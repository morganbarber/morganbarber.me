"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin/admin-layout"
import TerminalWindow from "@/components/terminal-window"
import { MessageSquare, Trash2, Search, User, FileText } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import type { Database } from "@/lib/supabase"

type Comment = Database["public"]["Tables"]["blog_comments"]["Row"] & {
  profiles: { full_name: string | null; email: string } | null
  blog_posts: { title: string; slug: string } | null
}

export default function AdminComments() {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchComments()
  }, [])

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("blog_comments")
      .select(`
        *,
        profiles (full_name, email),
        blog_posts (title, slug)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching comments:", error)
    } else {
      setComments((data as Comment[]) || [])
    }
    setLoading(false)
  }

  const deleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return

    const { error } = await supabase.from("blog_comments").delete().eq("id", commentId)

    if (!error) {
      fetchComments()
    }
  }

  const filteredComments = comments.filter(
    (comment) =>
      comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.profiles?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.blog_posts?.title.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-green-400 font-mono">Loading comments...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <TerminalWindow title="comments.sh">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-green-300">Comment Management</h1>
              <p className="text-green-400/80">Manage blog comments and discussions</p>
            </div>
            <div className="flex items-center space-x-2 text-green-400">
              <MessageSquare className="h-5 w-5" />
              <span className="font-mono">{comments.length} total comments</span>
            </div>
          </div>
        </TerminalWindow>

        {/* Search */}
        <TerminalWindow title="search.json">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-400/60" />
            <input
              type="text"
              placeholder="Search comments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/40 border border-green-400/30 rounded text-green-400 focus:border-green-400 focus:outline-none transition-colors"
            />
          </div>
        </TerminalWindow>

        {/* Comments List */}
        <div className="space-y-4">
          {filteredComments.map((comment) => (
            <TerminalWindow key={comment.id} title={`comment_${comment.id.slice(0, 8)}.md`}>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="w-8 h-8 bg-green-400/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-green-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-green-300 font-semibold text-sm">
                          {comment.profiles?.full_name || comment.profiles?.email || "Anonymous"}
                        </span>
                        <span className="text-green-400/60 text-xs">{formatDate(comment.created_at)}</span>
                      </div>

                      {comment.blog_posts && (
                        <div className="flex items-center space-x-1 mb-2">
                          <FileText className="h-3 w-3 text-green-400/60" />
                          <span className="text-green-400/80 text-xs">On: {comment.blog_posts.title}</span>
                        </div>
                      )}

                      <div className="glass rounded p-3 border border-green-400/20">
                        <p className="text-green-400/90 text-sm whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteComment(comment.id)}
                    className="p-2 glass rounded hover:bg-red-400/10 transition-colors ml-4 flex-shrink-0"
                    title="Delete comment"
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                </div>
              </div>
            </TerminalWindow>
          ))}

          {filteredComments.length === 0 && (
            <TerminalWindow title="no_comments.txt">
              <div className="text-center py-8">
                <div className="text-green-400/60">No comments found</div>
              </div>
            </TerminalWindow>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

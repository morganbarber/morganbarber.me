"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import AdminLayout from "@/components/admin/admin-layout"
import TerminalWindow from "@/components/terminal-window"
import { Plus, Edit, Trash2, Eye, EyeOff, Calendar, Tag, Search, Filter } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import type { Database } from "@/lib/supabase"

type BlogPost = Database["public"]["Tables"]["blog_posts"]["Row"]

export default function AdminPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft">("all")

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    const { data, error } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching posts:", error)
    } else {
      setPosts(data || [])
    }
    setLoading(false)
  }

  const togglePublishStatus = async (postId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("blog_posts")
      .update({
        published: !currentStatus,
        published_at: !currentStatus ? new Date().toISOString() : null,
      })
      .eq("id", postId)

    if (!error) {
      fetchPosts()
    }
  }

  const deletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return

    const { error } = await supabase.from("blog_posts").delete().eq("id", postId)

    if (!error) {
      fetchPosts()
    }
  }

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "published" && post.published) ||
      (filterStatus === "draft" && !post.published)

    return matchesSearch && matchesFilter
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-green-400 font-mono">Loading posts...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <TerminalWindow title="blog_posts.sh">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-green-300">Blog Posts</h1>
              <p className="text-green-400/80">Manage your blog content</p>
            </div>
            <Link
              href="/admin/posts/new"
              className="flex items-center space-x-2 px-4 py-2 glass rounded text-green-400 font-mono hover:bg-green-400/10 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Post</span>
            </Link>
          </div>
        </TerminalWindow>

        {/* Filters */}
        <TerminalWindow title="filters.json">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-400/60" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-black/40 border border-green-400/30 rounded text-green-400 focus:border-green-400 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-green-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 bg-black/40 border border-green-400/30 rounded text-green-400 focus:border-green-400 focus:outline-none transition-colors"
              >
                <option value="all">All Posts</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
              </select>
            </div>
          </div>
        </TerminalWindow>

        {/* Posts List */}
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <TerminalWindow key={post.id} title={`${post.slug}.md`}>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-green-300 font-semibold text-lg">{post.title}</h3>
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          post.published ? "bg-green-400/20 text-green-300" : "bg-yellow-400/20 text-yellow-300"
                        }`}
                      >
                        {post.published ? "Published" : "Draft"}
                      </span>
                    </div>

                    <p className="text-green-400/80 text-sm mb-3">{post.excerpt}</p>

                    <div className="flex items-center space-x-4 text-xs text-green-400/60">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Created {formatDate(post.created_at)}</span>
                      </div>
                      {post.published_at && (
                        <div className="flex items-center space-x-1">
                          <Eye className="h-3 w-3" />
                          <span>Published {formatDate(post.published_at)}</span>
                        </div>
                      )}
                    </div>

                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-green-400/10 text-green-400 text-xs rounded border border-green-400/20 flex items-center space-x-1"
                          >
                            <Tag className="h-3 w-3" />
                            <span>{tag}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Link
                      href={`/admin/posts/${post.id}/edit`}
                      className="p-2 glass rounded hover:bg-green-400/10 transition-colors"
                      title="Edit post"
                    >
                      <Edit className="h-4 w-4 text-green-400" />
                    </Link>

                    <button
                      onClick={() => togglePublishStatus(post.id, post.published || false)}
                      className="p-2 glass rounded hover:bg-green-400/10 transition-colors"
                      title={post.published ? "Unpublish" : "Publish"}
                    >
                      {post.published ? (
                        <EyeOff className="h-4 w-4 text-yellow-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-green-400" />
                      )}
                    </button>

                    <button
                      onClick={() => deletePost(post.id)}
                      className="p-2 glass rounded hover:bg-red-400/10 transition-colors"
                      title="Delete post"
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            </TerminalWindow>
          ))}

          {filteredPosts.length === 0 && (
            <TerminalWindow title="no_posts.txt">
              <div className="text-center py-8">
                <div className="text-green-400/60 mb-4">No posts found</div>
                <Link
                  href="/admin/posts/new"
                  className="inline-flex items-center space-x-2 px-4 py-2 glass rounded text-green-400 font-mono hover:bg-green-400/10 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create your first post</span>
                </Link>
              </div>
            </TerminalWindow>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import TerminalWindow from "@/components/terminal-window"
import { Calendar, Clock, Tag, ArrowLeft, Heart, MessageCircle, Share2, CheckCircle, User } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import type { Database } from "@/lib/supabase"
import type { User as SupabaseUser } from "@supabase/supabase-js"

type BlogPost = Database["public"]["Tables"]["blog_posts"]["Row"]
type BlogComment = Database["public"]["Tables"]["blog_comments"]["Row"] & {
  profiles: { full_name: string | null; email: string } | null
}

export default function BlogPost() {
  const params = useParams()
  const slug = params.slug as string

  const [post, setPost] = useState<BlogPost | null>(null)
  const [comments, setComments] = useState<BlogComment[]>([])
  const [likes, setLikes] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [newComment, setNewComment] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)
  const [shareSuccess, setShareSuccess] = useState(false)

  useEffect(() => {
    fetchPost()
    fetchComments()

    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        checkIfLiked(user.id)
      }
    })
  }, [slug])

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .single()

    if (error) {
      console.error("Error fetching post:", error)
    } else {
      setPost(data)
      fetchLikes(data.id)
    }
    setLoading(false)
  }

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("blog_comments")
      .select(`
        *,
        profiles (
          full_name,
          email
        )
      `)
      .eq("post_id", (await supabase.from("blog_posts").select("id").eq("slug", slug).single()).data?.id)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching comments:", error)
    } else {
      setComments(data as BlogComment[])
    }
  }

  const fetchLikes = async (postId: string) => {
    const { count, error } = await supabase
      .from("blog_likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId)

    if (!error) {
      setLikes(count || 0)
    }
  }

  const checkIfLiked = async (userId: string) => {
    if (!post) return

    const { data, error } = await supabase
      .from("blog_likes")
      .select("id")
      .eq("post_id", post.id)
      .eq("user_id", userId)
      .single()

    if (!error && data) {
      setIsLiked(true)
    }
  }

  const handleLike = async () => {
    if (!user || !post) return

    if (isLiked) {
      // Unlike
      const { error } = await supabase.from("blog_likes").delete().eq("post_id", post.id).eq("user_id", user.id)

      if (!error) {
        setIsLiked(false)
        setLikes((prev) => prev - 1)
      }
    } else {
      // Like
      const { error } = await supabase.from("blog_likes").insert([{ post_id: post.id, user_id: user.id }])

      if (!error) {
        setIsLiked(true)
        setLikes((prev) => prev + 1)
      }
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !post || !newComment.trim()) return

    setSubmittingComment(true)

    const { error } = await supabase.from("blog_comments").insert([
      {
        post_id: post.id,
        user_id: user.id,
        content: newComment.trim(),
      },
    ])

    if (!error) {
      setNewComment("")
      fetchComments()
    }

    setSubmittingComment(false)
  }

  const handleShare = async () => {
    try {
      const url = window.location.href
      await navigator.clipboard.writeText(url)
      setShareSuccess(true)
      setTimeout(() => setShareSuccess(false), 2000)
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea")
      textArea.value = window.location.href
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setShareSuccess(true)
      setTimeout(() => setShareSuccess(false), 2000)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-8 flex items-center justify-center">
        <div className="text-green-400 font-mono">Loading article...</div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen px-4 py-8 flex items-center justify-center">
        <TerminalWindow title="404.sh">
          <div className="text-center space-y-4">
            <div className="text-red-400 font-mono text-lg">Article not found</div>
            <Link href="/blog" className="text-green-400 hover:text-green-300 transition-colors">
              ← Back to blog
            </Link>
          </div>
        </TerminalWindow>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Button */}
        <Link
          href="/blog"
          className="inline-flex items-center space-x-2 text-green-400 hover:text-green-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="font-mono">Back to blog</span>
        </Link>

        {/* Article Header */}
        <TerminalWindow title={`${post.slug}.md`}>
          <article className="space-y-6">
            <header className="space-y-4">
              <h1 className="text-3xl font-bold text-green-300">{post.title}</h1>

              <div className="flex items-center space-x-4 text-sm text-green-400/60">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(post.published_at || post.created_at)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{Math.ceil(post.content.length / 1000)} min read</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {post.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-green-400/10 text-green-400 text-xs rounded border border-green-400/20 flex items-center space-x-1"
                  >
                    <Tag className="h-3 w-3" />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            </header>

            {/* Article Content */}
            <div className="prose prose-invert prose-green max-w-none">
              <div
                className="text-green-400/90 leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, "<br>") }}
              />
            </div>

            {/* Article Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-green-400/20">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLike}
                  disabled={!user}
                  className={`flex items-center space-x-2 px-3 py-2 rounded transition-colors ${
                    isLiked ? "text-red-400 bg-red-400/10" : "text-green-400 hover:bg-green-400/10"
                  } ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                  <span>{likes}</span>
                </button>

                <div className="flex items-center space-x-2 text-green-400">
                  <MessageCircle className="h-4 w-4" />
                  <span>{comments.length}</span>
                </div>
              </div>

              <button
                onClick={handleShare}
                className={`flex items-center space-x-2 px-3 py-2 rounded transition-colors ${
                  shareSuccess ? "text-green-300 bg-green-400/20" : "text-green-400 hover:bg-green-400/10"
                }`}
              >
                {shareSuccess ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4" />
                    <span>Share</span>
                  </>
                )}
              </button>
            </div>
          </article>
        </TerminalWindow>

        {/* Comments Section */}
        <TerminalWindow title="comments.log">
          <div className="space-y-6">
            <h3 className="text-green-300 font-mono text-lg">Comments ({comments.length})</h3>

            {/* Comment Form */}
            {user ? (
              <form onSubmit={handleComment} className="space-y-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={4}
                  className="w-full bg-black/40 border border-green-400/30 rounded px-3 py-2 text-green-400 focus:border-green-400 focus:outline-none transition-colors resize-none"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || submittingComment}
                  className="px-4 py-2 glass rounded text-green-400 font-mono hover:bg-green-400/10 transition-colors disabled:opacity-50"
                >
                  {submittingComment ? "Posting..." : "Post Comment"}
                </button>
              </form>
            ) : (
              <div className="text-green-400/60 text-sm">Please sign in to leave a comment.</div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="glass rounded p-4 border border-green-400/20">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-400/20 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-green-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-green-300 font-semibold text-sm">
                          {comment.profiles?.full_name || comment.profiles?.email || "Anonymous"}
                        </span>
                        <span className="text-green-400/60 text-xs">{formatDate(comment.created_at)}</span>
                      </div>
                      <p className="text-green-400/90 text-sm">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}

              {comments.length === 0 && (
                <div className="text-center text-green-400/60 py-8">
                  No comments yet. Be the first to share your thoughts!
                </div>
              )}
            </div>
          </div>
        </TerminalWindow>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import TerminalWindow from "@/components/terminal-window"
import { Calendar, Clock, Tag, ArrowLeft, Share2, Heart, MessageCircle } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import type { Database } from "@/lib/supabase"

type BlogPost = Database["public"]["Tables"]["blog_posts"]["Row"]

interface BlogPostClientProps {
  slug: string
}

// Simple markdown parser
const parseMarkdown = (content: string): string => {
  let html = content

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-green-300 mb-4 mt-8">$1</h3>')
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-green-300 mb-6 mt-10">$1</h2>')
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-green-300 mb-8 mt-12">$1</h1>')

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-green-300 font-semibold">$1</strong>')

  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em class="text-green-400/90 italic">$1</em>')

  // Code blocks
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    const language = lang ? `<div class="text-xs text-green-400/60 mb-2 font-mono">${lang}</div>` : ""
    return `<div class="my-6 bg-black/60 border border-green-400/30 rounded-lg p-4">
      ${language}
      <pre class="text-green-400 font-mono text-sm overflow-x-auto"><code>${code.trim()}</code></pre>
    </div>`
  })

  // Inline code
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="bg-black/40 text-green-300 px-2 py-1 rounded text-sm font-mono border border-green-400/20">$1</code>',
  )

  // Links
  html = html.replace(
    /\[([^\]]+)\]$$([^)]+)$$/g,
    '<a href="$2" class="text-green-300 hover:text-green-200 underline underline-offset-2 transition-colors" target="_blank" rel="noopener noreferrer">$1</a>',
  )

  // Unordered lists
  html = html.replace(
    /^\* (.+)$/gm,
    '<li class="text-green-400/90 mb-2 flex items-start"><span class="text-green-400 mr-2 mt-1">•</span><span>$1</span></li>',
  )
  html = html.replace(/(<li.*<\/li>)/s, '<ul class="my-4 space-y-1">$1</ul>')

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="text-green-400/90 mb-2 ml-6 list-decimal">$1</li>')
  html = html.replace(
    /(<li class="text-green-400\/90 mb-2 ml-6 list-decimal">.*<\/li>)/s,
    '<ol class="my-4 space-y-1">$1</ol>',
  )

  // Blockquotes
  html = html.replace(
    /^> (.+)$/gm,
    '<blockquote class="border-l-4 border-green-400/30 pl-4 my-4 text-green-400/80 italic bg-black/20 py-2">$1</blockquote>',
  )

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr class="border-green-400/30 my-8">')

  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p class="text-green-400/90 mb-4 leading-relaxed">')
  html = '<p class="text-green-400/90 mb-4 leading-relaxed">' + html + "</p>"

  // Clean up empty paragraphs
  html = html.replace(/<p class="text-green-400\/90 mb-4 leading-relaxed"><\/p>/g, "")

  return html
}

export default function BlogPostClient({ slug }: BlogPostClientProps) {
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    fetchPost()
  }, [slug])

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .single()

      if (error) {
        console.error("Error fetching post:", error)
        router.push("/blog")
        return
      }

      setPost(data)
      setLikeCount(Math.floor(Math.random() * 50) + 5) // Mock like count
    } catch (error) {
      console.error("Error:", error)
      router.push("/blog")
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share && post) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt || "",
          url: window.location.href,
        })
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href)
        alert("Link copied to clipboard!")
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert("Link copied to clipboard!")
    }
  }

  const handleLike = () => {
    setLiked(!liked)
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const estimateReadingTime = (content: string) => {
    const wordsPerMinute = 200
    const words = content.split(/\s+/).length
    return Math.ceil(words / wordsPerMinute)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-green-400 font-mono">Loading post...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-black text-green-400 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-green-400 font-mono">Post not found</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-green-400 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-green-400 hover:text-green-300 transition-colors font-mono"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Blog</span>
        </button>

        {/* Post Header */}
        <TerminalWindow title={`${post.slug}.md`}>
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-green-300 mb-4 leading-tight">{post.title}</h1>

              {post.excerpt && <p className="text-green-400/80 text-lg leading-relaxed">{post.excerpt}</p>}
            </div>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-green-400/60 border-t border-green-400/20 pt-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(post.published_at || post.created_at)}</span>
              </div>

              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>{estimateReadingTime(post.content)} min read</span>
              </div>

              {post.tags && post.tags.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Tag className="h-4 w-4" />
                  <div className="flex flex-wrap gap-1">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-green-400/10 text-green-400 text-xs rounded border border-green-400/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between border-t border-green-400/20 pt-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleLike}
                  className={`flex items-center space-x-2 px-3 py-2 rounded transition-colors ${
                    liked ? "bg-red-400/20 text-red-300" : "glass hover:bg-green-400/10 text-green-400"
                  }`}
                >
                  <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
                  <span>{likeCount}</span>
                </button>

                <button className="flex items-center space-x-2 px-3 py-2 glass rounded hover:bg-green-400/10 transition-colors text-green-400">
                  <MessageCircle className="h-4 w-4" />
                  <span>Comment</span>
                </button>
              </div>

              <button
                onClick={handleShare}
                className="flex items-center space-x-2 px-3 py-2 glass rounded hover:bg-green-400/10 transition-colors text-green-400"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </TerminalWindow>

        {/* Post Content */}
        <TerminalWindow title="content.md">
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(post.content) }}
          />
        </TerminalWindow>

        {/* Related Posts or Comments Section */}
        <TerminalWindow title="engagement.json">
          <div className="text-center py-8">
            <h3 className="text-green-300 font-semibold mb-4">Enjoyed this post?</h3>
            <p className="text-green-400/80 mb-6">
              Share your thoughts or check out more articles on cybersecurity and development.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => router.push("/blog")}
                className="px-6 py-2 glass rounded text-green-400 hover:bg-green-400/10 transition-colors"
              >
                More Posts
              </button>
              <button
                onClick={() => router.push("/contact")}
                className="px-6 py-2 bg-green-400/20 rounded text-green-300 hover:bg-green-400/30 transition-colors"
              >
                Get in Touch
              </button>
            </div>
          </div>
        </TerminalWindow>
      </div>
    </div>
  )
}

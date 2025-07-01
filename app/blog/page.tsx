"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import TerminalWindow from "@/components/terminal-window"
import NewsletterSignup from "@/components/newsletter-signup"
import { Calendar, Clock, Tag, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import type { Database } from "@/lib/supabase"

type BlogPost = Database["public"]["Tables"]["blog_posts"]["Row"]

const POSTS_PER_PAGE = 5

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPosts, setTotalPosts] = useState(0)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE)

  useEffect(() => {
    fetchPosts()
  }, [currentPage, selectedTag])

  const fetchPosts = async () => {
    setLoading(true)

    let query = supabase
      .from("blog_posts")
      .select("*", { count: "exact" })
      .eq("published", true)
      .order("published_at", { ascending: false })

    if (selectedTag) {
      query = query.contains("tags", [selectedTag])
    }

    const { data, error, count } = await query.range(
      (currentPage - 1) * POSTS_PER_PAGE,
      currentPage * POSTS_PER_PAGE - 1,
    )

    if (error) {
      console.error("Error fetching posts:", error)
    } else {
      setPosts(data || [])
      setTotalPosts(count || 0)
    }

    setLoading(false)
  }

  const getAllTags = () => {
    const allTags = posts.flatMap((post) => post.tags || [])
    return [...new Set(allTags)]
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
        <div className="text-green-400 font-mono">Loading blog posts...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <TerminalWindow title="morgan@barber:~/blog$ cat index.md">
              <div className="space-y-6">
                <div className="border-b border-green-400/20 pb-4">
                  <h1 className="text-2xl font-bold text-green-300 mb-2">Technical Blog</h1>
                  <div className="text-green-400/80">Insights on cybersecurity, technology, and innovation</div>
                </div>

                <div className="text-green-400 font-mono text-sm">
                  {totalPosts} published articles • Page {currentPage} of {totalPages}
                </div>

                {/* Tag Filter */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setSelectedTag(null)
                      setCurrentPage(1)
                    }}
                    className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                      !selectedTag
                        ? "bg-green-400/20 text-green-300"
                        : "bg-green-400/10 text-green-400 hover:bg-green-400/20"
                    }`}
                  >
                    All Posts
                  </button>
                  {getAllTags().map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSelectedTag(tag)
                        setCurrentPage(1)
                      }}
                      className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                        selectedTag === tag
                          ? "bg-green-400/20 text-green-300"
                          : "bg-green-400/10 text-green-400 hover:bg-green-400/20"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </TerminalWindow>

            {/* Blog Posts */}
            <div className="space-y-6">
              {posts.map((post, index) => (
                <div key={post.id} className="fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <TerminalWindow title={`article_${post.slug}.md`}>
                    <article className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Link href={`/blog/${post.slug}`}>
                            <h2 className="text-green-300 font-semibold text-lg mb-2 hover:text-green-200 transition-colors cursor-pointer">
                              {post.title}
                            </h2>
                          </Link>

                          <p className="text-green-400/80 text-sm mb-3">{post.excerpt}</p>

                          <div className="flex items-center space-x-4 text-xs text-green-400/60">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(post.published_at || post.created_at)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{Math.ceil(post.content.length / 1000)} min read</span>
                            </div>
                          </div>
                        </div>

                        <Link href={`/blog/${post.slug}`}>
                          <button className="ml-4 p-2 glass rounded hover:bg-green-400/10 transition-colors group">
                            <ArrowRight className="h-4 w-4 text-green-400 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </Link>
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
                    </article>
                  </TerminalWindow>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <TerminalWindow title="pagination.sh">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex items-center space-x-2 px-4 py-2 glass rounded text-green-400 hover:bg-green-400/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded text-sm font-mono transition-colors ${
                          currentPage === page
                            ? "bg-green-400/20 text-green-300"
                            : "text-green-400 hover:bg-green-400/10"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="flex items-center space-x-2 px-4 py-2 glass rounded text-green-400 hover:bg-green-400/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </TerminalWindow>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <NewsletterSignup />

            <TerminalWindow title="blog_stats.json">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-green-300 mb-1">{totalPosts}</div>
                  <div className="text-green-400/80 text-sm">Total Articles</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-300 mb-1">{getAllTags().length}</div>
                  <div className="text-green-400/80 text-sm">Topics Covered</div>
                </div>
              </div>
            </TerminalWindow>
          </div>
        </div>
      </div>
    </div>
  )
}

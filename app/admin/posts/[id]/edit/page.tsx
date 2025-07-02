"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "@/components/admin/admin-layout"
import TerminalWindow from "@/components/terminal-window"
import { Save, Eye, ArrowLeft, Plus, X, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { ensureAdminProfile } from "@/lib/admin-auth"

interface EditPostProps {
  params: Promise<{ id: string }>
}

export default function EditPost({ params }: EditPostProps) {
  const router = useRouter()
  const [postId, setPostId] = useState<string>("")
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    tags: [] as string[],
    published: false,
  })
  const [newTag, setNewTag] = useState("")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setPostId(resolvedParams.id)
      fetchPost(resolvedParams.id)
    }
    getParams()
  }, [params])

  const fetchPost = async (id: string) => {
    try {
      const { data, error } = await supabase.from("blog_posts").select("*").eq("id", id).single()

      if (error) throw error

      if (data) {
        setFormData({
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt || "",
          content: data.content,
          tags: data.tags || [],
          published: data.published || false,
        })
      }
    } catch (error) {
      console.error("Error fetching post:", error)
      alert("Error loading post")
      router.push("/admin/posts")
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
  }

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: generateSlug(title),
    }))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  const handleSubmit = async (e: React.FormEvent, publish = false) => {
    e.preventDefault()
    setSaving(true)

    try {
      await ensureAdminProfile()

      const postData = {
        ...formData,
        published: publish,
        published_at: publish ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("blog_posts").update(postData).eq("id", postId)

      if (error) {
        console.error("Supabase error:", error)
        throw error
      }

      router.push("/admin/posts")
    } catch (error: any) {
      console.error("Error updating post:", error)
      alert("Error updating post: " + (error.message || "Unknown error"))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return
    }

    setDeleting(true)
    try {
      const { error } = await supabase.from("blog_posts").delete().eq("id", postId)

      if (error) throw error

      router.push("/admin/posts")
    } catch (error: any) {
      console.error("Error deleting post:", error)
      alert("Error deleting post: " + (error.message || "Unknown error"))
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-green-400 font-mono">Loading post...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <TerminalWindow title="edit_post.md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-2 text-green-400 hover:text-green-300 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="font-mono">Back</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-green-300">Edit Blog Post</h1>
                <p className="text-green-400/80">Update your article</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center space-x-2 px-4 py-2 bg-red-400/20 rounded text-red-300 font-mono hover:bg-red-400/30 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>{deleting ? "Deleting..." : "Delete"}</span>
              </button>

              <button
                onClick={(e) => handleSubmit(e, false)}
                disabled={saving || !formData.title.trim()}
                className="flex items-center space-x-2 px-4 py-2 glass rounded text-green-400 font-mono hover:bg-green-400/10 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>Save Draft</span>
              </button>

              <button
                onClick={(e) => handleSubmit(e, true)}
                disabled={saving || !formData.title.trim() || !formData.content.trim()}
                className="flex items-center space-x-2 px-4 py-2 bg-green-400/20 rounded text-green-300 font-mono hover:bg-green-400/30 transition-colors disabled:opacity-50"
              >
                <Eye className="h-4 w-4" />
                <span>Publish</span>
              </button>
            </div>
          </div>
        </TerminalWindow>

        {/* Form */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
          {/* Basic Info */}
          <TerminalWindow title="post_metadata.json">
            <div className="space-y-4">
              <div>
                <label className="block text-green-400 text-sm font-mono mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                  className="w-full bg-black/40 border border-green-400/30 rounded px-3 py-2 text-green-400 focus:border-green-400 focus:outline-none transition-colors"
                  placeholder="Enter post title..."
                />
              </div>

              <div>
                <label className="block text-green-400 text-sm font-mono mb-2">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  required
                  className="w-full bg-black/40 border border-green-400/30 rounded px-3 py-2 text-green-400 focus:border-green-400 focus:outline-none transition-colors"
                  placeholder="post-url-slug"
                />
              </div>

              <div>
                <label className="block text-green-400 text-sm font-mono mb-2">Excerpt</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                  rows={3}
                  className="w-full bg-black/40 border border-green-400/30 rounded px-3 py-2 text-green-400 focus:border-green-400 focus:outline-none transition-colors resize-none"
                  placeholder="Brief description of the post..."
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-green-400 text-sm font-mono mb-2">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-green-400/10 text-green-400 text-sm rounded border border-green-400/20 flex items-center space-x-1"
                    >
                      <span>{tag}</span>
                      <button type="button" onClick={() => removeTag(tag)} className="text-red-400 hover:text-red-300">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    className="flex-1 bg-black/40 border border-green-400/30 rounded px-3 py-2 text-green-400 focus:border-green-400 focus:outline-none transition-colors"
                    placeholder="Add a tag..."
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-3 py-2 glass rounded text-green-400 hover:bg-green-400/10 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </TerminalWindow>

          {/* Content */}
          <TerminalWindow title="post_content.md">
            <div>
              <label className="block text-green-400 text-sm font-mono mb-2">Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                required
                rows={20}
                className="w-full bg-black/40 border border-green-400/30 rounded px-3 py-2 text-green-400 focus:border-green-400 focus:outline-none transition-colors resize-none font-mono text-sm"
                placeholder="Write your post content here... (Markdown supported)"
              />
            </div>
          </TerminalWindow>
        </form>
      </div>
    </AdminLayout>
  )
}

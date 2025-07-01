"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import AdminLayout from "@/components/admin/admin-layout"
import TerminalWindow from "@/components/terminal-window"
import { Save, ArrowLeft, Plus, X, Github, ExternalLink, Lock, Unlock } from "lucide-react"
import { supabase } from "@/lib/supabase-client"

export default function NewProject() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tech_stack: [] as string[],
    features: [] as string[],
    status: "In Progress",
    github_url: "",
    demo_url: "",
    is_open_source: true,
  })
  const [newTech, setNewTech] = useState("")
  const [newFeature, setNewFeature] = useState("")
  const [saving, setSaving] = useState(false)

  const addTech = () => {
    if (newTech.trim() && !formData.tech_stack.includes(newTech.trim())) {
      setFormData((prev) => ({
        ...prev,
        tech_stack: [...prev.tech_stack, newTech.trim()],
      }))
      setNewTech("")
    }
  }

  const removeTech = (techToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tech_stack: prev.tech_stack.filter((tech) => tech !== techToRemove),
    }))
  }

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }))
      setNewFeature("")
    }
  }

  const removeFeature = (featureToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((feature) => feature !== featureToRemove),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const { error } = await supabase.from("projects").insert([formData])

      if (error) throw error

      router.push("/admin/projects")
    } catch (error: any) {
      console.error("Error saving project:", error)
      alert("Error saving project: " + error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <TerminalWindow title="new_project.json">
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
                <h1 className="text-2xl font-bold text-green-300">New Project</h1>
                <p className="text-green-400/80">Add a new project to your portfolio</p>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={saving || !formData.title.trim() || !formData.description.trim()}
              className="flex items-center space-x-2 px-4 py-2 bg-green-400/20 rounded text-green-300 font-mono hover:bg-green-400/30 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? "Saving..." : "Save Project"}</span>
            </button>
          </div>
        </TerminalWindow>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <TerminalWindow title="project_info.json">
            <div className="space-y-4">
              <div>
                <label className="block text-green-400 text-sm font-mono mb-2">Project Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  required
                  className="w-full bg-black/40 border border-green-400/30 rounded px-3 py-2 text-green-400 focus:border-green-400 focus:outline-none transition-colors"
                  placeholder="Enter project title..."
                />
              </div>

              <div>
                <label className="block text-green-400 text-sm font-mono mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  required
                  rows={4}
                  className="w-full bg-black/40 border border-green-400/30 rounded px-3 py-2 text-green-400 focus:border-green-400 focus:outline-none transition-colors resize-none"
                  placeholder="Describe your project..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-green-400 text-sm font-mono mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-black/40 border border-green-400/30 rounded px-3 py-2 text-green-400 focus:border-green-400 focus:outline-none transition-colors"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Production">Production</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-green-400 text-sm font-mono mb-2">Visibility</label>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, is_open_source: !prev.is_open_source }))}
                    className={`w-full flex items-center justify-center space-x-2 px-3 py-2 rounded transition-colors ${
                      formData.is_open_source
                        ? "bg-green-400/20 text-green-300 border border-green-400/30"
                        : "bg-yellow-400/20 text-yellow-300 border border-yellow-400/30"
                    }`}
                  >
                    {formData.is_open_source ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    <span>{formData.is_open_source ? "Open Source" : "Private"}</span>
                  </button>
                </div>
              </div>
            </div>
          </TerminalWindow>

          {/* URLs */}
          <TerminalWindow title="project_links.json">
            <div className="space-y-4">
              <div>
                <label className="block text-green-400 text-sm font-mono mb-2 flex items-center space-x-2">
                  <Github className="h-4 w-4" />
                  <span>GitHub URL (optional)</span>
                </label>
                <input
                  type="url"
                  value={formData.github_url}
                  onChange={(e) => setFormData((prev) => ({ ...prev, github_url: e.target.value }))}
                  className="w-full bg-black/40 border border-green-400/30 rounded px-3 py-2 text-green-400 focus:border-green-400 focus:outline-none transition-colors"
                  placeholder="https://github.com/username/repo"
                />
              </div>

              <div>
                <label className="block text-green-400 text-sm font-mono mb-2 flex items-center space-x-2">
                  <ExternalLink className="h-4 w-4" />
                  <span>Demo URL (optional)</span>
                </label>
                <input
                  type="url"
                  value={formData.demo_url}
                  onChange={(e) => setFormData((prev) => ({ ...prev, demo_url: e.target.value }))}
                  className="w-full bg-black/40 border border-green-400/30 rounded px-3 py-2 text-green-400 focus:border-green-400 focus:outline-none transition-colors"
                  placeholder="https://demo.example.com"
                />
              </div>
            </div>
          </TerminalWindow>

          {/* Tech Stack */}
          <TerminalWindow title="tech_stack.json">
            <div className="space-y-4">
              <label className="block text-green-400 text-sm font-mono">Technologies Used</label>

              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tech_stack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-1 bg-green-400/10 text-green-400 text-sm rounded border border-green-400/20 flex items-center space-x-1"
                  >
                    <span>{tech}</span>
                    <button type="button" onClick={() => removeTech(tech)} className="text-red-400 hover:text-red-300">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTech}
                  onChange={(e) => setNewTech(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTech())}
                  className="flex-1 bg-black/40 border border-green-400/30 rounded px-3 py-2 text-green-400 focus:border-green-400 focus:outline-none transition-colors"
                  placeholder="Add technology..."
                />
                <button
                  type="button"
                  onClick={addTech}
                  className="px-3 py-2 glass rounded text-green-400 hover:bg-green-400/10 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </TerminalWindow>

          {/* Features */}
          <TerminalWindow title="features.json">
            <div className="space-y-4">
              <label className="block text-green-400 text-sm font-mono">Key Features</label>

              <div className="space-y-2 mb-2">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 glass rounded border border-green-400/20">
                    <span className="text-green-400">•</span>
                    <span className="flex-1 text-green-400/90 text-sm">{feature}</span>
                    <button
                      type="button"
                      onClick={() => removeFeature(feature)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                  className="flex-1 bg-black/40 border border-green-400/30 rounded px-3 py-2 text-green-400 focus:border-green-400 focus:outline-none transition-colors"
                  placeholder="Add feature..."
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="px-3 py-2 glass rounded text-green-400 hover:bg-green-400/10 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </TerminalWindow>
        </form>
      </div>
    </AdminLayout>
  )
}

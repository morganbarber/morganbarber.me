"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import AdminLayout from "@/components/admin/admin-layout"
import TerminalWindow from "@/components/terminal-window"
import { Plus, Edit, Trash2, ExternalLink, Github, Search, Filter, Lock } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import type { Database } from "@/lib/supabase"

type Project = Database["public"]["Tables"]["projects"]["Row"]

export default function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching projects:", error)
    } else {
      setProjects(data || [])
    }
    setLoading(false)
  }

  const deleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return

    const { error } = await supabase.from("projects").delete().eq("id", projectId)

    if (!error) {
      fetchProjects()
    }
  }

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.tech_stack?.some((tech) => tech.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesFilter = filterStatus === "all" || project.status.toLowerCase() === filterStatus.toLowerCase()

    return matchesSearch && matchesFilter
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "production":
        return "bg-green-400/20 text-green-300"
      case "completed":
        return "bg-blue-400/20 text-blue-300"
      case "in progress":
        return "bg-yellow-400/20 text-yellow-300"
      default:
        return "bg-gray-400/20 text-gray-300"
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-green-400 font-mono">Loading projects...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <TerminalWindow title="projects.sh">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-green-300">Project Management</h1>
              <p className="text-green-400/80">Manage your portfolio projects</p>
            </div>
            <Link
              href="/admin/projects/new"
              className="flex items-center space-x-2 px-4 py-2 glass rounded text-green-400 font-mono hover:bg-green-400/10 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Project</span>
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
                  placeholder="Search projects..."
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
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-black/40 border border-green-400/30 rounded text-green-400 focus:border-green-400 focus:outline-none transition-colors"
              >
                <option value="all">All Status</option>
                <option value="production">Production</option>
                <option value="completed">Completed</option>
                <option value="in progress">In Progress</option>
              </select>
            </div>
          </div>
        </TerminalWindow>

        {/* Projects List */}
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <TerminalWindow key={project.id} title={`${project.title.toLowerCase().replace(/\s+/g, "_")}.json`}>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-green-300 font-semibold text-lg">{project.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                      {!project.is_open_source && (
                        <span className="px-2 py-1 bg-yellow-400/20 text-yellow-300 text-xs rounded flex items-center space-x-1">
                          <Lock className="h-3 w-3" />
                          <span>Private</span>
                        </span>
                      )}
                    </div>

                    <p className="text-green-400/80 text-sm mb-3">{project.description}</p>

                    <div className="flex items-center space-x-4 text-xs text-green-400/60 mb-3">
                      <span>Created {formatDate(project.created_at)}</span>
                      <span>Updated {formatDate(project.updated_at)}</span>
                    </div>

                    {/* Tech Stack */}
                    {project.tech_stack && project.tech_stack.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {project.tech_stack.map((tech) => (
                          <span
                            key={tech}
                            className="px-2 py-1 bg-green-400/10 text-green-400 text-xs rounded border border-green-400/20"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Features */}
                    {project.features && project.features.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-green-300 font-semibold text-sm">Key Features:</div>
                        <ul className="space-y-1">
                          {project.features.slice(0, 3).map((feature, idx) => (
                            <li key={idx} className="text-green-400/80 text-sm flex items-center space-x-2">
                              <span className="text-green-400">•</span>
                              <span>{feature}</span>
                            </li>
                          ))}
                          {project.features.length > 3 && (
                            <li className="text-green-400/60 text-xs">+{project.features.length - 3} more features</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {/* External Links */}
                    {project.github_url && (
                      <a
                        href={project.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 glass rounded hover:bg-green-400/10 transition-colors"
                        title="View on GitHub"
                      >
                        <Github className="h-4 w-4 text-green-400" />
                      </a>
                    )}

                    {project.demo_url && (
                      <a
                        href={project.demo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 glass rounded hover:bg-green-400/10 transition-colors"
                        title="View Demo"
                      >
                        <ExternalLink className="h-4 w-4 text-green-400" />
                      </a>
                    )}

                    {/* Admin Actions */}
                    <Link
                      href={`/admin/projects/${project.id}/edit`}
                      className="p-2 glass rounded hover:bg-green-400/10 transition-colors"
                      title="Edit project"
                    >
                      <Edit className="h-4 w-4 text-green-400" />
                    </Link>

                    <button
                      onClick={() => deleteProject(project.id)}
                      className="p-2 glass rounded hover:bg-red-400/10 transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            </TerminalWindow>
          ))}

          {filteredProjects.length === 0 && (
            <TerminalWindow title="no_projects.txt">
              <div className="text-center py-8">
                <div className="text-green-400/60 mb-4">No projects found</div>
                <Link
                  href="/admin/projects/new"
                  className="inline-flex items-center space-x-2 px-4 py-2 glass rounded text-green-400 font-mono hover:bg-green-400/10 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create your first project</span>
                </Link>
              </div>
            </TerminalWindow>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

"use client"

import { useState, useEffect } from "react"
import TerminalWindow from "@/components/terminal-window"
import { ExternalLink, Github, Shield, Brain, Vote, Lock } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import type { Database } from "@/lib/supabase"

type Project = Database["public"]["Tables"]["projects"]["Row"]

const getProjectIcon = (title: string) => {
  if (title.toLowerCase().includes("fish") || title.toLowerCase().includes("ai")) return Brain
  if (title.toLowerCase().includes("voting")) return Vote
  if (title.toLowerCase().includes("security") || title.toLowerCase().includes("scanner")) return Shield
  return Shield
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-8 flex items-center justify-center">
        <div className="text-green-400 font-mono">Loading projects...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <TerminalWindow title="morgan@barber:~/projects$ ls -la">
          <div className="space-y-6">
            <div className="border-b border-green-400/20 pb-4">
              <h1 className="text-2xl font-bold text-green-300 mb-2">Project Portfolio</h1>
              <div className="text-green-400/80">Showcasing innovative solutions and technical expertise</div>
            </div>

            <div className="text-green-400 font-mono text-sm">
              Found {projects.length} projects • Total lines of code: ~50,000+
            </div>
          </div>
        </TerminalWindow>

        <div className="grid lg:grid-cols-2 gap-6">
          {projects.map((project, index) => {
            const IconComponent = getProjectIcon(project.title)
            return (
              <div key={project.id} className="fade-in" style={{ animationDelay: `${index * 0.2}s` }}>
                <TerminalWindow title={`project_${project.title.toLowerCase().replace(/\s+/g, "_")}.md`}>
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <IconComponent className="h-6 w-6 text-green-400" />
                        <div>
                          <h3 className="text-green-300 font-semibold text-lg">{project.title}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span
                              className={`px-2 py-1 text-xs rounded ${
                                project.status === "Production"
                                  ? "bg-green-400/20 text-green-300"
                                  : project.status === "Completed"
                                    ? "bg-blue-400/20 text-blue-300"
                                    : "bg-yellow-400/20 text-yellow-300"
                              }`}
                            >
                              {project.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        {project.is_open_source ? (
                          project.github_url ? (
                            <a
                              href={project.github_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 glass rounded hover:bg-green-400/10 transition-colors"
                            >
                              <Github className="h-4 w-4 text-green-400" />
                            </a>
                          ) : (
                            <div className="p-2 glass rounded opacity-50">
                              <Github className="h-4 w-4 text-green-400/50" />
                            </div>
                          )
                        ) : (
                          <div className="p-2 glass rounded" title="Private Repository">
                            <Lock className="h-4 w-4 text-yellow-400" />
                          </div>
                        )}
                        {project.demo_url && (
                          <a
                            href={project.demo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 glass rounded hover:bg-green-400/10 transition-colors"
                          >
                            <ExternalLink className="h-4 w-4 text-green-400" />
                          </a>
                        )}
                      </div>
                    </div>

                    <p className="text-green-400/80 text-sm">{project.description}</p>

                    <div className="space-y-3">
                      <div>
                        <h4 className="text-green-300 font-semibold text-sm mb-2">Key Features</h4>
                        <ul className="space-y-1">
                          {project.features?.map((feature, idx) => (
                            <li key={idx} className="text-green-400/80 text-sm flex items-center space-x-2">
                              <span className="text-green-400">•</span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-green-300 font-semibold text-sm mb-2">Technologies</h4>
                        <div className="flex flex-wrap gap-2">
                          {project.tech_stack?.map((tech) => (
                            <span
                              key={tech}
                              className="px-2 py-1 bg-green-400/10 text-green-400 text-xs rounded border border-green-400/20"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </TerminalWindow>
              </div>
            )
          })}
        </div>

        <TerminalWindow title="project_stats.sh">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-300 mb-2">{projects.length}</div>
              <div className="text-green-400/80 text-sm">Major Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-300 mb-2">50K+</div>
              <div className="text-green-400/80 text-sm">Lines of Code</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-300 mb-2">
                {projects.filter((p) => p.is_open_source).length}
              </div>
              <div className="text-green-400/80 text-sm">Open Source</div>
            </div>
          </div>
        </TerminalWindow>
      </div>
    </div>
  )
}

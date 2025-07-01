"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin/admin-layout"
import TerminalWindow from "@/components/terminal-window"
import { FileText, FolderOpen, Users, Mail, MessageSquare, Heart } from "lucide-react"
import { supabase } from "@/lib/supabase-client"

interface DashboardStats {
  totalPosts: number
  publishedPosts: number
  totalProjects: number
  totalUsers: number
  totalSubscribers: number
  totalComments: number
  totalLikes: number
  recentActivity: any[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    publishedPosts: 0,
    totalProjects: 0,
    totalUsers: 0,
    totalSubscribers: 0,
    totalComments: 0,
    totalLikes: 0,
    recentActivity: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      // Fetch all stats in parallel
      const [
        postsResult,
        publishedPostsResult,
        projectsResult,
        usersResult,
        subscribersResult,
        commentsResult,
        likesResult,
        recentCommentsResult,
      ] = await Promise.all([
        supabase.from("blog_posts").select("*", { count: "exact", head: true }),
        supabase.from("blog_posts").select("*", { count: "exact", head: true }).eq("published", true),
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("newsletter_subscribers").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("blog_comments").select("*", { count: "exact", head: true }),
        supabase.from("blog_likes").select("*", { count: "exact", head: true }),
        supabase
          .from("blog_comments")
          .select(`
            *,
            profiles (full_name, email),
            blog_posts (title)
          `)
          .order("created_at", { ascending: false })
          .limit(5),
      ])

      setStats({
        totalPosts: postsResult.count || 0,
        publishedPosts: publishedPostsResult.count || 0,
        totalProjects: projectsResult.count || 0,
        totalUsers: usersResult.count || 0,
        totalSubscribers: subscribersResult.count || 0,
        totalComments: commentsResult.count || 0,
        totalLikes: likesResult.count || 0,
        recentActivity: recentCommentsResult.data || [],
      })
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
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
          <div className="text-green-400 font-mono">Loading dashboard...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <TerminalWindow title="dashboard.sh">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-green-300">Admin Dashboard</h1>
            <p className="text-green-400/80">Welcome back, Morgan. Here's your website overview.</p>
          </div>
        </TerminalWindow>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <TerminalWindow title="blog_stats.json">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <FileText className="h-6 w-6 text-green-400" />
                <div>
                  <div className="text-2xl font-bold text-green-300">{stats.publishedPosts}</div>
                  <div className="text-green-400/80 text-sm">Published Posts</div>
                  <div className="text-green-400/60 text-xs">{stats.totalPosts} total</div>
                </div>
              </div>
            </div>
          </TerminalWindow>

          <TerminalWindow title="project_stats.json">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <FolderOpen className="h-6 w-6 text-green-400" />
                <div>
                  <div className="text-2xl font-bold text-green-300">{stats.totalProjects}</div>
                  <div className="text-green-400/80 text-sm">Projects</div>
                  <div className="text-green-400/60 text-xs">Portfolio items</div>
                </div>
              </div>
            </div>
          </TerminalWindow>

          <TerminalWindow title="user_stats.json">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Users className="h-6 w-6 text-green-400" />
                <div>
                  <div className="text-2xl font-bold text-green-300">{stats.totalUsers}</div>
                  <div className="text-green-400/80 text-sm">Registered Users</div>
                  <div className="text-green-400/60 text-xs">Active accounts</div>
                </div>
              </div>
            </div>
          </TerminalWindow>

          <TerminalWindow title="newsletter_stats.json">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-6 w-6 text-green-400" />
                <div>
                  <div className="text-2xl font-bold text-green-300">{stats.totalSubscribers}</div>
                  <div className="text-green-400/80 text-sm">Subscribers</div>
                  <div className="text-green-400/60 text-xs">Newsletter list</div>
                </div>
              </div>
            </div>
          </TerminalWindow>
        </div>

        {/* Engagement Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TerminalWindow title="engagement.log">
            <div className="space-y-4">
              <h3 className="text-green-300 font-mono text-lg">Engagement Overview</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="glass rounded p-4 border border-green-400/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-green-400" />
                    <span className="text-green-300 font-semibold">Comments</span>
                  </div>
                  <div className="text-2xl font-bold text-green-300">{stats.totalComments}</div>
                </div>

                <div className="glass rounded p-4 border border-green-400/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <Heart className="h-4 w-4 text-green-400" />
                    <span className="text-green-300 font-semibold">Likes</span>
                  </div>
                  <div className="text-2xl font-bold text-green-300">{stats.totalLikes}</div>
                </div>
              </div>
            </div>
          </TerminalWindow>

          <TerminalWindow title="recent_activity.log">
            <div className="space-y-4">
              <h3 className="text-green-300 font-mono text-lg">Recent Activity</h3>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map((activity: any) => (
                    <div key={activity.id} className="glass rounded p-3 border border-green-400/20">
                      <div className="flex items-start space-x-3">
                        <MessageSquare className="h-4 w-4 text-green-400 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-green-300 text-sm font-semibold truncate">
                            {activity.profiles?.full_name || activity.profiles?.email || "Anonymous"}
                          </div>
                          <div className="text-green-400/80 text-xs truncate">
                            Commented on "{activity.blog_posts?.title}"
                          </div>
                          <div className="text-green-400/60 text-xs">{formatDate(activity.created_at)}</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-green-400/60 text-sm text-center py-4">No recent activity</div>
                )}
              </div>
            </div>
          </TerminalWindow>
        </div>

        {/* Quick Actions */}
        <TerminalWindow title="quick_actions.sh">
          <div className="space-y-4">
            <h3 className="text-green-300 font-mono text-lg">Quick Actions</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="/admin/posts/new"
                className="glass rounded p-4 border border-green-400/20 hover:bg-green-400/5 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-6 w-6 text-green-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="text-green-300 font-semibold">New Blog Post</div>
                    <div className="text-green-400/80 text-sm">Create article</div>
                  </div>
                </div>
              </a>

              <a
                href="/admin/projects/new"
                className="glass rounded p-4 border border-green-400/20 hover:bg-green-400/5 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <FolderOpen className="h-6 w-6 text-green-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="text-green-300 font-semibold">New Project</div>
                    <div className="text-green-400/80 text-sm">Add portfolio item</div>
                  </div>
                </div>
              </a>

              <a
                href="/admin/newsletter"
                className="glass rounded p-4 border border-green-400/20 hover:bg-green-400/5 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <Mail className="h-6 w-6 text-green-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="text-green-300 font-semibold">Newsletter</div>
                    <div className="text-green-400/80 text-sm">Manage subscribers</div>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </TerminalWindow>
      </div>
    </AdminLayout>
  )
}

"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Users,
  Mail,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Terminal,
} from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { isAdmin } from "@/lib/admin-auth"

const adminNavItems = [
  { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { name: "Blog Posts", path: "/admin/posts", icon: FileText },
  { name: "Projects", path: "/admin/projects", icon: FolderOpen },
  { name: "Users", path: "/admin/users", icon: Users },
  { name: "Newsletter", path: "/admin/newsletter", icon: Mail },
  { name: "Comments", path: "/admin/comments", icon: MessageSquare },
  { name: "Settings", path: "/admin/settings", icon: Settings },
]

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const adminStatus = await isAdmin()
      if (!adminStatus) {
        router.push("/")
        return
      }
      setAuthorized(true)
    } catch (error) {
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-green-400 font-mono">Verifying admin access...</div>
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 glass border-r border-green-400/20 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-green-400/20">
            <div className="flex items-center space-x-2">
              <Terminal className="h-6 w-6 text-green-400" />
              <span className="font-mono text-green-400 font-semibold">Admin Panel</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-green-400 hover:text-green-300">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {adminNavItems.map((item) => {
              const IconComponent = item.icon
              const isActive = pathname === item.path

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-mono transition-all duration-200 ${
                    isActive
                      ? "bg-green-400/20 text-green-300 terminal-glow"
                      : "text-green-400 hover:bg-green-400/10 hover:text-green-300"
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-green-400/20">
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-3 w-full px-3 py-2 rounded-md text-sm font-mono text-green-400 hover:bg-green-400/10 hover:text-green-300 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <div className="glass border-b border-green-400/20 px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-green-400 hover:text-green-300">
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center space-x-4">
              <span className="text-green-400 font-mono text-sm">
                morgan@admin:~$ {pathname.replace("/admin", "") || "/"}
              </span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}

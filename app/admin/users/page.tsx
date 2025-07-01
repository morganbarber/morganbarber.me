"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin/admin-layout"
import TerminalWindow from "@/components/terminal-window"
import { Users, Mail, Calendar, Search, Shield } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import type { Database } from "@/lib/supabase"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export default function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching users:", error)
    } else {
      setUsers(data || [])
    }
    setLoading(false)
  }

  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
          <div className="text-green-400 font-mono">Loading users...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <TerminalWindow title="users.sh">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-green-300">User Management</h1>
              <p className="text-green-400/80">Manage registered users</p>
            </div>
            <div className="flex items-center space-x-2 text-green-400">
              <Users className="h-5 w-5" />
              <span className="font-mono">{users.length} total users</span>
            </div>
          </div>
        </TerminalWindow>

        {/* Search */}
        <TerminalWindow title="search.json">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-400/60" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/40 border border-green-400/30 rounded text-green-400 focus:border-green-400 focus:outline-none transition-colors"
            />
          </div>
        </TerminalWindow>

        {/* Users List */}
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <TerminalWindow key={user.id} title={`user_${user.email.split("@")[0]}.json`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-400/20 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-400" />
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-green-300 font-semibold">{user.full_name || "No name provided"}</h3>
                      {user.email === "morgan.barber@example.com" && (
                        <span className="px-2 py-1 bg-yellow-400/20 text-yellow-300 text-xs rounded flex items-center space-x-1">
                          <Shield className="h-3 w-3" />
                          <span>Admin</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1 text-green-400/80 text-sm">
                      <Mail className="h-3 w-3" />
                      <span>{user.email}</span>
                    </div>

                    <div className="flex items-center space-x-1 text-green-400/60 text-xs">
                      <Calendar className="h-3 w-3" />
                      <span>Joined {formatDate(user.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-green-400/60 text-xs">Last updated: {formatDate(user.updated_at)}</div>
                </div>
              </div>
            </TerminalWindow>
          ))}

          {filteredUsers.length === 0 && (
            <TerminalWindow title="no_users.txt">
              <div className="text-center py-8">
                <div className="text-green-400/60">No users found</div>
              </div>
            </TerminalWindow>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

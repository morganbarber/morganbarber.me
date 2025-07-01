"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin/admin-layout"
import TerminalWindow from "@/components/terminal-window"
import { Mail, Calendar, Search, Download, UserX } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import type { Database } from "@/lib/supabase"

type Subscriber = Database["public"]["Tables"]["newsletter_subscribers"]["Row"]

export default function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchSubscribers()
  }, [])

  const fetchSubscribers = async () => {
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("subscribed_at", { ascending: false })

    if (error) {
      console.error("Error fetching subscribers:", error)
    } else {
      setSubscribers(data || [])
    }
    setLoading(false)
  }

  const unsubscribeUser = async (subscriberId: string) => {
    if (!confirm("Are you sure you want to unsubscribe this user?")) return

    const { error } = await supabase
      .from("newsletter_subscribers")
      .update({
        is_active: false,
        unsubscribed_at: new Date().toISOString(),
      })
      .eq("id", subscriberId)

    if (!error) {
      fetchSubscribers()
    }
  }

  const exportSubscribers = () => {
    const activeSubscribers = subscribers.filter((sub) => sub.is_active)
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Email,Subscribed Date\n" +
      activeSubscribers.map((sub) => `${sub.email},${new Date(sub.subscribed_at).toLocaleDateString()}`).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "newsletter_subscribers.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredSubscribers = subscribers.filter((subscriber) =>
    subscriber.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const activeSubscribers = subscribers.filter((sub) => sub.is_active)

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
          <div className="text-green-400 font-mono">Loading subscribers...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <TerminalWindow title="newsletter.sh">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-green-300">Newsletter Management</h1>
              <p className="text-green-400/80">Manage newsletter subscribers</p>
            </div>
            <button
              onClick={exportSubscribers}
              className="flex items-center space-x-2 px-4 py-2 glass rounded text-green-400 font-mono hover:bg-green-400/10 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </TerminalWindow>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TerminalWindow title="total_subscribers.json">
            <div className="flex items-center space-x-3">
              <Mail className="h-6 w-6 text-green-400" />
              <div>
                <div className="text-2xl font-bold text-green-300">{activeSubscribers.length}</div>
                <div className="text-green-400/80 text-sm">Active Subscribers</div>
              </div>
            </div>
          </TerminalWindow>

          <TerminalWindow title="unsubscribed.json">
            <div className="flex items-center space-x-3">
              <UserX className="h-6 w-6 text-yellow-400" />
              <div>
                <div className="text-2xl font-bold text-yellow-300">
                  {subscribers.filter((sub) => !sub.is_active).length}
                </div>
                <div className="text-green-400/80 text-sm">Unsubscribed</div>
              </div>
            </div>
          </TerminalWindow>

          <TerminalWindow title="growth.json">
            <div className="flex items-center space-x-3">
              <Calendar className="h-6 w-6 text-green-400" />
              <div>
                <div className="text-2xl font-bold text-green-300">
                  {
                    subscribers.filter((sub) => {
                      const subDate = new Date(sub.subscribed_at)
                      const thirtyDaysAgo = new Date()
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                      return subDate > thirtyDaysAgo && sub.is_active
                    }).length
                  }
                </div>
                <div className="text-green-400/80 text-sm">New (30 days)</div>
              </div>
            </div>
          </TerminalWindow>
        </div>

        {/* Search */}
        <TerminalWindow title="search.json">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-400/60" />
            <input
              type="text"
              placeholder="Search subscribers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/40 border border-green-400/30 rounded text-green-400 focus:border-green-400 focus:outline-none transition-colors"
            />
          </div>
        </TerminalWindow>

        {/* Subscribers List */}
        <div className="space-y-4">
          {filteredSubscribers.map((subscriber) => (
            <TerminalWindow key={subscriber.id} title={`subscriber_${subscriber.email.split("@")[0]}.json`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${subscriber.is_active ? "bg-green-400" : "bg-red-400"}`} />

                  <div>
                    <div className="text-green-300 font-semibold">{subscriber.email}</div>

                    <div className="flex items-center space-x-4 text-green-400/60 text-xs">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Subscribed {formatDate(subscriber.subscribed_at)}</span>
                      </div>
                      {!subscriber.is_active && subscriber.unsubscribed_at && (
                        <div className="flex items-center space-x-1 text-red-400/60">
                          <UserX className="h-3 w-3" />
                          <span>Unsubscribed {formatDate(subscriber.unsubscribed_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {subscriber.is_active && (
                  <button
                    onClick={() => unsubscribeUser(subscriber.id)}
                    className="p-2 glass rounded hover:bg-red-400/10 transition-colors"
                    title="Unsubscribe user"
                  >
                    <UserX className="h-4 w-4 text-red-400" />
                  </button>
                )}
              </div>
            </TerminalWindow>
          ))}

          {filteredSubscribers.length === 0 && (
            <TerminalWindow title="no_subscribers.txt">
              <div className="text-center py-8">
                <div className="text-green-400/60">No subscribers found</div>
              </div>
            </TerminalWindow>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

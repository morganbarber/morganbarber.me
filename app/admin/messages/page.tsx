"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/admin/admin-layout"
import TerminalWindow from "@/components/terminal-window"
import { Inbox, Mail, Calendar, Search, Filter, Eye, EyeOff, Trash2, Reply, Archive } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import type { Database } from "@/lib/supabase"

type ContactMessage = Database["public"]["Tables"]["contact_messages"]["Row"]

export default function AdminMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching messages:", error)
    } else {
      setMessages(data || [])
    }
    setLoading(false)
  }

  const updateMessageStatus = async (messageId: string, status: string) => {
    const updates: any = { status }

    if (status === "read" && !messages.find((m) => m.id === messageId)?.read_at) {
      updates.read_at = new Date().toISOString()
    }

    if (status === "replied") {
      updates.replied_at = new Date().toISOString()
    }

    const { error } = await supabase.from("contact_messages").update(updates).eq("id", messageId)

    if (!error) {
      fetchMessages()
    }
  }

  const deleteMessage = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return

    const { error } = await supabase.from("contact_messages").delete().eq("id", messageId)

    if (!error) {
      fetchMessages()
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null)
      }
    }
  }

  const filteredMessages = messages.filter((message) => {
    const matchesSearch =
      message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.message.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterStatus === "all" || message.status === filterStatus

    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "unread":
        return "bg-red-400/20 text-red-300"
      case "read":
        return "bg-yellow-400/20 text-yellow-300"
      case "replied":
        return "bg-green-400/20 text-green-300"
      case "archived":
        return "bg-gray-400/20 text-gray-300"
      default:
        return "bg-gray-400/20 text-gray-300"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const unreadCount = messages.filter((m) => m.status === "unread").length

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-green-400 font-mono">Loading messages...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <TerminalWindow title="contact_messages.sh">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-green-300">Contact Messages</h1>
              <p className="text-green-400/80">Manage incoming contact form submissions</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-green-400">
                <Inbox className="h-5 w-5" />
                <span className="font-mono">{messages.length} total</span>
              </div>
              {unreadCount > 0 && (
                <div className="flex items-center space-x-2 text-red-300">
                  <Mail className="h-5 w-5" />
                  <span className="font-mono">{unreadCount} unread</span>
                </div>
              )}
            </div>
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
                  placeholder="Search messages..."
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
                <option value="all">All Messages</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
                <option value="replied">Replied</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </TerminalWindow>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Messages List */}
          <div className="space-y-4">
            {filteredMessages.map((message) => (
              <TerminalWindow key={message.id} title={`message_${message.id.slice(0, 8)}.txt`}>
                <div
                  className={`space-y-3 cursor-pointer p-2 rounded transition-colors ${
                    selectedMessage?.id === message.id ? "bg-green-400/10" : "hover:bg-green-400/5"
                  }`}
                  onClick={() => {
                    setSelectedMessage(message)
                    if (message.status === "unread") {
                      updateMessageStatus(message.id, "read")
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-green-300 font-semibold text-sm truncate">{message.name}</span>
                        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(message.status)}`}>
                          {message.status}
                        </span>
                      </div>

                      <div className="text-green-400/80 text-xs mb-1">{message.email}</div>
                      <div className="text-green-300 text-sm font-medium mb-2 truncate">{message.subject}</div>
                      <div className="text-green-400/70 text-xs line-clamp-2">{message.message}</div>

                      <div className="flex items-center space-x-4 text-xs text-green-400/60 mt-2">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(message.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          updateMessageStatus(message.id, message.status === "unread" ? "read" : "unread")
                        }}
                        className="p-1 hover:bg-green-400/10 rounded transition-colors"
                        title={message.status === "unread" ? "Mark as read" : "Mark as unread"}
                      >
                        {message.status === "unread" ? (
                          <EyeOff className="h-3 w-3 text-yellow-400" />
                        ) : (
                          <Eye className="h-3 w-3 text-green-400" />
                        )}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteMessage(message.id)
                        }}
                        className="p-1 hover:bg-red-400/10 rounded transition-colors"
                        title="Delete message"
                      >
                        <Trash2 className="h-3 w-3 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </TerminalWindow>
            ))}

            {filteredMessages.length === 0 && (
              <TerminalWindow title="no_messages.txt">
                <div className="text-center py-8">
                  <div className="text-green-400/60">No messages found</div>
                </div>
              </TerminalWindow>
            )}
          </div>

          {/* Message Detail */}
          <div className="space-y-4">
            {selectedMessage ? (
              <>
                <TerminalWindow title={`message_details_${selectedMessage.id.slice(0, 8)}.md`}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-green-300 font-mono text-lg">Message Details</h3>
                      <span className={`px-2 py-1 text-xs rounded ${getStatusColor(selectedMessage.status)}`}>
                        {selectedMessage.status}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-green-400/80 text-sm">From:</label>
                        <div className="text-green-300">{selectedMessage.name}</div>
                        <div className="text-green-400/80 text-sm">{selectedMessage.email}</div>
                      </div>

                      <div>
                        <label className="text-green-400/80 text-sm">Subject:</label>
                        <div className="text-green-300">{selectedMessage.subject}</div>
                      </div>

                      <div>
                        <label className="text-green-400/80 text-sm">Received:</label>
                        <div className="text-green-400/80 text-sm">{formatDate(selectedMessage.created_at)}</div>
                      </div>

                      {selectedMessage.read_at && (
                        <div>
                          <label className="text-green-400/80 text-sm">Read:</label>
                          <div className="text-green-400/80 text-sm">{formatDate(selectedMessage.read_at)}</div>
                        </div>
                      )}

                      {selectedMessage.replied_at && (
                        <div>
                          <label className="text-green-400/80 text-sm">Replied:</label>
                          <div className="text-green-400/80 text-sm">{formatDate(selectedMessage.replied_at)}</div>
                        </div>
                      )}

                      <div>
                        <label className="text-green-400/80 text-sm">Message:</label>
                        <div className="glass rounded p-3 border border-green-400/20 mt-1">
                          <div className="text-green-400/90 whitespace-pre-wrap">{selectedMessage.message}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TerminalWindow>

                <TerminalWindow title="message_actions.sh">
                  <div className="space-y-4">
                    <h4 className="text-green-300 font-mono">Actions</h4>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => updateMessageStatus(selectedMessage.id, "replied")}
                        disabled={selectedMessage.status === "replied"}
                        className="flex items-center justify-center space-x-2 px-3 py-2 glass rounded text-green-400 hover:bg-green-400/10 transition-colors disabled:opacity-50"
                      >
                        <Reply className="h-4 w-4" />
                        <span>Mark Replied</span>
                      </button>

                      <button
                        onClick={() => updateMessageStatus(selectedMessage.id, "archived")}
                        disabled={selectedMessage.status === "archived"}
                        className="flex items-center justify-center space-x-2 px-3 py-2 glass rounded text-green-400 hover:bg-green-400/10 transition-colors disabled:opacity-50"
                      >
                        <Archive className="h-4 w-4" />
                        <span>Archive</span>
                      </button>
                    </div>

                    <a
                      href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}&body=Hi ${selectedMessage.name},%0D%0A%0D%0AThank you for your message.%0D%0A%0D%0ABest regards,%0D%0AMorgan Barber`}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-green-400/20 rounded text-green-300 hover:bg-green-400/30 transition-colors"
                    >
                      <Mail className="h-4 w-4" />
                      <span>Reply via Email</span>
                    </a>
                  </div>
                </TerminalWindow>
              </>
            ) : (
              <TerminalWindow title="select_message.txt">
                <div className="text-center py-8">
                  <Inbox className="h-12 w-12 text-green-400/60 mx-auto mb-4" />
                  <div className="text-green-400/60">Select a message to view details</div>
                </div>
              </TerminalWindow>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

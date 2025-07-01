"use client"

import type React from "react"

import { useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { Mail, Send, CheckCircle } from "lucide-react"

export default function NewsletterSignup() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { error } = await supabase.from("newsletter_subscribers").insert([{ email }])

      if (error) {
        if (error.code === "23505") {
          setError("Email already subscribed!")
        } else {
          throw error
        }
      } else {
        setSubscribed(true)
        setEmail("")
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (subscribed) {
    return (
      <div className="glass rounded-lg p-6 text-center">
        <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
        <h3 className="text-green-300 font-mono text-lg mb-2">Successfully Subscribed!</h3>
        <p className="text-green-400/80 text-sm">
          You'll receive updates about new blog posts and cybersecurity insights.
        </p>
      </div>
    )
  }

  return (
    <div className="glass rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Mail className="h-6 w-6 text-green-400" />
        <h3 className="text-green-300 font-mono text-lg">Stay Updated</h3>
      </div>

      <p className="text-green-400/80 text-sm mb-4">
        Get the latest cybersecurity insights and technical articles delivered to your inbox.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-black/40 border border-green-400/30 rounded px-3 py-2 text-green-400 focus:border-green-400 focus:outline-none transition-colors"
          placeholder="your.email@example.com"
        />

        {error && <div className="text-red-300 text-sm bg-red-400/10 p-2 rounded">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full glass rounded py-2 px-4 text-green-400 font-mono hover:bg-green-400/10 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Subscribe</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { supabase } from "@/lib/supabase-client"
import TerminalWindow from "@/components/terminal-window"
import { X, Mail, Lock, User } from "lucide-react"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: "signin" | "signup"
  onModeChange: (mode: "signin" | "signup") => void
}

export default function AuthModal({ isOpen, onClose, mode, onModeChange }: AuthModalProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        })
        if (error) throw error
        setMessage("Check your email for the confirmation link!")
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        onClose()
      }
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <TerminalWindow title={`auth_${mode}.sh`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-green-300 font-mono text-lg">{mode === "signin" ? "Sign In" : "Create Account"}</h2>
              <button onClick={onClose} className="text-green-400 hover:text-red-400 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="block text-green-400 text-sm font-mono mb-2">
                    <User className="inline h-4 w-4 mr-2" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full bg-black/40 border border-green-400/30 rounded px-3 py-2 text-green-400 focus:border-green-400 focus:outline-none transition-colors"
                    placeholder="Your full name"
                  />
                </div>
              )}

              <div>
                <label className="block text-green-400 text-sm font-mono mb-2">
                  <Mail className="inline h-4 w-4 mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-black/40 border border-green-400/30 rounded px-3 py-2 text-green-400 focus:border-green-400 focus:outline-none transition-colors"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-green-400 text-sm font-mono mb-2">
                  <Lock className="inline h-4 w-4 mr-2" />
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-black/40 border border-green-400/30 rounded px-3 py-2 text-green-400 focus:border-green-400 focus:outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>

              {message && (
                <div
                  className={`text-sm p-2 rounded ${
                    message.includes("Check your email")
                      ? "text-green-300 bg-green-400/10"
                      : "text-red-300 bg-red-400/10"
                  }`}
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full glass rounded py-3 px-4 text-green-400 font-mono hover:bg-green-400/10 transition-all duration-200 disabled:opacity-50"
              >
                {loading ? "Processing..." : mode === "signin" ? "Sign In" : "Create Account"}
              </button>
            </form>

            <div className="text-center">
              <button
                onClick={() => onModeChange(mode === "signin" ? "signup" : "signin")}
                className="text-green-400/80 hover:text-green-300 text-sm font-mono transition-colors"
              >
                {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </div>
        </TerminalWindow>
      </div>
    </div>
  )
}

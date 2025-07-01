"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Terminal, Menu, X, User, LogOut } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import AuthModal from "./auth/auth-modal"

const navItems = [
  { name: "home", path: "/" },
  { name: "about", path: "/about" },
  { name: "experience", path: "/experience" },
  { name: "projects", path: "/projects" },
  { name: "blog", path: "/blog" },
  { name: "contact", path: "/contact" },
]

export default function Navigation() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin")
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === "SIGNED_IN") {
        setShowAuthModal(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setShowUserMenu(false)
  }

  if (!mounted) return null

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-green-400/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2 group">
              <Terminal className="h-6 w-6 text-green-400 group-hover:text-green-300 transition-colors" />
              <span className="font-mono text-green-400 group-hover:text-green-300 transition-colors">
                morgan@barber:~$
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-baseline space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.path}
                    className={`px-3 py-2 rounded-md text-sm font-mono transition-all duration-200 ${
                      pathname === item.path
                        ? "bg-green-400/20 text-green-300 terminal-glow"
                        : "text-green-400 hover:bg-green-400/10 hover:text-green-300"
                    }`}
                  >
                    ./{item.name}
                  </Link>
                ))}
              </div>

              {/* Auth Section */}
              <div className="ml-4 flex items-center space-x-2">
                {user ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-mono text-green-400 hover:bg-green-400/10 transition-colors"
                    >
                      <User className="h-4 w-4" />
                      <span>{user.user_metadata?.full_name || user.email}</span>
                    </button>

                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 glass rounded-md border border-green-400/20">
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-green-400/10 transition-colors flex items-center space-x-2"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setAuthMode("signin")
                      setShowAuthModal(true)
                    }}
                    className="px-3 py-2 rounded-md text-sm font-mono text-green-400 hover:bg-green-400/10 transition-colors"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-green-400 hover:text-green-300 transition-colors"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden glass border-t border-green-400/20">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-mono transition-all duration-200 ${
                    pathname === item.path
                      ? "bg-green-400/20 text-green-300"
                      : "text-green-400 hover:bg-green-400/10 hover:text-green-300"
                  }`}
                >
                  ./{item.name}
                </Link>
              ))}

              {/* Mobile Auth */}
              <div className="border-t border-green-400/20 pt-2 mt-2">
                {user ? (
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-mono text-green-400 hover:bg-green-400/10 transition-colors"
                  >
                    Sign Out
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setAuthMode("signin")
                      setShowAuthModal(true)
                      setIsOpen(false)
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-mono text-green-400 hover:bg-green-400/10 transition-colors"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </>
  )
}

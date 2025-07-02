"use client"

import { useState } from "react"
import Link from "next/link"
import TerminalWindow from "@/components/terminal-window"
import TypingText from "@/components/typing-text"
import StructuredData from "@/components/structured-data"
import { ChevronRight, Shield, Code, Database } from "lucide-react"

export default function Home() {
  const [showCommands, setShowCommands] = useState(false)

  return (
    <>
      <StructuredData type="person" data={{}} />
      <StructuredData type="website" data={{}} />

      <div className="min-h-screen px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="mb-12 fade-in">
            <TerminalWindow title="morgan@barber:~$ whoami" className="mb-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-green-400 font-mono">
                  <span className="text-green-500">$</span>
                  <TypingText text="cat /home/morgan/profile.txt" onComplete={() => setShowCommands(true)} />
                </div>

                {showCommands && (
                  <div className="space-y-2 slide-in-left">
                    <div className="text-green-300 text-2xl font-bold">Morgan Barber</div>
                    <div className="text-green-400">Cybersecurity Specialist</div>
                    <div className="text-green-400/80">CompTIA Network+ & A+ Certified</div>
                    <div className="text-green-400/60 text-sm">
                      Specializing in network security, threat detection, and innovative technology solutions
                    </div>
                  </div>
                )}
              </div>
            </TerminalWindow>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="glass rounded-lg p-6 hover:bg-green-400/5 transition-all duration-300 group">
              <Shield className="h-8 w-8 text-green-400 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-green-300 font-mono text-lg mb-2">Security Focus</h3>
              <p className="text-green-400/80 text-sm">Network security and threat analysis specialist</p>
            </div>

            <div className="glass rounded-lg p-6 hover:bg-green-400/5 transition-all duration-300 group">
              <Code className="h-8 w-8 text-green-400 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-green-300 font-mono text-lg mb-2">Development</h3>
              <p className="text-green-400/80 text-sm">Full-stack development with security-first mindset</p>
            </div>

            <div className="glass rounded-lg p-6 hover:bg-green-400/5 transition-all duration-300 group">
              <Database className="h-8 w-8 text-green-400 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-green-300 font-mono text-lg mb-2">Innovation</h3>
              <p className="text-green-400/80 text-sm">Machine learning and creative technology solutions</p>
            </div>
          </div>

          {/* Navigation Commands */}
          <TerminalWindow title="morgan@barber:~$ ls -la" className="mb-8">
            <div className="space-y-3">
              <div className="text-green-400 font-mono text-sm mb-4">Available directories:</div>

              {[
                { name: "about", desc: "Personal background and skills", path: "/about" },
                { name: "experience", desc: "Work history and achievements", path: "/experience" },
                { name: "projects", desc: "Portfolio of completed projects", path: "/projects" },
                { name: "blog", desc: "Technical articles and insights", path: "/blog" },
                { name: "contact", desc: "Get in touch", path: "/contact" },
              ].map((item, index) => (
                <Link
                  key={item.name}
                  href={item.path}
                  className="flex items-center space-x-3 text-green-400 hover:text-green-300 transition-colors group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  <span className="font-mono">cd ./{item.name}</span>
                  <span className="text-green-400/60 text-sm">#{item.desc}</span>
                </Link>
              ))}
            </div>
          </TerminalWindow>

          {/* Matrix Animation Background */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-10">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute h-px w-full matrix-bg"
                style={{
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${3 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

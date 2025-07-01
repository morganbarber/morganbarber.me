"use client"

import type { ReactNode } from "react"
import { Minimize2, Maximize2, X } from "lucide-react"

interface TerminalWindowProps {
  title?: string
  children: ReactNode
  className?: string
}

export default function TerminalWindow({ title = "terminal", children, className = "" }: TerminalWindowProps) {
  return (
    <div className={`glass rounded-lg overflow-hidden terminal-glow ${className}`}>
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/40 border-b border-green-400/20">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-green-400 font-mono text-sm ml-4">{title}</span>
        </div>
        <div className="flex items-center space-x-1 text-green-400/60">
          <Minimize2 className="w-4 h-4 hover:text-green-400 cursor-pointer transition-colors" />
          <Maximize2 className="w-4 h-4 hover:text-green-400 cursor-pointer transition-colors" />
          <X className="w-4 h-4 hover:text-red-400 cursor-pointer transition-colors" />
        </div>
      </div>

      {/* Terminal Content */}
      <div className="p-6">{children}</div>
    </div>
  )
}

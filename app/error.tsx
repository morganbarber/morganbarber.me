"use client"

import { useEffect } from "react"
import TerminalWindow from "@/components/terminal-window"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen px-4 py-8 flex items-center justify-center">
      <div className="max-w-2xl mx-auto">
        <TerminalWindow title="error.log">
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <AlertTriangle className="h-16 w-16 text-red-400" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-red-300 mb-2">System Error Detected</h1>
              <p className="text-green-400/80">An unexpected error occurred while processing your request.</p>
            </div>

            <div className="glass rounded-lg p-4 border border-red-400/20">
              <div className="text-red-400 font-mono text-sm">Error: {error.message || "Unknown system error"}</div>
              {error.digest && <div className="text-red-400/60 font-mono text-xs mt-2">Digest: {error.digest}</div>}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={reset}
                className="flex items-center justify-center space-x-2 px-6 py-3 glass rounded text-green-400 font-mono hover:bg-green-400/10 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </button>

              <Link
                href="/"
                className="flex items-center justify-center space-x-2 px-6 py-3 glass rounded text-green-400 font-mono hover:bg-green-400/10 transition-colors"
              >
                <Home className="h-4 w-4" />
                <span>Go Home</span>
              </Link>
            </div>

            <div className="text-green-400/60 text-sm font-mono">
              If this error persists, please contact the system administrator.
            </div>
          </div>
        </TerminalWindow>
      </div>
    </div>
  )
}

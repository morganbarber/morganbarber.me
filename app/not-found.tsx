import TerminalWindow from "@/components/terminal-window"
import TypingText from "@/components/typing-text"
import { FileX, Home, Search } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen px-4 py-8 flex items-center justify-center">
      <div className="max-w-2xl mx-auto">
        <TerminalWindow title="404.sh">
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <FileX className="h-16 w-16 text-yellow-400" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-yellow-300 mb-2">404 - File Not Found</h1>
              <div className="text-green-400 font-mono">
                <TypingText text="The requested resource could not be located in the file system." />
              </div>
            </div>

            <div className="glass rounded-lg p-4 border border-yellow-400/20">
              <div className="text-yellow-400 font-mono text-sm">
                $ ls -la /requested/path
                <br />
                ls: cannot access '/requested/path': No such file or directory
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="flex items-center justify-center space-x-2 px-6 py-3 glass rounded text-green-400 font-mono hover:bg-green-400/10 transition-colors"
              >
                <Home className="h-4 w-4" />
                <span>cd ~/home</span>
              </Link>

              <Link
                href="/blog"
                className="flex items-center justify-center space-x-2 px-6 py-3 glass rounded text-green-400 font-mono hover:bg-green-400/10 transition-colors"
              >
                <Search className="h-4 w-4" />
                <span>Browse Blog</span>
              </Link>
            </div>

            <div className="text-green-400/60 text-sm font-mono">
              Use the navigation above to find what you're looking for.
            </div>
          </div>
        </TerminalWindow>
      </div>
    </div>
  )
}

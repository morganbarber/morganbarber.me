import TerminalWindow from "@/components/terminal-window"

export default function Loading() {
  return (
    <div className="min-h-screen px-4 py-8 flex items-center justify-center">
      <div className="max-w-md mx-auto">
        <TerminalWindow title="loading.sh">
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
            </div>

            <div className="text-green-400 font-mono">
              <div className="typing-animation">Loading system resources...</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-green-400/60">
                <span>Initializing components</span>
                <span>100%</span>
              </div>
              <div className="w-full bg-black/40 rounded-full h-2">
                <div className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full animate-pulse w-full"></div>
              </div>
            </div>
          </div>
        </TerminalWindow>
      </div>
    </div>
  )
}

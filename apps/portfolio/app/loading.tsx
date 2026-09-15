/**
 * Streaming fallback.
 *
 * Pages render dynamically (see the nonce note in app/layout.tsx), so this is
 * what a visitor sees while the server assembles the page. It mirrors the final
 * layout's spacing so the real content does not jump when it arrives — a
 * skeleton that shifts on swap is worse than no skeleton at all.
 */
export default function Loading() {
  return (
    <main className="min-h-screen pt-32 px-6 max-w-7xl mx-auto" aria-busy="true">
      <span className="sr-only">Loading content…</span>

      <div className="animate-pulse space-y-10" aria-hidden="true">
        <div className="space-y-4">
          <div className="h-12 md:h-20 w-2/3 bg-muted/40" />
          <div className="h-12 md:h-20 w-1/2 bg-muted/20" />
        </div>

        <div className="space-y-6">
          {[0, 1, 2].map((index) => (
            <div key={index} className="border border-muted/40 p-6 space-y-3">
              <div className="h-3 w-24 bg-muted/40" />
              <div className="h-8 w-3/4 bg-muted/30" />
              <div className="h-3 w-full bg-muted/20" />
              <div className="h-3 w-5/6 bg-muted/20" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

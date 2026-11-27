import Link from "next/link";

/**
 * 404. The number decodes itself (data-scramble) over a terminal-style
 * explanation. Server component.
 */
export default function NotFound() {
  return (
    <main className="shell flex min-h-[100svh] flex-col justify-center pt-28 pb-20">
      <p className="mb-6 label">
        <span className="text-secondary">error</span> / http 404
      </p>
      <h1 className="font-display text-[clamp(7rem,30vw,26rem)] leading-[0.8]">
        <span data-scramble>404</span>
      </h1>
      <div className="mt-10 grid gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div data-reveal className="max-w-lg space-y-1 font-mono text-sm text-muted-foreground">
          <p>
            <span className="text-primary">$</span> curl -I {"<this page>"}
          </p>
          <p>HTTP/2 404 — target not found.</p>
          <p>Out of scope, moved, or never existed. No exploit required to go home.</p>
        </div>
        <div data-reveal className="flex flex-wrap gap-4">
          <Link href="/" className="btn btn-primary">
            Back home
          </Link>
          <Link href="/projects" className="btn btn-ghost">
            See projects
          </Link>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Route-level error boundary.
 *
 * Without one, an unhandled render error shows Next's default page — which in
 * development prints the stack trace. This renders a styled fallback instead
 * and shows only the `digest`: a hash Next assigns to the error so a report can
 * be correlated with the server log, without exposing the message, the stack,
 * or anything about the internals to the visitor.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The full error is logged server-side by Next; this is the client half.
    console.error("Unhandled render error:", error.digest ?? error.message);
  }, [error]);

  return (
    <main className="shell flex min-h-[100svh] flex-col justify-center pt-28 pb-20">
      <p className="mb-6 label">
        <span className="text-secondary">error</span> / http 500
      </p>
      <h1 className="font-display text-[clamp(4rem,14vw,12rem)] leading-[0.85]">Fault.</h1>
      <div className="mt-10 max-w-lg space-y-1 font-mono text-sm text-muted-foreground">
        <p>Something failed while rendering this page.</p>
        {error.digest ? <p className="break-all">reference: {error.digest}</p> : null}
      </div>
      <div className="mt-10 flex flex-wrap gap-4">
        <button type="button" onClick={reset} className="btn btn-primary">
          Retry
        </button>
        <Link href="/" className="btn btn-ghost">
          Back home
        </Link>
      </div>
    </main>
  );
}

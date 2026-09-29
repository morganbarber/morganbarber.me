"use client";

import { useEffect } from "react";
import Link from "next/link";
import GlitchHeading from "@repo/ui/glitch-heading";

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
    <main className="splash">
      <div className="relative z-10 flex flex-col items-center text-center space-y-8 max-w-xl">
        <div className="space-y-2">
          <p className="font-mono text-sm md:text-base text-secondary tracking-widest uppercase">
            {"// ERROR_CODE_500"}
          </p>
          <GlitchHeading
            as="h1"
            lines={["SYSTEM", "FAULT"]}
            className="text-5xl md:text-7xl leading-none"
            lineClassName={[undefined, "text-stroke"]}
          />
        </div>

        <div className="log-block w-full border-secondary/50 [--log-accent:var(--secondary)]">
          <p>Something failed while rendering this page.</p>
          {error.digest ? <p className="break-all">Reference: {error.digest}</p> : null}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button type="button" onClick={reset} className="btn btn-solid px-8 font-bold">
            RETRY
          </button>
          <Link href="/" className="btn btn-quiet px-8">
            RETURN HOME
          </Link>
        </div>
      </div>
    </main>
  );
}

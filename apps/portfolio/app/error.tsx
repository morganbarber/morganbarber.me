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
    <main className="relative flex flex-col items-center justify-center min-h-screen px-4 overflow-hidden bg-background">
      <div className="relative z-10 flex flex-col items-center text-center space-y-8 max-w-xl">
        <div className="space-y-2">
          <p className="font-mono text-sm md:text-base text-secondary tracking-widest uppercase">
            {"// ERROR_CODE_500"}
          </p>
          <GlitchHeading
            as="h1"
            lines={["SYSTEM", "FAULT"]}
            className="text-5xl md:text-7xl leading-none"
            lineClassName={[undefined, "text-transparent text-stroke"]}
          />
        </div>

        <div className="w-full font-mono text-sm text-muted-foreground space-y-2 border-l-2 border-secondary/50 pl-4 py-2 text-left bg-muted/10">
          <p className="before:content-['>'] before:mr-2 before:text-secondary">
            Something failed while rendering this page.
          </p>
          {error.digest ? (
            <p className="before:content-['>'] before:mr-2 before:text-secondary break-all">
              Reference: {error.digest}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={reset}
            className="bg-primary text-background hover:bg-transparent hover:text-primary border border-primary font-bold px-8 py-4 font-mono text-sm uppercase tracking-widest transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            RETRY
          </button>
          <Link
            href="/"
            className="border border-muted px-8 py-4 font-mono text-sm uppercase tracking-widest hover:border-primary hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            RETURN HOME
          </Link>
        </div>
      </div>
    </main>
  );
}

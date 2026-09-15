"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

/**
 * Unlike the public site's error boundary, this one shows the actual message.
 * The dashboard is a local developer tool with a single trusted operator, and
 * "Permission denied — check SUPABASE_SERVICE_ROLE_KEY" is exactly the detail
 * that makes a misconfiguration fixable in seconds rather than minutes.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full rounded border border-danger/40 bg-danger/5 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" aria-hidden="true" />
          <div className="min-w-0">
            <h1 className="font-bold text-danger">Something went wrong</h1>
            <p className="mt-2 whitespace-pre-wrap break-words text-muted-foreground">
              {error.message}
            </p>
            {error.digest ? (
              <p className="mt-2 text-xs text-muted-foreground">Reference: {error.digest}</p>
            ) : null}

            <div className="mt-5 flex items-center gap-4">
              <button
                type="button"
                onClick={reset}
                className="bg-primary text-background font-bold px-4 py-2 rounded hover:opacity-90 transition-opacity"
              >
                Try again
              </button>
              <Link href="/" className="text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

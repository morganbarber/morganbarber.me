"use client";

/**
 * Last-resort boundary for errors thrown in the root layout itself.
 *
 * This replaces the entire document, so it must render its own <html> and
 * <body> and cannot rely on the app's fonts, styles or providers — all inline,
 * all self-contained. A misconfigured environment (which throws from the
 * layout) lands here rather than on a blank page.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#050505",
          color: "#ededed",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: "36rem", textAlign: "center" }}>
          <p style={{ color: "#ff003c", letterSpacing: "0.2em", fontSize: "0.8rem" }}>
            {"// FATAL_ERROR"}
          </p>
          <h1 style={{ fontSize: "clamp(2rem, 8vw, 4rem)", margin: "0.5rem 0 1.5rem" }}>
            SYSTEM HALTED
          </h1>
          <p style={{ color: "#888", lineHeight: 1.7 }}>
            The application failed to start. If this persists, the server configuration is most
            likely at fault.
          </p>
          {error.digest ? (
            <p style={{ color: "#555", fontSize: "0.75rem", wordBreak: "break-all" }}>
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "2rem",
              background: "#00ff41",
              color: "#050505",
              border: "none",
              padding: "1rem 2rem",
              fontFamily: "inherit",
              fontWeight: 700,
              letterSpacing: "0.15em",
              cursor: "pointer",
            }}
          >
            RETRY
          </button>
        </div>
      </body>
    </html>
  );
}

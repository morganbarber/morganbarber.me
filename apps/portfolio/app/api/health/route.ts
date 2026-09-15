import { NextResponse } from "next/server";
import { createStaticClient } from "@repo/supabase/server";
import { describePublicEnv } from "@repo/config/env";

/**
 * GET /api/health — liveness and dependency check.
 *
 * Deliberately terse. A health endpoint is unauthenticated and therefore a
 * reconnaissance target, so it reports *that* a dependency is unhealthy and
 * never *why*: no error strings, no hostnames, no configuration details. The
 * status code carries the signal an uptime monitor needs; `scripts/preflight.mjs`
 * is where a developer goes for the diagnosis.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIMEOUT_MS = 5000;

export async function GET(): Promise<NextResponse> {
  const env = describePublicEnv();
  const startedAt = Date.now();

  let database: "ok" | "unreachable" | "unconfigured" = "unconfigured";

  if (env.ok) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const supabase = createStaticClient();
      const { error } = await supabase.rpc("health_check").abortSignal(controller.signal);
      database = error ? "unreachable" : "ok";
      if (error) {
        // Logged server-side only; never returned to the caller.
        console.error("[health] database check failed:", error.message);
      }
    } catch (error) {
      database = "unreachable";
      console.error(
        "[health] database unreachable:",
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      clearTimeout(timer);
    }
  }

  const healthy = env.ok && database === "ok";

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      checks: { environment: env.ok ? "ok" : "invalid", database },
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    },
    {
      status: healthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}

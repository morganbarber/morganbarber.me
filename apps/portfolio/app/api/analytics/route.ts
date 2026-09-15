import { NextResponse } from "next/server";
import { UAParser } from "ua-parser-js";
import { z } from "zod";
import { createStaticClient } from "@repo/supabase/server";
import { getSiteUrl } from "@repo/config/env";
import { getServerEnv } from "@repo/config/server-env";
import { rateLimit, rateLimitHeaders } from "@repo/security/rate-limit";
import {
  allowedOrigins,
  geoFromHeaders,
  isBot,
  isSameOrigin,
  optedOutOfTracking,
  referrerHost,
  visitorHash,
} from "@repo/security/request";
import { auditLog } from "@repo/security/audit";

/**
 * POST /api/analytics — records one page view or custom event.
 *
 * Replaces the previous Server Action, which took an unvalidated payload,
 * inserted it straight into the table with `as any`, and stored the raw user
 * agent and full referrer URL.
 *
 * Defence in depth, in the order it is applied:
 *
 *   1. Same-origin check          — CSRF; Route Handlers get no automatic one
 *   2. Body size cap              — reject before parsing
 *   3. Schema validation          — every field typed, bounded and trimmed
 *   4. Bot and DNT/GPC filtering  — privacy, and analytics hygiene
 *   5. In-process rate limit      — absorbs floods without touching the DB
 *   6. SECURITY DEFINER RPC       — the DB re-validates and rate-limits again
 *
 * The response is always 204 with no body. A client that can tell the
 * difference between "accepted", "rate limited" and "rejected as a bot" learns
 * how to evade those checks; one that cannot, does not.
 */

// ua-parser-js and the Supabase SDK both want Node built-ins.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Bodies larger than this are rejected unread. Real payloads are ~300 bytes. */
const MAX_BODY_BYTES = 2048;

const PER_IP_LIMIT = 60;
const PER_IP_WINDOW_MS = 60_000;

/**
 * Metadata is caller-supplied, so it is constrained rather than trusted:
 * at most 10 keys, short scalar values only, no nesting. That stops the column
 * being used as free storage or as a vector for a deeply nested parser bomb.
 */
const metadataSchema = z
  .record(z.string().max(48), z.union([z.string().max(200), z.number(), z.boolean()]))
  .refine((value) => Object.keys(value).length <= 10, {
    message: "metadata may contain at most 10 keys",
  });

const payloadSchema = z.object({
  // Must be a site-relative path. An absolute URL here would let a third-party
  // page attribute its own traffic to this site.
  path: z
    .string()
    .min(1)
    .max(512)
    .refine((value) => value.startsWith("/") && !value.startsWith("//"), {
      message: "path must be site-relative",
    }),
  event_name: z
    .string()
    .max(64)
    .regex(/^[a-z0-9_.-]+$/i, "event_name must be alphanumeric")
    .optional(),
  session_id: z.uuid().optional(),
  screen_resolution: z
    .string()
    .max(24)
    .regex(/^\d{1,5}x\d{1,5}$/, "screen_resolution must look like 1920x1080")
    .optional(),
  language: z.string().max(35).optional(),
  referrer: z.string().max(2048).optional(),
  metadata: metadataSchema.optional(),
});

export async function POST(request: Request): Promise<NextResponse> {
  // Uniform response: never reveals which check rejected the request.
  const accepted = (extra?: Record<string, string>) =>
    new NextResponse(null, {
      status: 204,
      headers: { "Cache-Control": "no-store", ...extra },
    });

  const siteUrl = getSiteUrl();

  if (!isSameOrigin(request, allowedOrigins(request, siteUrl))) {
    auditLog("csrf.rejected", {
      path: "/api/analytics",
      origin: request.headers.get("origin"),
      secFetchSite: request.headers.get("sec-fetch-site"),
    });
    return accepted();
  }

  /*
    Content-Type allowlist.

    A cross-origin HTML form can POST without a CORS preflight, but only with
    text/plain, application/x-www-form-urlencoded or multipart/form-data. None
    of those appear here: `sendBeacon` sends a Blob typed application/json and
    the fetch fallback sets the header explicitly. Requiring a JSON content
    type therefore forces any cross-origin caller through a preflight, which
    the browser will refuse — a second, independent CSRF control alongside the
    Sec-Fetch-Site check above.
  */
  const contentType = request.headers.get("content-type") ?? "";
  if (!/^application\/(json|reports\+json)\b/i.test(contentType)) {
    auditLog("request.bad_content_type", {
      path: "/api/analytics",
      contentType,
    });
    return accepted();
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return accepted();
  }

  const headers = request.headers;
  const userAgent = headers.get("user-agent");

  if (optedOutOfTracking(headers) || isBot(userAgent)) {
    return accepted();
  }

  let env;
  try {
    env = getServerEnv();
  } catch {
    // Misconfigured environment: drop the event rather than 500 a beacon.
    return accepted();
  }

  const hash = await visitorHash(headers, env.ANALYTICS_SALT);

  // Falls back to a shared bucket when hashing is unavailable, which is
  // conservative: it throttles harder, never softer.
  const limit = rateLimit(`analytics:${hash ?? "anonymous"}`, PER_IP_LIMIT, PER_IP_WINDOW_MS);
  if (!limit.allowed) {
    auditLog("ratelimit.exceeded", { path: "/api/analytics", actor: hash });
    return accepted(rateLimitHeaders(limit, PER_IP_LIMIT));
  }

  let raw: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return accepted();
    raw = JSON.parse(text);
  } catch {
    return accepted();
  }

  const parsed = payloadSchema.safeParse(raw);
  if (!parsed.success) {
    return accepted();
  }
  const payload = parsed.data;

  // The client-reported user agent is ignored entirely; only the header the
  // browser actually sent is parsed, and only its derived fields are stored.
  const ua = new UAParser(userAgent ?? "").getResult();
  const geo = geoFromHeaders(headers);

  try {
    const supabase = createStaticClient();

    const { error } = await supabase.rpc("track_event", {
      p_path: payload.path,
      p_event_name: payload.event_name ?? "page_view",
      p_session_id: payload.session_id ?? null,
      p_referrer_host: referrerHost(payload.referrer, siteUrl),
      p_language: payload.language ?? null,
      p_screen_resolution: payload.screen_resolution ?? null,
      p_device_type: ua.device.type ?? "desktop",
      p_os: [ua.os.name, ua.os.version].filter(Boolean).join(" ") || null,
      p_browser: [ua.browser.name, ua.browser.version].filter(Boolean).join(" ") || null,
      p_geo_country: geo.country,
      p_geo_region: geo.region,
      p_geo_city: geo.city,
      p_visitor_hash: hash,
      p_metadata: payload.metadata ?? {},
    });

    if (error) {
      console.error("[analytics] track_event failed:", error.message);
    }
  } catch (error) {
    // Analytics must never be able to take the site down.
    console.error(
      "[analytics] unreachable:",
      error instanceof Error ? error.message : String(error),
    );
  }

  return accepted(rateLimitHeaders(limit, PER_IP_LIMIT));
}

/** Anything other than POST is not an error worth explaining. */
export async function GET(): Promise<NextResponse> {
  return new NextResponse(null, { status: 405, headers: { Allow: "POST" } });
}

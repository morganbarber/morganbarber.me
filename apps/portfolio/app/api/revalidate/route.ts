import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { CACHE_TAGS } from "@repo/data/content";
import { getServerEnv } from "@repo/config/server-env";
import { timingSafeEqual } from "@repo/security/crypto";
import { rateLimit } from "@repo/security/rate-limit";
import { clientIp } from "@repo/security/request";
import { auditLog } from "@repo/security/audit";

/**
 * POST /api/revalidate — drops cached content after an edit in Supabase.
 *
 * Content is cached for an hour, which is right for reads and wrong for the
 * moment you publish a post. This is the escape hatch. Point a Supabase
 * Database Webhook at it (see supabase/README.md) and edits go live at once.
 *
 * Authentication is a shared secret in `x-revalidate-secret`, compared in
 * constant time. The endpoint is rate limited too: without that, the secret
 * could be attacked at whatever rate the platform allows.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ATTEMPT_LIMIT = 10;
const ATTEMPT_WINDOW_MS = 60_000;

const bodySchema = z.object({
  // Bare tag name, or a Supabase webhook payload's `table`.
  tag: z.enum(Object.values(CACHE_TAGS) as [string, ...string[]]).optional(),
  table: z.string().max(64).optional(),
});

/** Supabase webhooks identify the table; map it onto our cache tags. */
const TABLE_TO_TAG: Record<string, string> = {
  blog_posts: CACHE_TAGS.blogPosts,
  projects: CACHE_TAGS.projects,
  experience: CACHE_TAGS.experience,
  education: CACHE_TAGS.education,
  certifications: CACHE_TAGS.certifications,
  competitions: CACHE_TAGS.competitions,
};

export async function POST(request: Request): Promise<NextResponse> {
  const unauthorized = () =>
    NextResponse.json(
      { revalidated: false },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );

  const ip = clientIp(request.headers) ?? "unknown";
  const attempts = rateLimit(`revalidate:${ip}`, ATTEMPT_LIMIT, ATTEMPT_WINDOW_MS);
  if (!attempts.allowed) {
    auditLog("ratelimit.exceeded", { path: "/api/revalidate", actor: ip });
    return NextResponse.json(
      { revalidated: false },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(attempts.retryAfter),
        },
      },
    );
  }

  let secret: string | undefined;
  try {
    secret = getServerEnv().REVALIDATE_SECRET;
  } catch {
    return unauthorized();
  }

  // Not configured means disabled, not open. Still worth recording when
  // someone presents a secret to it — that is a probe regardless of whether
  // the endpoint happens to be enabled.
  if (!secret) {
    if (request.headers.get("x-revalidate-secret")) {
      auditLog("secret.invalid", {
        path: "/api/revalidate",
        actor: ip,
        reason: "endpoint not configured",
      });
    }
    return unauthorized();
  }

  const provided = request.headers.get("x-revalidate-secret");
  if (!provided || !timingSafeEqual(provided, secret)) {
    // Nobody guesses this by accident. A failure here means someone is probing
    // a privileged endpoint, which is worth alerting on.
    auditLog("secret.invalid", {
      path: "/api/revalidate",
      actor: ip,
      presented: provided ? "yes" : "no",
    });
    return unauthorized();
  }

  let payload: unknown = {};
  try {
    const text = await request.text();
    if (text) payload = JSON.parse(text);
  } catch {
    return NextResponse.json({ revalidated: false }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ revalidated: false }, { status: 400 });
  }

  const explicit = parsed.data.tag;
  const fromTable = parsed.data.table ? TABLE_TO_TAG[parsed.data.table] : undefined;

  // With no hint, refresh everything — the safe default for a manual call.
  const tags = explicit ? [explicit] : fromTable ? [fromTable] : Object.values(CACHE_TAGS);

  // Next 16 requires a cache-life profile. `{ expire: 0 }` means "treat every
  // entry as already stale", i.e. purge now.
  for (const tag of tags) revalidateTag(tag, { expire: 0 });

  return NextResponse.json(
    { revalidated: true, tags, now: Date.now() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(): Promise<NextResponse> {
  return new NextResponse(null, { status: 405, headers: { Allow: "POST" } });
}

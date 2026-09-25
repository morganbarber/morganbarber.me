import "server-only";

/**
 * In-process fixed-window rate limiter.
 *
 * This is the *first* of two layers. It is cheap and rejects floods before they
 * ever reach Supabase, but it only knows about one server instance, so a
 * serverless deployment gets one bucket per warm instance. The authoritative
 * limit lives in the database (`public.consume_rate_limit`), which every write
 * path also passes through. Together: this layer absorbs the volume, the
 * database layer enforces the real ceiling.
 *
 * Deliberately not backed by Redis — an extra network hop on every page view
 * would cost more than it saves at this traffic level.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

/** Hard cap on tracked keys, so a key-space flood cannot exhaust memory. */
const MAX_KEYS = 10_000;

const buckets = new Map<string, Bucket>();

/** Drops expired entries, and the oldest entries if the map is over capacity. */
function evict(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  if (buckets.size <= MAX_KEYS) return;

  // Map preserves insertion order, so the head is the least recently created.
  const excess = buckets.size - MAX_KEYS;
  let removed = 0;
  for (const key of buckets.keys()) {
    buckets.delete(key);
    if (++removed >= excess) break;
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  /** Seconds to wait before retrying; 0 when the request was allowed. */
  retryAfter: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  // Amortised cleanup: sweeping ~1% of calls keeps the map bounded without
  // running a timer that would keep a serverless instance alive.
  if (Math.random() < 0.01) evict(now);

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const bucket: Bucket = { count: 1, resetAt: now + windowMs };
    buckets.delete(key); // re-insert at the tail for LRU-ish ordering
    buckets.set(key, bucket);
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: bucket.resetAt,
      retryAfter: 0,
    };
  }

  existing.count += 1;
  const allowed = existing.count <= limit;

  return {
    allowed,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
    retryAfter: allowed ? 0 : Math.ceil((existing.resetAt - now) / 1000),
  };
}

/** Standard rate-limit headers for a response. */
export function rateLimitHeaders(result: RateLimitResult, limit: number): Record<string, string> {
  const headers: Record<string, string> = {
    "RateLimit-Limit": String(limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(Math.max(0, Math.ceil((result.resetAt - Date.now()) / 1000))),
  };
  if (!result.allowed) headers["Retry-After"] = String(result.retryAfter);
  return headers;
}

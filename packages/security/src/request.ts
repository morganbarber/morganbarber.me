import "server-only";

/**
 * Helpers for reasoning about an inbound request: who sent it, whether it came
 * from us, and whether it is a human.
 *
 * Uses Web Crypto and standard globals only, so it works unchanged on both the
 * Node and Edge runtimes.
 */

/**
 * Best-effort client address.
 *
 * Header order matters. `x-forwarded-for` is trivially spoofable by the client,
 * so platform-set headers are preferred and the *leftmost* XFF entry is only
 * used as a last resort. The result is never stored raw — see `visitorHash` —
 * and is used for throttling, where a spoofed value costs the attacker nothing
 * but also gains them nothing beyond an unshared bucket.
 */
export function clientIp(headers: Headers): string | null {
  const candidates = [
    headers.get("cf-connecting-ip"),
    headers.get("x-real-ip"),
    headers.get("x-vercel-forwarded-for"),
    headers.get("x-forwarded-for")?.split(",")[0],
  ];

  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (value && isIpLike(value)) return value;
  }
  return null;
}

function isIpLike(value: string): boolean {
  if (value.length > 45) return false;
  // IPv4, or anything with the hex-and-colons shape of IPv6.
  return (
    /^\d{1,3}(?:\.\d{1,3}){3}$/.test(value) || /^[0-9a-fA-F:]+$/.test(value)
  );
}

/**
 * Salted SHA-256 of the client address, truncated to 32 hex characters.
 *
 * Without the salt this would be reversible: the entire IPv4 space can be
 * hashed in seconds, so an unsalted digest is still personal data. With a
 * secret salt it becomes a stable pseudonymous key — enough to count unique
 * visitors and throttle abuse, useless for identifying anyone.
 *
 * Returns null when no salt is configured, which disables per-visitor
 * attribution entirely rather than falling back to something weaker.
 */
export async function visitorHash(
  headers: Headers,
  salt: string | undefined,
): Promise<string | null> {
  if (!salt) return null;
  const ip = clientIp(headers);
  if (!ip) return null;

  const data = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

/**
 * Verifies the request originated from this site.
 *
 * This is the CSRF control for the analytics and contact endpoints. Next.js
 * Server Actions carry their own origin check; plain Route Handlers do not, so
 * it is applied explicitly here. `sec-fetch-site` is set by the browser and
 * cannot be overridden by page script, which makes it the stronger of the two
 * signals; Origin is checked as well for older clients.
 */
export function isSameOrigin(request: Request, allowedOrigins: string[]): boolean {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite && secFetchSite !== "same-origin" && secFetchSite !== "none") {
    return false;
  }

  const origin = request.headers.get("origin");
  if (origin) {
    return allowedOrigins.includes(origin);
  }

  // No Origin header: only acceptable when the browser told us it was a
  // same-origin fetch (or a direct navigation, which cannot be a CSRF POST).
  return secFetchSite === "same-origin" || secFetchSite === "none";
}

/** Origins considered "us", including the request's own host in preview deploys. */
export function allowedOrigins(request: Request, siteUrl: string): string[] {
  const origins = new Set<string>([siteUrl]);
  try {
    origins.add(new URL(request.url).origin);
  } catch {
    /* request.url is always absolute in Next, but never trust that blindly */
  }
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) origins.add(`https://${vercelUrl}`);
  return [...origins];
}

/**
 * Coarse bot detection for analytics hygiene, not for access control.
 *
 * A determined crawler will not match this, and that is fine — the goal is to
 * keep obvious automated traffic out of the page-view numbers, not to block it.
 */
const BOT_PATTERN =
  /bot|crawl|spider|slurp|headless|phantom|puppeteer|playwright|selenium|curl|wget|python-requests|axios|go-http|java\/|okhttp|scrapy|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|preview|facebookexternalhit|embedly|quora link|vkshare|whatsapp|telegram|discord|slackbot|twitterbot|linkedinbot|applebot|bingpreview|semrush|ahrefs|mj12|dotbot|petalbot|dataprovider|screaming frog/i;

export function isBot(userAgent: string | null): boolean {
  if (!userAgent || userAgent.length < 8) return true;
  return BOT_PATTERN.test(userAgent);
}

/**
 * Honours Do Not Track and Global Privacy Control.
 *
 * Neither is legally binding for first-party analytics in most jurisdictions,
 * but respecting them costs one page view and is the right default.
 */
export function optedOutOfTracking(headers: Headers): boolean {
  return headers.get("dnt") === "1" || headers.get("sec-gpc") === "1";
}

/** Geo hints set by the hosting platform; absent when self-hosted. */
export function geoFromHeaders(headers: Headers): {
  country: string | null;
  region: string | null;
  city: string | null;
} {
  const decode = (value: string | null): string | null => {
    if (!value) return null;
    try {
      // Vercel percent-encodes non-ASCII city names.
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };

  return {
    country:
      headers.get("x-vercel-ip-country") ??
      headers.get("cf-ipcountry") ??
      null,
    region: decode(headers.get("x-vercel-ip-country-region")),
    city: decode(headers.get("x-vercel-ip-city")),
  };
}

/** Registrable host of a referrer, or null when absent, invalid or same-site. */
export function referrerHost(
  referrer: string | null | undefined,
  siteUrl: string,
): string | null {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const selfHost = new URL(siteUrl).host;
    if (url.host === selfHost) return null;
    return url.host.slice(0, 255);
  } catch {
    return null;
  }
}

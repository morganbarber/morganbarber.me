import { getSupabaseUrl } from "@repo/config/env";

/**
 * Security response headers, including a nonce-based Content Security Policy.
 *
 * Runs on the Edge runtime (imported by proxy.ts), so everything here uses
 * Web Crypto and standard globals only — no Node built-ins.
 */

/** Cryptographically random, base64-encoded nonce for this single response. */
export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/**
 * Derives the origins the page is allowed to talk to from the configured
 * Supabase URL, rather than hardcoding a project ref that would silently go
 * stale when the project is replaced.
 */
function supabaseOrigins(): string[] {
  const raw = getSupabaseUrl();
  if (!raw) return [];
  try {
    const { origin, host } = new URL(raw);
    // The realtime channel uses the same host over wss://.
    return [origin, `wss://${host}`];
  } catch {
    return [];
  }
}

export interface CspOptions {
  nonce: string;
  isDev: boolean;
}

/** Endpoint that collects CSP violation reports. */
export const REPORT_PATH = "/api/csp-report";

/** Reporting API group name, shared by the CSP and `Reporting-Endpoints`. */
export const REPORT_GROUP = "csp";

/**
 * Builds the CSP.
 *
 * `'strict-dynamic'` is the important part: scripts loaded by a nonce-approved
 * script inherit trust, which is how Next's runtime loads its chunks, while an
 * injected `<script src>` from a markup injection does not. That makes the
 * policy resistant to XSS without needing to enumerate every chunk URL.
 */
export function buildCsp({ nonce, isDev }: CspOptions): string {
  const supabase = supabaseOrigins();

  const directives: Record<string, string[] | null> = {
    "default-src": ["'self'"],

    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      // Browsers that do not understand strict-dynamic fall back to these.
      "https:",
      // React Refresh and the dev overlay compile with eval().
      ...(isDev ? ["'unsafe-eval'", "'unsafe-inline'"] : []),
    ],

    /*
      Nonce-based in production, verified against the real output: a production
      build emits ZERO inline `<style>` elements — Tailwind ships an external
      stylesheet, and Next puts the nonce on its `<link>` — so `'unsafe-inline'`
      bought nothing here except the ability for an injected `<style>` to run.
      That matters: CSS injection is a real exfiltration primitive (attribute
      selectors plus `background: url()` leak input values character by
      character) and a UI-redressing one.

      Dev keeps `'unsafe-inline'` because the HMR overlay injects unnonced
      style elements.

      `style-src-attr` stays permissive because framer-motion animates through
      element `style` attributes — 37 of them on the home page alone. Attribute
      styles cannot contain selectors, so they carry none of the exfiltration
      risk a `<style>` element does.
    */
    "style-src": isDev
      ? ["'self'", "'unsafe-inline'"]
      : ["'self'", `'nonce-${nonce}'`],
    "style-src-elem": isDev
      ? ["'self'", "'unsafe-inline'"]
      : ["'self'", `'nonce-${nonce}'`],
    "style-src-attr": ["'unsafe-inline'"],

    // next/font self-hosts the Google fonts at build time, so no external
    // font origin is needed at runtime.
    "font-src": ["'self'", "data:"],

    "img-src": ["'self'", "data:", "blob:", ...supabase],

    "connect-src": [
      "'self'",
      ...supabase,
      // The dev server's HMR socket.
      ...(isDev ? ["ws:", "wss:"] : []),
    ],

    "media-src": ["'self'"],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],

    // No plugins, no <base> hijacking, no embedding of this site anywhere.
    "object-src": ["'none'"],
    "base-uri": ["'none'"],
    "frame-ancestors": ["'none'"],
    "frame-src": ["'none'"],

    // Forms may only post back to this origin — blocks exfiltration via an
    // injected form action.
    "form-action": ["'self'"],

    // Valueless directive; omitted in dev where the origin is http://localhost.
    "upgrade-insecure-requests": isDev ? null : [],

    /*
      Violation reporting. `report-to` is the current mechanism and pairs with
      the `Reporting-Endpoints` response header; `report-uri` is deprecated but
      is still the only one Safari and older Firefox honour, so both are sent.

      Without this a CSP failure is invisible: the page silently loses a script
      and nobody finds out until a user reports a broken feature. It is also the
      only signal that an injection attempt was blocked.
    */
    "report-to": [REPORT_GROUP],
    "report-uri": [REPORT_PATH],
  };

  return Object.entries(directives)
    .filter(([, value]) => value !== null)
    .map(([name, value]) => (value!.length ? `${name} ${value!.join(" ")}` : name))
    .join("; ");
}

/**
 * `Reporting-Endpoints` is what makes the CSP's `report-to` directive resolve.
 * Without it the directive names a group the browser has never heard of and
 * nothing is ever sent.
 */
export function reportingEndpoints(siteUrl?: string): string {
  // A relative URL is accepted by Chrome but not by every implementation, so
  // an absolute one is used when the origin is known.
  const endpoint = siteUrl ? `${siteUrl.replace(/\/$/, "")}${REPORT_PATH}` : REPORT_PATH;
  return `${REPORT_GROUP}="${endpoint}"`;
}

/**
 * Report-only policy carrying the directives that are not yet safe to enforce.
 *
 * Trusted Types would eliminate DOM-based XSS outright by making every
 * dangerous sink (`innerHTML`, `eval`, `Function`) reject a plain string. React
 * and Next are not fully Trusted-Types-compliant today, so enforcing it would
 * break the site. Running it report-only costs nothing, breaks nothing, and
 * surfaces exactly which sinks are still in use — which is the information
 * needed to decide when enforcing becomes possible.
 *
 * `trusted-types 'none'` allows no policy to be created, so every sink use is
 * reported. That is the discovery mode, not the end state.
 */
export function buildReportOnlyCsp(): string {
  return [
    "require-trusted-types-for 'script'",
    "trusted-types 'none'",
    `report-to ${REPORT_GROUP}`,
    `report-uri ${REPORT_PATH}`,
  ].join("; ");
}

/**
 * Headers applied to every response.
 *
 * `hostname` gates HSTS. Browsers are required to ignore an STS header received
 * over plain HTTP, so this is belt-and-braces — but a production build served
 * on localhost (`next start`, a container health check, a CI smoke test) should
 * not be advertising a two-year HTTPS pin for a host that has no certificate.
 */
export function securityHeaders({
  isDev,
  hostname,
  siteUrl,
  isPreview,
}: {
  isDev: boolean;
  hostname?: string;
  /** Canonical origin, used to build an absolute reporting endpoint. */
  siteUrl?: string;
  /** True on a non-production deployment (Vercel preview, branch build). */
  isPreview?: boolean;
}): Record<string, string> {
  const headers: Record<string, string> = {
    // Defence in depth behind CSP frame-ancestors, for older browsers.
    "X-Frame-Options": "DENY",

    // Stops MIME sniffing turning an uploaded .txt into executable script.
    "X-Content-Type-Options": "nosniff",

    // Send the origin cross-site, the full path same-origin. Never leaks query
    // strings to third parties.
    "Referrer-Policy": "strict-origin-when-cross-origin",

    // Deny every powerful feature this site has no use for.
    "Permissions-Policy": [
      "accelerometer=()",
      "ambient-light-sensor=()",
      "autoplay=()",
      "battery=()",
      "camera=()",
      "display-capture=()",
      "document-domain=()",
      "encrypted-media=()",
      "fullscreen=(self)",
      "geolocation=()",
      "gyroscope=()",
      "magnetometer=()",
      "microphone=()",
      "midi=()",
      "payment=()",
      "picture-in-picture=()",
      "publickey-credentials-get=()",
      "screen-wake-lock=()",
      "serial=()",
      "usb=()",
      "xr-spatial-tracking=()",
      "interest-cohort=()",
      // Successor to interest-cohort; both are sent since browsers differ.
      "browsing-topics=()",
    ].join(", "),

    // Process isolation: severs window.opener links and blocks cross-origin
    // reads of this document, which is the baseline defence against Spectre-class
    // side channels.
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",

    /*
      The third leg of cross-origin isolation, and the one header the OWASP
      Secure Headers baseline flagged as missing. With COOP it makes the page
      `crossOriginIsolated`, which is what actually mitigates the Spectre-class
      timing attacks COOP alone only half-addresses.

      `credentialless` rather than `require-corp`: a cross-origin subresource
      loads without credentials instead of being blocked outright for lacking a
      CORP header. Verified against the real output — the page has zero
      cross-origin subresources today (the only external URLs are <a> hrefs and
      a preconnect, neither of which COEP governs) — but Supabase Storage is an
      allowed image source, and `require-corp` would break those the day one is
      used. Safari does not implement `credentialless` and ignores the value,
      which costs the isolation there but breaks nothing.

      Omitted in dev: the HMR websocket and the error overlay load resources
      that do not satisfy it.
    */
    ...(isDev ? {} : { "Cross-Origin-Embedder-Policy": "credentialless" }),

    // Gives this origin its own agent cluster.
    "Origin-Agent-Cluster": "?1",

    // No DNS prefetch of third-party hosts a page might reference.
    "X-DNS-Prefetch-Control": "off",

    // Legacy, but harmless and still honoured by some corporate proxies.
    "X-Permitted-Cross-Domain-Policies": "none",

    // Resolves the CSP's `report-to` group.
    "Reporting-Endpoints": reportingEndpoints(siteUrl),

    // Trusted Types discovery. Report-only: never blocks anything.
    "Content-Security-Policy-Report-Only": buildReportOnlyCsp(),
  };

  /*
    A preview deployment is a complete copy of the site — same database, same
    content — on a different hostname. Indexed, it becomes a duplicate that can
    outrank the real site and that leaks unreleased content. The header is the
    reliable control; robots.txt is advisory and only covers crawlers that read
    it before fetching.
  */
  if (isPreview) {
    headers["X-Robots-Tag"] = "noindex, nofollow, noarchive";
  }

  const isLocalHost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname?.endsWith(".localhost") === true;

  if (!isDev && !isLocalHost) {
    // Two years, subdomains included, preload-eligible.
    headers["Strict-Transport-Security"] =
      "max-age=63072000; includeSubDomains; preload";
  }

  return headers;
}

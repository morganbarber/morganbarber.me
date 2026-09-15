import { NextResponse, type NextRequest } from "next/server";
import { buildCsp, generateNonce, securityHeaders } from "@repo/security/headers";
import { getSiteUrl } from "@repo/config/env";
import { auditLog } from "@repo/security/audit";

/**
 * Edge proxy (the `middleware.ts` convention, renamed in Next 16): every
 * response leaves with a nonce-based CSP and the full set of security headers,
 * and obvious probe traffic is dropped before it can reach a route handler.
 */

const isDev = process.env.NODE_ENV !== "production";

/**
 * True on any deployment that is not production. `VERCEL_ENV` is set by the
 * platform to "production" | "preview" | "development", so a preview build is
 * identified without needing to be configured as one.
 */
const isPreview =
  Boolean(process.env.VERCEL_ENV) && process.env.VERCEL_ENV !== "production";

/**
 * Paths that only ever appear in automated vulnerability scans. Answering them
 * with 404 keeps the logs readable and avoids handing a scanner any signal
 * about what this stack is.
 */
const PROBE_PATTERNS: RegExp[] = [
  /^\/wp-(admin|login|content|includes)/i,
  /^\/(xmlrpc|wlwmanifest)\.php/i,
  /\.(php|asp|aspx|jsp|cgi)$/i,
  /^\/\.(env|git|svn|hg|aws|ssh|vscode|idea)(\/|$)/i,
  /^\/(config|backup|dump|database|db)\.(sql|bak|zip|tar|gz|json|ya?ml)$/i,
  /^\/(vendor|storage)\/.*\.(log|env)$/i,
  /^\/(actuator|solr|struts|jenkins|phpmyadmin|pma|adminer)(\/|$)/i,
  /^\/\.well-known\/(?!security\.txt|change-password).*\.(php|env)$/i,
  /^\/(telescope|debug|_profiler)(\/|$)/i,
];

/** Methods this site has any use for. Everything else is rejected at the edge. */
const ALLOWED_METHODS = new Set(["GET", "HEAD", "POST", "OPTIONS"]);

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!ALLOWED_METHODS.has(request.method)) {
    auditLog("method.rejected", { method: request.method, path: pathname });
    return new NextResponse("Method Not Allowed", {
      status: 405,
      headers: { Allow: [...ALLOWED_METHODS].join(", ") },
    });
  }

  if (PROBE_PATTERNS.some((pattern) => pattern.test(pathname))) {
    // A burst of these is the clearest early signal of an active scan.
    auditLog("probe.blocked", { path: pathname });
    return new NextResponse(null, {
      status: 404,
      headers: { "X-Robots-Tag": "noindex" },
    });
  }

  // Null bytes and encoded traversal sequences in a path are never legitimate.
  if (pathname.includes("\0") || /%00|%2e%2e|\.\.[/\\]/i.test(request.nextUrl.pathname + request.nextUrl.search)) {
    auditLog("request.malformed", { path: pathname });
    return new NextResponse(null, { status: 400 });
  }

  const nonce = generateNonce();
  const csp = buildCsp({ nonce, isDev });

  /**
   * Next reads the nonce back out of the request's own CSP header when it
   * renders, which is how the framework's inline bootstrap script gets the
   * matching `nonce` attribute. Setting it on the request is therefore not
   * redundant with setting it on the response.
   */
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  response.headers.set("Content-Security-Policy", csp);
  const headerSet = securityHeaders({
    isDev,
    hostname: request.nextUrl.hostname,
    siteUrl: getSiteUrl(),
    isPreview,
  });
  for (const [name, value] of Object.entries(headerSet)) {
    response.headers.set(name, value);
  }

  // Next sets this on its own; removing it denies a fingerprinting datapoint.
  response.headers.delete("X-Powered-By");

  return response;
}

export const config = {
  /**
   * Runs on every document and API response. Next's immutable build output and
   * files served straight from /public are excluded: they are fingerprinted or
   * inert, carry no CSP-relevant markup, and skipping them keeps the static
   * path free of per-request work.
   *
   * Prefetches are deliberately NOT excluded. Skipping them would leave RSC
   * payload responses without security headers, which is exactly the kind of
   * gap that is easy to miss and hard to notice.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|pdf|txt|xml|webmanifest)$).*)",
  ],
};

import { NextResponse, type NextRequest } from "next/server";
import { auditLog } from "./audit";
import { buildCsp, generateNonce, securityHeaders } from "./headers";

/**
 * Shared building blocks for each app's `proxy.ts` (Next 16's middleware).
 *
 * Both apps previously carried their own copy of the nonce generation, CSP
 * wiring and header loop — the same ~60 lines, drifting independently. Each
 * `proxy.ts` is now only its *policy* (which methods, whether it is local-only,
 * which paths may be embedded) composed from these functions.
 */

/**
 * Paths that only ever appear in automated vulnerability scans. Answering them
 * with 404 keeps the logs readable and gives a scanner no signal about the
 * stack.
 */
export const DEFAULT_PROBE_PATTERNS: readonly RegExp[] = [
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

export interface ScreenOptions {
  /** HTTP methods the app serves; anything else is a 405. */
  allowedMethods?: ReadonlySet<string>;
  probePatterns?: readonly RegExp[];
}

const DEFAULT_METHODS: ReadonlySet<string> = new Set(["GET", "HEAD", "POST", "OPTIONS"]);

/**
 * Rejects requests that no legitimate client sends, before any rendering.
 *
 * Returns a response to send immediately, or `null` to continue. Every
 * rejection is recorded as a security event.
 */
export function screenRequest(
  request: NextRequest,
  { allowedMethods = DEFAULT_METHODS, probePatterns = DEFAULT_PROBE_PATTERNS }: ScreenOptions = {},
): NextResponse | null {
  const { pathname, search } = request.nextUrl;

  if (!allowedMethods.has(request.method)) {
    auditLog("method.rejected", { method: request.method, path: pathname });
    return new NextResponse("Method Not Allowed", {
      status: 405,
      headers: { Allow: [...allowedMethods].join(", ") },
    });
  }

  if (probePatterns.some((pattern) => pattern.test(pathname))) {
    auditLog("probe.blocked", { path: pathname });
    return new NextResponse(null, { status: 404, headers: { "X-Robots-Tag": "noindex" } });
  }

  // Null bytes and encoded traversal sequences in a path are never legitimate.
  if (pathname.includes("\0") || /%00|%2e%2e|\.\.[/\\]/i.test(pathname + search)) {
    auditLog("request.malformed", { path: pathname });
    return new NextResponse(null, { status: 400 });
  }

  return null;
}

export interface SecureResponseOptions {
  isDev: boolean;
  /** Non-production deployment: adds X-Robots-Tag noindex. */
  isPreview?: boolean;
  /** Canonical origin, for the absolute CSP reporting endpoint. */
  siteUrl?: string;
}

/**
 * Continues the request with a fresh CSP nonce and the full header set.
 *
 * The nonce is set on the *request* as well as the response: Next reads it
 * back from the request's CSP header while rendering, which is how its inline
 * bootstrap scripts receive the matching `nonce` attribute.
 */
export function secureNext(
  request: NextRequest,
  { isDev, isPreview = false, siteUrl }: SecureResponseOptions,
): NextResponse {
  const nonce = generateNonce();
  const csp = buildCsp({ nonce, isDev });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);

  const headers = securityHeaders({
    isDev,
    hostname: request.nextUrl.hostname,
    siteUrl,
    isPreview,
  });
  for (const [name, value] of Object.entries(headers)) {
    response.headers.set(name, value);
  }

  // Next sets this itself; removing it denies a fingerprinting datapoint.
  response.headers.delete("X-Powered-By");
  return response;
}

/**
 * Hostnames that mean "this machine". Used by apps that must never be served
 * to anyone else (the admin dashboard).
 */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1", "0.0.0.0"]);

export function isLocalRequest(request: NextRequest): boolean {
  // Host includes the port. An IPv6 literal is bracketed, so splitting on the
  // last colon would corrupt it.
  const host = request.headers.get("host") ?? "";
  const hostname = host.startsWith("[")
    ? host.slice(0, host.indexOf("]") + 1)
    : (host.split(":")[0] ?? "");
  return LOCAL_HOSTS.has(hostname) || hostname.endsWith(".localhost");
}

/** True on a Vercel deployment other than production. */
export function isPreviewDeployment(): boolean {
  return Boolean(process.env.VERCEL_ENV) && process.env.VERCEL_ENV !== "production";
}

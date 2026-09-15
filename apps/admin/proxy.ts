import { NextResponse, type NextRequest } from "next/server";

/**
 * Admin edge proxy.
 *
 * Two jobs, in order of importance:
 *
 * 1. REFUSE NON-LOCAL REQUESTS. This app holds the Supabase service-role key,
 *    which bypasses every row-level security policy. It is designed to be
 *    reachable from the machine it runs on and nowhere else. `next dev` already
 *    binds to 127.0.0.1, but a reverse proxy, an SSH tunnel or a container port
 *    mapping can all defeat that binding — so the Host header is checked here
 *    as well. Belt and braces, because the downside is total database control.
 *
 * 2. SECURITY HEADERS. Same CSP machinery as the public site. An admin tool is
 *    a higher-value XSS target than a portfolio, not a lower one: a script
 *    running here can read and write everything.
 */

import { buildCsp, generateNonce, securityHeaders } from "@repo/security/headers";

const isDev = process.env.NODE_ENV !== "production";

/** Hostnames that mean "this machine". */
const LOCAL_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "[::1]",
  "::1",
  "0.0.0.0",
]);

function isLocalRequest(request: NextRequest): boolean {
  // Host includes the port; compare only the hostname part. An IPv6 literal is
  // bracketed, so splitting on the last colon would corrupt it.
  const host = request.headers.get("host") ?? "";
  const hostname = host.startsWith("[")
    ? host.slice(0, host.indexOf("]") + 1)
    : (host.split(":")[0] ?? "");

  return LOCAL_HOSTS.has(hostname) || hostname.endsWith(".localhost");
}

export default function proxy(request: NextRequest) {
  if (!isLocalRequest(request)) {
    return new NextResponse(
      "The admin dashboard only accepts requests from localhost.",
      { status: 403, headers: { "Content-Type": "text/plain" } },
    );
  }

  const nonce = generateNonce();
  const csp = buildCsp({ nonce, isDev });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  response.headers.set("Content-Security-Policy", csp);
  for (const [name, value] of Object.entries(
    // `isPreview` marks the dashboard noindex too — belt and braces alongside
    // the explicit X-Robots-Tag set below.
    securityHeaders({ isDev, hostname: request.nextUrl.hostname, isPreview: true }),
  )) {
    response.headers.set(name, value);
  }

  /*
    Completes the sign-out started by the logout action, which cannot set
    response headers itself. The cookie is consumed here and cleared, so the
    header is sent exactly once.
  */
  const clearSignal = request.cookies.get("admin_clear");
  if (clearSignal) {
    response.headers.set("Clear-Site-Data", clearSignal.value);
    response.cookies.delete("admin_clear");
  }

  // Nothing here should ever be cached or indexed.
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  response.headers.delete("X-Powered-By");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

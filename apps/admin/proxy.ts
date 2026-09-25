import { NextResponse, type NextRequest } from "next/server";
import { isLocalRequest, screenRequest, secureNext } from "@repo/security/proxy";

/**
 * Edge proxy for the admin dashboard.
 *
 * 1. LOCALHOST ONLY. This app holds the Supabase service-role key, which
 *    bypasses every row-level security policy. `next dev` binds to 127.0.0.1,
 *    but a reverse proxy, an SSH tunnel or a container port mapping can defeat
 *    that binding — so the Host header is checked here as well.
 * 2. The same CSP and header set as the public site (`@repo/security/proxy`).
 *    An admin tool is a higher-value XSS target than a portfolio, not a lower
 *    one: script running here can read and write everything.
 */

const isDev = process.env.NODE_ENV !== "production";

export default function proxy(request: NextRequest) {
  if (!isLocalRequest(request)) {
    return new NextResponse("The admin dashboard only accepts requests from localhost.", {
      status: 403,
      headers: { "Content-Type": "text/plain" },
    });
  }

  const rejected = screenRequest(request);
  if (rejected) return rejected;

  // isPreview marks every response noindex — belt and braces for a tool that
  // should never be reachable by a crawler in the first place.
  const response = secureNext(request, { isDev, isPreview: true });

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

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

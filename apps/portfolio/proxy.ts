import type { NextRequest } from "next/server";
import { getSiteUrl } from "@repo/config/env";
import { isPreviewDeployment, screenRequest, secureNext } from "@repo/security/proxy";

/**
 * Edge proxy for the public site.
 *
 * Policy only — the mechanics (nonce CSP, header set, scanner filtering) live
 * in `@repo/security/proxy` and are shared with the admin app.
 */

const isDev = process.env.NODE_ENV !== "production";

/**
 * Routes whose output exists to be embedded by other sites — chat unfurls,
 * feed readers, bookmark managers. `Cross-Origin-Resource-Policy: same-origin`
 * would make a browser refuse to render them anywhere but here.
 */
const EMBEDDABLE = /(^|\/)(opengraph-image|twitter-image|apple-icon|icon)(\/|$|\?)/;

export default function proxy(request: NextRequest) {
  const rejected = screenRequest(request);
  if (rejected) return rejected;

  const response = secureNext(request, {
    isDev,
    isPreview: isPreviewDeployment(),
    siteUrl: getSiteUrl(),
  });

  if (EMBEDDABLE.test(request.nextUrl.pathname)) {
    response.headers.set("Cross-Origin-Resource-Policy", "cross-origin");
  }

  return response;
}

export const config = {
  /**
   * Every document and API response. Next's immutable build output and files
   * served straight from /public are excluded: they carry no CSP-relevant
   * markup, and skipping them keeps the static path free of per-request work.
   * Prefetches are deliberately NOT excluded, so RSC payloads get the headers.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|pdf|txt|xml|webmanifest)$).*)",
  ],
};

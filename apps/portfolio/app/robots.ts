import type { MetadataRoute } from "next";
import { getSiteUrl } from "@repo/config/env";

/**
 * robots.txt.
 *
 * Production allows everything except the API. AI crawlers are deliberately
 * NOT blocked: for a portfolio, being cited by AI search (ChatGPT, Perplexity,
 * Google's AI overviews) is visibility the owner wants, not a cost.
 *
 * Non-production deployments disallow everything. The proxy already sends
 * `X-Robots-Tag: noindex` there; this stops compliant crawlers fetching the
 * pages at all, rather than fetching and then discarding them.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();
  const isPreview = Boolean(process.env.VERCEL_ENV) && process.env.VERCEL_ENV !== "production";

  if (isPreview) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // API routes have no crawlable content, and indexing them just invites
        // scanners.
        disallow: ["/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

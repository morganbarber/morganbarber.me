import type { MetadataRoute } from "next";
import { getSiteUrl } from "@repo/config/env";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // API routes have no crawlable content, and indexing them just invites
        // scanners. `/private/` in the original config never existed.
        disallow: ["/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

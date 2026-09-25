import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@repo/config/site";

/**
 * Web app manifest. Supplies the name, colours and icons browsers use when the
 * site is installed or pinned, and is one of the signals Lighthouse's
 * best-practice audit checks for.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_CONFIG.name} — ${SITE_CONFIG.role}`,
    short_name: SITE_CONFIG.name,
    description: SITE_CONFIG.seoDescription,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#050505",
    theme_color: "#050505",
    lang: "en-US",
    categories: ["education", "technology"],
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any", purpose: "any" },
      { src: "/apple-icon", type: "image/png", sizes: "180x180", purpose: "any" },
    ],
  };
}

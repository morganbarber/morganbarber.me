import type { Metadata } from "next";
import { SITE_CONFIG } from "@repo/config/site";
import { getSiteUrl } from "@repo/config/env";

/**
 * Metadata for every page, built in one place.
 *
 * Why a helper rather than a `metadata` object per page: Next merges metadata
 * from nested segments SHALLOWLY. A page that sets `openGraph: { title }`
 * replaces the layout's entire `openGraph` object — siteName, locale, type and
 * image all silently disappear. Before this existed, every page other than the
 * home page shared on social media with no image and no site name.
 *
 * Building the complete object here means no page can emit a partial set.
 */

export const SITE_NAME = SITE_CONFIG.name;

/** Roughly what Google displays of a <title> before truncating. */
const TITLE_LIMIT = 60;

/**
 * The site-wide social image. Set explicitly on every page because of the same
 * shallow merge: a page's `openGraph` object replaces the one carrying the
 * root opengraph-image, leaving pages without their own image file with none
 * at all. Pages that DO have their own opengraph-image.tsx still get it — the
 * file convention takes precedence over this object.
 */
const DEFAULT_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${SITE_CONFIG.name} — ${SITE_CONFIG.role}`,
};

/** Absolute URL for a site path. */
export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl();
  if (path === "/" || path === "") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Trims a description to the length search engines display.
 *
 * Google truncates snippets around 155–160 characters. Cutting at a word
 * boundary with an ellipsis reads better in results than a mid-word cut, and
 * keeps the most important words — which should come first — visible.
 */
export function clampDescription(text: string, max = 158): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 80 ? lastSpace : cut.length).replace(/[,;:.\s—-]+$/, "")}…`;
}

/**
 * Words kept in capitals when a stored ALL-CAPS title is converted for
 * metadata. The site displays titles uppercase by design, and some are stored
 * that way — but an all-caps <title> reads as shouting in search results, and
 * Google frequently rewrites titles it considers low quality.
 */
const ACRONYMS = new Set([
  "AI",
  "API",
  "APT",
  "APTS",
  "AWS",
  "CI",
  "CSP",
  "CTF",
  "CVE",
  "DNS",
  "DOS",
  "EDR",
  "HTB",
  "HTTP",
  "HTTPS",
  "IAM",
  "ICS",
  "IDS",
  "IOC",
  "IOCS",
  "IP",
  "IPS",
  "IT",
  "JWT",
  "ML",
  "NIDS",
  "NIST",
  "OSINT",
  "OWASP",
  "RCE",
  "SIEM",
  "SOC",
  "SQL",
  "SSH",
  "SSO",
  "SCADA",
  "TLS",
  "UI",
  "URL",
  "VPN",
  "XSS",
]);

const SMALL_WORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "but",
  "by",
  "for",
  "in",
  "nor",
  "of",
  "on",
  "or",
  "per",
  "the",
  "to",
  "vs",
  "via",
  "with",
]);

/**
 * Converts a title to title case only if it is entirely uppercase.
 * Mixed-case titles are left exactly as written — the author chose them.
 */
export function readableTitle(title: string): string {
  // "All caps" means nearly every word is uppercase. A strict check would miss
  // real stored titles like "…IN INDUSTRIAL IoT", where one deliberately
  // mixed-case word is the only exception.
  const words = title.match(/[A-Za-z]{2,}/g) ?? [];
  if (words.length === 0) return title;
  const upperWords = words.filter((w) => w === w.toUpperCase()).length;
  if (upperWords / words.length < 0.8) return title;

  // Capitalise the first word, and the first word after a colon.
  let startOfPhrase = true;

  return title
    .split(/(\s+)/)
    .map((token) => {
      if (!/[A-Za-z]/.test(token)) return token; // whitespace / punctuation

      const bare = token.replace(/[^A-Za-z0-9]/g, "");
      const upper = bare.toUpperCase();
      let out: string;

      const isMixedCase = bare !== upper && bare !== bare.toLowerCase();

      if (ACRONYMS.has(upper) || isMixedCase) {
        // Known acronym, or a word the author deliberately mixed-cased.
        out = token;
      } else if (upper === "IOT") {
        out = token.replace(/IOT/i, "IoT");
      } else if (!startOfPhrase && SMALL_WORDS.has(bare.toLowerCase())) {
        out = token.toLowerCase();
      } else {
        out = token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
      }

      startOfPhrase = token.endsWith(":");
      return out;
    })
    .join("");
}

export interface PageMetadataInput {
  /** Page title without the site suffix; the layout template appends it. */
  title?: string;
  /** Use the title verbatim with no template suffix (the home page). */
  absoluteTitle?: string;
  description: string;
  /** Site path, e.g. "/blog/my-post". Drives canonical and og:url. */
  path: string;
  type?: "website" | "article" | "profile";
  /** Article dates, ISO 8601. */
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
  /** Prevent indexing (e.g. a missing record). */
  noIndex?: boolean;
  /**
   * The route has its own opengraph-image.tsx. Verified against the built
   * output: an explicit `images` array here OVERRIDES the file convention
   * (contrary to the documented precedence), so such routes must omit it.
   */
  ownImage?: boolean;
}

/** Complete metadata for one page. */
export function pageMetadata(input: PageMetadataInput): Metadata {
  const url = absoluteUrl(input.path);
  const description = clampDescription(input.description);

  /*
    Google shows roughly 60 characters of a title. When the page title plus
    " | Morgan Barber" would run past that, the suffix is dropped rather than
    letting the page's own words be truncated — the brand is still carried by
    og:site_name and the structured data.
  */
  const suffixed = input.title ? `${input.title} | ${SITE_NAME}` : undefined;
  const absolute =
    input.absoluteTitle ?? (suffixed && suffixed.length > TITLE_LIMIT ? input.title : undefined);
  const displayTitle = absolute ?? suffixed ?? SITE_NAME;

  return {
    title: absolute ? { absolute } : input.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: input.type ?? "website",
      url,
      siteName: SITE_NAME,
      locale: "en_US",
      title: displayTitle,
      description,
      ...(input.ownImage ? {} : { images: [DEFAULT_IMAGE] }),
      ...(input.type === "article"
        ? {
            publishedTime: input.publishedTime,
            modifiedTime: input.modifiedTime,
            authors: [absoluteUrl("/about")],
            tags: input.tags,
          }
        : {}),
      ...(input.type === "profile"
        ? { firstName: "Morgan", lastName: "Barber", username: "morganbarber" }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: displayTitle,
      description,
      ...(input.ownImage ? {} : { images: [DEFAULT_IMAGE.url] }),
    },
    ...(input.noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}

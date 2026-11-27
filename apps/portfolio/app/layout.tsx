import type { Metadata, Viewport } from "next";
import { jsonForScript } from "@repo/security/serialize";
import { Archivo, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import { Suspense } from "react";
import "./globals.css";

import { INTRO_STORAGE_KEY } from "@repo/ui/intro";
import SmoothScroll from "@/components/motion/smooth-scroll";
import Preloader from "@/components/motion/preloader";
import ScrollProgress from "@/components/motion/scroll-progress";
import ScrollEffects from "@/components/motion/scroll-effects";
import PageTransition from "@/components/motion/page-transition";
import CommandPalette from "@/components/motion/command-palette";
import Toaster from "@/components/motion/toaster";
import Cursor from "@/components/motion/cursor";
import RootMode from "@/components/motion/root-mode";
import SiteHeader from "@/components/site-header";
import Footer from "@/components/footer";
import StructuredData from "@/components/structured-data";
import { graph, personNode, websiteNode } from "@/lib/structured-data";
import AnalyticsTracker from "@/components/analytics-tracker";
import { SITE_CONFIG } from "@repo/config/site";
import { getSiteUrl, getSupabaseUrl } from "@repo/config/env";

const siteUrl = getSiteUrl();

/**
 * Runs in <head>, before the body is parsed, and settles three things before
 * anything is painted — an effect after hydration would be too late, the
 * wrong state would already be on screen:
 *
 *   data-static       crawlers, audit tools and reduced-motion visitors get
 *                     the page in its final state: no intro, no entrances.
 *                     Their snapshot should be the content, not a boot screen.
 *   data-anim-pending everyone else: elements about to animate in are held
 *                     hidden until their GSAP states are applied. Removed by
 *                     the app on mount — and by this script after four
 *                     seconds regardless, so a failed bundle never leaves
 *                     content invisible.
 *   data-intro-seen   skips the boot intro for returning visitors this tab
 *                     and for search-engine landings (Google's page-experience
 *                     guidance discourages covering what someone clicked
 *                     through to). Also when storage throws: an intro that
 *                     replays every navigation is worse than none.
 *
 * Built only from constants — the one interpolated value goes through
 * `jsonForScript` — and it carries the per-request nonce for the strict CSP.
 */
const INTRO_PREPAINT_SCRIPT = `(function(){var d=document.documentElement;function s(){d.setAttribute("data-intro-seen","")}var q=false;try{q=/bot|crawl|spider|slurp|lighthouse|pagespeed|chrome-lighthouse|headlesschrome|preview/i.test(navigator.userAgent||"")||matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){}if(q){d.setAttribute("data-static","");return s()}d.setAttribute("data-anim-pending","");setTimeout(function(){d.removeAttribute("data-anim-pending")},4000);try{if(/(^|\\.)(google|bing|duckduckgo|yahoo|ecosia|brave|startpage|yandex|baidu|qwant)\\./i.test((function(){try{return new URL(document.referrer).hostname}catch(e){return ""}})())){return s()}if(sessionStorage.getItem(${jsonForScript(INTRO_STORAGE_KEY)})==="true"){s()}}catch(e){s()}})();`;

/**
 * `display: "swap"` renders text immediately in the fallback face and swaps
 * when the webfont arrives, rather than leaving the page blank for up to three
 * seconds. `adjustFontFallback` (on by default) scales the fallback metrics to
 * match, which is what keeps the swap from shifting layout.
 */
/** Variable: weight plus the width axis, opened up for display type. */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
  axes: ["wdth"],
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

/**
 * Site-wide defaults. Each page overrides these through `pageMetadata()` in
 * lib/seo.ts, which always emits the complete Open Graph / Twitter set — see
 * that file for why a partial override here would silently drop fields.
 *
 * No `images` are set: the file-based opengraph-image.tsx routes provide a
 * generated image per page, and an explicit image here would pin every page to
 * one picture.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE_CONFIG.name} | ${SITE_CONFIG.role}`,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.seoDescription,
  applicationName: SITE_CONFIG.name,
  authors: [{ name: SITE_CONFIG.name, url: siteUrl }],
  creator: SITE_CONFIG.name,
  publisher: SITE_CONFIG.name,
  category: "technology",
  alternates: {
    canonical: siteUrl,
    // Advertises the feed so readers and aggregators can discover it from any
    // page, not only from the blog.
    types: {
      "application/rss+xml": [{ url: "/blog/feed.xml", title: `${SITE_CONFIG.name} — Blog` }],
    },
  },
  // Stops iOS Safari turning every number in the page into a phone link.
  formatDetection: { telephone: false, address: false, email: false },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: SITE_CONFIG.name,
    title: `${SITE_CONFIG.name} | ${SITE_CONFIG.role}`,
    description: SITE_CONFIG.seoDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_CONFIG.name} | ${SITE_CONFIG.role}`,
    description: SITE_CONFIG.seoDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Never below 5: capping zoom at 1 blocks a user's ability to magnify text.
  maximumScale: 5,
  themeColor: "#08090b",
  colorScheme: "dark",
};

/**
 * Reading the per-request nonce here is what makes the CSP actually work.
 *
 * Next injects `nonce="..."` into its own inline bootstrap scripts only for a
 * DYNAMICALLY rendered tree. Awaiting `headers()` opts this layout — and so
 * every page — into dynamic rendering, which is the deliberate trade behind
 * the nonce-based policy: without it the pages prerender with no nonce, and
 * `strict-dynamic` then blocks every script Next emits. A statically rendered
 * page under this CSP is not a faster site, it is a blank one.
 *
 * The cost is paid back in lib/data/content.ts: the HTML is rebuilt per
 * request, but the Supabase reads behind it are served from the data cache, so
 * a request does no database work.
 */
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const supabaseOrigin = getSupabaseUrl();

  return (
    <html
      lang="en"
      className={`${archivo.variable} ${jetbrainsMono.variable}`}
      // The pre-paint script adds data-intro-seen before React hydrates; this
      // tells React that one attribute difference on <html> is expected.
      suppressHydrationWarning
    >
      <head>
        <script
          nonce={nonce}
          // eslint-disable-next-line react/no-danger -- constant string, see INTRO_PREPAINT_SCRIPT
          dangerouslySetInnerHTML={{ __html: INTRO_PREPAINT_SCRIPT }}
        />
        {/* Without JavaScript the intro could never dismiss itself and would
            cover the page permanently. Nonced because style-src is strict. */}
        <noscript>
          <style nonce={nonce}>{"[data-intro-overlay]{display:none!important}"}</style>
        </noscript>
        {/* The only third-party origin the page touches. Warming the connection
            early removes a DNS + TLS round trip from the first API call. */}
        {supabaseOrigin ? (
          <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" />
        ) : null}
      </head>
      <body className="antialiased">
        <StructuredData data={graph(websiteNode(), personNode())} />

        {/* AnalyticsTracker reads useSearchParams(), which must sit inside a
            Suspense boundary or it opts the entire tree out of streaming. */}
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>

        <Preloader />
        <SiteHeader />
        <ScrollProgress />

        <div id="main">{children}</div>
        <Footer year={new Date().getFullYear()} />

        {/* Behaviour-only client islands. ScrollEffects sits after #main on
            purpose: its layout effect must run after the page's own. */}
        <SmoothScroll />
        <ScrollEffects />
        <PageTransition />
        <CommandPalette />
        <Toaster />
        <Cursor />
        <RootMode />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Oswald, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import { Suspense } from "react";
import "./globals.css";

import SmoothScroll from "@repo/ui/smooth-scroll";
import Loader from "@repo/ui/loader";
import ScrollProgress from "@repo/ui/scroll-progress";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import JsonLd from "@/components/json-ld";
import AnalyticsTracker from "@/components/analytics-tracker";
import { SITE_CONFIG } from "@repo/config/site";
import { getSiteUrl, getSupabaseUrl } from "@repo/config/env";

const siteUrl = getSiteUrl();

/**
 * `display: "swap"` renders text immediately in the fallback face and swaps
 * when the webfont arrives, rather than leaving the page blank for up to three
 * seconds. `adjustFontFallback` (on by default) scales the fallback metrics to
 * match, which is what keeps the swap from shifting layout.
 */
const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  fallback: ["Impact", "Haettenschweiler", "sans-serif"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE_CONFIG.name} | Cybersecurity Specialist`,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  applicationName: SITE_CONFIG.name,
  keywords: [
    "Cybersecurity",
    "Network Security",
    "Threat Analysis",
    "System Hardening",
    "Penetration Testing",
    "CompTIA Security+",
    "Morgan Barber",
    "Portfolio",
  ],
  authors: [{ name: SITE_CONFIG.name, url: siteUrl }],
  creator: SITE_CONFIG.name,
  publisher: SITE_CONFIG.name,
  alternates: { canonical: siteUrl },
  // Stops iOS Safari turning every number in the page into a phone link.
  formatDetection: { telephone: false, address: false, email: false },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: `${SITE_CONFIG.name} | Cybersecurity`,
    title: `${SITE_CONFIG.name} | Cybersecurity Specialist`,
    description: SITE_CONFIG.shortDescription,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${SITE_CONFIG.name} — cybersecurity portfolio`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_CONFIG.name} | Cybersecurity Specialist`,
    description: SITE_CONFIG.shortDescription,
    images: ["/og-image.png"],
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
  themeColor: "#050505",
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
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const supabaseOrigin = getSupabaseUrl();

  return (
    <html lang="en" className={`${oswald.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/* The only third-party origin the page touches. Warming the connection
            early removes a DNS + TLS round trip from the first API call. */}
        {supabaseOrigin ? (
          <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" />
        ) : null}
      </head>
      <body className="antialiased bg-background text-foreground overflow-x-hidden">
        <JsonLd nonce={nonce} />

        {/* AnalyticsTracker reads useSearchParams(), which must sit inside a
            Suspense boundary or it opts the entire tree out of streaming. */}
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>

        <Loader />
        <Navigation />
        <ScrollProgress />

        <SmoothScroll>
          <div id="main">{children}</div>
          <Footer />
        </SmoothScroll>
      </body>
    </html>
  );
}

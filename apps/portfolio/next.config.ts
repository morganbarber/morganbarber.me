import path from "node:path";
import type { NextConfig } from "next";

/**
 * Security headers are set in middleware.ts, because the CSP carries a
 * per-request nonce and therefore cannot be a static config value. What lives
 * here is everything that is genuinely static.
 */
const nextConfig: NextConfig = {
  transpilePackages: [
    "@repo/config",
    "@repo/data",
    "@repo/security",
    "@repo/supabase",
    "@repo/types",
    "@repo/ui",
  ],

  // Removes `X-Powered-By: Next.js`, which tells a scanner exactly what to
  // target and buys nothing in return.
  poweredByHeader: false,

  reactStrictMode: true,

  // Brotli/gzip for the Node server. Vercel and most CDNs do this upstream, in
  // which case this is simply unused rather than duplicated.
  compress: true,

  // Source maps in production would publish the readable server and client
  // source of the whole app.
  productionBrowserSourceMaps: false,

  // Trailing-slash and case variants of a URL are one canonical page, not three.
  trailingSlash: false,
  skipTrailingSlashRedirect: false,

  // In a monorepo, Next must be told where the workspace root is or it traces
  // file dependencies from the wrong directory and bloats the output bundle.
  outputFileTracingRoot: path.join(__dirname, "../../"),

  typescript: {
    // Never true. A type error that reaches production is a runtime error.
    ignoreBuildErrors: false,
  },

  experimental: {
    /*
      `inlineCss` is deliberately NOT enabled, though it measured ~0.3 s better
      LCP in Lighthouse. Next emits the inlined stylesheet as a <style> tag
      WITHOUT the CSP nonce (verified in the built HTML), so the strict,
      nonce-based style-src blocks it and the site renders unstyled. Enabling it
      would mean reverting style-src to 'unsafe-inline'. Revisit if Next starts
      nonce-ing inlined CSS — check:headers now fails if any <style> lacks one.
    */

    // Rewrites `import { X } from "lucide-react"` to a direct deep import, so a
    // page using three icons does not pull the whole icon set into dev compiles.
    optimizePackageImports: ["lucide-react", "framer-motion"],

    serverActions: {
      /*
        Caps the Server Action request body. The contact form's own limit is
        5,000 characters, so 128 KB is far above any legitimate submission and
        far below what would be needed to tie up a function with a large upload.
        The default is 1 MB.
      */
      bodySizeLimit: "128kb",

      /*
        Server Actions are only callable from these origins. Next already
        checks Origin against Host, but behind a proxy that rewrites Host the
        check can be satisfied by a request that did not come from the site —
        naming the origins explicitly removes that ambiguity.
      */
      allowedOrigins: [
        "morganbarber.me",
        "www.morganbarber.me",
        "localhost:3000",
        "127.0.0.1:3000",
      ],
    },
  },

  images: {
    // The only remote images are Supabase Storage objects. An open remote
    // pattern would turn /_next/image into a free image proxy for anyone.
    remotePatterns: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? [
          {
            protocol: "https",
            hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // SVGs can contain script; never let the optimiser serve them inline.
    dangerouslyAllowSVG: false,
    contentDispositionType: "attachment",
  },

  async headers() {
    return [
      {
        /*
          Next's immutable build output bypasses the proxy (it is excluded from
          the matcher so the static path does no per-request work), which means
          it would otherwise be the only response on the site without nosniff.
          A .js chunk served without it can be coerced into another type by a
          browser's sniffing heuristics.
        */
        source: "/_next/static/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
        ],
      },
      {
        source: "/:path*.(svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      {
        // Never cached, never indexed.
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },

  async redirects() {
    return [
      // RFC 9116 places security.txt under /.well-known/; the bare path is a
      // common guess, so it is redirected rather than 404'd.
      { source: "/security.txt", destination: "/.well-known/security.txt", permanent: true },
      // Browsers and some crawlers request /favicon.ico directly, ignoring
      // <link rel="icon">. Without this they receive the 31 KB 404 page.
      { source: "/favicon.ico", destination: "/icon.svg", permanent: true },
    ];
  },
};

export default nextConfig;

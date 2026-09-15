import path from "node:path";
import type { NextConfig } from "next";

/**
 * Admin dashboard config.
 *
 * Deliberately minimal: this app is never deployed, so there is no CDN caching,
 * image optimisation or asset strategy worth tuning. Security headers come from
 * proxy.ts, which also enforces the localhost-only rule.
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

  poweredByHeader: false,
  reactStrictMode: true,

  // Source maps would expose the dashboard's source; it is local-only, but
  // there is no reason to generate them either.
  productionBrowserSourceMaps: false,

  outputFileTracingRoot: path.join(__dirname, "../../"),

  typescript: { ignoreBuildErrors: false },

  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;

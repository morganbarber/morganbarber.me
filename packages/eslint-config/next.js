import nextPlugin from "@next/eslint-plugin-next";
import { reactInternalConfig } from "./react-internal.js";

/** Config for the Next.js application. */
export const nextConfig = [
  ...reactInternalConfig,
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    plugins: { "@next/next": nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,

      // Flags <a> where <Link> is needed — a full page reload instead of a
      // client transition is a real perf regression, not a style nit.
      "@next/next/no-html-link-for-pages": "off",
      "@next/next/no-img-element": "warn",
      "@next/next/no-sync-scripts": "error",
    },
  },
];

export default nextConfig;

import nextConfig from "@repo/eslint-config/next";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextConfig,
  {
    ignores: ["supabase/**", ".next/**", "next-env.d.ts"],
  },
];

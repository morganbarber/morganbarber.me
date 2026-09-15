import "server-only";

import { z } from "zod";
import { isSecretKey } from "./env";

/**
 * Server-only configuration.
 *
 * `import "server-only"` makes it a build error for this module to reach a
 * client bundle — the guardrail that stops a future refactor shipping the
 * service-role key to browsers.
 */

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  /**
   * Salt for visitor hashing. Without it, a SHA-256 of an IPv4 address is
   * reversible by brute force — the whole address space hashes in seconds — so
   * an unsalted digest would still be personal data.
   */
  ANALYTICS_SALT: z
    .string()
    .min(32, "ANALYTICS_SALT must be at least 32 characters of random data")
    .optional(),

  /** Shared secret for POST /api/revalidate. */
  REVALIDATE_SECRET: z
    .string()
    .min(32, "REVALIDATE_SECRET must be at least 32 characters")
    .optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = serverSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    ANALYTICS_SALT: process.env.ANALYTICS_SALT,
    REVALIDATE_SECRET: process.env.REVALIDATE_SECRET,
  });

  if (!parsed.success) {
    throw new Error(
      `Invalid server configuration:\n` +
        parsed.error.issues
          .map((issue) => `  • ${issue.path.join(".")}: ${issue.message}`)
          .join("\n"),
    );
  }

  cached = parsed.data;
  return cached;
}

/**
 * Service-role credentials for the admin app.
 *
 * This key bypasses every RLS policy, so it is deliberately isolated:
 *
 *   • read through this function only, never `process.env` directly
 *   • never prefixed NEXT_PUBLIC_, and validated to be an actual secret key so
 *     a publishable key pasted here fails loudly instead of causing confusing
 *     permission errors
 *   • only the admin app ever calls it; the public site has no privileged
 *     credential at all, and therefore none to leak
 */
export function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set.\n\n" +
        "The admin dashboard writes to tables that the publishable key cannot touch, " +
        "so it needs the service-role key:\n" +
        "  Supabase dashboard → Project Settings → API Keys → service_role / secret\n\n" +
        "Put it in apps/admin/.env.local. Never commit it, and never give it a " +
        "NEXT_PUBLIC_ prefix.",
    );
  }

  if (!isSecretKey(key)) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY does not look like a secret key.\n\n" +
        "Expected an `sb_secret_…` key or a JWT with role=service_role. A " +
        "publishable key here would leave every write silently denied by RLS.",
    );
  }

  return key;
}

/** True when a service-role key is available, without throwing if it is not. */
export function hasServiceRoleKey(): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(key && isSecretKey(key));
}

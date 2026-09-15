import { z } from "zod";

/**
 * Environment validation, shared by every app in the monorepo.
 *
 * Misconfiguration is a security problem, not just an availability one: a
 * missing Supabase URL silently becomes the string "undefined" and every query
 * fails in a way that is easy to mistake for an empty database. Parsing the
 * environment once, at module load, turns that into a loud error.
 */

const DEFAULT_SITE_URL = "https://morganbarber.me";

/**
 * Supabase issues two generations of public key:
 *
 *   • `sb_publishable_…`  — current, opaque, independently revocable
 *   • `eyJ…`              — legacy anon JWT, tied to the project's JWT secret
 *
 * Both are accepted. The *secret* counterparts (`sb_secret_…` and a
 * `role: "service_role"` JWT) are rejected outright in this slot, because any
 * NEXT_PUBLIC_* value is compiled into the JavaScript every visitor downloads.
 */
const publishableKey = z
  .string()
  .min(20, "The Supabase publishable key looks too short to be valid")
  .refine((value) => !value.startsWith("sb_secret_"), {
    message:
      "A secret key was placed in a NEXT_PUBLIC_* variable. That value ships to every browser — use the publishable key.",
  })
  .refine((value) => !isServiceRoleJwt(value), {
    message:
      "A service-role key was placed in a NEXT_PUBLIC_* variable. That value ships to every browser — use the publishable/anon key.",
  });

const supabaseUrl = z
  .url("The Supabase URL must be a valid URL")
  .refine((value) => value.startsWith("https://"), {
    message: "The Supabase URL must use https",
  })
  .refine((value) => !value.endsWith("/"), {
    message: "The Supabase URL must not have a trailing slash",
  });

/**
 * Decodes a base64url segment without Buffer, which does not exist on the Edge
 * runtime where this module is imported by the proxy.
 */
function decodeBase64Url(segment: string): string {
  const padded = segment.replace(/-/g, "+").replace(/_/g, "/");
  return atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), "="));
}

export function isServiceRoleJwt(value: string): boolean {
  const parts = value.split(".");
  if (parts.length !== 3 || !parts[1]) return false;
  try {
    const payload = JSON.parse(decodeBase64Url(parts[1])) as { role?: unknown };
    return payload.role === "service_role";
  } catch {
    return false;
  }
}

/** True for any value that must never reach a browser bundle. */
export function isSecretKey(value: string): boolean {
  return value.startsWith("sb_secret_") || isServiceRoleJwt(value);
}

/**
 * Next inlines `process.env.NEXT_PUBLIC_*` only for statically analysable
 * member expressions, so each name is read literally rather than through a
 * loop or a computed key. Both key variables are read for the same reason:
 * the fallback has to be visible to the compiler, not resolved at runtime.
 */
const rawPublic = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
};

/**
 * Resolves the public key from either variable name.
 *
 * Supabase renamed this key when it moved off JWTs, and both names are in the
 * wild — the project's own `.env.local` uses the newer one. Supporting both,
 * with the current name taking precedence, means neither a fresh project nor an
 * older deployment needs a migration step.
 */
function resolvePublicKey(): { key: string | undefined; source: string } {
  if (rawPublic.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return {
      key: rawPublic.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      source: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    };
  }
  if (rawPublic.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      key: rawPublic.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      source: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    };
  }
  return { key: undefined, source: "(unset)" };
}

const publicSchema = z.object({
  supabaseUrl,
  supabaseKey: publishableKey,
  siteUrl: z
    .url()
    .optional()
    .transform((value) => (value ?? DEFAULT_SITE_URL).replace(/\/$/, "")),
});

export type PublicEnv = z.infer<typeof publicSchema>;

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `  • ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
}

let cached: PublicEnv | null = null;

/** Validated public configuration. Throws with actionable detail if invalid. */
export function getPublicEnv(): PublicEnv {
  if (cached) return cached;

  const { key } = resolvePublicKey();

  const parsed = publicSchema.safeParse({
    supabaseUrl: rawPublic.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: key,
    siteUrl: rawPublic.NEXT_PUBLIC_SITE_URL,
  });

  if (!parsed.success) {
    throw new Error(
      `Invalid Supabase configuration:\n${formatIssues(parsed.error)}\n\n` +
        `Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.\n` +
        `Copy .env.example to get started, then run: npm run check:supabase`,
    );
  }

  cached = parsed.data;
  return cached;
}

/** Canonical site origin. Safe on any runtime; never throws. */
export function getSiteUrl(): string {
  return (
    rawPublic.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? DEFAULT_SITE_URL
  );
}

/** Supabase origin without validating the rest of the config. */
export function getSupabaseUrl(): string | undefined {
  return rawPublic.NEXT_PUBLIC_SUPABASE_URL;
}

/**
 * Non-throwing probe for the health endpoint and the preflight script, which
 * need to *report* a bad configuration rather than crash on it.
 */
export function describePublicEnv(): {
  ok: boolean;
  problems: string[];
  keySource: string;
  siteUrl: string;
} {
  const { key, source } = resolvePublicKey();

  const parsed = publicSchema.safeParse({
    supabaseUrl: rawPublic.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: key,
    siteUrl: rawPublic.NEXT_PUBLIC_SITE_URL,
  });

  return parsed.success
    ? { ok: true, problems: [], keySource: source, siteUrl: parsed.data.siteUrl }
    : {
        ok: false,
        problems: parsed.error.issues.map(
          (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`,
        ),
        keySource: source,
        siteUrl: getSiteUrl(),
      };
}

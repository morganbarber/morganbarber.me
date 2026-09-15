import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@repo/types/database";
import { getPublicEnv } from "@repo/config/env";
import { getServiceRoleKey } from "@repo/config/server-env";

/**
 * Privileged Supabase client. Bypasses every RLS policy.
 *
 * This exists for exactly one consumer: the local admin dashboard, which has to
 * write to tables the publishable key is deliberately barred from touching.
 *
 * Three guardrails, because a service-role key in a deployed app would hand
 * full database control to anyone who reached it:
 *
 *   1. `server-only` — a build error if this module is ever imported into a
 *      client component.
 *   2. `assertAdminRuntime()` — refuses to construct the client in a production
 *      build or on a recognised hosting platform. The admin app is meant to run
 *      on localhost; if it is ever deployed by accident, it fails closed rather
 *      than exposing an unauthenticated write API.
 *   3. `getServiceRoleKey()` — validates the key really is a secret key, so a
 *      publishable key pasted here fails loudly instead of producing confusing
 *      RLS denials.
 *
 * Nothing in apps/portfolio imports this file.
 */

/**
 * Refuses to run anywhere that looks like a deployment.
 *
 * The platform variables are set by the host, not by us, so this cannot be
 * satisfied by forgetting to configure something — it fails closed.
 */
export function assertAdminRuntime(): void {
  const deploymentSignals = [
    ["VERCEL", process.env.VERCEL],
    ["NETLIFY", process.env.NETLIFY],
    ["RENDER", process.env.RENDER],
    ["FLY_APP_NAME", process.env.FLY_APP_NAME],
    ["RAILWAY_ENVIRONMENT", process.env.RAILWAY_ENVIRONMENT],
    ["AWS_LAMBDA_FUNCTION_NAME", process.env.AWS_LAMBDA_FUNCTION_NAME],
    ["CF_PAGES", process.env.CF_PAGES],
  ].filter(([, value]) => Boolean(value));

  if (deploymentSignals.length > 0) {
    throw new Error(
      `The admin dashboard cannot run on a hosting platform ` +
        `(detected: ${deploymentSignals.map(([name]) => name).join(", ")}).\n\n` +
        `It holds the Supabase service-role key, which bypasses all row-level ` +
        `security. It is designed to run only on localhost.`,
    );
  }

  // An explicit opt-out exists for a trusted private network, but it has to be
  // set deliberately and is never the default.
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ADMIN_ALLOW_PRODUCTION !== "i-understand-the-risk"
  ) {
    throw new Error(
      "The admin dashboard is refusing to start a production build.\n\n" +
        "It is intended for local use only (`npm run dev` in apps/admin). " +
        "If you genuinely need a production build on a trusted private network, " +
        "set ADMIN_ALLOW_PRODUCTION=i-understand-the-risk — and make sure the " +
        "port is not reachable from the internet.",
    );
  }
}

let adminClient: SupabaseClient<Database> | null = null;

export function createAdminClient(): SupabaseClient<Database> {
  assertAdminRuntime();

  if (adminClient) return adminClient;

  const { supabaseUrl } = getPublicEnv();

  adminClient = createSupabaseClient<Database>(supabaseUrl, getServiceRoleKey(), {
    auth: {
      // A service-role client has no user session to persist, and writing one
      // to storage would be a needless place for the key to end up.
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { "x-application-name": "morganbarber.me-admin" },
    },
  });

  return adminClient;
}

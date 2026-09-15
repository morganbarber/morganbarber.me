import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Database } from "@repo/types/database";
import { getPublicEnv } from "@repo/config/env";

/**
 * Server-side Supabase client.
 *
 * `import "server-only"` makes it a build error for this module to end up in a
 * client bundle, which is the guardrail that keeps a future refactor from
 * accidentally shipping server code to the browser.
 *
 * Still the publishable key, never the service-role key: the Next server has no
 * more authority over this database than a browser does. That is deliberate.
 * Nothing this site renders requires privileged access, so there is no
 * privileged credential to leak. (The admin app is the sole exception, and it
 * uses `createAdminClient` from ./admin — which never runs in production.)
 */

function requireConfig(): { url: string; key: string } {
  const { supabaseUrl, supabaseKey } = getPublicEnv();
  return { url: supabaseUrl, key: supabaseKey };
}

/**
 * Request-scoped client. `cache()` dedupes construction across every component
 * in a single render pass, so ten components reading data build one client
 * rather than ten.
 */
export const createClient = cache(async (): Promise<SupabaseClient<Database>> => {
  const { url, key } = requireConfig();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, {
              ...options,
              // Harden whatever the library asks for: these cookies must never
              // be readable by script, never be sent cross-site, and never
              // travel in the clear in production.
              httpOnly: true,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
              path: "/",
            });
          }
        } catch {
          // Server Components cannot set cookies. Ignored by design: this app
          // has no authenticated session to refresh, so there is nothing to lose.
        }
      },
    },
    global: {
      headers: { "x-application-name": "morganbarber.me" },
    },
  });
});

/**
 * Client for contexts with no request scope — `generateStaticParams`, build-time
 * scripts and the health check — where `cookies()` is unavailable.
 */
export function createStaticClient(): SupabaseClient<Database> {
  const { url, key } = requireConfig();

  return createServerClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
    global: {
      headers: { "x-application-name": "morganbarber.me" },
    },
  });
}

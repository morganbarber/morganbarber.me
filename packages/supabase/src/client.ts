import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@repo/types/database";
import { getPublicEnv } from "@repo/config/env";

/**
 * Browser-side Supabase client.
 *
 * Only ever holds the publishable key, which is public by design; all authority
 * lives in the database's RLS policies and SECURITY DEFINER functions, not in
 * the key.
 *
 * The instance is memoised because `createBrowserClient` opens its own auth
 * state listener and storage subscription — creating one per render would leak
 * listeners and, in a component that re-renders often, visibly degrade the page.
 */

let browserClient: SupabaseClient<Database> | null = null;

export function createClient(): SupabaseClient<Database> {
  if (browserClient) return browserClient;

  const { supabaseUrl, supabaseKey } = getPublicEnv();

  browserClient = createBrowserClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      // This site has no sign-in. Turning the auth machinery off removes the
      // token-refresh timer and the URL fragment parsing that would otherwise
      // run on every page load for no reason.
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { "x-application-name": "morganbarber.me" },
    },
  });

  return browserClient;
}

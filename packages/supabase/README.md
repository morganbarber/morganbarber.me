# @repo/supabase

Typed Supabase client construction — nothing else. Queries live in `@repo/data`.

| Export                  | Key              | Use                                                 |
| ----------------------- | ---------------- | --------------------------------------------------- |
| `@repo/supabase/client` | publishable      | Browser                                             |
| `@repo/supabase/server` | publishable      | Server components, actions, route handlers          |
| `@repo/supabase/admin`  | **service-role** | `server-only`; refuses to run on a hosting platform |

`apps/portfolio` must never import `/admin`; CI fails if it does
([ADR 0003](../../docs/adr/0003-privileged-key-confined-to-local-admin.md)).

# @repo/data

The only place that talks to the database. Apps never build queries themselves.

| Export                  | Key              | Purpose                                           |
| ----------------------- | ---------------- | ------------------------------------------------- |
| `@repo/data/content`    | publishable      | Cached, fail-soft reads of published content      |
| `@repo/data/hackthebox` | server token     | HackTheBox profile, cached 1 h, fail-soft         |
| `@repo/data/schemas`    | —                | Zod schemas mirroring the SQL `CHECK` constraints |
| `@repo/data/admin`      | **service-role** | CRUD, analytics, inbox. **Local admin app only.** |

Reads return `{ data, degraded }`; degraded results are never cached
([ADR 0005](../../docs/adr/0005-fail-soft-data-layer.md)).

When a constraint changes in `apps/portfolio/supabase/schema.sql`, change the
matching schema in `src/schemas.ts` — each field notes its SQL counterpart.

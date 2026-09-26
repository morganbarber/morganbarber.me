# Supabase setup

Everything the database needs, in the order it needs doing.

## Files

| File          | Purpose                                                                                         |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `schema.sql`  | Complete schema: tables, indexes, RLS policies, functions, grants. Idempotent — safe to re-run. |
| `seed.sql`    | Sample content. Idempotent — updates rows in place rather than duplicating.                     |
| `migrations/` | Incremental changes for a database that already exists.                                         |

## First-time setup

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. **SQL Editor → New query** → paste `schema.sql` → **Run**.
3. Same again with `seed.sql`, if you want the sample content.
4. **Project Settings → API** → copy the Project URL and the `anon` / publishable key into `apps/portfolio/.env.local` (see `.env.example`).
5. Verify:

   ```bash
   npm run check:supabase
   ```

   That script checks the environment, DNS, the REST endpoint, every table, every function, and — importantly — that the private tables are _not_ readable with the public key. It tells you which step failed rather than leaving you to guess.

With the CLI instead of the dashboard:

```bash
supabase link --project-ref <ref>
psql "$SUPABASE_DB_URL" -f supabase/schema.sql
psql "$SUPABASE_DB_URL" -f supabase/seed.sql
```

## Upgrading an existing database

`schema.sql` always describes the full current schema, so a fresh project needs
nothing else. A database created from an older `schema.sql` catches up by
running each migration it has not seen, in order, in the SQL Editor:

| Migration                 | Adds                                                             |
| ------------------------- | ---------------------------------------------------------------- |
| `0001_harden_from_legacy` | RLS, grants and write functions for a pre-hardening database     |
| `0002_role_limits`        | Row-count and statement-timeout caps on the public roles         |
| `0003_competitions`       | The `competitions` table (CTFs, CyberPatriot…) with starter rows |

All are idempotent. `npm run check:supabase` names the migration for any table
that is missing.

## Security model

The anon key is public — it ships in the JavaScript bundle of every page. So `anon` is treated as an untrusted role, and all authority lives in the database:

**Public content** — `blog_posts`, `projects`, `experience`, `education`, `certifications`

- `anon` has `SELECT` and nothing else.
- RLS restricts rows to `published = true`. New rows in `blog_posts` and `projects` default to `published = false`, so drafts are invisible until you deliberately publish them.

**Private tables** — `analytics`, `contact_messages`, `rate_limit_buckets`

- `anon` has **no grants at all** and **no RLS policy**. Direct reads and writes both fail.
- Writes happen only through `SECURITY DEFINER` functions, which validate, clamp and rate-limit their input before inserting.
- Because `anon` cannot read these tables back, they cannot be used to exfiltrate anything.

**Functions**

| Function                      | Callable by    | Does                                                                                                        |
| ----------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------- |
| `track_event(...)`            | `anon`         | Records one analytics event. Clamps every field; 240/hour per visitor.                                      |
| `submit_contact_message(...)` | `anon`         | Stores a contact message. 5/hour per visitor, 50/hour site-wide. Returns `ok` / `invalid` / `rate_limited`. |
| `health_check()`              | `anon`         | Liveness probe. Returns a timestamp, no data.                                                               |
| `consume_rate_limit(...)`     | _nobody_       | Internal token bucket.                                                                                      |
| `prune_old_data()`            | `service_role` | Deletes analytics older than 180 days.                                                                      |

Every `SECURITY DEFINER` function sets `search_path = ''` and fully qualifies each identifier. Without that, anyone able to create objects in a schema on the search path could shadow a function or table name and have it run with the definer's privileges — a well-known Postgres privilege-escalation pattern.

### What is deliberately _not_ stored

- **Raw IP addresses.** Only a salted SHA-256, truncated to 32 hex characters. The salt lives in `ANALYTICS_SALT` on the server, never in the database, so a database dump alone cannot be reversed to addresses.
- **Raw user-agent strings.** Only the parsed device type, OS and browser. A full UA string is a strong fingerprint and adds nothing analytically.
- **Full referrer URLs.** Only the host. Referrer query strings routinely carry session tokens and search terms from other sites.
- **Query strings from the site's own URLs.** Only the path is recorded.

### Retention

`prune_old_data()` deletes analytics older than 180 days and stale rate-limit buckets. `schema.sql` schedules it nightly via `pg_cron` if that extension is enabled (**Database → Extensions → pg_cron**). If it is not enabled, nothing breaks — the data simply accumulates, and you can run the function manually.

## Instant cache invalidation (optional)

Content is cached for an hour. To make edits appear immediately, point a Supabase webhook at the revalidation endpoint.

1. Put a strong secret in `REVALIDATE_SECRET` (`openssl rand -base64 48`).
2. **Database → Webhooks → Create a new hook**
   - Table: `blog_posts` (repeat for `projects`, `experience`, `education`, `certifications`)
   - Events: Insert, Update, Delete
   - Type: HTTP Request → `POST https://morganbarber.me/api/revalidate`
   - HTTP Headers: `x-revalidate-secret: <your secret>`

The endpoint maps the payload's `table` to the matching cache tag. A call with no body purges everything. The secret is compared in constant time and the endpoint is rate-limited to 10 attempts per minute per IP, so it cannot be brute-forced.

Manual purge:

```bash
curl -X POST https://morganbarber.me/api/revalidate \
  -H "x-revalidate-secret: $REVALIDATE_SECRET" \
  -H 'Content-Type: application/json' \
  -d '{"tag":"blog-posts"}'
```

## Publishing content

Rows in `blog_posts` and `projects` are **unpublished by default**:

```sql
update public.blog_posts set published = true where slug = 'my-post';
```

`experience`, `education` and `certifications` default to published, since they have no draft workflow.

## Type safety

`packages/types/src/database.ts` mirrors this schema by hand. After changing the schema, regenerate it:

```bash
npx supabase gen types typescript --project-id <ref> > packages/types/src/database.ts
npm run type-check
```

Any query that no longer matches the schema then fails at compile time instead of returning a 400 in production.

## Reading analytics

The anon key cannot read `analytics` or `contact_messages` — by design. Query them from the SQL Editor, which runs with elevated privileges:

```sql
-- Page views per day, last 30 days
select date_trunc('day', created_at) as day, count(*) as views,
       count(distinct visitor_hash) as visitors
  from public.analytics
 where created_at > now() - interval '30 days'
 group by 1 order by 1 desc;

-- Most visited paths
select path, count(*) as views
  from public.analytics
 where created_at > now() - interval '30 days'
 group by 1 order by 2 desc limit 20;

-- Unread contact messages
select created_at, name, email, message
  from public.contact_messages
 where status = 'new'
 order by created_at desc;
```

## Housekeeping

Verifying the RPCs during development inserts a small number of probe rows. The
current `check:supabase` deliberately calls each function with arguments its own
validation rejects, so it writes nothing — but earlier runs, or manual testing,
can leave rows behind.

To clear test data, run this in the SQL Editor (or delete the contact message
from the admin dashboard's Messages screen):

```sql
-- Analytics events from local testing
delete from public.analytics
 where path like '/__probe%'
    or event_name in ('probe', 'preflight');

-- Contact submissions from testing
delete from public.contact_messages
 where name in ('probe', 'test')
    or message like 'xxxxxxxxxxxx%';

-- Reset rate-limit buckets after load testing
delete from public.rate_limit_buckets;
```

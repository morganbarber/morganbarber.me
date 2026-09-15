# morganbarber.me

Personal portfolio for Morgan Barber — cybersecurity. Next.js 16 App Router, Supabase, Tailwind v4, in a Turborepo monorepo.

Given the subject matter, the site is built to survive being looked at closely: a nonce-based CSP, a database where the public key can do almost nothing, and scripts that prove both of those are actually working rather than merely configured.

---

## Quick start

```bash
npm install

cp apps/portfolio/.env.example apps/portfolio/.env.local
# fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

npm run check:supabase     # confirms the database is actually reachable and correct
npm run dev                # http://localhost:3000
```

Supabase's newer `sb_publishable_…` keys and the legacy `anon` JWTs are both
accepted; set `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or
`NEXT_PUBLIC_SUPABASE_ANON_KEY` and the app resolves whichever is present.

### Admin dashboard

```bash
cp apps/admin/.env.example apps/admin/.env.local
# add SUPABASE_SERVICE_ROLE_KEY and ADMIN_PASSWORD

npm run dev:admin          # http://127.0.0.1:3100
```

It edits every table behind the site, shows traffic, and holds the contact
inbox. It is **not deployed** — see [Admin dashboard](#admin-dashboard-1) below.

If `check:supabase` fails, read its output before doing anything else — it names the exact failing step (missing variable, dead project, missing table, missing grant) instead of leaving you to infer it from an empty page.

Database setup lives in **[`apps/portfolio/supabase/README.md`](apps/portfolio/supabase/README.md)**.

---

## Layout

Shared logic lives in packages so the public site and the admin dashboard use
the same validation, the same security primitives and the same database types —
rather than two copies that drift.

```
apps/
  portfolio/              the public site (deployed)
    app/                  routes, route handlers, error boundaries
    actions/contact.ts    contact form Server Action
    components/           page and section components
    proxy.ts              edge proxy: CSP nonce, headers, probe filtering
    scripts/              check-supabase.mjs, check-headers.mjs
    supabase/             schema.sql, seed.sql, migrations/
  admin/                  local content dashboard (NEVER deployed)
    app/                  dashboard, CRUD, analytics, message inbox
    lib/                  auth, resource definitions, revalidation ping
    proxy.ts              localhost-only enforcement + security headers

packages/
  config/                 validated env (public + server) and site constants
  security/               CSP builder, rate limiting, request helpers, URL safety
  data/                   content queries (cached, fail-soft) + admin CRUD + schemas
  supabase/               typed browser, server and admin clients
  types/                  database types and domain projections
  ui/                     shared components
  eslint-config/          flat ESLint config
  typescript-config/      shared tsconfig
```

### Why these package boundaries

| Package | Holds | Imported by |
| --- | --- | --- |
| `@repo/config` | Env parsing and site constants | everything |
| `@repo/security` | CSP, rate limits, CSRF/bot/IP helpers | both proxies, API routes, actions |
| `@repo/data` | Every database read and write | both apps |
| `@repo/supabase` | Client construction only | `@repo/data` |
| `@repo/types` | Generated database types | everything |

The rule that matters: **`@repo/data/admin` and `@repo/supabase/admin` are the
only modules that touch the service-role key, and nothing in `apps/portfolio`
imports them.**

---

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Portfolio dev server (localhost:3000) |
| `npm run dev:admin` | Admin dashboard (127.0.0.1:3100) |
| `npm run build` | Production build |
| `npm run type-check` | TypeScript across every workspace |
| `npm run lint` | ESLint across every workspace |
| `npm run check:supabase` | Diagnose the database end to end |
| `npm run check:headers` | Verify security headers against a running server |
| `npm run audit:security` | Fail on any high/critical dependency advisory |
| `npm run test` | Security-primitive tests (Node built-in runner) |
| `npm run verify` | type-check + lint + test + audit |
| `npm run admin:hash-password` | Generate a scrypt `ADMIN_PASSWORD_HASH` |
| `npm run sst:install` | Download the Vercel provider (once, before first deploy) |
| `npm run deploy` | `sst deploy --stage production` |
| `npm run deploy:preview` | Deploy a preview stage |

Verifying headers against a real server:

```bash
npm run build && npm start
npm run check:headers                            # localhost:3000
npm run check:headers -- https://morganbarber.me # production
```

---

## How it fits together

### Rendering and caching

Pages render **dynamically**, and the content behind them is **cached**. That split is deliberate.

The CSP uses a per-request nonce, and a nonce is only useful if it differs per response — which rules out serving prerendered HTML. So `app/layout.tsx` awaits `headers()`, which opts the tree into dynamic rendering and lets Next stamp its scripts with the matching nonce. Prerendering these pages would not produce a faster site; it would produce a blank one, because `strict-dynamic` blocks every script that lacks the nonce.

The cost of that is paid back one layer down. Every Supabase read in `@repo/data/content` is wrapped in `unstable_cache` with a one-hour lifetime and a cache tag, so a request renders HTML but does no database work. `POST /api/revalidate` (or a Supabase webhook) purges a tag when content changes, so edits still appear immediately.

### Fail-soft data access

Every query degrades to empty data and logs, rather than throwing. A portfolio should not return 500 because a database is asleep — and this one genuinely was, mid-rewrite, which is how the behaviour got tested. `GET /api/health` reports the dependency state for an uptime monitor.

### Analytics

Page views go to `POST /api/analytics` via `sendBeacon`, scheduled during idle time, de-duplicated per URL. Do Not Track and Global Privacy Control are honoured client-side *and* server-side. What gets stored is a salted IP hash, the path, and a parsed device/OS/browser — never a raw address, a raw user agent, a full referrer, or a query string. See the privacy notes in the Supabase README.

---

## Security

Full detail in **[SECURITY.md](SECURITY.md)**; the formal audit against OWASP Top 10 / OWASP Secure Headers / NIST SSDF, 800-63B and CSF 2.0 is in **[docs/SECURITY-AUDIT.md](docs/SECURITY-AUDIT.md)**. The short version:

- **CSP** — per-request nonce with `strict-dynamic`; `object-src`, `base-uri` and `frame-ancestors` all `'none'`. Verified by `check:headers`, which fails if any script tag is missing its nonce.
- **Headers** — HSTS (2 years, preload), COOP, CORP, `X-Frame-Options`, `X-Content-Type-Options`, a deny-by-default `Permissions-Policy`, and `X-Powered-By` removed.
- **Database** — the public key can read published content and call three validated functions. That is all: no writes, no reads of analytics or contact messages, no way to reach a draft.
- **Input** — every external input is Zod-validated at the edge and re-validated in SQL.
- **Rate limiting** — two layers: in-process (absorbs the volume) and in-database (enforces the real ceiling across instances).
- **Injection** — no `dangerouslySetInnerHTML` on stored content; every `href` passes through `@repo/security/url`, because React escapes text but does not stop `javascript:` in a URL.
- **Dependencies** — `npm audit` is clean, including the Next.js advisory for **XSS in App Router applications using CSP nonces**, which applies directly to this design and is fixed in 16.3.5.

---

## Admin dashboard

`apps/admin` is a local content editor for everything behind the site: blog
posts, projects, experience, education, certifications, plus traffic figures and
the contact inbox.

```bash
npm run dev:admin     # http://127.0.0.1:3100
```

### Why it is not deployed

It runs on the Supabase **service-role** key, which bypasses every row-level
security policy. That is unavoidable — the publishable key is deliberately
barred from writing content or reading analytics, which is most of what an admin
tool does. So instead of weakening the database, the dashboard is kept off the
internet, with four independent guards:

1. **`assertAdminRuntime()`** refuses to construct a privileged client when a
   hosting platform is detected (`VERCEL`, `NETLIFY`, `RENDER`, `FLY_APP_NAME`,
   `RAILWAY_ENVIRONMENT`, `AWS_LAMBDA_FUNCTION_NAME`, `CF_PAGES`) or in a
   production build. Those variables are set by the host, so this cannot be
   satisfied by forgetting to configure something — it fails closed.
2. **The proxy rejects any request whose `Host` is not localhost** with a 403,
   which covers a reverse proxy, an SSH tunnel or a container port mapping
   defeating the `--hostname 127.0.0.1` binding.
3. **A password gate** with an HMAC-signed, httpOnly, sameSite=strict session
   cookie and constant-time comparison.
4. **`server-only`** on every privileged module, so a stray import into a client
   component is a build error rather than a leaked key.

Every Server Action re-checks authentication independently. A Server Action is
its own POST endpoint and does not inherit a page's authorisation — treating a
layout check as sufficient is a well-worn way to ship an unauthenticated write
API.

### What it does

| Screen | Purpose |
| --- | --- |
| Dashboard | Row counts per table, and how many are still drafts |
| Content → * | Create, edit, delete and publish/unpublish any row |
| Analytics | 30-day traffic: pages, referrers, devices, recent hits |
| Messages | Contact inbox with read/archive/spam states |

All five content types share one form component, generated from the field
definitions in `apps/admin/lib/resources.ts`. Adding a column to the site means
adding a `FieldDef` there — not copying a CRUD screen and editing it, which is
how five hand-written forms end up validating five slightly different things.

Validation comes from `@repo/data/schemas`, the same Zod schemas that mirror the
SQL `CHECK` constraints — so the form, the Server Action and the database all
agree on what a valid slug is.

### Publishing

New blog posts and projects are created **unpublished** and stay invisible until
you tick Published. Saving pings the portfolio's `/api/revalidate` so the change
appears immediately; if `PORTFOLIO_URL` or `REVALIDATE_SECRET` is unset the save
still succeeds and the note says the cache will catch up within the hour.

---

## Deploying

Deployment is managed by **SST** and targets **Vercel**. Only the public site is
deployed; `apps/admin` is excluded three ways (see below).

```bash
npx sst install                    # downloads the Vercel provider, once

cp .env.sst.example .env.sst       # fill in credentials + app config
npx sst deploy --stage production
```

State is stored locally (`home: "local"` in `sst.config.ts`), so **no AWS
account is required** — the only cloud credential is a Vercel API token. The
trade-off is that `.sst/` holds the state and should be backed up, and
`sst.Secret` is unavailable, so deploy-time values come from `.env.sst`.

### What the config manages

| Resource | Notes |
| --- | --- |
| `vercel.Project` | Monorepo build (`rootDirectory: apps/portfolio`, turbo-filtered build), Node 22, functions in `iad1` near Supabase |
| `vercel.ProjectEnvironmentVariable` | One per variable; `ANALYTICS_SALT` and `REVALIDATE_SECRET` are marked `sensitive` so they cannot be read back through the dashboard or API |
| `vercel.Deployment` | Uploads the repo (minus `.vercelignore`) and builds it |
| `vercel.ProjectDomain` | Production only, with a 308 from the apex/www counterpart |

Security posture set on the project:

- `gitForkProtection` — a fork's pull request cannot trigger a build with access to the project's environment variables
- `vercelAuthentication: standard_protection` — previews sit behind Vercel SSO; production stays public
- `protectedSourcemaps` — source maps are not served publicly
- `skewProtection: 12 hours` — a stale client gets a clear error instead of silently mismatching server actions against an old bundle

The config refuses to deploy on three conditions: a missing required variable, a
secret key in the publishable slot, and a production stage with no
`ANALYTICS_SALT`. Each fails with the command needed to fix it.

### Keeping the admin app out

| Layer | Mechanism |
| --- | --- |
| Upload | `.vercelignore` excludes `apps/admin` entirely — the code never leaves your machine |
| Build | The build command is turbo-filtered to `portfolio-web`, so the admin app is not in the graph |
| Runtime | `assertAdminRuntime()` throws when it detects `VERCEL` and other platform variables |

CI adds a fourth: the `boundaries` job fails if `apps/portfolio` ever imports a
service-role module.

### After the first deploy

```bash
npm run check:headers -- https://morganbarber.me
```

Also run `supabase/migrations/0002_role_limits.sql` in the Supabase SQL Editor —
it caps rows per request and query runtime for the public role, which RLS does
not cover.

Submit the domain to [hstspreload.org](https://hstspreload.org) only once every
subdomain can serve HTTPS; preload is difficult to reverse.

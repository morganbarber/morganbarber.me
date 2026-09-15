# Security

How this site is defended, and why each control is there. Machine-readable contact details are in [`/.well-known/security.txt`](apps/portfolio/public/.well-known/security.txt).

A formal audit against the OWASP Top 10, the OWASP Secure Headers Project and NIST SSDF / 800-63B / CSF 2.0 — with findings, fixes and accepted risks — is in **[docs/SECURITY-AUDIT.md](docs/SECURITY-AUDIT.md)**.

## Reporting a vulnerability

Email **morgan@morganbarber.me** with reproduction steps and the affected URL. I aim to acknowledge within 72 hours.

**In scope:** `morganbarber.me` and its subdomains.

**Out of scope:** volumetric denial of service, social engineering, automated scanner output with no demonstrated impact, and issues in third-party services (Supabase, the CDN, the registrar) — please report those to the vendor.

Please do not access, modify or exfiltrate data belonging to anyone else while testing, and allow a reasonable window for a fix before public disclosure.

---

## Threat model

A public portfolio with no user accounts and no authenticated area. The realistic threats are:

1. **Stored XSS via content** — an attacker who obtains database write access, or a mistyped row, turning into script execution for every visitor.
2. **Abuse of the public key** — the Supabase publishable key is in the JavaScript bundle by design. Anyone can extract it and call the API directly.
3. **Automated scanning** — constant background traffic probing for `/.env`, `/wp-admin`, exposed `.git` directories, and so on.
4. **Spam and flooding** — the contact form and analytics endpoint are unauthenticated write paths.
5. **Supply chain** — a vulnerable transitive dependency.
6. **Leakage of the admin credential** — the local dashboard holds a service-role key that bypasses all row-level security. See control 14.

Notably *not* in the model: session hijacking, privilege escalation between users, or payment fraud. There are no sessions, no users and no payments. Controls are sized accordingly — no control here exists to satisfy a checklist.

---

## Controls

### 1. Content Security Policy

Built per request in `@repo/security/headers`, applied in each app's `proxy.ts`:

```
script-src  'self' 'nonce-<random>' 'strict-dynamic' https:
style-src   'self' 'nonce-<random>'
style-src-attr 'unsafe-inline'
object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'
report-to csp; report-uri /api/csp-report
```

`style-src` is nonce-based, not `'unsafe-inline'`. That was verified against the
real output before tightening: a production build emits **zero** inline
`<style>` elements — Tailwind ships an external stylesheet and Next nonces the
`<link>` — so `'unsafe-inline'` bought nothing except the ability for an
injected `<style>` to run. CSS injection is a genuine exfiltration primitive
(attribute selectors plus `background: url()` leak input values character by
character) and a UI-redressing one, so it is worth closing.

`style-src-attr` stays permissive because framer-motion animates through element
`style` attributes — 37 on the home page alone. Attribute styles cannot contain
selectors, so they carry none of that risk.

Each response gets a fresh 128-bit nonce from `crypto.getRandomValues`. `'strict-dynamic'` means a script loaded *by* a nonce-approved script inherits trust — which is how Next loads its chunks — while an injected `<script src>` from a markup injection does not. That removes the need to enumerate chunk URLs and makes the policy resistant to XSS rather than merely restrictive.

`base-uri 'none'` matters more than it looks: without it, an injected `<base>` tag redirects every relative script URL on the page to an attacker's host, which defeats a `'self'`-based policy entirely.

**This is verified, not assumed.** `npm run check:headers` fetches a page and fails if any `<script>` tag lacks the nonce, or if a nonce in the HTML does not match the one in the header. A CSP that silently stops applying looks exactly like one that is working, so the check is the control.

The trade-off is documented in `apps/portfolio/app/layout.tsx`: a per-request nonce requires per-request HTML, so pages render dynamically. The data behind them is cached instead — see the README.

**Violation reporting.** `POST /api/csp-report` collects reports in both formats browsers send (the legacy `report-uri` body and the Reporting API array), paired with a `Reporting-Endpoints` header so `report-to` resolves. Without it a CSP failure is invisible: the page quietly loses a script and nobody finds out until a user reports a broken feature. It is also the only signal that an injection attempt was *blocked*.

The endpoint is unusual in that browsers post to it cross-origin and unauthenticated, so it cannot use the same-origin check the analytics endpoint does. It is therefore capped at 8 KB, rate-limited to 20/min per source, filters out browser-extension noise, and **logs rather than stores** — an unauthenticated endpoint that writes to the database is a free disk-filling primitive.

**Trusted Types** run report-only (`require-trusted-types-for 'script'; trusted-types 'none'`). Enforcing it would eliminate DOM-based XSS outright by making `innerHTML`/`eval`/`Function` reject plain strings, but React and Next are not yet fully compliant, so enforcement would break the site. Report-only costs nothing, breaks nothing, and surfaces which sinks are still in use — which is the information needed to decide when enforcing becomes possible.

### 2. Transport and isolation headers

| Header | Value | Why |
| --- | --- | --- |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Two years. Omitted in development, where pinning localhost to HTTPS would break the dev server in that browser profile. |
| `X-Frame-Options` | `DENY` | Clickjacking, for browsers predating `frame-ancestors`. |
| `X-Content-Type-Options` | `nosniff` | Stops a response being reinterpreted as script. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Never leaks a path or query string off-site. |
| `Permissions-Policy` | ~22 features denied | Deny-by-default; only `fullscreen=(self)` is allowed. |
| `Cross-Origin-Opener-Policy` | `same-origin` | Process isolation; severs `window.opener`. |
| `Cross-Origin-Resource-Policy` | `same-origin` | Blocks cross-origin reads of this document. |
| `Origin-Agent-Cluster` | `?1` | Requests a dedicated agent cluster. |
| `X-Powered-By` | *removed* | Hands a scanner nothing about the stack. |

### 3. Database authority

The publishable key is public, so it is treated as hostile. Full detail in [`apps/portfolio/supabase/README.md`](apps/portfolio/supabase/README.md).

- **Published content:** `SELECT` only, restricted by RLS to `published = true`. Drafts default to unpublished.
- **`analytics`, `contact_messages`, `rate_limit_buckets`:** no grants and no RLS policy. Direct reads and writes both fail. Since they cannot be read back, they cannot be used to exfiltrate anything.
- **Writes** go only through `SECURITY DEFINER` functions that validate, clamp and rate-limit their input.
- Every such function pins `search_path = ''` and fully qualifies identifiers, closing the Postgres search-path hijack escalation path.
- The **public site** never uses a service-role key. The Next server has no more authority over the database than a browser does, so there is no privileged credential to leak. `@repo/config/env` rejects a service-role key in the public slot at startup, and `check:supabase` fails on one.

### 4. Input validation

Every external input is validated twice — once at the edge in Zod, once in SQL — because the endpoint and the database are separately reachable and the second layer is what holds if the first is bypassed.

- Analytics: bounded body size, site-relative path only, ≤10 metadata keys of scalar values, strict formats on each field.
- Contact: length bounds, email format, honeypot, time trap.
- Route params: matched against the same regex as the database `CHECK` constraint, so a malformed slug 404s without a round trip.
- SQL: `clean_text()` strips control characters and truncates every stored string.

### 5. Output encoding

- No `dangerouslySetInnerHTML` on database content. `apps/portfolio/components/prose.tsx` splits text on blank lines and lets React escape it — there is no HTML or Markdown parser in the path, so there is no injection surface to sanitise.
- Every `href` goes through `@repo/security/url`. React escapes text but does **not** validate URL schemes: `<a href={row.link}>` will happily execute `javascript:`. Both the database `CHECK` constraint and the render path reject it.
- The JSON-LD block escapes `<` and is built only from local constants.

### 6. CSRF

- **Server Actions** (contact form) — Next verifies the Origin header automatically.
- **Route Handlers** (analytics, revalidate) — get no automatic check, so `isSameOrigin()` applies one explicitly, preferring `Sec-Fetch-Site` because page script cannot forge it.
- **Content-Type allowlist** on `/api/analytics`, as a second independent control. A cross-origin form can POST without a CORS preflight, but *only* as `text/plain`, `application/x-www-form-urlencoded` or `multipart/form-data`. Requiring a JSON content type forces any cross-origin caller through a preflight the browser will refuse. `sendBeacon` sends a JSON-typed Blob, so legitimate traffic is unaffected.
- **Server Action origins** are pinned explicitly in `next.config.ts` (`allowedOrigins`). Next already compares Origin against Host, but behind a proxy that rewrites Host that check can be satisfied by a request that did not come from the site.

### 7. Rate limiting

Two layers, because each covers the other's weakness:

| Layer | Scope | Purpose |
| --- | --- | --- |
| In-process (`@repo/security/rate-limit`) | One server instance | Absorbs floods with no network hop. Key-space capped at 10,000 entries so a key flood cannot exhaust memory. |
| Database (`consume_rate_limit`) | Global | The authoritative ceiling, holding across instances, restarts and regions. |

Limits: analytics 60/min per visitor (240/hour in SQL); contact 3 per 10 min per visitor, 5/hour and 50/hour site-wide in SQL; revalidate 10/min per IP; CSP reports 20/min per source.

Request bodies are capped independently of rate limits, since one large request costs more than many small ones: 2 KB on analytics, 8 KB on CSP reports, and 128 KB on Server Actions (`serverActions.bodySizeLimit`, down from the 1 MB default — the contact form's own ceiling is 5,000 characters).

### 8. Privacy by design

- IP addresses are never stored. Only a salted SHA-256 truncated to 32 hex characters, with the salt held on the server and never in the database — a database dump alone cannot be reversed to addresses. Without `ANALYTICS_SALT` the feature disables itself rather than falling back to an unsalted (and therefore trivially reversible) hash.
- Raw user agents, full referrer URLs and query strings are not stored.
- DNT and GPC are honoured on both the client and the server.
- Analytics older than 180 days are deleted automatically.

### 9. Static asset headers

Next's immutable build output is excluded from the proxy matcher, so that path does no per-request work — which would otherwise make it the only response on the site without `X-Content-Type-Options`. A `.js` chunk served without `nosniff` can be coerced into another type by a browser's sniffing heuristics. `next.config.ts` sets `nosniff` and `Cross-Origin-Resource-Policy: same-origin` on `/_next/static/*` directly.

### 10. Edge filtering

`proxy.ts` drops scanner traffic before it reaches a handler: known probe paths return 404, methods outside `GET/HEAD/POST/OPTIONS` return 405, and null bytes or encoded traversal sequences in a URL return 400.

### 11. Supply chain

`npm audit` is clean at high and critical. `npm run audit:security` gates on it.

The upgrade to **Next 16.3.5** was not routine: 16.1.3 carried an advisory for **cross-site scripting in App Router applications using CSP nonces**, which is exactly the mechanism this site's primary defence is built on.

CI enforces three further supply-chain and boundary properties on every push:

- **`secrets`** — gitleaks over full history, a check that no `.env` file is tracked (templates excepted), and a scan for `sb_secret_` keys in the source.
- **`boundaries`** — fails if `apps/portfolio` ever imports `@repo/supabase/admin` or `@repo/data/admin`, which would make the service-role key reachable from a deployed app.
- **`headers`** — builds, starts the site and runs `check:headers` against it, so a CSP regression fails the build rather than shipping.

Keeping Next at one version took two fixes. An over-broad peer-dependency range in `@repo/supabase` caused a second, vulnerable copy of Next to be installed at the workspace root; that range is pinned to the patched minimum. Adding the admin app then pulled in `next@16.1.6` — the same advisory — through transitive resolution, so the root `package.json` now carries `overrides` forcing a single patched version of `next`, `sharp` and `postcss` across every workspace.

### 12. Database resource limits

RLS controls *which rows* the publishable key can see. It says nothing about how many, or how long a query may run — so two gaps remained, both closed at the role level in `supabase/migrations/0002_role_limits.sql`:

| Setting | `anon` | Closes |
| --- | --- | --- |
| `pgrst.db_max_rows` | 500 | `select=*` with no limit returning the entire table. The app always passes a limit, but the key is public — anyone can call PostgREST directly and ignore it. |
| `statement_timeout` | 5s | A pathological filter (an expensive regex, a large offset, a costly sort) holding a connection for as long as Postgres allows. With a small pool, a handful of those is an outage. |
| `idle_in_transaction_session_timeout` | 10s | A half-finished request holding locks indefinitely. |

Role settings apply to every connection that authenticates as the role, including ones that never touch this codebase — which is the point. `service_role` is deliberately excluded: the admin dashboard's aggregation and the retention job legitimately run longer.

### 13. Preview deployment isolation

A Vercel preview is a complete copy of the site — same database, same secrets — on a guessable URL. Two controls:

- **Vercel SSO** (`vercelAuthentication: standard_protection` in `sst.config.ts`) puts every preview behind team authentication. Production stays public.
- **`X-Robots-Tag: noindex, nofollow, noarchive`** is set by the proxy whenever `VERCEL_ENV` is anything other than `production`. The header is the reliable control; `robots.txt` is advisory and only covers crawlers that read it first. An indexed preview is both a duplicate that can outrank the real site and a leak of unreleased content.

`check:headers` fails if a non-production host is missing the header, and fails if production has it.

### 14. Security event logging

Addresses OWASP A09:2021. `@repo/security/audit` emits one line of JSON per security event — failed and successful logins, lockouts, rate-limit trips, CSRF rejections, invalid shared secrets, blocked scanner probes, CSP violations and every privileged admin write. JSON because an aggregator can then filter on `event="auth.failure"` rather than grepping prose.

Two properties matter:

- **Actors are the salted visitor hash, never a raw IP.** Logs are durable artefacts; putting addresses in them would undo the privacy work done everywhere else.
- **Every value is redacted.** Event details routinely carry attacker-controlled strings — a requested path, a CSP `blocked-uri`, an Origin header. Interpolating those raw is CWE-117 log injection: a newline forges an entry and an ANSI escape rewrites the reader's terminal. `redact()` strips C0/C1 controls and escape introducers, then truncates, with no opt-out.

### 15. Admin dashboard isolation

`apps/admin` is the one component that holds a service-role key, and it is never
deployed. Four independent guards keep it that way; each would have to fail for
the key to be exposed.

| Guard | Where | Fails closed because |
| --- | --- | --- |
| Platform detection | `@repo/supabase/admin` → `assertAdminRuntime()` | The variables it reads (`VERCEL`, `NETLIFY`, `FLY_APP_NAME`, …) are set by the *host*, so it cannot be satisfied by a missing config value |
| Localhost-only | `apps/admin/proxy.ts` | Non-local `Host` → 403, covering a reverse proxy or tunnel that defeats the `127.0.0.1` bind |
| Password gate | `apps/admin/lib/auth.ts` | HMAC-signed httpOnly sameSite=strict cookie, constant-time comparison, delay on failure |
| `server-only` | every privileged module | A stray client import is a build error, not a runtime leak |

Two further properties matter:

- **Every Server Action re-checks authentication.** A Server Action is a POST
  endpoint in its own right and does not inherit the page's authorisation.
  Relying on a layout check is how admin tools ship unauthenticated write APIs.
- **The dashboard renders all stored content as text.** Contact messages in
  particular are submitted by anyone on the internet and displayed in a page
  running with full database privileges — the worst possible place for stored
  XSS. No `dangerouslySetInnerHTML` appears anywhere in the admin app.

The `SUPABASE_SERVICE_ROLE_KEY` variable has no `NEXT_PUBLIC_` prefix, and the
app validates that it really is a secret key — a publishable key pasted there
fails loudly instead of producing confusing RLS denials.

Login is rate-limited with an escalating lockout (5 attempts, then 30 s → 2 min → 10 min → 1 hour), checked *before* the password is verified. The previous 400 ms delay was per-request and so gave N parallel requests N guesses per window; `lib/login-guard.test.ts` asserts that twenty concurrent attempts are all refused.

The stored verifier is scrypt (N=16384, r=8, p=1), per NIST SP 800-63B §5.1.1.2 — `npm run admin:hash-password` generates it. Plaintext `ADMIN_PASSWORD` still works but warns.

Sign-out sends `Clear-Site-Data: "cache", "cookies", "storage"`. Deleting the
session cookie ends the session on the server, but the browser has already
cached rendered pages containing contact messages, analytics and draft content;
on a shared machine those survive in the back/forward and HTTP caches. A Server
Action cannot set response headers, so the action writes a 10-second marker
cookie that the proxy converts into the real header on the next response.

---

## Deliberate non-goals

- **No WAF or bot-blocking beyond the basics.** The bot check is for analytics hygiene, not access control. A determined crawler will not match it, and that is fine — everything reachable is public by design.
- **No CAPTCHA.** The honeypot, time trap and layered rate limits handle the actual spam volume a site this size sees, without sending every visitor's behaviour to a third party.
- **No subresource integrity.** All scripts are same-origin and build-fingerprinted; there is no CDN-hosted third-party script to pin.
- **No `require-trusted-types-for 'script'`.** It would break Next's runtime today. Worth revisiting when framework support lands.

## Recurring maintenance

- `npm run audit:security` — weekly, and before every deploy.
- `npm run check:headers -- https://morganbarber.me` — after every deploy.
- `npm run check:supabase` — after any schema change.
- Rotate `ANALYTICS_SALT` and `REVALIDATE_SECRET` periodically. Rotating the salt resets unique-visitor attribution; that is the intended trade-off.
- Review the `Expires` date in `security.txt` annually — an expired file is treated as invalid.

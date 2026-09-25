# Security audit — morganbarber.me

**Date:** 2026-09-15
**Scope:** `apps/portfolio` (public site), `apps/admin` (local dashboard), `packages/*`, the Supabase schema, and the SST/Vercel deployment.
**Frameworks:** OWASP Top 10 (2021), OWASP Secure Headers Project, NIST SP 800-218 (SSDF), NIST SP 800-63B, NIST CSF 2.0.

Every finding below was verified against running code, not inferred from reading it. Every fix has been implemented and re-verified.

---

## Summary

| Severity      | Found | Fixed |
| ------------- | ----- | ----- |
| High          | 1     | 1     |
| Medium        | 3     | 3     |
| Low           | 4     | 4     |
| Informational | 2     | 2     |

**Result:** 10 findings, all remediated. Security headers now meet the OWASP Secure Headers Project baseline in full.

The single high-severity finding was **unlimited password guessing against the admin dashboard** — the existing 600 ms delay was per-request and therefore trivially parallelised away.

---

## Findings

### H-01 · Admin login had no brute-force protection

**OWASP A07:2021 — Identification and Authentication Failures · NIST SP 800-63B §5.2.2 · CWE-307**

The only control on failed logins was a fixed 400–600 ms `setTimeout`. That is not a rate limit:

- it caps a serial attacker at ~1.6 guesses/second, **indefinitely** — there was no lockout at any count;
- it is applied _per request_, so twenty concurrent requests each waited 600 ms in parallel and yielded twenty guesses per 600 ms.

The dashboard holds the Supabase **service-role** key, so a successful guess is full database control.

**Fixed.** `apps/admin/lib/login-guard.ts` adds a shared counter with a 5-attempt threshold and an escalating lockout (30 s → 2 min → 10 min → 1 hour). The check runs _before_ password verification, so a locked-out attempt does no work. `lib/login-guard.test.ts` covers the state machine, including the property the old code failed:

```
✔ refuses parallel attempts once locked out   (20 concurrent, all refused)
```

---

### M-01 · Log injection via CSP violation reports

**OWASP A03:2021 — Injection · CWE-117**

`/api/csp-report` interpolated attacker-controlled fields (`blocked-uri`, `document-uri`, `script-sample`) straight into a `console.warn` template. Zod bounded their _length_ but not their _content_, so a report body containing a newline forged an additional log entry, and an ANSI escape could rewrite the reader's terminal. The endpoint is unauthenticated and reachable by anyone.

**Fixed.** All logging routes through `auditLog`, which applies `redact()` to every key and value — stripping C0/C1 controls and ANSI introducers, then truncating. Verified with a live payload containing both a newline and `ESC[31m`:

```
forged standalone lines:  0
control bytes in the line: none
payload contained in a JSON string: true
```

---

### M-02 · No security event logging

**OWASP A09:2021 — Security Logging and Monitoring Failures · NIST CSF 2.0 DE.CM**

Every log statement in the codebase was an _operational_ error — a failed query, an unreachable database. Nothing recorded a failed login, a tripped rate limit, a rejected cross-origin write, an invalid shared secret, or a blocked scanner probe. An attack would have left no trace at all, and no amount of log retention would have helped.

**Fixed.** `packages/security/src/audit.ts` emits one line of JSON per security event, so aggregators can query them (`event="auth.failure"` rather than a grep). Fourteen event types are wired through the request paths:

| Event                                                                               | Emitted from                                  |
| ----------------------------------------------------------------------------------- | --------------------------------------------- |
| `auth.failure`, `auth.success`, `auth.logout`, `auth.lockout`, `auth.misconfigured` | admin login/logout                            |
| `ratelimit.exceeded`                                                                | analytics, contact form, revalidate           |
| `csrf.rejected`                                                                     | analytics                                     |
| `request.bad_content_type`                                                          | analytics                                     |
| `secret.invalid`                                                                    | revalidate                                    |
| `probe.blocked`, `method.rejected`, `request.malformed`                             | edge proxy                                    |
| `csp.violation`                                                                     | CSP report endpoint                           |
| `admin.write`                                                                       | every privileged create/update/delete/publish |

Actors are identified by the **salted visitor hash**, never a raw IP — the log is durable, and putting addresses in it would undo the privacy work everywhere else.

Verified live:

```
info   probe.blocked             path=/wp-login.php
info   method.rejected           method=DELETE, path=/
warn   csrf.rejected             path=/api/analytics, origin=https://evil.example
info   request.bad_content_type  path=/api/analytics, contentType=text/plain
warn   csp.violation             directive=script-src, blocked=…
```

---

### M-03 · Admin password stored in plaintext

**OWASP A02:2021 — Cryptographic Failures · NIST SP 800-63B §5.1.1.2 · CWE-256**

`ADMIN_PASSWORD` was read as plaintext from `.env.local`. 800-63B requires stored verifiers to be salted and hashed with a memory-hard function precisely because a plaintext credential survives in backups, editor swap files and shell history, and anyone who can read the file has the credential itself.

**Fixed.** `ADMIN_PASSWORD_HASH` (scrypt, N=16384 r=8 p=1, 16-byte salt, 64-byte key) is now preferred, compared with `crypto.timingSafeEqual`. `npm run admin:hash-password` generates it. Plaintext still works for an existing setup but logs a one-time warning. Parsed KDF parameters are range-checked, so a tampered hash string cannot turn a login into a memory-exhaustion bomb (scrypt allocates ~128·N·r bytes).

---

### L-01 · `Cross-Origin-Embedder-Policy` missing

**OWASP Secure Headers Project**

The only header absent from the OWASP baseline. Without COEP the page is not `crossOriginIsolated`, so COOP alone only half-addresses the Spectre-class timing attacks the isolation headers exist for.

**Fixed.** `Cross-Origin-Embedder-Policy: credentialless` in production. `credentialless` rather than `require-corp` because the page has zero cross-origin subresources today — verified by enumerating every `src`/`href`/`url()` in the rendered HTML; the only external URLs are `<a>` hrefs and a preconnect, neither of which COEP governs — but Supabase Storage is an allowed image source, and `require-corp` would break those the day one is used. Omitted in dev, where the HMR socket does not satisfy it.

---

### L-02 · Unvalidated fetch destination in the admin revalidation ping

**OWASP A10:2021 — SSRF · CWE-918**

`notifyPortfolio()` built a URL from `PORTFOLIO_URL` and POSTed to it with `REVALIDATE_SECRET` in a header, without validating the scheme or host. The value is operator-configured rather than user input, so this was not a live vulnerability — but a typo'd or tampered value would have sent the shared secret to whatever host it named.

**Fixed.** The URL is parsed, restricted to `http:`/`https:`, and rejected if it carries embedded credentials, before any request is made.

---

### L-03 · No package signature verification

**OWASP A08:2021 — Software and Data Integrity Failures · NIST SSDF PW.4.1, PS.2**

CI ran `npm audit`, which is a known-CVE lookup. It says nothing about whether the tarballs installed are the ones the registry actually published — the control against a compromised mirror or a poisoned cache.

**Fixed.** CI runs `npm audit signatures`. Current state: **431 packages with verified registry signatures, 115 with verified attestations.**

---

### L-04 · No SBOM

**NIST SSDF PS.3.2 · Executive Order 14028 §4(e)**

No machine-readable inventory of what shipped. Answering "are we exposed to CVE-x?" for a past release would mean re-deriving its dependency tree.

**Fixed.** CI generates a CycloneDX 1.5 SBOM (`npm sbom`) and retains it as a build artifact for 90 days. This required adding a `version` to the root `package.json` — `npm sbom` cannot construct a package URL without one.

---

### I-01 · Root package had no version

Blocked SBOM generation (see L-04). Set to `1.0.0`.

### I-02 · No automated tests for security primitives

The URL-scheme validator, the log redactor and the login guard are pure logic guarding real attack classes, and none had a regression test — so a future refactor could silently weaken them.

**Fixed.** 25 tests using the Node built-in runner (no framework dependency): 7 for the login guard, 7 for log redaction, 11 for URL scheme validation. `npm run test` runs them; CI runs them on every push.

---

## OWASP Top 10 (2021) — coverage

|     | Category                        | Assessment                                                                                                                                                                                                                                                                                                                                            |
| --- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A01 | Broken Access Control           | **Pass.** RLS restricts anonymous reads to `published = true`; analytics/contact/rate-limit tables have no grants and no policy. Every admin Server Action re-checks authentication independently — a Server Action is its own POST endpoint and does not inherit a page's authorisation. CI fails if `apps/portfolio` imports a service-role module. |
| A02 | Cryptographic Failures          | **Pass** after M-03. HSTS 2 years with preload; salted SHA-256 visitor hashing with the salt held off-database; scrypt for the admin verifier; constant-time comparison on every secret.                                                                                                                                                              |
| A03 | Injection                       | **Pass** after M-01. PostgREST parameterises all queries; no `dangerouslySetInnerHTML` on stored content; every `href` passes scheme validation in code _and_ a database CHECK; log values are redacted.                                                                                                                                              |
| A04 | Insecure Design                 | **Pass.** Documented threat model; two-layer rate limiting (in-process absorbs volume, database enforces the ceiling); fail-soft data layer; drafts default to unpublished.                                                                                                                                                                           |
| A05 | Security Misconfiguration       | **Pass** after L-01. Full OWASP header baseline; `X-Powered-By` removed; deny-by-default database grants; env validation refuses a secret key in a public slot at build _and_ runtime.                                                                                                                                                                |
| A06 | Vulnerable Components           | **Pass.** `npm audit` clean at high/critical, enforced in CI, plus a weekly scheduled run. `overrides` pin a single patched `next`/`sharp`/`postcss` across all workspaces.                                                                                                                                                                           |
| A07 | Identification & Authentication | **Pass** after H-01 and M-03.                                                                                                                                                                                                                                                                                                                         |
| A08 | Software & Data Integrity       | **Pass** after L-03/L-04. Signature verification, SBOM, `npm ci` from a committed lockfile, no untrusted deserialisation (JSON is schema-validated before use).                                                                                                                                                                                       |
| A09 | Logging & Monitoring            | **Pass** after M-02.                                                                                                                                                                                                                                                                                                                                  |
| A10 | SSRF                            | **Pass** after L-02. The app makes exactly one outbound request (admin → portfolio revalidation); no user-supplied URL is ever fetched. `next/image` remote patterns are restricted to the Supabase storage path.                                                                                                                                     |

---

## Security headers — OWASP Secure Headers Project

Audited against a production build. `npm run check:headers -- <url>` reproduces this and fails the build on a regression.

**Present:**

| Header                                                        | Value                                                                                                 |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `Content-Security-Policy`                                     | nonce + `strict-dynamic`; `object-src`/`base-uri`/`frame-ancestors` `'none'`; nonce-based `style-src` |
| `Strict-Transport-Security`                                   | `max-age=63072000; includeSubDomains; preload`                                                        |
| `Cross-Origin-Opener-Policy`                                  | `same-origin`                                                                                         |
| `Cross-Origin-Embedder-Policy`                                | `credentialless` ← added                                                                              |
| `Cross-Origin-Resource-Policy`                                | `same-origin`                                                                                         |
| `X-Frame-Options`                                             | `DENY`                                                                                                |
| `X-Content-Type-Options`                                      | `nosniff`                                                                                             |
| `Referrer-Policy`                                             | `strict-origin-when-cross-origin`                                                                     |
| `Permissions-Policy`                                          | 23 features denied; only `fullscreen=(self)` allowed                                                  |
| `X-Permitted-Cross-Domain-Policies`                           | `none`                                                                                                |
| `Cache-Control`                                               | `private, no-cache, no-store, max-age=0, must-revalidate`                                             |
| `Reporting-Endpoints` + `Content-Security-Policy-Report-Only` | Trusted Types discovery                                                                               |
| `Origin-Agent-Cluster`, `X-DNS-Prefetch-Control`              | set                                                                                                   |

**Correctly absent:** `Server`, `X-Powered-By`, `X-AspNet-Version`, `Public-Key-Pins`, `Expect-CT`, `X-XSS-Protection` (deprecated and harmful in older browsers).

**Conditional:** HSTS is omitted on localhost — pinning a local origin to HTTPS would break the dev server in that browser profile. `X-Robots-Tag: noindex` is added only when `VERCEL_ENV !== "production"`.

---

## NIST mapping

### SP 800-218 (SSDF)

| Practice                               | Implementation                                                                                                    |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| PO.3 — supporting toolchains           | CI enforces type-check, lint, tests, audit, signature verification, SBOM, secret scanning and header verification |
| PO.5 — separate environments           | Admin dashboard is localhost-only with four independent guards; previews behind Vercel SSO                        |
| PS.1 — protect code                    | Branch-based CI, no committed secrets (gitleaks + tracked-`.env` check + `sb_secret_` scan)                       |
| PS.2 — verify integrity                | `npm audit signatures`                                                                                            |
| PS.3.2 — provenance                    | CycloneDX SBOM retained per build                                                                                 |
| PW.4.1 — reuse well-secured components | Pinned overrides; audit gate at high severity                                                                     |
| PW.5 — secure coding                   | Deny-by-default grants, parameterised queries, output encoding by default                                         |
| PW.7 — code review                     | CI `boundaries` job mechanically enforces the privileged-module boundary                                          |
| PW.8 — test executable code            | 25 tests over the security primitives                                                                             |
| RV.1 — identify vulnerabilities        | Weekly scheduled audit; `security.txt` reporting channel                                                          |

### SP 800-63B — authentication (admin dashboard)

| Requirement                                         | Status                                                                   |
| --------------------------------------------------- | ------------------------------------------------------------------------ |
| §5.1.1.2 — salted, memory-hard stored verifier      | scrypt (N=16384, r=8, p=1)                                               |
| §5.1.1.2 — minimum 8 characters                     | Enforced                                                                 |
| §5.1.1.2 — no composition rules, no forced rotation | Followed                                                                 |
| §5.2.2 — throttle failed attempts                   | 5 attempts then escalating lockout (far stricter than the 100 permitted) |
| §5.2.7 — no unauthenticated secret disclosure       | Uniform failure messages                                                 |
| §7.1 — session binding                              | HMAC-SHA256 signed, httpOnly, `SameSite=Strict`, 12-hour expiry          |
| §7.2 — reauthentication                             | 12-hour absolute session lifetime                                        |
| **Not implemented:** MFA (§4.3 AAL2)                | Accepted. Single operator, localhost-only, no network exposure.          |

### CSF 2.0

| Function     | Coverage                                                                              |
| ------------ | ------------------------------------------------------------------------------------- |
| **IDENTIFY** | Documented threat model and asset inventory (SBOM)                                    |
| **PROTECT**  | CSP, headers, RLS, rate limiting, input validation, KDF, least privilege              |
| **DETECT**   | Security event logging, CSP violation reporting, health endpoint                      |
| **RESPOND**  | `security.txt` with a 72-hour acknowledgement commitment; documented disclosure scope |
| **RECOVER**  | Idempotent schema, 180-day analytics retention, `retain` removal policy on production |

---

## Accepted risks

Deliberate decisions, recorded so they are re-evaluated rather than rediscovered.

| Risk                                     | Rationale                                                                                                                                                                                                                   |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No MFA on the admin dashboard            | Single operator, localhost-bound, four independent guards against exposure. MFA would add a dependency and a recovery problem for no realistic gain.                                                                        |
| Trusted Types report-only                | React and Next are not yet Trusted-Types-compliant; enforcing would break the site. Report-only surfaces which sinks remain in use — the information needed to decide when enforcement becomes possible.                    |
| `style-src-attr 'unsafe-inline'`         | framer-motion animates via element `style` attributes (37 on the home page). Attribute styles cannot contain selectors, so they carry none of the exfiltration risk that made an injected `<style>` element worth blocking. |
| In-process rate limiting is per-instance | The database limiter (`consume_rate_limit`) is the authoritative global ceiling. The in-process layer exists to absorb volume without a network hop.                                                                        |
| Admin errors show real messages          | Single trusted local operator; "Permission denied — check SUPABASE_SERVICE_ROLE_KEY" turns a misconfiguration into a seconds-long fix. The public site shows only an opaque digest.                                         |
| No WAF / CAPTCHA                         | Honeypot, time trap and layered rate limits handle the real spam volume without sending every visitor's behaviour to a third party.                                                                                         |
| Local SST state (`.sst/`)                | Avoids requiring an AWS account for a Vercel-only deploy. Trade-off: the directory must be backed up.                                                                                                                       |

---

## Verification

```bash
npm run verify                                   # type-check, lint, 25 tests, audit
npm run check:supabase                           # database posture, incl. negative RLS tests
npm run build && npm start
npm run check:headers -- http://localhost:3000   # full header + CSP + nonce assertions
```

All green as of this audit: 9 workspaces type-check, 9 lint with zero warnings, 25/25 tests pass, 0 vulnerabilities, all header checks pass.

## Outstanding action

`apps/portfolio/supabase/migrations/0002_role_limits.sql` must be run in the Supabase SQL Editor. It caps rows per request (`pgrst.db_max_rows`) and query runtime (`statement_timeout`) for the public role — limits RLS does not provide. It is DDL, so the publishable key cannot apply it.

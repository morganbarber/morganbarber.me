# 0003. Service-role key confined to a local-only admin app

- **Status:** Accepted
- **Date:** 2026-09-14

## Context

Content editing needs writes to tables the publishable key is barred from, and
reads of analytics and contact messages. That requires the Supabase
service-role key, which bypasses every row-level security policy. Weakening RLS
to let the public key write would expose the database to anyone who views the
site.

## Decision

The public site uses only the publishable key. The service-role key lives only
in `apps/admin`, which is never deployed, enforced by four independent guards:

1. `assertAdminRuntime()` refuses to run on a detected hosting platform or a
   production build.
2. The admin proxy rejects any non-localhost `Host` (403).
3. A password gate: scrypt verifier, HMAC-signed session, escalating lockout.
4. `server-only` on every privileged module.

CI (`boundaries` job) fails if `apps/portfolio` imports `@repo/supabase/admin`
or `@repo/data/admin`; `.vercelignore` excludes `apps/admin` from uploads.

## Consequences

Editing requires running the dashboard locally. There is no remote admin. If
one is ever needed, it needs real authentication (SSO/MFA) and network
isolation — not removal of these guards.

# @repo/security

Security primitives shared by both apps. Everything here runs on the Edge
runtime (Web Crypto, no `Buffer`) unless noted.

| Export                      | Purpose                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `@repo/security/proxy`      | `screenRequest()` (method/probe/malformed filter), `secureNext()` (nonce + CSP + headers), `isLocalRequest()` |
| `@repo/security/headers`    | CSP builder and the full response-header set                                                                  |
| `@repo/security/crypto`     | `sha256Hex`, `hmacSha256Hex`, `timingSafeEqual`, `randomBase64`                                               |
| `@repo/security/rate-limit` | Token-bucket limiter backed by Supabase, in-memory fallback                                                   |
| `@repo/security/request`    | Client IP, same-origin/CSRF check, bot detection, salted visitor hash                                         |
| `@repo/security/url`        | Safe `href` / redirect validation (blocks `javascript:` and friends)                                          |
| `@repo/security/audit`      | Structured audit log with secret redaction                                                                    |

Each app's `proxy.ts` is a short policy file composed from `screenRequest` and
`secureNext`. Changing the CSP? Run `npm run check:headers` against a build —
see [ADR 0002](../../docs/adr/0002-nonce-csp-with-dynamic-rendering.md).

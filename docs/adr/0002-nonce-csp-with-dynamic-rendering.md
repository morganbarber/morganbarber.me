# 0002. Nonce-based CSP, dynamic rendering, cached data

- **Status:** Accepted
- **Date:** 2026-09-14

## Context

The primary XSS control is a Content Security Policy with a per-request nonce
and `'strict-dynamic'`. Next.js stamps its inline bootstrap scripts with the
nonce only during a **dynamic** render. A test with static prerendering produced
HTML with **zero** nonce attributes — under `strict-dynamic` every script would
be blocked and the site would be blank. A reused nonce (e.g. CDN-cached HTML)
is equivalent to `'unsafe-inline'`.

## Decision

- The root layout awaits `headers()`, opting every page into dynamic rendering.
- `style-src` is nonce-based too (production emits no inline `<style>`).
- Every Supabase read is wrapped in `unstable_cache` (1 h, tag-invalidated), so
  a request renders HTML but does no database work.
- `experimental.inlineCss` stays **off**: it emits an un-nonced `<style>` that
  the policy blocks, rendering the site unstyled (verified).

## Consequences

- No CDN caching of HTML. Measured Lighthouse performance is still 96–99.
- `npm run check:headers` must pass on every change touching rendering or CSP;
  it fails if any `<script>` or `<style>` lacks the nonce.
- Revisit if Next.js gains nonce support for static output or inlined CSS.

# 0005. Fail-soft data layer; failures are never cached

- **Status:** Accepted
- **Date:** 2026-09-24

## Context

A portfolio must not return 500 because its database is asleep or mid-incident.
The original fail-soft layer returned empty data on failure — but cached that
empty result for the full hour, so one brief outage during a crawl served an
empty blog, sitemap and RSS feed for an hour afterwards.

## Decision

Every read in `@repo/data` resolves to `{ data, degraded }`. Degraded results
are returned to the caller but thrown _inside_ the cache boundary so
`unstable_cache` never stores them; the next request retries the database. The
HackTheBox integration follows the same rule.

## Consequences

Pages always render. A database outage costs one retry per request rather than
an hour of stale emptiness. `GET /api/health` reports dependency state.

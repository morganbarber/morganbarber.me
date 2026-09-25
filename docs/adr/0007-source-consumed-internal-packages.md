# 0007. Internal packages consumed as TypeScript source

- **Status:** Accepted
- **Date:** 2026-09-25

## Context

Internal packages could each have a build step emitting JavaScript, or be
consumed as source and compiled by the app. An early version ran `tsc` without
an `outDir`, which wrote stale `.js`/`.d.ts` beside the sources and shadowed them.

## Decision

Packages export `.ts` directly via `exports` and are listed in each app's
`transpilePackages`. They have no `build` task — only `lint`, `type-check` and
`test`. Compiled output next to sources is gitignored.

## Consequences

No build ordering between packages, instant cross-package edits in dev, and
Turborepo schedules lint/type-check fully in parallel. The cost: packages are
not publishable to a registry as-is. That is correct — they are private.

# 0006. Node's built-in test runner instead of a framework

- **Status:** Accepted
- **Date:** 2026-09-25

## Context

The tested code is pure logic guarding security boundaries: constant-time
comparison, log redaction, URL-scheme validation, schema validation, the login
lockout. None of it needs DOM emulation, module mocking or snapshotting.

## Decision

Tests use `node:test` with `--experimental-strip-types`, colocated as
`*.test.ts`. Coverage uses Node's built-in instrumentation with thresholds
(lines 80 %, branches 80 %, functions 65 %) enforced in CI, emitting LCOV.

## Consequences

Zero test dependencies to update or audit. Tests import with explicit `.ts`
extensions (`allowImportingTsExtensions`). If component or browser tests are
ever needed, add Vitest or Playwright for that layer rather than migrating these.

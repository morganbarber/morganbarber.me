# 0008. CI deploys code; SST owns infrastructure

- **Status:** Accepted (amends [0004](0004-sst-local-state-vercel.md))
- **Date:** 2026-09-28

## Context

ADR 0004 kept SST state on a developer machine, which ruled out running
`sst deploy` in CI and meant every release was a manual step. The goal now is
that merging to `main` ships automatically, and that nothing reaches `main`
without a reviewed-by-CI pull request.

Running SST in CI would require moving its state to a remote home (AWS or
Cloudflare R2) and giving CI credentials that can create and delete the
Vercel project, its domains and its secrets.

## Decision

Split the two concerns:

- **Code** — `.github/workflows/deploy.yml` runs `vercel deploy --prod` after
  the CI workflow succeeds on a push to `main`, checking out the exact commit
  CI tested. It uses the project settings and environment variables that
  already exist on Vercel, then runs the header and SEO checks against
  production.
- **Infrastructure** — the Vercel project, its environment variables and
  domains stay in `sst.config.ts`, applied locally with `npm run deploy`.

Deploy credentials (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) are
secrets on a GitHub `production` environment restricted to `main`, so a pull
request — including one from a fork — can never read them.

`main` is protected by a repository ruleset: changes arrive only through pull
requests whose required checks pass; force pushes and deletion are blocked,
with no bypass.

## Consequences

- Merging a PR deploys it. Infrastructure changes (a new env var, a domain)
  still need `npm run deploy` locally, **before** merging code that depends on
  them.
- A local `npm run deploy` also creates a production deployment from the local
  checkout. Run it from an up-to-date `main` so it does not roll production
  back to older code.
- The repository is public, which is what makes rulesets available on the free
  plan and also enables CodeQL and dependency review.

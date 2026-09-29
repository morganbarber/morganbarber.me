# 0004. SST with local state, deploying to Vercel

- **Status:** Accepted — amended by [0008](0008-ci-deploys-code-sst-owns-infrastructure.md) (CI now deploys code; SST still owns infrastructure)
- **Date:** 2026-09-15

## Context

Infrastructure is declared in `sst.config.ts` using the Pulumi Vercel provider.
SST needs a "home" for state: AWS, Cloudflare, or local. Requiring an AWS
account solely to hold a state file for a Vercel deployment is disproportionate.

## Decision

`home: "local"`. State lives in `.sst/` (gitignored). Secrets are supplied from
`.env.sst` at deploy time, because `sst.Secret` requires AWS. `installCommand`
is deliberately left unset — Vercel auto-detects the workspace install, and a
path-relative override breaks monorepo builds.

## Consequences

- **Deploys run from a developer machine, not CI.** A CI runner has no state, so
  `sst deploy` there would try to create every resource afresh. There is
  therefore no deploy workflow.
- `.sst/` must be backed up; losing it orphans the Vercel project from SST.
- To enable CI deploys: move `home` to `aws` or `cloudflare`, then add a
  deploy workflow with an environment-protected secret for `VERCEL_API_TOKEN`.

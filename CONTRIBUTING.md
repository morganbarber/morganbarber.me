# Contributing

## Prerequisites

- Node **22.12+** (`nvm use` reads `.nvmrc`) and npm **10.9+**. `engine-strict`
  is on, so older versions fail at install.
- A Supabase project for anything touching data — see
  [`apps/portfolio/supabase/README.md`](apps/portfolio/supabase/README.md).

```bash
npm install          # also installs the git hooks (husky)
cp apps/portfolio/.env.example apps/portfolio/.env.local
npm run check:supabase
npm run dev
```

## Workflow

1. Branch from `main`: `feat/…`, `fix/…`, `chore/…`.
2. Commit. The pre-commit hook runs Prettier and ESLint on staged files only.
   `git commit --no-verify` skips it; CI will still run the same checks.
3. Before pushing, run `npm run verify` (format, types, lint, tests with
   coverage thresholds, dependency audit).
4. Open a PR. Its **title** must be a
   [Conventional Commit](https://www.conventionalcommits.org/) — `feat(ui): …`,
   `fix(security): …` — because PRs are squash-merged and the title becomes the
   commit message.

## Where code goes

| You are adding…                               | Put it in                         |
| --------------------------------------------- | --------------------------------- |
| A page, route or page-specific component      | `apps/portfolio`                  |
| A component used by both apps                 | `packages/ui`                     |
| A database read or write                      | `packages/data` (never in an app) |
| A header, CSP, crypto or validation primitive | `packages/security`               |
| An env var                                    | `packages/config` + `turbo.json`  |
| A design token                                | `packages/tailwind-config`        |
| An operational script                         | `tooling/checks`                  |

Adding an env var? Declare it in `turbo.json`: `globalEnv` if it is inlined into
a bundle (`NEXT_PUBLIC_*`), `globalPassThroughEnv` if it is a runtime secret.
Otherwise Turborepo strips it in strict mode and the task sees `undefined`.

## Tests

Colocated `*.test.ts`, run with Node's built-in runner
([ADR 0006](docs/adr/0006-node-test-runner.md)). Import siblings with the `.ts`
extension. Anything that guards a security boundary needs a test.

```bash
npm test                 # every workspace, via turbo
npm run test:coverage    # thresholds enforced; LCOV to coverage/lcov.info
```

## Decisions

Changing something structural? Write an ADR in `docs/adr/` in the same PR.
Read the existing ones first — several choices that look like mistakes are
deliberate.

## Security issues

Do not open a public issue. See [`SECURITY.md`](SECURITY.md).

# @repo/typescript-config

Shared `tsconfig` bases:

| File                 | For                                                                 |
| -------------------- | ------------------------------------------------------------------- |
| `base.json`          | Everything: `strict`, `isolatedModules`, bundler resolution, ES2022 |
| `nextjs.json`        | Next.js apps (adds DOM libs, JSX preserve, the Next plugin)         |
| `react-library.json` | React packages (`@repo/ui`)                                         |

Extend with `"extends": "@repo/typescript-config/nextjs.json"`. Packages with
tests also set `allowImportingTsExtensions` so `node --experimental-strip-types`
can resolve `./x.ts` imports ([ADR 0006](../../docs/adr/0006-node-test-runner.md)).

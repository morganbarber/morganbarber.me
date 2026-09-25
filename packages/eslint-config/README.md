# @repo/eslint-config

ESLint 9 flat configs.

| Export                               | For                                    |
| ------------------------------------ | -------------------------------------- |
| `@repo/eslint-config/base`           | Any TypeScript/JS workspace            |
| `@repo/eslint-config/next`           | Next.js apps (adds Next + React rules) |
| `@repo/eslint-config/react-internal` | React libraries (`@repo/ui`)           |

`base` bans `console` outside CLIs (`**/bin/**`), bans `eval`-like APIs and
`javascript:` URLs, and relaxes a few rules in `*.test.ts`.

# @repo/checks

Operational CLIs. Pure Node, no build step.

| Bin              | Root script              | Checks                                                             |
| ---------------- | ------------------------ | ------------------------------------------------------------------ |
| `check-supabase` | `npm run check:supabase` | Env, reachability, tables, grants, RLS posture, RPCs               |
| `check-headers`  | `npm run check:headers`  | Security headers and that every `<script>`/`<style>` has the nonce |
| `check-seo`      | `npm run check:seo`      | Metadata, JSON-LD, OG images for every sitemap URL                 |
| `check-deps`     | `npm run check:deps`     | Every `@repo/*` import is declared by its workspace                |

`check-headers` and `check-seo` take a base URL (default
`http://localhost:3000`) and run in CI's smoke job against a production build.
All exit non-zero on failure.

# @repo/config

Validated configuration. Parses the environment once and fails loudly, because a
missing Supabase URL otherwise becomes the string `"undefined"` and looks like
an empty database.

| Export                    | Runtime     | Purpose                                                                                       |
| ------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `@repo/config/env`        | any (Edge)  | Public env: Supabase URL + publishable key, site URL. Rejects secret keys in `NEXT_PUBLIC_*`. |
| `@repo/config/server-env` | server-only | Secrets: analytics salt, revalidate secret, HTB token, service-role key                       |
| `@repo/config/site`       | any         | Site name, author, social links, SEO constants                                                |

`describePublicEnv()` reports problems without throwing — used by `/api/health`
and `check-supabase`.

Adding a variable: parse it here, then declare it in `turbo.json`
(`globalEnv` if inlined into a bundle, `globalPassThroughEnv` if a secret).

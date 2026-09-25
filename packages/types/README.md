# @repo/types

`Database` types for the Supabase schema plus the domain projections the UI
renders. Maintained by hand against `apps/portfolio/supabase/schema.sql`; to
regenerate from a live project:

```bash
npx supabase gen types typescript --project-id <ref> > packages/types/src/database.ts
```

Types only — no runtime code, so it is safe to import anywhere.

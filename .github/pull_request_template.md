## Summary

<!-- What changes, and why. Link the issue if there is one: Closes #123 -->

## Type

- [ ] Feature
- [ ] Fix
- [ ] Refactor / chore
- [ ] Security
- [ ] Docs / CI

## Checklist

- [ ] `npm run verify` passes locally (types, lint, tests, audit)
- [ ] New logic has tests, or the PR explains why it does not
- [ ] User-facing change checked in a production build (`npm run build && npm start`)
- [ ] No secrets, `.env` files or service-role keys in the diff

### If this touches security-sensitive code

<!-- proxy.ts, packages/security, packages/supabase/src/admin.ts, auth, SQL -->

- [ ] `npm run check:headers` passes against a production build
- [ ] RLS / grants reviewed if `supabase/` changed, and a migration added
- [ ] `docs/SECURITY-AUDIT.md` or an ADR updated if a control changed

### If this changes routes or metadata

- [ ] `npm run check:seo` passes against a production build

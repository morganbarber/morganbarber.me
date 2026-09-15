-- =============================================================================
-- Migration 0001 — harden a database created with the original setup script
-- =============================================================================
-- Only needed for a database that was created with the old `supabase_setup.sql`
-- and `01_expand_analytics.sql`. A fresh project should just run
-- `supabase/schema.sql`, which already produces the end state.
--
-- WHAT WAS WRONG
-- --------------
-- The original policies were:
--
--   create policy "..." on analytics for insert with check ( true );
--   create policy "..." on blog_posts for select using ( true );
--
-- which meant anyone holding the anon key — that is, anyone who viewed the
-- site — could insert unlimited arbitrary rows into `analytics`, and every
-- draft post was publicly readable the moment it was written. The table also
-- stored raw user agents and full referrer URLs.
--
-- This migration closes all of that. Run `supabase/schema.sql` FIRST (it is
-- idempotent and creates the new columns, functions and policies), then this
-- file to remove what the old schema left behind.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 1. Drop the permissive legacy policies
-- -----------------------------------------------------------------------------

drop policy if exists "Analytics are insertable by everyone."          on public.analytics;
drop policy if exists "Public blog posts are viewable by everyone."    on public.blog_posts;
drop policy if exists "Public certifications are viewable by everyone." on public.certifications;
drop policy if exists "Public projects are viewable by everyone."      on public.projects;
drop policy if exists "Public experience are viewable by everyone."    on public.experience;
drop policy if exists "Public Access"                                  on storage.objects;

-- -----------------------------------------------------------------------------
-- 2. Revoke direct access to the private tables
-- -----------------------------------------------------------------------------

revoke all on public.analytics from anon, authenticated;
revoke all on public.contact_messages from anon, authenticated;
revoke all on public.rate_limit_buckets from anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. Publish the content that was already live
-- -----------------------------------------------------------------------------
-- `published` defaults to false on blog_posts and projects, so without this the
-- migration would silently unpublish everything that was visible before.

update public.blog_posts     set published = true where published is not true;
update public.projects       set published = true where published is not true;
update public.experience     set published = true where published is not true;
update public.education      set published = true where published is not true;
update public.certifications set published = true where published is not true;

-- -----------------------------------------------------------------------------
-- 4. Backfill referrer_host from the old referrer column, then drop the PII
-- -----------------------------------------------------------------------------
-- Full referrer URLs frequently contain session tokens and search queries from
-- the originating site. Only the host has analytical value.

do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'analytics' and column_name = 'referrer'
  ) then
    update public.analytics
       set referrer_host = left(
             split_part(split_part(regexp_replace(referrer, '^https?://', ''), '/', 1), '?', 1),
             255
           )
     where referrer is not null
       and referrer <> ''
       and referrer_host is null;

    alter table public.analytics drop column referrer;
  end if;

  -- Raw user agents are a strong fingerprint; the parsed os/browser/device
  -- columns added by schema.sql carry the useful part.
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'analytics' and column_name = 'user_agent'
  ) then
    alter table public.analytics drop column user_agent;
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- 5. Tighten the certifications storage bucket
-- -----------------------------------------------------------------------------

update storage.buckets
   set file_size_limit = 10485760,
       allowed_mime_types = array['application/pdf', 'image/png', 'image/jpeg']
 where id = 'certifications';

commit;

-- -----------------------------------------------------------------------------
-- Verify
-- -----------------------------------------------------------------------------
-- Expect exactly one SELECT policy per content table and none at all on
-- analytics / contact_messages / rate_limit_buckets:
--
--   select tablename, policyname, cmd from pg_policies where schemaname = 'public';
--
-- Then re-run the application-side check:  npm run check:supabase

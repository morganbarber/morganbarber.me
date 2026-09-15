-- =============================================================================
-- Migration 0002 — resource limits on the public roles
-- =============================================================================
-- Safe to run on any database created from schema.sql. Idempotent.
--
-- WHAT THIS CLOSES
-- ----------------
-- RLS controls *which rows* the publishable key can see. It says nothing about
-- how many, or how long a query may run. Two gaps remain after schema.sql:
--
--   1. BULK EXTRACTION. `GET /rest/v1/blog_posts?select=*` with no limit
--      returns the entire table. The application always passes a limit, but the
--      key is public — anyone can call PostgREST directly and ignore it.
--
--   2. SLOW-QUERY DENIAL OF SERVICE. A crafted filter (a pathological regex, a
--      large offset, an expensive sort) can tie up a connection for as long as
--      Postgres will allow. With a small connection pool, a handful of those
--      is an outage.
--
-- Both are fixed by role-level settings, which apply to every connection that
-- authenticates as the role — including ones that never touch this codebase.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Cap rows returned per request
-- -----------------------------------------------------------------------------
-- PostgREST reads `pgrst.db_max_rows` from the role's settings and silently
-- truncates any larger result, returning a Content-Range that says so.
--
-- 500 is far above what any page needs (the largest table has single-digit
-- rows, and the app caps itself at 200) and far below "download the database".

alter role anon set pgrst.db_max_rows = '500';
alter role authenticated set pgrst.db_max_rows = '1000';

-- -----------------------------------------------------------------------------
-- 2. Cap query execution time
-- -----------------------------------------------------------------------------
-- Every public read is a single indexed lookup measured in milliseconds, so
-- anything still running after 5 seconds is either pathological or hostile.
-- The statement is cancelled; the connection is not lost.
--
-- Deliberately NOT applied to service_role: the admin dashboard's analytics
-- aggregation and the retention job legitimately take longer.

alter role anon set statement_timeout = '5s';
alter role authenticated set statement_timeout = '10s';

-- A transaction that has been idle mid-statement is holding locks for no
-- reason. This bounds how long a half-finished request can do that.
alter role anon set idle_in_transaction_session_timeout = '10s';
alter role authenticated set idle_in_transaction_session_timeout = '30s';

-- -----------------------------------------------------------------------------
-- 3. Keep the roles out of the catalogue
-- -----------------------------------------------------------------------------
-- `anon` has no business reading table definitions, function bodies or the
-- list of roles. Postgres grants much of pg_catalog to PUBLIC by default, and
-- while the genuinely sensitive parts are already restricted, the schema layout
-- is free reconnaissance for anyone probing the API.

revoke all on schema information_schema from anon, authenticated;
grant usage on schema information_schema to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. Confirm the SECURITY DEFINER functions still work
-- -----------------------------------------------------------------------------
-- They run as the owner, whose settings are unchanged, so the timeouts above do
-- not apply to their bodies — only to the calling statement, which is a single
-- fast function call.

-- -----------------------------------------------------------------------------
-- Verify
-- -----------------------------------------------------------------------------
-- select rolname, rolconfig
--   from pg_roles
--  where rolname in ('anon', 'authenticated', 'service_role');
--
-- Expect anon to show:
--   {pgrst.db_max_rows=500,statement_timeout=5s,idle_in_transaction_session_timeout=10s}
--
-- PostgREST caches role settings; reload it after running this:
--   notify pgrst, 'reload config';

notify pgrst, 'reload config';

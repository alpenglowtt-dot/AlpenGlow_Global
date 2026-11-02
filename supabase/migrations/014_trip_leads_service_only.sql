-- ============================================================
--  Security hardening — migration 014 (fix 1d)
--  Closes the follow-up left open by migration 009: trip_leads was
--  still readable and writable with the public anon key (SELECT was
--  needed for the browser's upsert-by-session_id), so anyone could list
--  every trip-planner submission (name, phone, email, budget) and change
--  any row.
--
--  Since fix 1a/1b the trip planner writes only through the
--  save-trip-lead Edge Function (service_role, validated, never
--  overwrites a submitted row); nothing in the frontend touches the
--  table directly any more. service_role and postgres have BYPASSRLS
--  and keep full access, so the function and vps-deploy.sh are not
--  affected.
--
--  This drops every policy on trip_leads and revokes every privilege
--  from anon, authenticated and PUBLIC. Row security stays enabled and
--  forced, so even a privilege granted by mistake later would show no
--  rows to the public roles.
-- ============================================================

BEGIN;

-- 1) Drop every policy on trip_leads (the three anon policies from 009,
--    plus anything added by hand).
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'trip_leads'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.trip_leads', r.policyname);
  END LOOP;
END $$;

-- 2) Row security stays on and forced.
ALTER TABLE public.trip_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_leads FORCE  ROW LEVEL SECURITY;

-- 3) No table privileges for the public-facing roles.
REVOKE ALL ON public.trip_leads FROM anon, authenticated, PUBLIC;

-- 4) Guard: abort the whole transaction unless the table is really closed
--    to the public roles and still fully usable by service_role.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'trip_leads') THEN
    RAISE EXCEPTION 'trip_leads still has policies';
  END IF;
  IF has_table_privilege('anon', 'public.trip_leads', 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE')
     OR has_table_privilege('authenticated', 'public.trip_leads', 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE') THEN
    RAISE EXCEPTION 'a public role still has a privilege on trip_leads';
  END IF;
  IF NOT has_table_privilege('service_role', 'public.trip_leads', 'SELECT, INSERT, UPDATE') THEN
    RAISE EXCEPTION 'service_role lost access to trip_leads';
  END IF;
END $$;

COMMIT;

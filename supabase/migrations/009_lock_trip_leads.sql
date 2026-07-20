-- ============================================================
--  Lock down trip_leads — migration 009
--  Found during a VPS deploy audit: trip_leads had a blanket
--  "FOR ALL USING (true)" policy plus full table GRANTs to anon,
--  meaning anyone with the public anon key could read every
--  visitor's trip-planner submission (name, phone, email, budget,
--  destination — everyone's, not just their own), and could
--  update or delete any row.
--
--  The actual frontend (trip-planner.js) only ever INSERTs a new
--  session row and UPDATEs it by session_id (upsert pattern) — it
--  never explicitly SELECTs or DELETEs.
--
--  IMPORTANT CAVEAT (found by testing this migration against the live
--  upsert flow before trusting it): Postgres requires SELECT privilege
--  to evaluate ANY WHERE clause or ON CONFLICT ... DO UPDATE check —
--  so removing SELECT entirely breaks the upsert-by-session_id pattern
--  the app actually depends on. SELECT has to stay granted for INSERT/
--  UPDATE to function at all under the shared anon key. This migration
--  therefore only closes the unambiguous, unnecessary parts of the
--  original hole: DELETE and TRUNCATE. The remaining SELECT access
--  still permits bulk-dumping the whole table with an unfiltered
--  `SELECT * FROM trip_leads` — RLS cannot distinguish "queried by a
--  known session_id" from "queried with no filter at all", since a
--  USING clause only sees row content, never the shape of the client's
--  query. Closing that fully requires moving trip_leads access behind
--  a service-role Edge Function (same pattern already used for
--  `leads` via submit-lead/crm) instead of direct anon-key table
--  access — recommended as a follow-up, not done here.
-- ============================================================

-- Drop every existing policy on trip_leads (covers the overly-broad
-- "anon can upsert trip_leads" ALL/true policy and the unused SELECT ones).
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

ALTER TABLE public.trip_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_leads FORCE  ROW LEVEL SECURITY;

-- Anon may create and progressively update their own in-flight session
-- (the wizard's upsert-by-session_id pattern). SELECT is required too —
-- see the caveat above — but DELETE/TRUNCATE are removed since nothing
-- legitimate ever deletes a trip_leads row.
CREATE POLICY "trip_leads_anon_insert" ON public.trip_leads
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "trip_leads_anon_update" ON public.trip_leads
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "trip_leads_anon_select" ON public.trip_leads
  FOR SELECT TO anon USING (true);

-- Table-level grants: only what the policies above actually allow.
-- Notably absent: DELETE, TRUNCATE (the original, unambiguous hole).
REVOKE ALL ON public.trip_leads FROM anon, authenticated;
GRANT INSERT, UPDATE, SELECT ON public.trip_leads TO anon;

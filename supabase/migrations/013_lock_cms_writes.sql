-- ============================================================
--  Security hardening — migration 013
--  CMS tables (packages, package_pages, blog_posts, offers,
--  destinations) accepted INSERT/UPDATE/DELETE from the public anon
--  key (migrations 002, 003, 004 created "dev"/"dashboard" write
--  policies TO anon, and the default grants included every write
--  privilege). Nothing legitimate writes them any more: dev.html edits
--  local files and the site reads data/bundle.js + data/*.json; edge
--  functions do not use these tables.
--
--  This removes every public write policy and write privilege. Reads
--  stay (the *_public_read policies and SELECT grants), so the health
--  check's probe on `packages` keeps working. service_role and postgres
--  are not touched.
-- ============================================================

BEGIN;

-- 1) Drop every write policy on the five tables (covers policies added
--    by hand as well as the 15 from migrations 002–004).
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('packages', 'package_pages', 'blog_posts', 'offers', 'destinations')
      AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 2) Revoke every write privilege from the public-facing roles.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.packages, public.package_pages, public.blog_posts, public.offers, public.destinations
  FROM anon, authenticated, PUBLIC;

-- 3) Guard: abort the whole transaction if any table lost its public read.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['packages', 'package_pages', 'blog_posts', 'offers', 'destinations'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t
        AND cmd = 'SELECT' AND 'anon' = ANY (roles)
    ) THEN
      RAISE EXCEPTION 'no anon read policy left on %', t;
    END IF;
  END LOOP;
END $$;

COMMIT;

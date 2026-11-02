-- ============================================================
--  Security hardening — migration 012
--  _migrations_applied is the deploy bookkeeping table that
--  deploy/vps-deploy.sh reads to decide which migrations to run.
--  It was created without row security and kept the default full
--  grants, so anyone with the public anon key could read it or
--  delete its rows — the next deploy would then re-run every
--  migration.
--
--  Only vps-deploy.sh touches it, as `postgres` (table owner, with
--  BYPASSRLS), so enabling row security with no policies and revoking
--  the public roles does not affect deploys. vps-deploy.sh applies the
--  same two statements every run, so a fresh server is locked too.
-- ============================================================

BEGIN;
ALTER TABLE public._migrations_applied ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public._migrations_applied FROM anon, authenticated, PUBLIC;
COMMIT;

-- ============================================================
--  OTP table auto-cleanup — migration 008
--  Deletes every row in otp_verifications once it is 24 hours
--  old (measured from created_at, i.e. when the code was issued),
--  regardless of whether it was ever verified. Runs entirely inside
--  Postgres via pg_cron — no Edge Function, no external trigger,
--  and no app-level resource usage.
-- ============================================================

-- pg_cron ships as a Postgres extension; Supabase exposes it per-project.
-- Must be created in the "extensions" schema on Supabase.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- ── CLEANUP FUNCTION ──────────────────────────────────────
-- Replaces nothing existing — this is a distinct rule from the
-- unverified/expired cleanup already defined in 001_schema.sql
-- (that one only removes unverified rows past their 10-min expiry;
-- this one removes ALL rows, verified or not, past 24 hours old).
CREATE OR REPLACE FUNCTION public.cleanup_old_otps_24h()
RETURNS void AS $$
BEGIN
  DELETE FROM public.otp_verifications
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ── SCHEDULE ──────────────────────────────────────────────
-- Runs hourly. Re-running this migration is safe: unschedule any
-- previous job with the same name first so it isn't duplicated.
DO $$
BEGIN
  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname = 'otp-24h-cleanup';
EXCEPTION WHEN OTHERS THEN
  NULL; -- no existing job / pg_cron.job not yet queryable — ignore
END $$;

SELECT cron.schedule(
  'otp-24h-cleanup',
  '0 * * * *',              -- top of every hour
  $$ SELECT public.cleanup_old_otps_24h(); $$
);

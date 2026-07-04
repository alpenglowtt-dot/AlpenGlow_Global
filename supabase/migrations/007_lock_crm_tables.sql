-- ============================================================
--  Security hardening — migration 007
--  Lock down CRM/PII tables so the PUBLIC anon key can no longer
--  read or write them. All dashboard access now goes through the
--  authenticated `crm` Edge Function (service-role, password-gated).
--
--  Background: the dashboard used to hit PostgREST directly with the
--  anon key, which meant anyone could dump customer PII. This removes
--  every anon/authenticated policy and privilege on these tables.
--  The service_role (used by Edge Functions) bypasses RLS and keeps
--  full access, so the CRM keeps working.
-- ============================================================

-- 1) Drop ANY existing policies on these tables (covers permissive
--    policies that may have been added manually in the dashboard).
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('leads', 'lead_activities', 'follow_ups', 'otp_verifications')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 2) Make sure RLS is ON (and enforced even for table owners).
ALTER TABLE public.leads              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads              FORCE  ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities    FORCE  ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups         FORCE  ROW LEVEL SECURITY;
ALTER TABLE public.otp_verifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_verifications  FORCE  ROW LEVEL SECURITY;

-- 3) Revoke every table privilege from the public-facing roles.
--    (service_role is NOT touched — Edge Functions still have full access.)
REVOKE ALL ON public.leads             FROM anon, authenticated;
REVOKE ALL ON public.lead_activities   FROM anon, authenticated;
REVOKE ALL ON public.follow_ups        FROM anon, authenticated;
REVOKE ALL ON public.otp_verifications FROM anon, authenticated;

-- With RLS enabled and no policies, even if some privilege were granted
-- the anon role would still be blocked. Belt and suspenders.

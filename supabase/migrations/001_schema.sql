-- ============================================================
--  Alpen Glow Tours — Supabase Schema  (migration 001)
-- ============================================================

-- ── LEADS ─────────────────────────────────────────────────
-- Stores every captured lead: contact forms, blog unlocks,
-- package gate cards, and offer OTP completions.
CREATE TABLE IF NOT EXISTS public.leads (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name             TEXT,
  email            TEXT,
  phone            TEXT,
  message          TEXT,
  source           TEXT        NOT NULL DEFAULT 'unknown',
  -- 'contact_form' | 'blog_unlock' | 'package_gate' | 'offer_otp'
  package_name     TEXT,
  offer_code       TEXT,
  verified_phone   BOOLEAN     DEFAULT FALSE,
  verified_email   BOOLEAN     DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── OTP VERIFICATIONS ─────────────────────────────────────
-- Short-lived codes for SMS and email verification.
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  contact    TEXT        NOT NULL,          -- phone number OR email
  type       TEXT        NOT NULL CHECK (type IN ('sms', 'email')),
  code       TEXT        NOT NULL,
  purpose    TEXT        NOT NULL DEFAULT 'general',
  -- 'offer_unlock' | 'package_gate' | 'blog_unlock' | 'contact'
  metadata   JSONB       DEFAULT '{}',
  attempts   INTEGER     DEFAULT 0,
  verified   BOOLEAN     DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEXES ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_otp_lookup
  ON public.otp_verifications (contact, type, verified, expires_at);

CREATE INDEX IF NOT EXISTS idx_leads_created
  ON public.leads (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leads_source
  ON public.leads (source);

-- ── ROW-LEVEL SECURITY ────────────────────────────────────
-- All access goes through Edge Functions (service-role key).
-- Direct client access is blocked by enabling RLS with no policies.
ALTER TABLE public.leads              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_verifications  ENABLE ROW LEVEL SECURITY;

-- ── UPDATED_AT TRIGGER ────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── CLEANUP FUNCTION ──────────────────────────────────────
-- Call manually or schedule with pg_cron:
--   SELECT cron.schedule('cleanup-otps', '*/30 * * * *', 'SELECT cleanup_expired_otps()');
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM public.otp_verifications
  WHERE expires_at < NOW() AND verified = FALSE;
END;
$$ LANGUAGE plpgsql;

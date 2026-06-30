-- ============================================================
--  AlpenGlow CRM — migration 005
--  Adds: status + revenue columns to leads,
--        lead_activities table, follow_ups table
-- ============================================================

-- ── LEADS — new CRM columns ────────────────────────────────
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS status         TEXT    NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','contacted','quoted','booked','cancelled')),
  ADD COLUMN IF NOT EXISTS quoted_amount  NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS final_amount   NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes          TEXT;

CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads (status);

-- ── LEAD ACTIVITIES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id    UUID        NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,
  type       TEXT        NOT NULL,
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_lead ON public.lead_activities (lead_id, created_at DESC);

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- ── FOLLOW-UPS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id    UUID        NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,
  due_at     TIMESTAMPTZ NOT NULL,
  note       TEXT,
  done       BOOLEAN     DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_followups_lead ON public.follow_ups (lead_id);
CREATE INDEX IF NOT EXISTS idx_followups_due  ON public.follow_ups (due_at) WHERE done = FALSE;

ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

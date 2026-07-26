-- ============================================================
--  Billing — migration 010
--  Customers and tax invoices for the AlpenGlow billing app
--  (travel-app: ticket PDF -> GST tax invoice).
--
--  Security posture matches migration 007: these tables hold
--  customer PII (names, mobiles, GST numbers) and financial
--  records, so the PUBLIC anon key gets NO access at all.
--  Everything goes through the password-gated `billing` Edge
--  Function, which uses the service-role key and bypasses RLS.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- Customers
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.billing_customers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name  text,                    -- printed as "M/S :" (firms only)
  name          text NOT NULL,           -- passenger / buyer name
  salutation    text,                    -- Mr, Mrs, Ms ...
  mobile        text,
  email         text,
  gst_number    text,
  state         text,
  address       text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- One customer per name+mobile, so re-billing the same person reuses the
-- existing row instead of creating duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS billing_customers_name_mobile_key
  ON public.billing_customers (lower(name), coalesce(mobile, ''));

CREATE INDEX IF NOT EXISTS billing_customers_company_idx
  ON public.billing_customers (company_name);

-- ------------------------------------------------------------
-- Invoices
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.billing_invoices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number  integer NOT NULL UNIQUE,
  invoice_date    date NOT NULL DEFAULT current_date,

  customer_id     uuid REFERENCES public.billing_customers (id) ON DELETE SET NULL,

  -- Every ticket billed on this invoice: route, passengers, fare and service
  -- charge per ticket. One bill can carry several (e.g. outbound + return).
  tickets         jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Summary of the first ticket, denormalised so listing and reporting
  -- queries don't have to reach into the JSON.
  mode            text
                  CHECK (mode IN ('train','bus','domestic_flight','international_flight')),
  journey_date    date,
  from_place      text,
  to_place        text,
  passengers      jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Money (INR)
  qty             integer NOT NULL DEFAULT 1,
  ticket_amount   numeric(12,2) NOT NULL DEFAULT 0,
  extra_charges   jsonb NOT NULL DEFAULT '[]'::jsonb,
  handling_rate   numeric(12,2) NOT NULL DEFAULT 0,
  handling_qty    integer NOT NULL DEFAULT 1,
  handling_total  numeric(12,2) NOT NULL DEFAULT 0,
  cgst_rate       numeric(5,2) NOT NULL DEFAULT 9,
  sgst_rate       numeric(5,2) NOT NULL DEFAULT 9,
  cgst_amount     numeric(12,2) NOT NULL DEFAULT 0,
  sgst_amount     numeric(12,2) NOT NULL DEFAULT 0,
  grand_total     numeric(12,2) NOT NULL DEFAULT 0,
  amount_in_words text,

  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billing_invoices_customer_idx
  ON public.billing_invoices (customer_id);
CREATE INDEX IF NOT EXISTS billing_invoices_date_idx
  ON public.billing_invoices (invoice_date DESC);
CREATE INDEX IF NOT EXISTS billing_invoices_number_idx
  ON public.billing_invoices (invoice_number DESC);

-- ------------------------------------------------------------
-- Invoice numbering
-- The agency's existing bills run 139, 199, 200, 201, 212 ...
-- so the series continues from 213.
-- ------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.billing_invoice_number_seq AS integer START WITH 213;

-- Never collide with rows already present.
SELECT setval(
  'public.billing_invoice_number_seq',
  greatest(
    coalesce((SELECT max(invoice_number) FROM public.billing_invoices), 212) + 1,
    213
  ),
  false
);

CREATE OR REPLACE FUNCTION public.next_billing_invoice_number()
RETURNS integer
LANGUAGE sql
VOLATILE
AS $$
  SELECT nextval('public.billing_invoice_number_seq')::integer;
$$;

-- ------------------------------------------------------------
-- keep updated_at fresh
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_billing_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS billing_customers_touch ON public.billing_customers;
CREATE TRIGGER billing_customers_touch BEFORE UPDATE ON public.billing_customers
  FOR EACH ROW EXECUTE FUNCTION public.touch_billing_updated_at();

DROP TRIGGER IF EXISTS billing_invoices_touch ON public.billing_invoices;
CREATE TRIGGER billing_invoices_touch BEFORE UPDATE ON public.billing_invoices
  FOR EACH ROW EXECUTE FUNCTION public.touch_billing_updated_at();

-- ============================================================
--  Lock down — same posture as migration 007.
--
--  These tables carry customer PII and financial records, and this
--  Postgres is reachable from the internet via PostgREST. The anon
--  key is public (it ships in the app), so it must not be able to
--  read or write here. The `billing` Edge Function uses the
--  service-role key, which bypasses RLS.
-- ============================================================

-- Drop any policy that might have been added by hand.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('billing_customers', 'billing_invoices')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

ALTER TABLE public.billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_customers FORCE  ROW LEVEL SECURITY;
ALTER TABLE public.billing_invoices  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_invoices  FORCE  ROW LEVEL SECURITY;

REVOKE ALL ON public.billing_customers FROM anon, authenticated;
REVOKE ALL ON public.billing_invoices  FROM anon, authenticated;

-- The numbering helpers must not be callable with the public key either.
REVOKE ALL ON SEQUENCE public.billing_invoice_number_seq FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.next_billing_invoice_number() FROM anon, authenticated, public;

-- With RLS enabled and no policies, even a stray GRANT would still be
-- blocked. Belt and suspenders, as in 007.

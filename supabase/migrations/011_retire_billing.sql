-- ============================================================
--  Retire billing — migration 011
--
--  The travel-app billing app moved to its own fully isolated stack
--  (Express + SQLite, own containers, own domain
--  travel.alpenglowglobal.com) — it no longer uses this Supabase
--  project at all. This removes everything migration 010 added, so
--  the agency's shared Postgres doesn't carry dead schema.
--
--  Verified empty before writing this (0 rows in both tables) —
--  nothing was ever billed through the old path.
-- ============================================================

DROP TRIGGER IF EXISTS billing_customers_touch ON public.billing_customers;
DROP TRIGGER IF EXISTS billing_invoices_touch  ON public.billing_invoices;

DROP FUNCTION IF EXISTS public.touch_billing_updated_at();
DROP FUNCTION IF EXISTS public.next_billing_invoice_number();

DROP SEQUENCE IF EXISTS public.billing_invoice_number_seq;

-- CASCADE takes the indexes and the FK from invoices -> customers with it.
DROP TABLE IF EXISTS public.billing_invoices CASCADE;
DROP TABLE IF EXISTS public.billing_customers CASCADE;

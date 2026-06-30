-- Add exact_budget column to trip_leads
ALTER TABLE public.trip_leads
  ADD COLUMN IF NOT EXISTS exact_budget NUMERIC DEFAULT NULL;

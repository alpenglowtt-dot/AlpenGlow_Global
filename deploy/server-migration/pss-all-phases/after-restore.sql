-- PLAN.md step 10, after ~/ops/restore-public.sh: buckets and the migration record. Run once in
-- pss-db as postgres, BEFORE the first deploy/vps-deploy.sh:
--   docker exec -i pss-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 < after-restore.sql
-- Safe to re-run (ON CONFLICT DO NOTHING). One transaction.
--  * Buckets: the three private buckets with exactly the settings of migrations 059, 062 and 069
--    (decision 3; the dump holds only "public", not storage.buckets). No storage.objects policies:
--    those three migrations add none, and the old student-photos ones (002/010/016) are not wanted.
--  * public._migrations_applied: row security on, no access for PUBLIC/anon/authenticated, and
--    every file in supabase/migrations at PSS commit 65d8f1a recorded as applied (the data arrived
--    as a dump of a database that already has them). Generated from the repo, 73 names.
BEGIN;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('payment-proofs', 'payment-proofs', false, 1572864, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('id-photos',      'id-photos',      false, 1572864, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('task-photos',    'task-photos',    false, 1572864, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public._migrations_applied (
  filename text PRIMARY KEY,
  applied_at timestamptz DEFAULT now()
);
ALTER TABLE public._migrations_applied ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public._migrations_applied FROM PUBLIC, anon, authenticated;
INSERT INTO public._migrations_applied (filename) VALUES
  ('001_initial.sql'),
  ('002_features.sql'),
  ('003_session_pause.sql'),
  ('004_overtime.sql'),
  ('005_rename_branches.sql'),
  ('006_owner_requests.sql'),
  ('007_tasks_attendance.sql'),
  ('008_menu_seed.sql'),
  ('009_task_routines.sql'),
  ('010_storage_anon_upload.sql'),
  ('011_recurring_tasks.sql'),
  ('012_locker_pending.sql'),
  ('013_food_bill_settlement.sql'),
  ('014_enquiries.sql'),
  ('015_enquiries_rls.sql'),
  ('016_remove_anon_storage_policies.sql'),
  ('017_membership_discounts.sql'),
  ('018_enquiry_trial_session.sql'),
  ('019_cashbacks.sql'),
  ('020_permanent_waitlist.sql'),
  ('021_food_pass.sql'),
  ('022_overtime_billing.sql'),
  ('023_payouts.sql'),
  ('024_referral_source_ai_platform.sql'),
  ('025_walkin_fee_tiers.sql'),
  ('026_membership_plan_changes.sql'),
  ('027_staff_session_end.sql'),
  ('028_branch_capacity_update.sql'),
  ('029_staff_branch_override.sql'),
  ('030_hopes_locker_renumber.sql'),
  ('031_membership_refund_payout.sql'),
  ('032_membership_edits.sql'),
  ('033_overtime_excluded.sql'),
  ('034_booking_scheduled_hours.sql'),
  ('035_custom_plan_weekend_hours.sql'),
  ('036_membership_edits_attendance.sql'),
  ('037_case_insensitive_username.sql'),
  ('038_locker_orphan_guard.sql'),
  ('039_delete_membership_reason.sql'),
  ('040_admin_role.sql'),
  ('041_admin_role_assign.sql'),
  ('042_food_stock_logs.sql'),
  ('043_drop_food_stock_logs.sql'),
  ('044_food_inventory_logs.sql'),
  ('045_inventory_items.sql'),
  ('046_inventory_logs.sql'),
  ('047_drop_food_inventory_logs.sql'),
  ('048_app_settings.sql'),
  ('049_transaction_category_overtime.sql'),
  ('050_renewals_and_waivers.sql'),
  ('051_self_signup.sql'),
  ('052_event_log.sql'),
  ('053_actor_audit.sql'),
  ('054_idempotency_keys.sql'),
  ('055_focus_pulse.sql'),
  ('056_model_outputs.sql'),
  ('057_agent_runs.sql'),
  ('058_student_auth.sql'),
  ('059_payment_proofs.sql'),
  ('060_portal_notifications.sql'),
  ('061_approvals.sql'),
  ('062_student_requests.sql'),
  ('063_seat_releases.sql'),
  ('064_yield_and_leads.sql'),
  ('065_referral_links.sql'),
  ('066_exam_notices.sql'),
  ('067_phase2_hardening.sql'),
  ('068_checkin_location.sql'),
  ('069_food_queue_and_tickets.sql'),
  ('070_deprecate_staff_ops.sql'),
  ('071_learning_and_buddies.sql'),
  ('072_certificates_and_digests.sql'),
  ('073_ai_provider_attempts.sql')
ON CONFLICT (filename) DO NOTHING;

SELECT (SELECT count(*) FROM storage.buckets WHERE id IN ('payment-proofs','id-photos','task-photos')) AS buckets,
       (SELECT count(*) FROM public._migrations_applied) AS migrations_recorded;
COMMIT;

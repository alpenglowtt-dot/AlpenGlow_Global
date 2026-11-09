# PSS all-phases on the old server: progress

Plan: `PLAN.md` in this folder. Update this file after EVERY finished step,
then commit and push it to `claude/sleepy-johnson-fmuoxd` (pre-approved).
Never write passwords, keys, tokens, connection strings or customer data
here.

## Current step

Step 2: read-only inventory of `zripsszkprhtyccukrir`. SQL given to you
(9 Nov): part 1 (server, extensions, public tables with exact counts,
totals, buckets with file counts, auth users, realtime publication, Vault
secret names), part 2 (cron jobs, no commands printed), part 3 (CLI
migration history), plus `docs/ops/full-system-diagnostic.sql`. Waiting
for the results, the Edge Function list and the secret NAMES.

## Next step

Step 3: stack kit for the full app (template with Storage and Realtime,
`add-project-full.sh`, `nginx/project-site-full.template`), diff shown to
you. Then step 4 (PSS-side files, incl. the decision B change).

## Done

- **9 Nov 2026** Step 1, worktrees (no server, Cloudflare or Supabase
  change):
  - `claude/sleepy-johnson-fmuoxd` was on GitHub in neither repo when
    checked (`git ls-remote`); created locally from `92156bc` (AlpenGlow,
    = `claude/server-migration-kit`) and `65d8f1a` (PSS, =
    `pss-ai/all-phases`), confirmed by you.
  - `Desktop\AlpenGlow WEB\AlpenGlow-pss-all-phases`: branch at `92156bc`,
    clean, no upstream yet (first push sets it).
  - `Desktop\PSS\pss-all-phases`: branch at `65d8f1a`, clean; after your
    cloud session pushed it, fetched and set to track
    `origin/claude/sleepy-johnson-fmuoxd` (same commit, nothing to merge).
  - Protected folders unchanged: `AlpenGlow-migration` still on
    `claude/server-migration-kit` (`92156bc`), `PSS\perfect-study-space`
    still on `main`.
  - Both folders added with `/add-dir`.
- **9 Nov 2026** Step 1, code read (all-phases at `65d8f1a`, read-only):
  73 migrations; Storage in 002, 010, 016, 059, 062, 069 (048 was a false
  match on `localStorage`); functions `api`, `cron`, `agent` + `_shared`,
  all served by the template's `main` router; signed Storage links built
  from `SUPABASE_URL` (would point at `kong:8000`: open choice 1 in
  `PLAN.md`); `cron.sql` uses Vault and pg_net, 27 jobs; secret names as in
  `PLAN.md`. Docker Desktop installed on the laptop, not running.
- **9 Nov 2026** `PLAN.md` and this file written (commit `3539900`, first
  push of the AlpenGlow branch).
- **9 Nov 2026** Step 1 approved by you, with open choice 1 = **B**
  (signed links from `SUPABASE_PUBLIC_URL` in the two actions; functions
  keep `SUPABASE_URL=http://kong:8000`; nginx opens only GET/HEAD
  `/storage/v1/object/sign/` and the Realtime websocket, nothing internal).
  2, 3, 5 as proposed; 4 after step 2; 6 no PSS backup. Recorded in
  `PLAN.md` Decisions.
- **9 Nov 2026** Step 2 prep (read-only, in the repo):
  `full-system-diagnostic.sql` writes only to its own temporary report
  table (dropped at `COMMIT`). Migrations 059, 062, 069 add no
  `storage.objects` policies; their buckets are private, 1572864 bytes
  (1.5 MB), `image/jpeg`, `image/png`, `image/webp`.
- **9 Nov 2026** Step 2, part 3 (your result): `supabase_migrations.schema_migrations`
  does not exist; migrations were applied through the SQL Editor, not the
  CLI. So the cloud has no record of which of 001 to 073 ran; the
  diagnostic (part 4) is the evidence that the schema matches 001 to 073.
  No effect on the move: 001 to 073 are recorded on the stack in step 10.
- **9 Nov 2026** Step 2, part 4 (`full-system-diagnostic.sql`, run by you
  on `zripsszkprhtyccukrir`): **FAIL 0, BLOCKED 0, WARN 1**, OFF 30,
  ON_UNVERIFIED 39, PASS 113.
  - Schema matches 001 to 073: all **77 tables** present with the expected
    columns, each RLS on, primary key, 0 policies; 6 required unique
    indexes valid; 0 invalid indexes; 0 unvalidated constraints; triggers
    `events_no_update_delete`, `events_no_truncate`,
    `trg_release_orphaned_locker` enabled; SQL functions
    `events_append_only`, `hash_staff_password`, `verify_staff_login`,
    `purge_events`, `release_orphaned_locker`, `pss_run_cron_job`,
    `pss_run_agent_job` present. The three privileged helpers are not
    executable by `PUBLIC`/`anon`/`authenticated`.
  - Extensions `pg_cron`, `pg_net`, `pgcrypto` installed. Vault holds
    exactly one `pss_project_url` and one `pss_cron_secret` (values not
    shown).
  - Schedules: all **27** `pss_*` jobs exist with the expected schedules;
    **2 active** (`pss_integrity_report` 20:30 UTC, `pss_owner_brief`
    01:30 UTC), 25 paused. Both ran nightly up to 9 Nov (owner brief via
    Ollama `gemma4:31b`, 30 successful AI attempts, 0 failed; Claude and
    Gemini unused).
  - Storage: `id-photos`, `payment-proofs`, `task-photos` present and
    private; `student-photos` absent (the only WARN; expected, unused).
    File counts not in the diagnostic (part 1 has them).
  - Feature switches (`app_settings`): 39 of 44 on, incl.
    `pssai_realtime`; off (no row, default off): `pssai_auto_approve`,
    `pssai_cron`, `pssai_proof_reading`, `pssai_retire_staff_ops`,
    `pssai_upi_pay`. Controls: `pssai_agent_shadow` on, AI budget 10 USD,
    discount confirm over 1000, enquiry AI 150/day, public AI 40/day.
  - Data present: 3 active branches, 2 active owner accounts, 3 branch
    signup links; no self-check-in setup, no student portal PINs.
  - Consequences for the move: (1) the cloud keeps changing (the two
    active jobs write `owner_briefs`, `agent_runs`, `events` nightly), so
    step 10 compares the stack against row counts taken from the dump
    itself, with step 2's counts only as a sanity check; (2) the dump of
    `public` includes `pss_run_cron_job`/`pss_run_agent_job` pointing at
    Vault and pg_net; `cron-selfhosted.sql` replaces them in step 13;
    (3) the 39 switches arrive ON with the data, unchanged (see Waiting
    on me).

## Decisions

See `PLAN.md`, "Decisions" (branch, folders, Supabase rules, billing,
tracking). In short:

- Only `zripsszkprhtyccukrir`; you log in to its dashboard yourself.
- No Supabase CLI against any project without asking you first.
- `ozatixapvxwrwbpdxuzt` (live PSS) is never touched.
- No `EnterWorktree`; edit by full path; never git or write in
  `PSS\perfect-study-space`, `AlpenGlow-migration`, `AlpenGlow work`.

## Waiting on me

- [x] Your OK on `PLAN.md` (9 Nov; open choice 1 = B).
- [ ] Step 2: part 1 result (exact row counts, bucket file counts,
      Postgres version), the deployed Edge Functions, the secret NAMES.
      (Part 3 and the diagnostic are in; part 2 is no longer needed: the
      diagnostic listed all 27 jobs.)
- [ ] Decide: the 39 feature switches arrive ON with the data. Leave them
      as in the cloud (Claude's default: no change), or set them off on
      the stack until "start testing"?
- [ ] Step 5: Docker Desktop running on this laptop (you are starting it,
      9 Nov).

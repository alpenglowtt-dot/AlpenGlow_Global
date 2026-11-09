# PSS all-phases on the old server: progress

Plan: `PLAN.md` in this folder. Update this file after EVERY finished step,
then commit and push it to `claude/sleepy-johnson-fmuoxd` (pre-approved).
Never write passwords, keys, tokens, connection strings or customer data
here.

## Current step

Step 14: steps 5 to 13 done. The branch preview has not been rebuilt with
the new Preview variables (still the cloud API). Waiting for you to check
the variables and the deployment in Cloudflare Pages (see chat, 10 Nov).

## Next step

Step 5: local rehearsal with Docker Desktop (stack from step 3, all 73
migrations, the 3 functions, buckets, signed link, pg_cron/pg_net/Vault,
`cron-selfhosted.sql` paused, Storage login as `supabase_storage_admin`,
Realtime as `supabase_admin`, the PSS server test suites incl. the new
`storage_links_test.ts`). Then step 6 (commit and push), then 6b
(travel-app removal, billing dump first), then 7 (baseline).

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
- **9 Nov 2026** Step 2, parts 1 and 2 and the secret names (run and read
  by you; counts and names only). **These are the step 2 reference counts.**
  - Server: Postgres **17.11**, database 20 MB. `shared_preload_libraries`:
    `pg_stat_statements, pgaudit, plpgsql, plpgsql_check, pg_cron, pg_net,
    pgsodium, auto_explain, pg_tle, plan_filter, supabase_vault`.
    (Stack image `supabase/postgres:17.6.1.136`: same major version, so
    its `pg_dump` can dump 17.11.)
  - Extensions: `pg_cron` 1.6.4 (`pg_catalog`), `pg_net` 0.20.4,
    `pg_stat_statements` 1.11, `pgcrypto` 1.3, `uuid-ossp` 1.1 (all in
    `extensions`), `plpgsql` 1.0, `supabase_vault` 0.3.1 (`vault`).
  - `public`: **77 tables, 7328 rows**, 8 functions, 192 indexes,
    0 policies, 3 triggers, 0 views; every table RLS on.
    Non-zero tables: `agent_runs` 18, `alerts` 800, `app_settings` 45,
    `bookings` 3016, `branches` 3, `cashbacks` 17, `desks` 178,
    `enquiries` 38, `enquiry_activities` 21, `enquiry_followups` 1,
    `events` 136, `fee_config` 23, `food_bill_items` 11, `food_bills` 10,
    `food_items` 34, `inventory_items` 1, `inventory_logs` 2, `lockers`
    109, `membership_discounts` 28, `membership_edits` 351,
    `membership_holds` 53, `membership_plan_changes` 60, `memberships`
    770, `messages` 39, `overtime_sessions` 147, `owner_briefs` 10,
    `payouts` 50, `permanent_waitlist` 2, `staff` 10, `staff_attendance`
    226, `students` 442, `tasks` 3, `transactions` 665, `waivers` 9. The
    other 43 tables: 0 rows.
  - Storage: `id-photos`, `payment-proofs`, `task-photos`, each private,
    limit 1572864, **0 files**; 0 objects in total.
  - `auth.users` 0. No table in the `supabase_realtime` publication
    (Broadcast does not need one).
  - Vault names: `pss_cron_secret`, `pss_project_url` (created 29 Oct).
  - Cron (part 2): 27 jobs; 20 call `pss_run_cron_job`, 7 call
    `pss_run_agent_job`; active only `pss_integrity_report` and
    `pss_owner_brief`.
  - Edge Function secret names (8): `STAFF_JWT_SECRET`,
    `STUDENT_JWT_SECRET`, `CRON_SECRET`, `CERTIFICATE_SECRET`,
    `PORTAL_URL`, `ALLOWED_ORIGINS`, `OLLAMA_API_KEY`, `AI_API_KEY`. Not
    set: `PUBLIC_SITE_KEY` (so the site-key signup action,
    `api/domains/auth.ts:78`, answers 401 on the cloud today),
    `GEMINI_API_KEY`, all `*_MODEL*` overrides (code defaults apply),
    `JWT_SECRET`.
  - **Open choice 4 settled by the data: no Storage files to copy**; the
    three buckets are created empty on the stack (decision 3).
  - To check in step 5: `verify_staff_login`/`hash_staff_password` use
    `crypt()`/`gen_salt()` from `pgcrypto` in the `extensions` schema; a
    staff login on the restored data proves the search path works.
- **9 Nov 2026** Step 2 approved by you. Feature switches: all 39 stay as
  in the cloud; schedules stay paused; no AI keys until you say (PLAN.md
  Decisions). Edge Function list not needed. Nature of the data: your
  answer left both options open; treated as personal data until you
  confirm (wipe `~/projects/pss` before the old server is cancelled).
- **9 Nov 2026** Step 3 built (files in this folder, not committed):
  - `stack-template/`: copy of `../new-server/stack-template` plus
    `storage` (`supabase/storage-api:v1.60.4`, file backend in
    `volumes/storage`, 256 MB) and `realtime`
    (`supabase/realtime:v2.102.3`, container `realtime-dev.__PROJECT__-realtime`,
    384 MB), settings taken from the AlpenGlow stack's own compose file
    (backend archive of snapshot `2026-11-02_2218`; only the unresolved
    compose, `kong.yml` and `realtime.sql` were extracted, to the job's
    temp folder; no secrets read). REST lowered to 256 MB. Kong plugins
    `post-function`, `request-termination` added; Storage and Realtime
    routes copied from AlpenGlow's `kong.yml`. `volumes/db/realtime.sql`
    new (copy of AlpenGlow's). `kong-entrypoint.sh`, `jwt.sql`,
    `roles.sql`, `main/index.ts` unchanged.
  - `add-project-full.sh`: as `add-project.sh` plus the new containers in
    the pre-check, `__PROJECT__` in `kong.yml`, `volumes/storage`, new
    secrets (`SECRET_KEY_BASE`, `REALTIME_DB_ENC_KEY` 16 chars, S3 protocol
    keys), new memory lines; no `~/ops` entry (decision 6); adds
    `snippets/proxy-to-stack.conf` only if missing; if `nginx -t` fails it
    removes what this run enabled and does not reload.
  - `nginx/project-site-full.template`: public only `/functions/v1/` (404
    for `main` and `_shared`), `GET`/`HEAD` `/storage/v1/object/sign/`,
    `= /realtime/v1/websocket` (1 h timeout); everything else 404 for
    everyone.
  - Checks: `bash -n` OK; both YAML files parse; `docker compose config`
    on a scratch copy with dummy values: valid, 6 services, ceilings total
    2688 MB, the only published port `127.0.0.1:8010`, no `__PROJECT__`
    left.
- **9 Nov 2026** Step 3 approved by you. Your decisions, recorded in
  `PLAN.md` Decisions: the data is treated as personal data (never printed,
  logged or committed; `~/projects/pss` wiped before the old server is
  cancelled); the AlpenGlow rollback no longer needs protecting, but its
  containers keep running if possible; the travel-app is removed in a new
  step 6b before the step 7 baseline (billing dump first); every server
  change still asked. Step 5 gets two more checks (Storage as
  `supabase_storage_admin` with the slim `roles.sql`, Realtime as
  `supabase_admin`).
- **9 Nov 2026** Temporary folder `...\jobs\10ae8e1e\tmp\ag-ref` (the 5
  files extracted from the backup archive) deleted on your request. Left
  in the job's temp folder: `compose-check` (template copy with dummy
  values only, nothing from the backup).
- **9 Nov 2026** Step 4 built in `Desktop\PSS\pss-all-phases` (not
  committed):
  - Decision B: `publicStorageLink()` in `supabase/functions/_shared/http.ts`
    (link rebased from `SUPABASE_URL` onto `SUPABASE_PUBLIC_URL`; unchanged
    when that is unset, equal, or the link does not start with
    `SUPABASE_URL`), used by `get_payment_proof_image`
    (`api/domains/payments.ts`) and `get_task_photo`
    (`api/domains/tickets.ts`). New suite `tests/server/storage_links_test.ts`
    (6 checks). Existing tests do not assert signed links; the fake's links
    start with `http://fake.local`, so they stay unchanged.
  - `deploy/vps-deploy.sh`: from the kit's `pss/vps-deploy.sh`; new step 0
    stops before changing anything if `pss-db`/`pss-functions`/the `main`
    router is missing or `_migrations_applied` is missing or empty; syncs
    `api`, `cron`, `agent`, `_shared`; applies only unrecorded migrations;
    keeps `_migrations_applied` locked; restarts `functions`.
  - `public/_headers` and `vercel.json`: `https://api.perfectstudyspace.in`
    added to `img-src` and `connect-src`, `wss://api.perfectstudyspace.in`
    to `connect-src`; `*.supabase.co` kept; both CSPs identical.
  - `docs/ops/cron-selfhosted.sql`: one transaction; extensions `pg_cron`,
    `pg_net`, `supabase_vault` if missing; Vault `pss_project_url =
    http://kong:8000` and `pss_cron_secret` from the psql variable
    `cron_secret` (refused if missing or shorter than 16); the two helpers
    as in `cron.sql`; 27 jobs created and paused in the same transaction;
    a count check before `COMMIT`.
  - Checks: `bash -n deploy/vps-deploy.sh` OK; `vercel.json` valid JSON;
    the 27 (name, schedule, helper, job) entries are identical to
    `cron.sql` (parsed by script). The server test suites are not run yet
    (no Deno on the laptop; they run in step 5).
- **9 Nov 2026** Step 4 approved by you. Data corrected: made-up test data
  (`~/projects/pss` still removed before the old server is cancelled, as
  cleanup). New working mode: steps 5 to 14 run without waiting (stop
  conditions in `PLAN.md` Decisions).
- **9 Nov 2026** **Step 5 done: local rehearsal** (Docker Desktop 29.9.2 on
  the laptop, dummy data only; torn down afterwards: containers, volumes
  and temp files removed).
  - Server test suites in `denoland/deno:2.9.6` (repo pins `^2.9.6`),
    worktree mounted read-only: **30 of 31 suites pass**, including the new
    `storage_links_test.ts`. **`golden_test.ts` fails** ("golden master
    differs"), and fails identically on an untouched export of `65d8f1a`,
    so it is pre-existing and not caused by this migration (the new helper
    is a no-op in the tests). Noted under Known issues; not fixed here.
    `seats_test.ts` (the release-gate race) passed this run.
  - Found and fixed in `stack-template/docker-compose.yml`: the first start
    of a fresh database took over 50 s, longer than the db health check
    allows (10 x 5 s), so `compose up` gave up and the other containers
    never started (`add-project-full.sh` would have stopped). Added
    `start_period: 120s` to the db health check; the next fresh start
    became healthy on its own.
  - Stack from the step 3 template, `__PROJECT__` = `pss`, freshly
    generated secrets: **all 6 containers healthy**; only
    `127.0.0.1:8010` published; no database port. Real memory use with
    dummy data: **923 MiB** (functions 283, realtime 204, storage 145, kong
    137, db 91, rest 64), ceilings 2688 MB.
  - Your two checks: **Storage logs in as `supabase_storage_admin`** (its
    connection in `pg_stat_activity`, its own `storage.*` tables created);
    **Realtime connects as `supabase_admin`** (`supabase_mt_realtime`,
    `cluster_node_realtime`), tenant `realtime-dev` seeded. The slim
    `roles.sql` set passwords on `authenticator`, `pgbouncer`,
    `supabase_admin`, `supabase_auth_admin`, `supabase_storage_admin`.
    `realtime.sql` ran (`_realtime` schema). No errors in either log.
  - `shared_preload_libraries` as on the cloud (incl. `pg_cron`, `pg_net`,
    `supabase_vault`); `cron.database_name = postgres`; `supabase_vault`
    0.3.1 installed; `pg_cron` 1.6.4 and `pg_net` 0.20.3 available.
  - **All 73 migrations apply from empty** (one transaction each), Storage
    ones included; 77 tables, 192 indexes, 3 triggers, 0 public policies,
    the 3 buckets private with 1.5 MB and jpeg/png/webp. (Differences from
    the cloud explained by the dump path: `overtime_sessions` without RLS
    and 5 instead of 8 functions here; the cloud's RLS and extra functions
    come with its dump.)
  - Real data path: `pg_dump --schema=public --no-owner` (224 KB, 77 tables,
    218 dummy rows), database wiped, stack restarted empty (healthy),
    `restore-public.sh pss-db` (no unexpected errors), **row counts match
    for all 77 tables** (counted from the dump's COPY blocks vs the
    database). New file `after-restore.sql` (this folder): 3 buckets +
    `_migrations_applied` (RLS on, no anon/authenticated access) with the
    73 names generated from the repo: 3 buckets, 73 recorded.
  - Functions `api`, `cron`, `agent`, `_shared` copied in (as
    `vps-deploy.sh` does), dummy `functions.env`: healthy. Dummy staff login
    (seed `owner`): 200 with a token (so `crypt()` from `pgcrypto` works);
    wrong password 401; `cron` and `agent` without `x-cron-secret` 401.
  - **Decision B end to end:** dummy image uploaded to `task-photos`
    (service role, via the gateway, 200); `get_task_photo` returned a link
    starting `https://api.perfectstudyspace.in/storage/v1/object/sign/task-photos/`.
  - nginx 1.24.0 stand-in with the rendered `project-site-full.template`
    (self-signed stand-in certificate): `nginx -t` OK. Open: signed link
    GET 200 (`image/png`, 70 B), HEAD 200, login 200 / wrong password 401,
    websocket upgrade **101**. Closed: POST and PUT on the sign path 403;
    404 for object download, public and authenticated object paths,
    `/storage/v1/bucket`, `/s3`, `/upload/resumable`, `/rest/v1/`,
    `/rest/v1/staff`, `/auth/v1/settings`, `/realtime/v1/api/broadcast`
    (GET and POST with the service key), `/realtime/v1/api/tenants`,
    `/functions/v1/main`, `/functions/v1/_shared/...`, `/pg/`,
    `/graphql/v1`, `/project/default`, `/`. Inside the stack the
    functions' broadcast path (`kong:8000/realtime/v1/api/broadcast`) 202.
  - `cron-selfhosted.sql`: without `-v cron_secret` and with a too-short
    one it stops and keeps nothing; with the dummy secret **27 jobs, 0
    active**, Vault `pss_cron_secret` and `pss_project_url`
    (`http://kong:8000`). One manual `pss_run_cron_job('cron_integrity_report')`
    (rehearsal only): pg_net 200, `events` row `integrity_report` ok.
    Scheduled runs: 0.
- **9 Nov 2026** **Step 6 done:** both worktrees committed and pushed to
  `claude/sleepy-johnson-fmuoxd` only. PSS `17dcbe9` (8 files: CSP,
  `publicStorageLink`, `deploy/vps-deploy.sh`, `docs/ops/cron-selfhosted.sql`,
  `tests/server/storage_links_test.ts`). AlpenGlow `266e73c` (the kit,
  `after-restore.sql`, `PLAN.md`, `PROGRESS.md`, refreshed `graphify-out`).
  PSS's `graphify-out` was refreshed by mistake and restored to its
  committed state (the refresh rewrote tracked files with this laptop's
  paths); 98 untracked files the refresh left there are not committed.
  The automatic security review of the push did not run (review API busy,
  HTTP 429; log in `~\.claude\security\log.txt`).
- **9 Nov 2026** **Step 6b a, billing data (read-only):**
  - Latest snapshot `2026-11-02_2218`: `db/app-billing-schema+data.sql`
    present (12181 bytes) and **OK in its `SHA256SUMS`** (all 22 listed
    files OK). Schema `billing`, tables `_migrations_applied`, `customers`,
    `invoices`, `login_attempts`.
  - **Fresh dump** (`pg_dump --schema=billing` in `supabase-db`, read-only,
    over SSH): `vps-migration-backup\2026-11-09_2112_billing-before-travel-app-removal\billing-schema+data.sql`,
    **12926 bytes**, Postgres 17.6, with its own `SHA256SUMS`; no
    DROP/TRUNCATE/DELETE statements.
  - Rows per table, identical in the fresh dump, the 2 Nov snapshot and
    live `count(*)` on the server: `_migrations_applied` 2, `customers` 1,
    `invoices` 2, `login_attempts` 0. Data lines identical to 2 Nov (0
    differing); the fresh dump also carries owner statements (2 Nov was
    taken with `--no-owner`) and its own random `\restrict` line.
  - **Waiting for your "dump OK"** before anything of the travel-app is
    removed (stop condition 3).
- **9 Nov 2026** You: "dump OK".
- **9 Nov 2026** **Step 6b b, as `deploy` (16:5x CET):** before: 3 containers
  `travel-app-web` (healthy), `travel-app-extraction`, `travel-app-billing`
  (healthy), no named volumes, folder 7.4 MB. `docker compose down` (no
  `-v`): containers and network `travel-app_travel-app` removed. Images
  removed: `travel-app-extraction` (2.9 GB), `travel-app-web` (379 MB),
  `travel-app-billing` (364 MB); none left. Folder `~/projects/travel-app`
  removed (everything in it owned by `deploy`); `~/projects` now holds
  only `alpenglow-global`. Disk 35 GB used, 62 GB free. Rollback source:
  `vps-migration-backup\2026-11-02_2218\files\travel-app.tar.gz`. Still to
  do as root (you): the nginx site and `certbot delete`; then the
  Cloudflare `travel` record.
- **9 Nov 2026** **Step 7 done: baseline "before PSS"** (read-only, 16:55 CET,
  travel-app containers already gone; its nginx site still enabled):
  - Memory 7941 MB total, 1754 used, **6186 available**; **no swap**. Go/no-go
    (≥ 3 GB available): **GO**. Load 1.13 / 1.20 / 1.28; up 6 days. Disk
    `/` 96 GB, 35 used, 62 free.
  - Containers: AlpenGlow's 10 running and healthy (studio 266 MB, storage
    235, realtime 221, pooler 206, db 135, meta 125, imgproxy 92,
    functions 86, rest 58, auth 10: about 1.43 GB), `supabase-kong`
    Exited (0) since 2 Nov (rollback stop), `tender_kowalevski` Exited.
  - Listening TCP: 22, 80, 443, 5432, 6543 (v4 and v6), resolver on 53
    (loopback). 8000/8443 not listening (Kong stopped). **Port 8010 free**,
    no nginx site uses it; no `pss-*` containers.
  - nginx 1.24.0 (Ubuntu); `nginx.conf` includes `conf.d/*.conf` and
    `sites-enabled/*`; `conf.d` empty; `snippets/` has no
    `proxy-to-stack.conf` (the script adds it); sites enabled:
    `api.alpenglowglobal.com`, `default`, `travel.alpenglowglobal.com`.
    `/etc/letsencrypt/options-ssl-nginx.conf` and `ssl-dhparams.pem` present;
    `/etc/letsencrypt/live` root-only; `/var/www/html` present; certbot
    installed.
  - Python 3.12.3, OpenSSL 3.0.13, Docker Compose 5.6.1, Ubuntu 24.04.5,
    IPv6 on. Docker networks: `bridge` 172.17/16, `supabase_default`
    172.18/16. No `~/ops`, no crontab for `deploy`.
- **9 Nov 2026** **Step 8, `deploy` part:** committed kit (`add-project-full.sh`,
  `after-restore.sql`, `stack-template/`, `nginx/`) copied to `~/pss-kit`,
  `restore-public.sh` to `~/ops/` (mode 700 folder); CR line endings
  stripped on the server (0 left); `bash -n` / `sh -n` OK;
  `add-project-full.sh` SHA-256 equal to the committed file. Waiting for
  you to run the root commands (stop condition 1).
- **9 to 10 Nov 2026** You ran the root commands and the Cloudflare
  changes ("done"). Checked by Claude (read-only):
  - **Step 6b root part done:** `travel.alpenglowglobal.com` gone from
    `sites-enabled` and `sites-available`; its certbot renewal config gone
    (left: `api.alpenglowglobal.com.conf`, `api.perfectstudyspace.in.conf`).
    **Differs:** the `travel` A record is **still in Cloudflare**: both
    zone nameservers (`lorna`, `tanner`) answer `169.58.43.191` (TTL 300);
    not a cache. Harmless for PSS (no `travel` site any more), asked again.
  - **Step 8 done:** stack `pss` up, **6 containers healthy** (`pss-db`,
    `pss-rest`, `pss-kong`, `pss-functions`, `pss-storage`,
    `realtime-dev.pss-realtime`); the only new listening port
    `127.0.0.1:8010`; no database port; `.env` and `functions.env` mode
    600 owned by `deploy` (19 `.env` keys as in `.env.example`); no
    `~/ops/projects` entry; `conf.d/10-pss.conf` and
    `snippets/proxy-to-stack.conf` added. AlpenGlow's containers unchanged
    (10 healthy, Kong Exited as before). Memory after: 2313 MB used, 5627
    available; PSS containers 23 to 183 MB each (about 620 MB together).
  - **Step 9 done:** `api.perfectstudyspace.in` A `169.58.43.191` at 1.1.1.1
    and 8.8.8.8; certificate CN `api.perfectstudyspace.in`, Let's Encrypt
    YE2, valid to **7 Feb 2027**; TLS site on. From the laptop: http 301 to
    https; HSTS and nosniff headers; websocket without key 401 (gateway);
    POST on the sign path 403; **404** for `/`, `/rest/v1/`,
    `/auth/v1/settings`, `/storage/v1/bucket`, `/storage/v1/object/public/...`,
    `/storage/v1/object/...`, `/storage/v1/s3`, `/realtime/v1/api/broadcast`,
    `/functions/v1/main`, `/functions/v1/_shared`, `/pg/`, `/graphql/v1`,
    `/project/default`. `/functions/v1/api` 500 until the functions are
    deployed (step 12; the router finds no `api` folder yet).
- **10 Nov 2026** Step 10 incident (no harm done, no data read): your
  first attempt passed a connection string of the **live project
  `ozatixapvxwrwbpdxuzt`** on the `read` command line (so `read` failed,
  the variable stayed empty, and `pg_dump` was refused by the local socket:
  nothing connected to the live project). The string then sat in the
  chat and in `deploy`'s shell history. You cleaned the history (0 pooler
  strings left in `~/.bash_history`, checked). Resetting that project's
  database password: your decision (recommended). Two more attempts
  failed because of Claude's block (the variable was not handed to
  `docker exec`; fixed with a command prefix) and a wrong test-project
  password (you then used the right one).
- **10 Nov 2026** **Step 10 done (data):**
  - `travel` record now gone from Cloudflare (both zone nameservers answer
    nothing).
  - Dump by you on the server (string checked to be `zripsszkprhtyccukrir`,
    passed only as an environment variable): `pg_dump --schema=public
    --no-owner`, exit 0, **2490717 bytes**, from Postgres 17.11 by
    pg_dump 17.6; no reference to `ozatixapvxwrwbpdxuzt`. In the dump: 77
    tables, **7328 rows** (each table equal to the step 2 inventory), RLS
    enabled on all 77, 0 policies, 8 functions (the 8th is
    `rls_auto_enable`), 3 triggers; other schemas referenced only by the
    two cron helpers (`net.http_post`, `vault.decrypted_secrets`).
  - `~/ops/restore-public.sh pss-db`: only the expected noise (12 x
    "permission denied to change default privileges", 1 x "schema public
    already exists").
  - `~/pss-kit/after-restore.sql`: 3 buckets, 73 migrations recorded.
  - **Row counts match: 77 tables, 7328 rows** (database vs dump, per
    table). Database: 0 tables without RLS, 8 functions, 192 indexes, 3
    triggers, 0 policies, 0 views; 3 private buckets, 0 objects;
    `_migrations_applied` 73, RLS on, `anon` cannot read it. `app_settings`
    45 rows, 40 `pssai_` keys `on` (the 39 switches plus the
    `pssai_agent_shadow` control), unchanged.
  - Dump file and count list deleted from the server.
  - Found for step 14: Pages project `perfectstudyspace` already built this
    branch as a preview, `https://claude-sleepy-johnson-fmuoxd.perfectstudyspace.pages.dev`
    (200; serves the new CSP with `api.perfectstudyspace.in`), but its
    bundle still points at `https://zripsszkprhtyccukrir.supabase.co`
    (Preview variables). Production `https://perfectstudyspace.pages.dev`
    200.
- **10 Nov 2026** You wrote `functions.env` on the server and changed the
  Cloudflare Pages Preview variables ("done").
- **10 Nov 2026** **Step 11 done:** `functions.env` mode 600 with exactly
  `STAFF_JWT_SECRET`, `STUDENT_JWT_SECRET`, `CRON_SECRET`,
  `CERTIFICATE_SECRET` (fresh random, 64 chars each, generated on the
  server, never shown), `PORTAL_URL` and `ALLOWED_ORIGINS` (both the
  branch preview `https://claude-sleepy-johnson-fmuoxd.perfectstudyspace.pages.dev`;
  origins also `http://localhost:5173`); no duplicates, no empty values,
  **no AI keys**, no `PUBLIC_SITE_KEY` (as on the cloud).
  `docker compose up -d functions`: healthy; all 6 secrets plus
  `SUPABASE_URL` and `SUPABASE_PUBLIC_URL` present in the container.
- **10 Nov 2026** **Step 12 done:** `VPS_HOST=deploy@169.58.43.191 bash
  deploy/vps-deploy.sh` from the PSS worktree at `17dcbe9` (no tracked
  changes): pre-check "stack present, 73 migrations recorded"; synced
  `_shared`, `agent`, `api`, `cron`; "no new migrations"; functions
  restarted. Through `https://api.perfectstudyspace.in/functions/v1/`:
  preflight from the preview origin 200 with that origin allowed, from
  `https://evil.example` no allow header; login with an unknown user and
  wrong password **401 "Invalid login credentials"** (0.9 s: function,
  REST and the `verify_staff_login`/`crypt()` path work);
  `list_branches` without a token 401; `cron` and `agent` without
  `x-cron-secret` 401; `main` and `_shared` 404; 0 error lines in the
  functions log. A successful login needs a real test staff password
  (yours): one command for you in the final report.
- **10 Nov 2026** **Step 13 done:** `cron-selfhosted.sql` copied to
  `~/pss-kit` (SHA-256 equal to the committed file), run by
  `~/pss-kit/run-cron-selfhosted.sh` (takes `CRON_SECRET` from
  `functions.env` and feeds it to psql through stdin; never on a command
  line or printed). Result: **27 `pss_` jobs, 0 active**, 27 jobs in
  total; Vault `pss_cron_secret` (64 chars) and `pss_project_url` =
  `http://kong:8000`; helpers not executable by `anon`; `pg_cron` 1.6.4,
  `pg_net` 0.20.3, `supabase_vault` 0.3.1; 0 scheduled runs so far.
- **10 Nov 2026, 21:41 CET** Whole-server check (read-only): 6 PSS
  containers healthy, AlpenGlow's 10 unchanged (Kong Exited as before);
  memory 2547 MB used, 5393 available (PSS stack 816 MiB, AlpenGlow 1460
  MiB); load 2.1 to 2.3 (baseline 1.2); disk 37 %; listening ports as in
  step 7 plus `127.0.0.1:8010` only. From the internet: 15 closed paths
  404, POST on the sign path 403, a forged signed link 400 (Storage checks
  the token); AlpenGlow's API on the new server answers 200. (`nginx -t`
  run as `deploy` reports "failed" only because it cannot read root-only
  files; your `sudo` run passed and the site serves the new config.)
- **10 Nov 2026** **Step 14 differs (stopped, stop condition 2):** the branch
  preview has **not been rebuilt**: still bundle `index-DsKqMPqS.js`,
  calling `https://zripsszkprhtyccukrir.supabase.co` with an anon key
  whose fingerprint (`81e49de0d54f`) is not the stack's (`e6cd3522f42b`).
  Checked twice about 10 minutes apart (a longer watch was stopped by
  Claude Code because the laptop ran low on memory). The CSP of that
  preview already allows `api.perfectstudyspace.in`.

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
- [x] Step 2 results: parts 1 to 4 and the secret names (9 Nov).
- [x] Your OK on step 2 (9 Nov).
- [x] Feature switches: keep all 39 as in the cloud (9 Nov).
- [x] Data handling: personal data, wipe `~/projects/pss` before the old
      server is cancelled (9 Nov).
- [x] Your OK on step 3 (9 Nov).
- [x] Your OK on step 4 (9 Nov).
- [x] Step 6b: your "dump OK" for the fresh billing dump (9 Nov).
- [x] Root commands: travel nginx site, `certbot delete` (travel),
      `add-project-full.sh` (1st run), `certbot certonly` (api), 2nd run
      (done 9/10 Nov).
- [x] Cloudflare: `api` A `169.58.43.191`, DNS only (done).
- [x] Cloudflare: delete `travel` in `alpenglowglobal.com` (gone, 10 Nov).
- [x] Step 10: dump of `zripsszkprhtyccukrir` on the server (10 Nov).
- [ ] Recommended: reset the database password of the live project
      `ozatixapvxwrwbpdxuzt` (its string was exposed in the chat).
- [ ] Step 11: write the `functions.env` lines on the server.
- [ ] Step 14: Cloudflare Pages Preview variables, then retry the branch's
      preview deployment.
- [ ] Step 6b c: delete the `travel` DNS record in Cloudflare (after the
      travel-app is removed).
- [ ] Step 5: Docker Desktop running on this laptop (you are starting it,
      9 Nov).

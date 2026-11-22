# Server migration: progress

Read this at the start of every session (after `git checkout
claude/server-migration-kit` and `git pull`), and update it after every
finished step, then commit and push. Never write passwords, keys, tokens,
connection strings or customer data here.

## Current step

**PSS Sitting 3 (22 Nov), Phase 1 DONE (read-only, see Done); Phase 2 waiting for your OKs (batched in the chat).** Earlier in Phase 1: DNS: you repointed `api.perfectstudyspace.in` to 84.247.184.195 (checked 16:0x CET; was 169.58.43.191). Supabase CLI (read-only): secret names set on the cloud: PUBLIC_SITE_KEY, STAFF_JWT_SECRET (both explicit), VITE_SUPABASE_ANON_KEY, VITE_SUPABASE_URL (unused by the api) and the platform SUPABASE_* ones. Deployed `api` = PSS main `cb7beeb` exactly (only a final newline differs); your 052 api lines are not on the cloud. Server: no host psql; the inventory runs in a throw-away container of the already present image supabase/postgres:17.6.1.136 (AlpenGlow containers untouched). Inventory query: kit `pss/phase1-inventory.sql` (READ ONLY transaction, counts and names only; tested on the local dummy db). Waiting: you copy it and run it with the pooler string typed at `read -rs`. The pooler string with the password was pasted into the chat again (22 Nov): not used; change the password after the final dump (Sitting 4).

Earlier: step 2b done, proven locally, all committed and pushed.

HANDOVER (for a fresh session):
- Committed and pushed (branches only, never main): PSS `fix/pre-migration` at
  `d560eb0` (all of 2b except the two items below); kit `claude/server-migration-kit`
  at `64d0085` (router + jose, nginx `_*` block, security-test, check.mjs) plus PROGRESS.
- Your OK 22 Nov on both diffs; committed and pushed: PSS `fix/pre-migration` at
  `8fd2fb3` (054_money_transactions.sql, api moneyTx, tests/scale/money-tx.mjs, run.mjs,
  README); kit at `c41876d` (J: backup-nightly.sh, healthcheck.sh, crontab.deploy,
  01-base-setup.sh, ops.env.example, restore-test.sh, runbook, README, UPDATE-PROCEDURE).
  Nothing uncommitted for the migration in either worktree.
- Re-run the proofs any time (Docker, dummy data): in the PSS worktree
  `npm run test:scale -- --orig d560eb0` (about 4 min; all steps incl. 4f must PASS).
  Never the large seed on the laptop (your decision): it runs in Phase 2 on the server.
  The local stack (compose project psslocal, `.scale-test/backend`) is stopped, not deleted.
- J is NOT installed on the live server (your decision 22 Nov): it still has backup 22:30,
  reboot 23:30 and no restore test. Install J in Phase 2 together with adding the PSS stack,
  with your OK, and without disturbing AlpenGlow's backups or health check: before the
  change take a backup and note `healthcheck.sh --status`; after it, run one backup by hand
  (must end "ok" for alpenglow-global AND pss), `healthcheck.sh --status` clean, and
  `crontab -l` showing the new schedule; keep the old crontab and apt reboot file as dated
  copies to roll back.
- AlpenGlow: 24-hour read-only memory sampling running on the server since 09:58 CET
  (`~/alpenglow-mem-24h.sh`, log `~/alpenglow-mem-24h.log`, ends by itself about 09:58 CET
  23 Nov; stop early: `pkill -f alpenglow-mem-24h`). Afterwards: peaks per container, the
  ceilings table under your rules (db >= 512m, edge-functions >= 384m, others >= 1.5 x peak,
  min 128m; propose stopping Studio if the total with PSS 4,608 MiB exceeds 7,941 MiB),
  then you pick the quiet hour.
- Nothing else changed on any server, Cloudflare or Supabase.

Earlier (AlpenGlow): switch-over finished (2 Nov): `api` points at `84.247.184.195`
since about 22:28 laptop time; Phases 3, 4 and 5 done (see Done). Now in
the Phase 6 rollback window: old server untouched for 1 to 2 weeks, old
Kong stays STOPPED (rollback only: point `api` back to `169.58.43.191`
and `docker compose start kong` there). Only open check: WhatsApp OTP to
a non-Indian number (needs a number you can receive on; same code path
and keys as the Indian one, which works).

Security fixes session (3 Nov) in progress, worktree
`C:\Users\sriva\Desktop\AlpenGlow WEB\AlpenGlow-security`, branch
`claude/security-fixes` (from `origin/main`, no upstream so a plain push
cannot reach `main`). Setup done; fixes 2 and 3 deployed and tested on the
new server; fix 1a (`save-trip-lead` edge function) deployed and
curl-tested; fix 1b committed (`8b1b269`) and passed a pre-merge browser
test; `main` pushed (`8b1b269`, 02:21 IST) and live on Cloudflare from
02:21:42 IST; your own final submit confirmed (fix 1c done). Fix 1d:
migration 014 written and dry-run OK (not committed, not deployed; see
Done, 3 Nov). Fix 1d deployed 02:47 IST on your order (before the 1 h
minimum, your decision) and tested: `security-test.sh` 0 FAIL; `main`
pushed (`9047ad7`, 02:56:57 IST). No real visitor hit the stale-cache
401 (checked 10:41 IST). Final re-test re-run by you and confirmed
(11:04 IST): contact form, trip planner final submit, Compass chat,
dashboard login all reached the new server, 0 errors. **AlpenGlow
security fixes 1, 2, 3: complete.**

## Next step

PSS Sitting 3, in this order: (1) done: both diffs committed (8fd2fb3, c41876d). (2) Phase 1 (read-only, PSS-MIGRATION-PLAN.md): you run `npx supabase login` on the
laptop (access token: secret NAMES and a download of the deployed `api` to diff); you
type the session-pooler string yourself at a `read -rs` prompt on the server (never in the
chat). Read: counts incl. students per branch, sessions and transactions per month;
whether `staff.last_login_at` exists on the cloud; live violations of one open session per
student / per desk (053 skips its two unique indexes with a WARNING if any); the IP
location of 84.247.184.195; where `api.perfectstudyspace.in` points (STOP if
169.58.43.191). Check AlpenGlow is healthy before and after. (3) Phase 2 on the new
server (each step with your OK): PSS rehearsal stack with DUMMY data first: 20,000-student
seed, all checks, load at 10, 20 and 50 users while watching AlpenGlow's response times;
then wipe it, then restore the live copy; install J then too (see the J rule above) (`restore-public.sh` only; migrations 001-051
recorded as applied BEFORE the first deploy). GO needs: 0 functions restarts, 0 Kong
errors, all checks PASS, at least 1 GB memory free, AlpenGlow response times unchanged.
Cloud order before the fixed `api` is deployed there: 052, then 053, then 054, by you in
the SQL editor. (4) End of sitting: GO/NO-GO and the Sitting 4 list; if GO, ask your OK to
merge fix/pre-migration into main and to deploy the api to the cloud. Each server, DNS or
Supabase change only with your OK.

Earlier (AlpenGlow): security fixes 1, 2, 3 are complete (deployed, tested, on `main`, site
flows confirmed 11:04 IST); `trip-planner.js` version tag and Supabase
CDN removal done (3 Nov, 12:20 IST). Optional later: `www` answers
Cloudflare 522. Whenever `trip-planner.js` changes, bump its `?v=` in
`index.html` and every `packages/*.html` (see the comment in
`index.html`). Later: Phase 6 (last `pull-backup.sh` of the
old server with `VPS_HOST=deploy@169.58.43.191`, then cancel it, delete
the `travel` DNS record, `ssh-keygen -R 169.58.43.191`), then the PSS
move.

## Done


- **22 Nov 2026, PSS Phase 1 done (read-only, cloud read 15:14 UTC via  in a
  READ ONLY transaction, run by you with the pooler string at ):** Postgres 17.6, 17 MB.
  34 public tables = exactly the repo's 001-051 schema (the repo-built db adds only
  _migrations_applied and 053's 4 tables); 92 indexes, 4 functions, 1 trigger, 0 policies, 12
  enums; row security on every table (overtime_sessions too). Rows: students 482, memberships
  911, bookings 4,523, transactions 861, alerts 852, desks 178, lockers 116, staff 8, branches 3
  (full list in ~/pss-phase1.txt on the server). Students per branch: 100 Feet Road 95 (31 with
  an active membership), Hopes 240 (92), Ram Nagar 147 (61). Per month (IST) sessions /
  transactions / revenue: 2026-07 12/20/24,883; 08 8/142/239,091; 09 1,050/289/373,739; 10
  2,463/220/283,817; 11 (to 22nd) 990/190/265,615. staff.last_login_at: ABSENT (052 needed).
  None of the names 053/054 create exist. Open sessions: 13; students or desks with 2+ open
  sessions: 0 and 0, so 053 creates both unique indexes. service_role has no timeout (053
  sets 30 s); anon 3 s, authenticated 8 s. pg_cron available but not installed (053 creates
  it; if the SQL editor refuses, enable pg_cron under Database > Extensions first, then run
  053 again: it is safe to run twice). Not used: auth.users 0, storage buckets 0 / objects 0
  (student-photos gone), realtime 0 tables, no webhooks; Supabase CLI migration history
  empty (migrations were run in the SQL editor). Secrets: STAFF_JWT_SECRET and
  PUBLIC_SITE_KEY set. Deployed api = main cb7beeb. New server 84.247.184.195 is Contabo,
  Germany (RIPE), so expect about 150 ms more per request from India than a nearby server.

- **22 Nov 2026, E-transactions and J committed (your OK):** PSS `fix/pre-migration`
  `8fd2fb3` pushed (branch only); kit `c41876d` pushed. J stays kit-only until Phase 2.
- **22 Nov 2026, J (ops in the kit) proven locally (uncommitted, diff to show you):**
  `backup-nightly.sh` runs from cron every 6 h (03:30, 09:30, 15:30, 21:30 server time);
  without an off-server copy it stops while the last good backup is under 20 h old (one
  local backup a day), `--now` forces one; 14 days kept locally and off-server
  (KEEP_OFFSITE_DAYS 90 -> 14). New `restore-test.sh` (cron, 2nd of the month 05:00):
  newest complete backup of each project restored with `restore-public.sh` into a scratch
  database `restore_test_<date>` in the project's own db container, every table's row count
  compared with the backup's row-counts.txt, scratch database dropped, PASS/FAIL emailed via
  Resend (`--no-mail` prints only). `healthcheck.sh`: memory alert under 1,024 MB available
  (was 300); `--db-size` writes one line (each project's database size, disk use) weekly,
  Monday 07:00. Reboot window 22:30 server time = 03:00 IST in winter (02:00 IST in summer),
  was 23:30; backups moved off 22:30. `01-base-setup.sh` installs restore-test.sh. Docs:
  runbook schedule table, README, UPDATE-PROCEDURE, ops.env.example. Local proof (dummy
  stack, throw-away HOME): backup ok (4.9 MB, 39 tables); the next 6-hourly run skipped;
  restore test PASS (39 tables, every count equal, 0 scratch databases left); a backup with
  one wrong count -> FAIL, exit 1; size line "pss 26 MB; disk 86% used". bash -n clean on
  all kit scripts. The memory alert reads /proc/meminfo, so it is checked on the server
  (`healthcheck.sh --status`).


- **22 Nov 2026, E-transactions proven locally (uncommitted, diff to show you):** migration
  **054_money_transactions.sql**: record_payment, record_locker_payment, topup_food_pass,
  create_food_bill, apply_loyalty_discount each as one SQL function = one transaction; the
  changed row is locked (FOR UPDATE; food items locked in id order; the student row for a
  top-up); same checks and messages; staff errors as SQLSTATE P0001 -> HTTP 400. Only
  service_role can run them (anon: 404). The api calls them and keeps its old steps as
  fallback ONLY when the function is missing (PGRST202). Evidence (local dummy stack,
  reference = api of d560eb0): `tests/scale/money-tx.mjs` 38/38 PASS, twice in a row:
  33 twin cases (two students in the same state, old steps vs one transaction) equal in
  every row and reply to the paisa, incl. refusals and their messages; a split that does not
  add up: new 400 with nothing changed (old: HTTP 500 with fee_due already 0 and no ledger
  row); a bill whose 2nd item is out of stock: new leaves stock untouched (old: 1st item's
  stock taken); at the same moment: 2 x 600 on a due of 1000 -> new 1 accepted, ledger 600
  (old: both accepted, ledger 1200, fee due 400); 5 top-ups of 100 on a new pass -> new pass
  500 = ledger 500 (old: pass 100, ledger 500); 2 pass bills of 80 on 100 -> new 1 paid, 1
  unpaid (old: both "paid from the pass", balance 20). With 054 hidden: 33/33 equal through
  the fallback. Full npm run test:scale (054 applied, 54 migrations) all PASS; type check
  back to the 2 old errors; paging lint OK; 0 restarts, 0 CPU-limit cancels.
- **22 Nov 2026, step 2b saved (your order "SAVE NOW"):** PSS `fix/pre-migration`
  `d560eb0` pushed (41 files): `052_owner_last_login.sql` byte-identical to yours plus its
  10 api lines unchanged; 053; api; website; `_vendor`; `tests/scale` (run.mjs, setup.sh,
  stack/, both seeds, check/students-pages/calls/duplicates/login-and-cache, lint-paging,
  README) plus the 2b proofs moved in from the job temp folder (a-equality.mjs,
  b-summary.sql, b-corrections.sql, c-equality.mjs, d-calls.mjs, e-dupes.mjs, fd-test.mjs);
  `.github/workflows/scale-test.yml`. Secret scan of the commit: none (only
  `${POSTGRES_PASSWORD}` references). Kit `64d0085` pushed: router with
  `jose@6.2.18.mjs`, nginx template blocks `/functions/v1/_*`, security-test.sh
  `_vendor` path, check.mjs retry counter. Your decisions the same day: transactions now
  for the five money actions, the big membership actions after the move (Sitting 5
  backlog); the 20,000-student test only on the new server in Phase 2 (dummy data first,
  then wipe, then the live copy), never again on the laptop; AlpenGlow's router
  `jsr:@panva/jose@6` import: note only, a separate fix later with your OK.

- **22 Nov 2026, 2b-H proven locally (uncommitted):** `supabase/functions/_vendor/` holds
  supabase-js 2.49.1 (esbuild browser bundle of the npm package, 104 KB, imports nothing) and
  jose 5.10.0 (esm.sh bundle, 66 KB, imports nothing), with a README (how each was made,
  sha256); api imports them by relative path. Found: esm.sh Deno bundle of supabase-js
  imports 13 node: modules, and Deno then fetches @types/node from npm on an empty cache, so
  it could not start offline; the browser build avoids that. **Found in the kit router:**
  `main/index.ts` imported `jsr:@panva/jose@6` (a moving range, fetched from jsr.io on an
  empty cache): with no internet the whole functions container looped on "worker boot
  error". Now `./jose@6.2.18.mjs` stored next to it (what @6 resolved to). AlpenGlow live
  router has the same jsr import (not changed; note only). Proof: fresh empty module cache
  + outbound internet blocked: container healthy, 0 restarts; login, revenue, students page,
  daily report, open sessions all HTTP 200; control (original api, esm.sh imports) HTTP 500;
  0 files downloaded. Back online, full regression: 28/28, 98/98, 191/191, D, E, lockout and
  cache all PASS. nginx template now 404s every /functions/v1/_ folder.

- **22 Nov 2026, 2b-D proven locally (uncommitted):** besides the cache and parallel
  login/sign-in lookups: action `batch` (up to 10 READ actions in one request through the
  same handler; writes, nesting and more than 10 refused); `poll_session_alerts` and
  `poll_my_tasks` for the two minute-by-minute hooks; both Dashboard views load through
  `apiBatch` (2 and 3 calls become 1). Checks: every batch part equals its own call,
  branch rules hold inside a batch; session alerts 78 KB instead of 360 KB per poll, the
  owner task bell 12 bytes instead of 761 KB per poll (every minute, every open tab);
  batches and polls store no idempotency records. Type check 2 old errors; vite build OK.

- **22 Nov 2026, 2b-C proven locally (uncommitted):** new actions `list_students_page`
  (50 per page) and `export_students` (filtered rows, for the CSV only), with the Students
  page own filter, sort and status rules moved into the api unchanged; rows kept 15 s per
  branch scope in the worker, cleared by every write. Both views of StudentsPage.jsx page
  through it (search sent after a 300 ms pause, Prev/Next). Proof: 142 branch-view
  combinations (every sort column and direction, statuses, searches, course and column
  filters; 199 pages) and 48 Combined Hall combinations give exactly the old browser
  result (same students, same order, same totals, courses and branch counts); export
  equals the filtered list (73 rows). One page 20.8 KB vs 607 KB for the whole list at
  1,500 students. `vite build` OK. Not yet clicked through in a browser (Playwright not
  available here): part of rehearsal test d. `list_students` is kept for the old website
  until the new one is live.

- **22 Nov 2026, 2b-B proven locally (uncommitted):** daily revenue summary
  (`revenue_daily`), rebuilt nightly at 02:00 IST by pg_cron (job
  `pss-nightly-summary`; a test job really ran, "succeeded"), today and
  newer days summed live, and a trigger that rebuilds a branch-day at once
  when a past payment or payout is added, edited, moved or deleted. 40/40
  day ranges identical to the plain row sums; 5/5 corrections stay exact;
  98/98 API comparisons PASS with `get_revenue` on the summary.
- **22 Nov 2026, 2b-E proven locally (uncommitted), apart from the
  SQL-transaction part:** `idempotency_keys` (purged after 7 days);
  every staff write runs through `withIdempotency` (the 4,957-line action
  chain moved unchanged into `handleStaffAction`); the website sends a key
  with each write and does not resend an identical write still in flight;
  the router may retry an undelivered request or one with a key. Unique
  rules: one open session per student and per desk (created only if the
  data already obeys them, else a warning). Tests: double-click payment
  recorded once (second answer a replay, fee due down once), same key with
  another amount 422, a new key is a new payment; 5 simultaneous
  check-ins of one student give 1 open session; two students on one free
  desk give one winner and "That desk is already in use by another open
  session". Regression after the move: 28/28, 98/98, lockout and cache
  all PASS. **Waiting on you:** scope of "each multi-step write in one
  transaction": 33 actions write 2+ times (renew_membership 11 writes /
  290 lines, update_attendance 11/173, delete_membership 10/129,
  close_membership 9/154, checkout_booking 8/217, create_membership
  6/250, ...). Recommendation: now the short money writes
  (record_payment, record_locker_payment, create_food_bill,
  topup_food_pass, apply_loyalty_discount, about 260 lines); the big
  membership actions after the move, one at a time with equality tests.

- **22 Nov 2026, your decisions:** AlpenGlow ceilings only after a 24-hour
  measurement (incl. the 22:30 backup): db at least 512m, edge-functions
  at least 384m, the others at least 1.5x their 24-hour peak (min 128m);
  if the total with PSS (4,608) exceeds 7,941 MiB, propose stopping
  AlpenGlow's Studio (start when needed) instead of cutting further; you
  pick the quiet hour. Your 052 and its api lines go into
  `fix/pre-migration` unchanged; cloud order: 052, then 053.
- **22 Nov 2026, 2b-A proven locally (uncommitted):** six SQL functions in
  053 (`report_revenue`, `report_daily`, `report_top_students`,
  `report_referrals`, `active_member_dues`, `dashboard_counts`), each
  one jsonb value (no row cap), plus 11 indexes; the api uses them and
  keeps the old method as a fallback. Equality against the committed
  JavaScript (`bfe2cb1`), 6 scopes x 5 periods and owner/staff views,
  with 400 payouts and payments one second either side of IST midnight
  added: **98/98 comparisons PASS** (money within half a paisa: revenue,
  daily/monthly reports, referral stats, top students, active-membership
  dues, dashboards, transactions, discounts). Same 98/98 with the SQL
  functions hidden (fallback path; 78 fallback log lines). Whole run:
  SQL 5.5 s vs JavaScript 13.2 s; monthly report about 100 ms instead of
  1.8 to 2.2 s. 28/28 checks PASS, 0 supervisor cancels. Found:
  `transactions.payment_mode` is NOT NULL, so the "null" key cannot occur.
  Reports page reads `walkinCount`/`newMemberCount` (falls back to list
  lengths), so it must go live before the new api.
- **22 Nov 2026, your 052 copied into the fix worktree (uncommitted):**
  migration byte-identical; its 10 api lines taken from your checkout's
  own diff, byte-identical, inserted after the token is signed as in your
  version. Local test: owner login sets `last_login_at`, staff login
  leaves it empty, both HTTP 200.

- **22 Nov 2026, AlpenGlow memory, read-only, 12 minutes (07:00 to 07:15
  CET, 72 samples, 0 restarts, 5.9 GB available at the end).** Container:
  ceiling now / peak / PROPOSED (at least 1.5x peak, min 128), MiB:
  realtime 384/218/336, auth 128/14/128, db 1024/135/256, edge-functions
  512/88/192, imgproxy 256/104/160, kong 512/318/480, meta 256/155/240,
  pooler 384/209/320, rest 384/63/128, storage 384/223/336, studio
  512/273/416. **Total now 4,736, proposed 2,992.** With PSS (4,608):
  7,600 of 7,941 MiB RAM, about 340 MiB left for the system, nginx and
  Docker (tight; db and edge-functions are the ones to raise for room).
  Waiting for your OK on the numbers and a quiet hour; nothing changed.
- **22 Nov 2026, found in my own change and fixed before any commit:**
  the cache helper `allBranches(db)` was shadowed by the request field
  `allBranches` in 6 report handlers (would have failed every
  all-branches report); renamed `getAllBranches`. Lesson: type-check
  after every change; the 28 checks do not cover get_revenue, referral
  stats, transactions, discounts (to be added in 2b-A/I).

- **22 Nov 2026, decisions (yours):** migration 052 is yours
  (`052_owner_last_login.sql`, uncommitted in
  `C:UserssrivaDesktopPSSperfect-study-space`; never edit,
  move, delete or commit there). It adds one empty column,
  `staff.last_login_at` (timestamptz, `IF NOT EXISTS`), nothing else;
  its rollback drops that column. The matching uncommitted `api` change
  (10 lines) writes the time into it after an owner's successful login,
  without changing the login's answer. Phase 1 checks whether the column
  exists on the cloud. Hardening migration renumbered to **053**.
  Memory option A: both stacks within RAM.
- **22 Nov 2026, PSS memory option A in the kit** (`e63f446`): functions
  2048m (3 CPUs, 8 workers, 512 MB each, CPU 15 s / 45 s unchanged), db
  1280m (shared_buffers 384MB, effective_cache_size 1GB unchanged), rest
  512m, kong 768m: **4,608 MiB**. Local re-run: 28/28 PASS, 0 supervisor
  cancels, 0 restarts.
- **22 Nov 2026, found and fixed in the kit:** after `docker compose
  restart rest functions` (used in Phase 3 step 2) the two containers
  swapped addresses and Kong kept sending REST traffic to the old one:
  502 on every REST call, so every function failed, until Kong's DNS
  answer expired or Kong restarted. `KONG_DNS_VALID_TTL: "10"`: the same
  restart, REST and login answered 200 after 1 s. (AlpenGlow's stack has
  the upstream Kong settings; not changed.)
- **22 Nov 2026, 2b-G proven locally:** before 053 every api query had
  an 8 s limit (the `authenticator` login role's; a 10 s query was
  cancelled at 8.03 s). 053 sets `service_role` to 30 s: a 10 s query
  ran to the end, a 35 s query was cancelled at 30 s; anon 3 s and
  authenticated 8 s unchanged; 053 runs twice without error.
  Autovacuum is on. pg_cron 1.6.4 is preloaded in the image.

- **22 Nov 2026, your OKs carried out:** kit step 1 committed + pushed
  (`924237f`); PSS fixes committed on `fix/pre-migration` with
  `.gitattributes` (`*.sh text eol=lf`) and pushed to
  `origin/fix/pre-migration` only (`1d2e6f9`; `origin/main` still
  `cb7beeb`).
- **22 Nov 2026, worker CPU limits + safe retry (kit `main/index.ts`):**
  `cpuTimeSoftLimitMs` / `cpuTimeHardLimitMs` from `.env`
  (`EDGE_WORKER_CPU_SOFT_MS` 15000, `EDGE_WORKER_CPU_HARD_MS` 45000); one
  retry on a new worker only for "failed to send request to user worker"
  / "worker has already retired" (never reached a worker), never for
  "user worker failed to respond".
- **22 Nov 2026, batched expiry alerts** (`bfe2cb1`, pushed to
  `fix/pre-migration`): `list_active_memberships` 3079 ms -> 376 ms at
  1,500 members; alerts end state identical to the old loop
  (`check.mjs --alerts`: 4540 rows, same md5, cases: no alert, two
  alerts, second expiring membership).
- **22 Nov 2026, 75% resource plan in the kit** (`1499d46`), defaults
  overridable in `.env`: functions 3 CPUs, 2560m, worker 512 MB, max 8
  workers, 30 s queue, CPU 15 s / 45 s; db 1536m, `shared_buffers` 384MB
  and `effective_cache_size` 1GB as `postgres -c` arguments (source
  "command line" in `pg_settings`; outranks the image's
  `postgresql.conf`, which sets both to 128MB); rest 512m,
  `PGRST_DB_POOL` 20; kong 768m; nginx `NGINX_RATE` 40r/s,
  `NGINX_BURST` 120 (read from the project's `.env` by `add-project.sh`).
  Local rehearsal with these values: **28/28 checks PASS, 0 supervisor
  cancels, 0 CPU hard-limit hits, 0 restarts**; longest internal URL
  5.9 KB. Server load test still to do (Phase 2).
- **22 Nov 2026, memory ceilings (read-only, nothing changed):**
  AlpenGlow's containers on the server add up to 4,736 MiB (db 1024,
  edge-functions/kong/studio 512, realtime/pooler/rest/storage 384,
  meta/imgproxy 256, auth 128; no CPU caps). PSS at the new defaults:
  5,376 MiB. Together 10,112 MiB: above the 7,941 MiB RAM by about
  2.2 GB, and above RAM + swap (9,988 MiB). Real use now about 2 GB.
  Your decision.
- **22 Nov 2026, PSS Sitting 3, start.** Read-only check of the new server
  (05:48 CET): AlpenGlow healthy, 11 containers up 7 days, health state
  clean (last event RECOVERED 4 Nov), last backup 21 Nov 22:30, 5.9 GB
  memory free, load 1.5 to 2.3 (fail2ban, nginx, node; no container over
  10% CPU), `supabase-auth` 2 restarts since 14 Nov. No PSS stack yet.
  `/etc/nginx/conf.d/00-ratelimit.conf` has `limit_req_status 429;`
  (step 1 item 8 confirmed).
- **22 Nov 2026, found:** the PSS laptop checkout (`perfect-study-space`,
  on `main`) has uncommitted work from 14 Nov: an owner "last login"
  timestamp in `api` (10 lines) and an untracked migration
  `052_owner_last_login.sql` (+ `supabase/rollback/`). Not on
  `origin/main`. Phase 1 step 5 must show whether the cloud runs it.
  Left untouched.
- **22 Nov 2026, security note:** the PSS cloud database password was
  pasted into the chat. Not used, not stored. Change it in the Supabase
  dashboard after the final dump (Sitting 4). The `api` function does not
  use the database password (only `SUPABASE_URL`, the service-role key,
  `STAFF_JWT_SECRET`/`JWT_SECRET`, `PUBLIC_SITE_KEY`), so changing it does
  not affect the live site.
- **22 Nov 2026, step 1 (kit) written, uncommitted:**
  `stack-template/docker-compose.yml` (db `start_period: 120s`; Kong
  `KONG_NGINX_PROXY_LARGE_CLIENT_HEADER_BUFFERS "4 64k"`; functions
  `mem_limit` 1024m, `cpus: 2`, `--policy per_worker --max-parallelism 4
  --request-wait-timeout 30000`, `DENO_DIR` on the `deno-cache` volume),
  same defaults in `.env.example` and `add-project.sh`; `add-project.sh`
  optional 4th argument (keep-warm function) and nginx roll-back when
  `nginx -t` fails; nginx template 404 for `/functions/v1/main` and
  `/_shared`; `healthcheck.sh` restart/OOM alerts, keep-warm call,
  `--status`; `security-test.sh` parallel burst (200, 50 at a time);
  `pss/vps-deploy.sh` step 0 pre-check (stack, router, 001-051 recorded,
  both secrets set). New `pss/local-test/` (setup-local.sh, seed.sql,
  check.mjs). All scripts pass `bash -n`.
- **22 Nov 2026, step 2 (app fixes) written, uncommitted, branch
  `fix/pre-migration`:** `create_staff` accepts only staff/owner/admin and
  only an admin may create an admin; new helpers `allRows` (paged) and
  `allRowsIn` (ids in chunks of 150, about 6 KB per URL, each chunk
  paged) used in 36 queries (all-branches students/memberships/lockers,
  dashboard due/expired, recent activity, combined pending, actionable
  items, open sessions and their 5 lookups, active memberships and their
  cashback/overtime lookups, daily report x4, top students, cashbacks,
  food bills, alerts, enquiries, 4 task lists + completions,
  fix_membership_dates, negative food passes); `jose@5` pinned to
  `jose@5.10.0` (what `@5` resolves to, the last 5.x); `deploy/vps-deploy.sh`
  added. Type check: 2 errors, both pre-existing (`main` has 17).
- **22 Nov 2026, local test (dummy data, 1,500 students over 3
  branches, laptop only):** 28 list checks against the database: fixed
  `api` exact on 27, the original stops at 1000 on every growing list
  (e.g. students 1000 of 1500, open sessions 1000 of 1150, recent
  sessions 1000 of 5783, enquiries 1000 of 3500, unbilled overtime
  Rs 8,940 of 13,000, missed tasks 50 of 55). `create_staff`: original
  lets an owner create an admin (200, row created); fixed 403, no row;
  admin creating admin 200; unknown role 400. Branch isolation PASS.
  Longest internal REST URL: fixed 5.9 KB (0 over 8 KB), original
  38.2 KB (25 over 8 KB). Kit settings verified in the running container;
  module cache survives a container re-create (first call 0.34 s, 0
  downloads). Re-run: `pss/local-test/check.mjs`.
- **22 Nov 2026, found in the local test (not yet fixed):** 1 of 28
  checks got HTTP 500 "request has been cancelled by supervisor". Cause in
  the functions log: "CPU time soft limit reached" x9, "hard limit
  reached" x1 (0 restarts, no OOM). With `per_worker`, a worker's CPU
  budget adds up over all its requests; the router sets no CPU limits,
  so the runtime defaults apply. The fixed reports do more CPU work
  (they read all rows), so they hit it sooner. Proposal waiting for your
  decision. Also: `list_active_memberships` takes about 3 s in both
  versions with 1,500 members (it upserts an alert one by one for every
  member expiring within 7 days); relevant to rehearsal test b.

- **26 Oct 2026** Migration kit built and rehearsed end to end in a sandbox
  (commit `e6ce4aa`, see `README.md`).
- **26 Oct 2026** Old server checked: healthy; 27 `leads`, 72 `trip_leads`,
  11 migrations applied. Certificates valid until 17 Dec (`api`) and 24 Dec
  (`travel`). `certbot.timer` active (last run 13:14 CET, next 00:04 CET).
- **26 Oct 2026** Readiness checks, all read-only, all passed:
  - SSH key `~/.ssh/id_ed25519` present (ed25519); `ssh deploy@169.58.43.191
    "echo ok"` answers `ok`.
  - Git Bash available (bash 5.2.37) for the `.sh` scripts.
  - Snapshot `vps-migration-backup/2026-10-05_1803` present; `SHA256SUMS`
    PASS (24 files, 0 failed); `host/root-only.SECRET.tar.gz` and
    `db/exact-row-counts.txt` present.
  - PSS repo `C:\Users\sriva\Desktop\PSS\perfect-study-space` reachable, on
    `main`, 51 migrations (001 to 051). `pss/frontend-csp.patch` passes
    `git apply --check` there. The only uncommitted files are
    `.claude-flow/` tool folders.
  - Claude runs on the laptop that has the SSH key (remote control), so it
    can run the steps itself.
- **26 Oct 2026** This file created; billing-app decision recorded in
  `INPUTS-NEEDED.md`; session rule added to `CLAUDE.md`.
- **26 Oct 2026** Stop hook `progress-hook.sh` added (commit `4a3262e`): a
  reply cannot finish while this file is uncommitted or unpushed. Takes
  effect in a fresh session.
- **26 Oct 2026** Git pushes from this laptop go out as `SriVaibhav14` in
  every repo (AlpenGlow's remote no longer names `alpenglowtt-dot`); a plain
  `git push` works.
- **26 Oct 2026** PSS local `main` pulled: equal to GitHub `main`
  (`cb7beeb`).
- **26 Oct 2026** Read-only check of the old server against the 5 Oct
  snapshot (`2026-10-05_1803`): **nothing changed.**
  - All 48 compared files identical (sha256): the 13 deployed function
    files (`backend/volumes/functions`), the 12 function files and 11
    migrations in `repo/`, all 10 `docker-compose*.yml` files (incl.
    `override`), `kong.yml` and `kong-entrypoint.sh`.
  - `.env`: the same 83 key names; none added, none removed, no value
    changed (compared by hash, names only).
  - `_migrations_applied` in the live database: the same 11 rows (001 to
    011) as the snapshot.
  - This laptop's repo matches what is deployed: 11 migrations, the 12
    function files identical, no commits touching `supabase/` since 5 Oct.
  - So the 5 Oct snapshot is still a faithful copy of the live backend.
- **26 Oct 2026** Reachability of `169.58.43.191` from this laptop
  (`Test-NetConnection`), unchanged from the 7 Oct audit:
  - Open: 22, 80, 443, and 8000, 8443 (Kong, bypassing nginx: known; the
    new server's firewall unit closes them).
  - Closed: 5432, 6543 (the `DOCKER-USER` drop rules still work).
  - `https://api.alpenglowglobal.com/`, `/project/default` and
    `/auth/v1/settings` all answer 401: Studio's password prompt and Auth
    are reachable from the internet (known FAILs; the new server's nginx
    site file returns 404 for them).
- **26 Oct 2026** Old server sudo checks (output pasted by you), plus
  read-only checks without sudo:
  - `PasswordAuthentication yes`: **password SSH login is ON** (the
    `50-cloud-init.conf` drop-in wins, as the runbook suspected).
  - "Accepted password": **no SSH password login** in any of the five
    `auth.log*` files. The count of 1 was our own check: sudo logs each
    command line, and the `zgrep "Accepted password"` command contains that
    text. The matching lines are all `sudo:` entries from today's checks.
  - **2616 "Failed password" attempts** in the current `auth.log`: bots
    guess passwords all the time because password login is on. None
    succeeded.
  - fail2ban works: `backend = systemd`, the SSH filter matches
    `_COMM=sshd`, version `1.0.2-3ubuntu0.1`. It restarted at 15:02 CET
    after the upgrade below; in its first 27 s it caught 3 failures, and 4
    bans were restored.
  - **ufw is not installed.** It was removed on 19 Jul 2026 as a side effect
    of `apt-get install -y iptables-persistent` (the two packages conflict);
    only `/etc/ufw` config files remain. The saved ruleset
    (`/etc/iptables/rules.v4`, 7 Oct copy) has INPUT policy `ACCEPT` and
    empty ufw chains, and is reloaded at every boot (last boot 18 Oct). So
    there is no host firewall; only the `DOCKER-USER` drops filter.
    Listening on public interfaces: exactly 22, 80, 443, 5432, 6543, 8000,
    8443, so today's exposure is what was tested. The runbook's description
    of the old server ("ufw (SSH, 80, 443)") is out of date.
  - `DOCKER-USER`: `DROP` for 6543 and 5432 on `eth0`, as in the runbook.
  - fail2ban active and enabled.
  - Kit checked: `01-base-setup.sh` installs and enables ufw and does not
    install iptables-persistent, so this cannot happen on the new server.
- **26 Oct 2026** Found in the old server's apt log: `apt upgrade -y` run
  as `deploy` today, 14:58:55 to 15:01:24 CET (not by Claude). Docker
  Engine 29.6.2 to 29.9.2, containerd 2.2.6 to 2.4.2, Compose plugin 5.3.1
  to 5.6.1, buildx, cloud-init, apparmor, snapd and about 45 other Ubuntu
  updates. Docker restarted at 15:02:23 CET (forms down for about 1 to 2
  minutes). Afterwards all 11 Supabase containers and the 3 travel-app
  containers were `healthy`/`Up`, the API answered through nginx as before,
  and no reboot was required. The backend files, `.env` and migrations are
  untouched (step 1 above), and the container images are pinned, so the
  snapshot is still valid. **Confirmed by you: you ran this upgrade
  yourself.**
- **26 Oct 2026** sshd layout on the old server (read-only):
  `sshd_config` includes `sshd_config.d/*.conf` on line 12, before its own
  `PasswordAuthentication no`; drop-ins load alphabetically and the first
  value wins, so `50-cloud-init.conf` (not readable by `deploy`) turns
  password login on. A `00-hardening.conf` sorts first and wins.
  `PermitRootLogin no` is set in `sshd_config`. `ssh.service` and
  `ssh.socket` are both active. `deploy` has 2 authorized keys.
- **26 Oct 2026** Old server hardening step 1: you changed the `deploy`
  password (`passwd`: "password updated successfully"). `sudo` there now
  uses the new password.
- **26 Oct 2026** Your note: at 15:05 CET you started `do-release-upgrade`
  on the old server and aborted it at the Continue prompt. Nothing was
  installed. It had left a recovery sshd on port 1022 (PID 8035) and its
  `screen` session (PID 7612); both had exited by the time you checked: no
  upgrader process, port 1022 closed, `dpkg --audit` clean.
  Read-only check afterwards: still Ubuntu 24.04.5 LTS (noble); no upgrader
  or `screen` process; nothing listens on 1022; `ubuntu.sources` restored
  to `noble`, `noble-updates`, `noble-backports`, `noble-security`.
  **Leftover:** the upgrader renamed the Docker apt source to
  `/etc/apt/sources.list.d/docker.list.disabled` (15:03) and did not
  restore it, so the Docker repository is off. The file still points to
  `download.docker.com/linux/ubuntu noble stable`. Docker itself is on
  29.9.2 from today's upgrade, but later `apt upgrade` runs will not update
  Docker or containerd until it is renamed back. Also left:
  `/etc/apt/sources.list.disabled` (comments only, harmless).
- **26 Oct 2026** Old server hardening step 2a (run by you, 15:22 CET):
  `/etc/ssh/sshd_config.d/00-hardening.conf` written (root, 644, 129
  bytes: a comment, `PasswordAuthentication no`,
  `KbdInteractiveAuthentication no`). `sshd -t`: config valid. `sshd -T`
  shows the values that apply after a reload: `passwordauthentication no`,
  `kbdinteractiveauthentication no`, `pubkeyauthentication yes`,
  `permitrootlogin no`. Not live until `ssh` is reloaded (2b).
- **26 Oct 2026** Old server hardening step 2b (run by you): `systemctl
  reload ssh` finished at 15:25:42 CET (`ssh.service` active, same
  listener PID). Nothing listens on port 1022. **Password SSH login is
  off:** the server now offers only `publickey` (a BatchMode login with
  password methods gets `Permission denied (publickey)`). Key login works
  after the reload (Claude's key logins at 15:26:35 and 15:27:01). Your
  first test run was before the reload took effect (key test 15:25:07,
  password test 15:25:28, so that password login still got in under the
  old settings). No undo needed.
- **26 Oct 2026** Your repeat of the tests in a new PowerShell window,
  after the reload: key login prints `key-login-ok`; a password-only login
  gets `Permission denied (publickey)` with no password prompt. **Old
  server hardening done.**
- **2 Nov 2026** New Contabo server created by you: `84.247.184.195`.
- **2 Nov 2026** PSS live project `ozatixapvxwrwbpdxuzt`, read-only checks
  (`supabase db query --linked` from a scratch folder, deleted afterwards;
  catalog and counts only, no rows read):
  - `overtime_sessions`: **row security is ON** (0 policies, not forced),
    so the public key can neither read nor change it despite its broad
    grants. Switched on outside the migrations (probably in the dashboard);
    the PSS move restores the live database, so this comes along. No
    migration needed.
  - All 34 public tables have row security. (The plan says 35 tables;
    compare in PSS Phase 1.)
  - Storage: **0 buckets, 0 files**. The `student-photos` bucket no longer
    exists, so no ID photos are exposed and nothing needs moving.
  - Your Supabase CLI login (`npx supabase login`) is set up on this
    laptop.
- **2 Nov 2026** New server checked read-only before setup: Ubuntu 24.04.5,
  x86_64, 4 vCPU, 7.8 GB RAM, 96 GB disk, interface `eth0`, timezone
  `Europe/Berlin`. Host key ED25519
  `SHA256:/fmu+gs1TqeGtQmlz1bbuVVQg3Gzcht7t4eazrtoCAs`. Before setup it had
  password and root login on (cloud-init default).
- **2 Nov 2026** Fresh snapshot `2026-11-02_2030` pulled (read-only on the
  old server, 4.9 MB, integrity OK). Public row counts: `leads` 29,
  `trip_leads` 72, `lead_activities` 24, `packages` 6, `destinations` 4,
  `blog_posts` 3, `offers` 3, `package_pages` 1, `_migrations_applied` 11,
  `follow_ups` 0, `otp_verifications` 0. Certificates still come from
  `2026-10-05_1803/host/root-only.SECRET.tar.gz` (not re-fetched by
  `pull-backup.sh`; unchanged until certbot renews around 17 Nov).
- **2 Nov 2026** Phase 1 on the new server: `01-base-setup.sh` run as root.
  First run stopped at the `deploy` key step (bug: a missing
  `authorized_keys` file failed the pipe under `set -e`); fixed in the kit
  (`|| true` per file) and re-run: exit 0. Checked: `deploy` key login
  works (laptop key only, your decision; the old server's second key
  `batore-vps` was NOT copied); password-only login gets `Permission denied
  (publickey)`; `sshd -T`: `passwordauthentication no`, `permitrootlogin
  without-password`; ufw active (22, 80, 443 only); `DOCKER-USER` drops
  5432, 6543, 8000, 8443 on `eth0`; fail2ban, docker, nginx 1.24.0,
  unattended-upgrades active; Docker 29.9.2; 2 GB swap; ops scripts in
  `~/ops` (crontab not installed yet); backup passphrase created on the
  server (not yet copied off). No reboot pending.
- **2 Nov 2026** Phase 2 (rehearsal) on the new server, snapshot
  `2026-11-02_2030`:
  - Copied to `~deploy/snapshot` (mode 700/600) only what Phase 2 needs:
    backend archive, public dump, row counts, and the certificate archive
    from `2026-10-05_1803`; checksums verified. No travel-app or billing
    files on the new server.
  - `.env` mode 600; also set 600 on `.env.bak.*`, `.env.old`,
    `.env.example` (were 664). Original kept as `.env.from-old-server`.
    Auth sign-up switched off (`DISABLE_SIGNUP=true`, email/phone sign-up
    and phone autoconfirm false).
  - All 11 containers healthy on the pinned images, including the pooler.
    Memory caps on (`docker-compose.limits.yml` in `COMPOSE_FILE`); Kong 2
    workers, 132 MB of 512 MB.
  - `restore-public.sh`: only the expected noise (12 + 1); public-role
    permissions match the runbook table exactly (`leads`,
    `lead_activities`, `follow_ups`, `otp_verifications` none;
    `trip_leads` `anon=arw`; CMS tables and `_migrations_applied` full).
    Migration 008 re-run. COUNTS MATCH (all 11 public tables);
    `otp-24h-cleanup` hourly, active; 23 policies; 4 functions; 10 tables
    with row security (`_migrations_applied` has none: fix 2).
  - Certificates restored (`api` valid to 17 Dec 2026; the `travel`
    certificate came along in the archive, unused). Kit site file
    installed, default site removed, `nginx -t` OK.
  - From the laptop via `--resolve`: `rest/v1/packages` 200 (6 rows),
    `/`, `/project/default`, `/auth/v1/settings`, `/storage/v1/status` 404,
    `leads` refused to the public key, `submit-lead` CORS preflight 200.
- **2 Nov 2026** Phase 2b on the new server: first backup by hand ended
  `ok` (156 KB, `~/backups/2026-11-02_1633`, local only: no
  `RCLONE_REMOTE` yet); health check by hand: all checks pass, nothing
  emailed; `crontab ~/ops/crontab.deploy` installed (backup 22:30, health
  every 5 min, Sunday cache prune, monthly log trim), cron active. The
  backup passphrase is still only on the server: you copy it off with
  `scp` (command given in chat) and into your password manager.
- **2 Nov 2026** "Audit before cutover" on the new server (DNS unchanged):
  - `security-test.sh … 84.247.184.195 --burst` from the laptop: PASS for
    the 4 locked lead tables, the 5 CMS reads, all 9 blocked paths (404),
    ports 5432/6543/8000/8443/3000 closed, TLS 1.0/1.1 refused, certificate
    valid. FAIL only for `trip_leads` (72 rows) and `_migrations_applied`
    (11 rows): expected until fixes 1 and 2. Its rate-limit row also said
    FAIL, but only because the script sends the 200 requests one by one and
    from Git Bash on Windows each takes ~1.5 s (5 min in total), far below
    20 r/s. Re-tested with one parallel curl (200 requests, 50 at a time,
    13 s): 100 answered 429. Rate limiting works. (The other 100 got 500:
    the edge runtime's normal answer for a function that does not exist.)
  - On the server: `sshd -T` password and keyboard-interactive `no`, root
    key-only; mode 600 on every `.env*`, `ops.env`, `backup.passphrase`;
    `DOCKER-USER` drop rule present; all 11 containers 0 restarts, none
    OOM-killed (Kong 2 workers inside its 512 MB cap).
  - Restore test: tonight's `public.sql.gz` into a scratch database: only
    the expected noise, counts match, 23 policies; scratch database
    dropped.
  - Alert test: `supabase-meta` stopped on purpose, health check emailed
    PROBLEM to the agency address; started again, RECOVERED emailed. Resend
    accepted both (inbox arrival still to be confirmed by you).
  - Reboot test (21:36 laptop time): back within about a minute; docker,
    `docker-user-firewall`, nginx, fail2ban, ufw, cron,
    unattended-upgrades active; `DOCKER-USER` rule re-applied; swap on;
    crontab intact; all 11 containers healthy, Kong 0 restarts. From the
    laptop afterwards: `packages` 200, `/` 404, 5432/6543/8000/8443
    closed.
- **2 Nov 2026** Your decisions after step 1, carried out:
  - `certbot delete --cert-name travel.alpenglowglobal.com` on the NEW
    server only: its certificate, archive and renewal config are gone; only
    `api.alpenglowglobal.com` remains (valid to 17 Dec), `nginx -t` OK. The
    old server was not touched.
  - `batore-vps` key: not needed; the new server's `deploy` keeps the
    laptop key only.
  - Backup passphrase: replaced by you on the new server and kept in your
    password manager. Checked (without reading it): still owned by
    `deploy`, mode 600. The first backup (`2026-11-02_1633`) was local
    only and never encrypted with the old passphrase, so nothing depends on
    it.
- **2 Nov 2026** Pre-cutover checks for the switch-over (all read-only):
  - `api` A record: TTL 300 (Auto, DNS only; checked by you today and
    confirmed via 1.1.1.1), still `169.58.43.191`; zone on Cloudflare.
  - No backend deployed to the old server since the rehearsal (your
    statement), confirmed: all 62 backend files on the old server (13
    deployed function files, `repo/` functions and 11 migrations,
    `config.toml`, the 10 compose files, Kong and envoy config) identical
    (sha256) to snapshot `2026-11-02_2030`; live `_migrations_applied` 11
    rows. Nothing to re-deploy on the new server.
  - New server: all 11 containers healthy, disk 14% used, `packages` 200
    via `--resolve`.
- **2 Nov 2026** Old server outage, not caused by us: unreachable from
  about 21:56 to 22:08 laptop time (ports 22, 80, 443 timed out from the
  laptop and from the new server). It rebooted at 17:38:12 CET (22:08
  laptop time). Unclean: `last -x` shows the reboot but no shutdown, and
  the previous boot's journal (as `deploy` can see it) ends at 17:25:43
  CET. So a crash or a hard reset on Contabo's side; the kernel log needs
  sudo (`sudo journalctl -b -1 -p warning -n 50`). Afterwards all 14
  containers up (11 Supabase healthy, billing app too). The `deploy` logins
  from `117.98.171.83` are this laptop.
- **2 Nov 2026** Phase 3 step 2: Kong stopped on the old server at
  22:17:59 laptop time (your OK); public API answers 502 from nginx.
- **2 Nov 2026** Phase 3 step 3: final `pull-backup.sh` OK, snapshot
  `2026-11-02_2218` (4.9 MB, integrity OK). Public counts identical to
  20:30 (`leads` 29, `trip_leads` 72, `lead_activities` 24, migrations 11):
  no lead lost to the outage. Ran the folder's own (older) copy of
  `pull-backup.sh`: same dump commands, writes next to itself, no
  inside-git guard. Public dump and row counts copied to
  `~/snapshot-final/db` on the new server (mode 700/600), sha256 equal on
  both ends.
- **2 Nov 2026** Phase 3 step 4 on the new server: `docker compose down`;
  rehearsal database `volumes/db/data` (69 MB) wiped as root; `compose up`
  with the limits file; all 11 healthy after about 1 minute.
  `restore-public.sh` with `~/snapshot-final/db`: only the expected noise
  (12 + 1); permissions exactly the runbook table. Migration 008 re-run
  (exit 0); rest and functions restarted. COUNTS MATCH against
  `2026-11-02_2218` (all 11 public tables); `otp-24h-cleanup` hourly,
  active; 23 policies; 10 tables with row security; 11/11 healthy. Via
  `--resolve`: `packages` 200 (6 rows), `leads` refused to the public key
  (401), `submit-lead` preflight 200, `/` 404. (First attempt piped the
  whole block into `bash -s`: the restore's `docker exec -i` read the rest
  of the script from stdin, so 008 and the restart did not run; run again
  on their own.)
- **2 Nov 2026** Phase 3 step 5: you changed the `api` A record in
  Cloudflare to `84.247.184.195` (DNS only). At 22:28:56 laptop time
  1.1.1.1, 8.8.8.8, Cloudflare's own nameserver and the laptop all answer
  the new IP (TTL 300).
- **2 Nov 2026** Phase 4, automated part, over real DNS:
  `security-test.sh` (no `--burst`; rate limit already proven) 2 FAIL,
  0 WARN, the same as the audit: only `trip_leads` (72) and
  `_migrations_applied` (11), fixes 1 and 2; all other rows PASS, ports
  5432, 6543, 8000, 8443, 3000 closed. `certbot renew --dry-run`: all
  simulated renewals succeeded (it waits a random ~6 min when run without
  a terminal). Functions logs: no errors in the last 50 lines.
  `healthcheck.sh`: all checks pass, now against the new server itself.
- **2 Nov 2026** Phase 4, your browser tests ("all working"), checked in
  the new server's database, Kong and nginx logs since the cutover (17:58
  CET): 2 new `leads` (`site_popup`, 18:04 and 18:05 CET), `submit-lead`,
  email OTP send and verify, and ONE `send-sms-otp` and `verify-sms-otp`,
  all 200, no function errors. NOT seen on the new server: any
  `trip_leads` write or `trip_planner` lead, any `crm` call (dashboard),
  any `chat-compass` call (Compass), a second WhatsApp number. Probably
  run before 22:28 or from a browser still caching the old IP (old Kong
  stopped, so 502; the trip planner swallows save errors). Re-test asked.
- **2 Nov 2026** Phase 5 (your OK: apply, commit, push): old IP replaced
  by `84.247.184.195` in `deploy/vps-deploy.sh` (lines 15 and 20,
  `VPS_HOST`), `scripts/setup-new-laptop.sh` (line 34, message) and the
  kit's `pull-backup.sh` default (line 15); `bash -n` OK. The older
  `pull-backup.sh` copy in `vps-migration-backup` replaced by the kit's
  (your OK). Left on purpose: the old IP in `README.md`,
  `INPUTS-NEEDED.md`, this file and the runbook (history). The last
  old-server snapshot (Phase 6) needs `VPS_HOST=deploy@169.58.43.191`.
  `ssh-keygen -R 169.58.43.191` only after the old server is cancelled.
- **2 Nov 2026** Phase 4 re-test (you asked Claude to do it), seen in the
  new server's database and Kong log. Your own re-run from 18:19 CET:
  trip planner submitted (step 9, `trip_planner` lead 18:19:50), Compass
  (`compass_bot` lead 18:20:20, `chat-compass` 200), dashboard (6 `crm`
  200), email OTP and WhatsApp OTP sent and verified. Claude, from a fresh
  Playwright browser on `https://alpenglowglobal.com`: trip planner step 1
  saved (`POST trip_leads` 201, row 18:25:06 CET, `beach`, `in_progress`,
  a test row left in the table); `chat-compass` 200 in 2.7 s with a real
  Groq answer. Both WhatsApp OTPs since the cutover went to +91 numbers:
  **a non-Indian number is still untested** (same code path, same keys
  and template; only the number normalization differs). Post-cutover
  totals: `leads` 33, `trip_leads` 74. Earlier "missing" tests were simply
  run after Claude's first look at the logs.
- **2 Nov 2026** Your decisions after the switch-over, carried out:
  - Old Kong stays stopped (billing app retired; no stale-DNS writes to
    the old server). Start it only for a rollback.
  - Claude's test row deleted on the new server (your OK): exactly 1 row
    in `trip_leads` (18:25:06 CET, `beach`, `in_progress`, step 1), in a
    guarded transaction; `trip_leads` now 73.
  - Security fixes 1, 2, 3: not tonight, in a fresh session.
  - Old server untouched for the rollback window.
  - Local `.playwright-mcp/` test snapshots (never committed) deleted.
- **3 Nov 2026** Security fixes, setup (no server change):
  - Your main folder `AlpenGlow work` (on `main`): no uncommitted changes
    to `trip-planner.js`, `supabase/`, `vps-deploy.sh` or
    `setup-new-laptop.sh` (only `graphify-out/` files). Not modified.
  - Worktree `AlpenGlow-security` on new branch `claude/security-fixes`
    from `origin/main` (`d083663`); its upstream removed so a plain
    `git push` cannot go to `main`.
  - Phase 5 IP change applied there to `deploy/vps-deploy.sh` and
    `scripts/setup-new-laptop.sh` only (same base blobs as `dd62a4c`;
    `bash -n` OK; old IP gone), local commit `3b82503`, not pushed.
  - Parity proof before any deploy (read-only): worktree
    `supabase/functions` (12 files) identical to the server's
    `repo/functions` and live `volumes/functions` (excluding `main`), and
    `supabase/migrations` (11 files) identical to `repo/migrations`,
    comparing content with line endings ignored; the 11 local `.sql`
    names equal the 11 `_migrations_applied` rows. (Raw bytes differ only
    by CRLF: the Windows checkout has `core.autocrlf=true`; the server
    already holds 6 CRLF files from earlier deploys.) A deploy from the
    worktree removes no function and re-runs no migration.
  - Fix 3 evidence: the only Supabase client in the frontend is
    `trip-planner.js` (`trip_leads` only); `api.js`, `compass.html`,
    `dashboard.html` only call edge functions (`submit-lead`,
    `chat-compass`, `crm`, `send-lead-email`); `dev.html` writes local
    files via `writeJSON`. No edge function uses the 5 CMS tables or
    `_migrations_applied`.
  - Server catalog (read-only): the 5 CMS tables have row security on,
    full grants to `anon` and `authenticated`, and 15 anon write policies
    (insert/update/delete per table, all `true`); `_migrations_applied`
    has no row security and full grants. `postgres` (owner, used by
    `vps-deploy.sh`) and `service_role` have BYPASSRLS, so neither is
    affected by the fixes.
- **3 Nov 2026** Fixes 2 and 3 deployed to the new server (your OK),
  commit `c6121c3` on `claude/security-fixes` (not pushed):
  - `012_lock_migrations_table.sql`: row security on
    `_migrations_applied`, all public roles revoked. `vps-deploy.sh` now
    applies the same two statements on every run (fresh servers locked
    from the start).
  - `013_lock_cms_writes.sql`: every public write policy dropped on the 5
    CMS tables (15) and write privileges revoked from `anon`,
    `authenticated`, `PUBLIC`; reads kept; a guard aborts if any table
    loses its anon read policy.
  - Dry run first (each file with `ROLLBACK`): both exit 0, nothing kept.
    Then `vps-deploy.sh` from the worktree: 012 and 013 applied, no
    function removed, functions restarted. `_migrations_applied` 13 rows.
  - Catalog after: `_migrations_applied` row security on, no public
    grants; each CMS table only `SELECT` for `anon`/`authenticated` and
    its one read policy.
  - `security-test.sh` (real DNS): 1 FAIL, 0 WARN: only `trip_leads`
    (73 rows, fix 1). `_migrations_applied` now PASS (401).
  - Write probes with the public key on the CMS tables (filter
    `id IS NULL`, matches no row): PATCH and DELETE 401 on all 5; reads
    200. `_migrations_applied` read and DELETE 401. (A PATCH with an empty
    `{}` body answers 204 because PostgREST skips it without asking the
    database; re-probed with a real column.)
  - `healthcheck.sh` exit 0; all containers healthy; 0 error lines in the
    functions log (10 min).
  - Live site in a fresh browser: homepage 6 package cards, 5
    destinations, 3 offers, 0 console errors; `packages/bali` renders
    (title, overview, cities, inclusions, 12 images), 0 console errors.
    Browser snapshot files deleted.
- **3 Nov 2026** Fix 1a deployed (your OK), commit `9cfc131` on
  `claude/security-fixes` (not pushed): new edge function
  `save-trip-lead`. Service role only inside the function; POST/OPTIONS;
  `ALLOWED_ORIGINS` CORS like `submit-lead` plus 403 for a present but
  disallowed Origin; rate limit = nginx `alpenglow_api` (20 r/s per IP,
  burst 60), the same as `submit-lead` (your decision: no server config
  change; `_shared/ratelimit.ts` is OTP-only and not used by
  `submit-lead`). Every field validated against the planner's real values
  (400 otherwise), unknown fields ignored; writes only `trip_leads` by
  `session_id` (lowercase v4 UUID); a `submitted` row is never changed
  (guarded UPDATE, 409); `created_at` never written; answers only
  `{ok:true}` or `{error}`. `trip_leads` permissions unchanged.
  - Checks first: `ALLOWED_ORIGINS` (in `.env` and in the running
    container) = `alpenglowglobal.com`, `www.alpenglowglobal.com`,
    `alpenglow-global.pages.dev` (https). The live site serves only
    `https://alpenglowglobal.com` (http redirects there); `www` answers
    Cloudflare 522 (not served at all). Session ids: only `_uuid()` sets
    `tp_sid`; `crypto.randomUUID()` and the fallback both give lowercase
    v4; generator unchanged since `d2b0b69` (27 Jun); all 73 existing
    `trip_leads` session ids match `SESSION_RE`. So `SESSION_RE` stays
    strict.
  - `vps-deploy.sh`: no migration, no function removed. Curl tests (one
    made-up row): preflight 200 with the site origin; valid saves 200
    `{"ok":true}`; 6 bad fields 400, GET 405; wrong origin 403 (preflight
    still names the site); submit 200, then an `in_progress` save and a
    changed re-submit both 409; row stayed `submitted`, step 9, test name,
    `created_at` unchanged. Test row deleted (exactly 1, guarded);
    `trip_leads` 73. Functions log 0 errors; all containers healthy.
- **3 Nov 2026** Fix 1b committed (your OK), `8b1b269` on
  `claude/security-fixes` (not pushed): `trip-planner.js` saves progress
  and the final submit through `save-trip-lead` (fetch); the Supabase
  browser client and every direct `trip_leads` call removed; after the
  submitted save (or a 409 `already_submitted` retry) the lead still goes
  through `submit-lead` as before; budget outside 1..1e9 sent as empty;
  name input `maxlength` 100. `node --check` OK.
  - Pre-merge browser test (your OK): live `https://alpenglowglobal.com`
    in a fresh browser with the worktree's `trip-planner.js` served in
    place of the deployed one; steps 1 to 8, no contact data, no submit.
    8 POSTs to `save-trip-lead`, all 200; no request to `trip_leads`,
    `rest/v1` or `submit-lead`. Row: `in_progress`, step 8, all 8 answers
    present, no contact fields. Deleted (exactly 1, guarded);
    `trip_leads` 73. No browser files left.
  - `git diff --stat main...claude/security-fixes`: 6 files (+335/-31):
    `trip-planner.js`, `vps-deploy.sh`, `setup-new-laptop.sh`,
    `save-trip-lead/index.ts`, migrations 012 and 013. Nothing from
    `deploy/server-migration/`, `CLAUDE.md` or `.claude/`. `main` =
    `origin/main` = `d083663` = merge base, so `main` can fast-forward.
  - Your rules for c and d: you do the final submit yourself after the
    Cloudflare deploy; fix 1d waits at least 1 hour after that deploy.
- **3 Nov 2026** Fix 1c, push (your OK): `git push origin
  claude/security-fixes:main` from the worktree at 02:21:03 IST,
  fast-forward `d083663..8b1b269`, no force. Your `AlpenGlow work`
  folder was not touched (its local `main` is now 4 behind; `git pull`
  there when you like; the 4 commits do not touch `graphify-out/`).
- **3 Nov 2026** Cloudflare Pages serves the new `trip-planner.js` from
  02:21:42 IST (contains `save-trip-lead`, no direct `trip_leads` call).
  Baseline at 02:22 IST: `trip_leads` 73 (29 submitted), `leads` 33 (8
  from `trip_planner`). **Cache:** `trip-planner.js` is served with
  `Cache-Control: max-age=14400` (4 h) and the script tag has no version
  (`index.html` itself is `max-age=0`). A browser that loaded the old file
  before 02:21 may keep it until about 06:22 IST; after fix 1d such a
  copy would fail the final submit (alert, and the lead would not reach
  `leads`). So 1d is safe from 06:22 IST (your rule of at least 1 hour
  would allow 03:22).
- **3 Nov 2026** Fix 1c confirmed with your own final submit (02:27:36 to
  02:28:15 IST), counts only: 1 new `trip_leads` row, `submitted`, step 9,
  name/phone/email present; 1 new `trip_planner` lead via `submit-lead`;
  SMS and email OTP send and verify through functions. Totals:
  `trip_leads` 74 (30 submitted), `leads` 34. Kong since the deploy: 10
  POST `save-trip-lead` from the browser side; the 2 POST and 11 PATCH on
  `/rest/v1/trip_leads` all came from the edge-functions container
  (`SUPABASE_URL=http://kong`, matched by hashed container address), i.e.
  `save-trip-lead` itself as service role: 10 guarded updates, 1 insert,
  plus 1 save that raced the first insert and took the built-in retry
  path (insert conflict, guarded update). No browser wrote `trip_leads`
  directly. Functions log 0 errors.
- **3 Nov 2026** Fix 1d prepared: `014_trip_leads_service_only.sql` in
  the worktree (not committed): drops every policy on `trip_leads`, keeps
  row security on and forced, revokes all from `anon`, `authenticated`,
  `PUBLIC`; a guard aborts unless no policies remain, the public roles
  have no privilege and `service_role` still has SELECT/INSERT/UPDATE.
  Dry run on the server (02:3x IST, `ROLLBACK`): exit 0; inside the
  transaction `anon` SELECT and UPDATE refused, `service_role` reads (74
  rows); afterwards unchanged (3 policies, anon INSERT/SELECT/UPDATE, 014
  not recorded).
- **3 Nov 2026** Fix 1d deployed (your order "go 1d", then "deploy now",
  overriding the 1 h minimum): 014 committed `9047ad7` (not pushed);
  `vps-deploy.sh` from the worktree at 02:46:59 IST applied 014 (guard
  passed), no function removed, functions restarted.
  - `security-test.sh` (real DNS): **0 FAIL, 0 WARN**; `trip_leads` and
    `_migrations_applied` 401. Public-key PATCH and DELETE on `trip_leads`
    401. Catalog: 0 policies and 0 public grants on `trip_leads`;
    `_migrations_applied` 14. `healthcheck.sh` exit 0; all containers
    healthy; functions log 0 errors.
  - Browser run, steps 1 to 8 on the live site: the first run used a
    **cached old `trip-planner.js`** (that browser had loaded the site at
    01:16 IST; 4 h cache): 8 direct `trip_leads` POSTs, all 401, no row.
    This is the stale-cache case: such a visitor loses progress saves
    silently and gets an error at the final submit (no lead) until about
    06:22 IST. Kong since the deploy: every direct `trip_leads` request
    was Claude's (3 probes, 8 cached-browser POSTs, 3 preflights); no
    real visitor affected at that time.
  - Second run with the browser cache bypassed (live file): 8 POSTs to
    `save-trip-lead`, all 200; no direct `trip_leads` request; 0 console
    errors; row `in_progress`, step 8, the 8 answers, no contact data.
    Deleted (exactly 1, guarded); `trip_leads` 74. Browser files deleted.
- **3 Nov 2026** Migration 014 pushed to `main` (your OK): `git push
  origin claude/security-fixes:main` at 02:56:57 IST, fast-forward
  `8b1b269..9047ad7`, one file (`014_trip_leads_service_only.sql`). No
  effect on the live site (migrations run only via `vps-deploy.sh`);
  `main` now matches the server. Your `AlpenGlow work` folder untouched
  (its local `main` is 5 behind).
- **3 Nov 2026** Final re-test, part 1 (after 1d): Compass backend,
  `chat-compass` called from the site origin with one travel question:
  200 in 3.0 s, real Groq answer; the function writes nothing. (The
  `compass` page itself is behind the site's verification popup, so a
  browser chat needs a real OTP.) Trip planner after 1d: steps 1 to 8
  OK through `save-trip-lead` (see 1d entry); the final submit after 1d
  needs a real OTP. Contact form (`submit-contact`, no OTP) not yet
  submitted: it inserts a `leads` row, emails the agency through Resend
  and adds a Google Sheets row, so it waits for your OK.
- **3 Nov 2026, 10:41 IST** Check after your report "contact form, trip
  planner final submit, Compass chat, dashboard login done" (counts and
  logs only, read-only):
  - **Stale-cache 401s, 02:47 to 06:22 IST (and on to 10:41): none from a
    real visitor.** After Claude's last test (02:50:01 IST) there was no
    direct `/rest/v1/trip_leads` request at all from outside the
    edge-functions container.
  - **Your tests are not on the new server.** Since the 1d deploy
    (02:46:59 IST): 0 new `leads` (total 34), 0 new `trip_leads` (74, 30
    submitted). Kong since the 1b deploy (02:21 IST), all function POSTs:
    your 02:27 trip planner run (10 `save-trip-lead`, SMS and email OTP
    send and verify, 1 `submit-lead`), Claude's 8 `save-trip-lead` and 1
    `chat-compass`; nothing else: no `submit-contact`, no `crm`
    (dashboard), no second OTP pair or `submit-lead`. Since 02:47 the only
    other traffic is the 5-minute health check (97 `GET packages`).
    Functions log 0 errors.
  - Logs are complete: Kong running since 2 Nov 22:22 IST, 0 restarts,
    json-file 5 x 20 MB. This laptop resolves `api` to `84.247.184.195`.
    The new server's nginx access log is not readable by `deploy`
    (needs sudo), so requests that never reached Kong cannot be seen.
  - Possible causes (not checked): tests run before 02:21 (only the
    02:27 trip planner run matches), a browser or device still resolving
    `api` to the old server (old Kong is stopped, so it would answer 502),
    or a different site/page. Next: re-run the four tests and note the
    times; Claude then checks counts and Kong; if anything is missing,
    look at the browser's network tab and the new server's nginx log
    (sudo).
- **3 Nov 2026, 11:04 IST** Your re-run of the final re-test, confirmed
  (counts and Kong since 10:40 IST, read-only):
  - New `leads`: `contact_form` 1, `trip_planner` 1, `compass_bot` 1.
    New `trip_leads`: 1, `submitted`, name/phone/email present; 0 left
    `in_progress`. Totals: `leads` 37, `trip_leads` 75 (31 submitted).
  - Kong, all 200/201/204: `submit-contact` 1; `save-trip-lead` 11;
    SMS and email OTP send and verify 1 each; `submit-lead` 2 (trip
    planner and Compass); `chat-compass` 2; `crm` 5 (your dashboard
    login and views). Every `/rest/v1/leads` and `/rest/v1/trip_leads`
    call (1 GET, 3 POST on `leads`; 1 POST, 11 PATCH on `trip_leads`)
    came from the edge-functions container (service role); 0 from
    browsers. 0 function calls with status 400 or above; functions log 0
    errors.
  - **AlpenGlow security fixes 1, 2, 3 complete:** live on the new
    server, `security-test.sh` 0 FAIL, all on `main` (`9047ad7`), site
    flows confirmed.
- **3 Nov 2026, 12:20 IST** Two frontend follow-ups (your request "do
  these fixes and push it"), commit `051768d` on `claude/security-fixes`,
  pushed to `main` (fast-forward `9047ad7..051768d`, 12:20:15 IST), live
  on Cloudflare from 12:20:44 IST:
  - `trip-planner.js?v=1611e0f` (its git content hash) in `index.html`
    and all 20 `packages/*.html` (1 line each; `dev.html` copies
    `packages/japan.html` as its template, so new pages keep the tag). A
    comment in `index.html` says to bump it whenever the file changes, so
    updates no longer wait out the 4 h browser cache.
  - `index.html` no longer loads `@supabase/supabase-js` from jsdelivr
    (nothing uses `window.supabase` since fix 1b; no other page loaded
    it).
  - Checked live in a fresh browser: homepage and `packages/bali` load
    `trip-planner.js?v=1611e0f`, no Supabase script, `window.supabase`
    undefined, the planner opens (step 1 of 9), 0 console errors, all
    images and scripts load (the only empty image is the hidden city
    modal's, filled when a city opens; unrelated). Browser files deleted.

## Decisions made

- **Order.** AlpenGlow first: old VPS `deploy@169.58.43.191` to the new
  server. PSS about a week later: Supabase cloud project
  `ozatixapvxwrwbpdxuzt` to the same new server, as its own separate stack.
- **New server: option A, a new Contabo server.** We use Contabo only.
  Contabo cannot clone a server onto another, so the move follows the
  runbook as planned.
- **Old server billing.** Next billing date 16 Nov. The earliest
  cancellation date Contabo offers (16 Nov or 16 Dec) is still to be checked
  in the Contabo panel. The move dates are your choice; Claude does not plan
  them.
- **Fallbacks.** The old server only has to stay as AlpenGlow's fallback.
  PSS's fallback is its Supabase cloud project.
- **Certificates.** `certbot.timer` on the old server is active (checked
  26 Oct: last run 13:14 CET, next 00:04 CET). The `api` certificate renews
  there automatically around 17 Nov (the new one is valid to about mid-Feb
  2027). If AlpenGlow switches before 17 Nov, the copied certificate is
  valid to 17 Dec, and the new server renews it after the DNS switch.
- **Deadline.** AlpenGlow must switch before early December (saved
  certificates expire 17 Dec for `api`).
- **Billing app (travel-app, `travel.alpenglowglobal.com`): removed, not
  moved.** It stays on the old server until that server is cancelled; then
  delete the `travel` DNS record. Keep `db/app-billing-schema+data.sql` from
  the snapshots (GST records).
- **PSS: only `main` moves.** Never touch other PSS branches (`pss-ai/*`,
  `cloudflare/workers-autoconfig`). The cloud project is used only by
  `main`; retire it after the rollback window.
- **PSS frontend** is on Cloudflare Pages, project `perfect-study-space`
  (staff site and `join.perfectstudyspace.in`). Set only the Production
  variables. The CSP lives in `public/_headers` (patch:
  `deploy/server-migration/pss/frontend-csp.patch`).
- **Folders.** PSS repo `C:\Users\sriva\Desktop\PSS\perfect-study-space`.
  Snapshots `C:\Users\sriva\Desktop\AlpenGlow WEB\vps-migration-backup`
  (outside git, holds secrets: never commit or print its contents). Run
  `pull-backup.sh` with
  `OUT="/c/Users/sriva/Desktop/AlpenGlow WEB/vps-migration-backup"`.
- **Old server notes (26 Oct).** About 20 GB of Docker build cache can be
  cleared, but only with your OK. A stray stopped container
  `tender_kowalevski` exists. The load (~1.8) is health-check noise, not a
  problem.
- **Scheduling.** Switch-overs only after the weekly usage reset (1 Nov,
  ~04:30 IST). One fresh session per sitting.
- **AlpenGlow security fixes 1, 2, 3 (decided 2 Nov): yes, right AFTER the
  AlpenGlow switch-over, on the new server only, so each is deployed once.**
  Until then the audit's `trip_leads` and `_migrations_applied` rows are
  expected FAILs (runbook, "Audit before cutover").
- **PSS `overtime_sessions` (2 Nov):** no migration; row security is
  already on live. Had it been off: show the migration and ask before
  applying it to the live PSS project.
- **PSS `student-photos` (2 Nov):** nothing to do, the bucket is gone.
  Your rule had it existed: make it private first (with your OK), then you
  decide about an offline copy and deleting.
- **Old server (2 Nov):** leave `docker.list` disabled; leave the ~20 GB
  build cache and the stopped container `tender_kowalevski` as they are.
- **Recommended set-ups (2 Nov): planned, you set them up yourself:** R2
  bucket for off-server backups, backup passphrase in a password manager,
  outside uptime monitor, second SSH key.
- **Git (2 Nov):** your laptop checkout stays on `main`, untouched; Claude
  works on `claude/server-migration-kit` in a separate worktree.

## Rules for every sitting

- Ask before every step that changes anything, anywhere.
- Never print, paste or commit secrets (passwords, keys, tokens, connection
  strings, `.env` contents, customer data). You type secrets straight into
  the server yourself.
- Restore databases only with `~/ops/restore-public.sh`, never a plain
  `psql < dump`.
- PSS: record migrations 001 to 051 as applied BEFORE its first deploy
  (`PSS-MIGRATION-PLAN.md`, Phase 2 step 5).
- Never deploy backend changes during a switch-over window. Backend code
  deployed to the old server or the cloud after a rehearsal must be
  re-deployed to the new server during that project's switch-over.
- Never install `iptables-persistent` / `netfilter-persistent` on the new
  server: it uninstalls ufw (that is how the old server lost its firewall).
- Never run `do-release-upgrade` on the old server. The new server stays on
  Ubuntu 24.04 (the kit is built and rehearsed for it).
- Multi-line remote commands from PowerShell: pipe a here-string into
  `ssh <host> "tr -d '\r' | bash -s"` (plain quoted commands get their
  quotes stripped). Bash scripts run in Git Bash.
- In a script piped into `bash -s`, any command that reads stdin
  (`restore-public.sh`, `docker exec -i`, `psql < file`) swallows the rest
  of the script. Run those as their own `ssh` call with `</dev/null`.

## Waiting on me

PSS Sitting 3 (22 Nov):

- [x] OK on the step 1 kit diff (done 22 Nov, `924237f`).
- [x] OK on the step 2 app-fix diff (done 22 Nov, `1d2e6f9`, branch pushed).
- [x] Worker CPU-limit fix (done 22 Nov, `1499d46`).
- [x] Memory: option A (decided 22 Nov): both stacks must fit in RAM,
      swap only as a buffer. PSS kit defaults done (`e63f446`).
- [ ] AlpenGlow ceilings: OK on the new numbers (table in the chat,
      after the 12-minute read-only measurement), then a quiet hour of
      your choice to apply them (AlpenGlow only, `docker compose up -d`).
- [x] Migration numbers (decided 22 Nov): 052 is yours, the hardening
      migration is 053.
- [x] Copy your `052_owner_last_login.sql` and its 10 `api` lines UNCHANGED into
      `fix/pre-migration` (your OK 22 Nov; committed `d560eb0`).
- [x] OK on the E-transactions diff and the J kit diff (22 Nov; `8fd2fb3`, `c41876d`).
- [ ] Phase 2, your OK: put J on the live server together with the PSS stack (crontab,
      reboot time 22:30, restore-test.sh), without disturbing AlpenGlow's backups or health check.
- [ ] Sitting 5 backlog (after the move, one at a time, each with your OK): the big
      membership actions (new/renew/transfer/cancel membership and the other multi-step
      writes) each in one SQL transaction; AlpenGlow's live router `jsr:@panva/jose@6`
      import replaced by a stored copy (separate fix).
- [ ] For Phase 1: a Supabase access token on the laptop (secret names,
      download of the deployed `api`), and the session-pooler string
      typed by you at a `read -rs` prompt on the server.
- [ ] Sitting 4: change the PSS cloud database password after the final
      dump (it was pasted into the chat on 22 Nov).

Dates (your choice):

- [ ] Check the earliest cancellation date for the old server in the
      Contabo panel (16 Nov or 16 Dec).
- [ ] Choose the migration dates.

To start Phase 1:

- [x] The new Contabo server: `84.247.184.195` (2 Nov). Checked: Ubuntu
      24.04.5, 4 vCPU, 7.8 GB RAM, 96 GB disk, root key login works.
- [x] A fresh session on this laptop for step 1 (2 Nov, evening).

Before the AlpenGlow switch-over (from step 1, 2 Nov):

- [ ] Confirm the two test alert emails (PROBLEM, then RECOVERED, about
      17:05 server time) arrived at the agency inbox, not in spam.
- [x] Do not deploy backend changes to the old server until the
      switch-over: none were (checked 2 Nov). From now on deploy only to
      the new server (`vps-deploy.sh` points there).
- [ ] WhatsApp OTP to a non-Indian number on the live site.
- [x] `travel` certificate on the new server: removed (your decision,
      2 Nov; `certbot delete`, new server only).
- [x] Old server's second deploy key `batore-vps`: not needed, not added
      to the new server (your decision, 2 Nov).
- [x] Backup passphrase: you replaced it on the new server with a new one
      and saved it in your password manager yourself (2 Nov); the `scp`
      step is skipped.

After the AlpenGlow switch-over (decided 2 Nov):

- [x] AlpenGlow fix 1: `trip_leads` behind an edge function (runbook,
      "Security fixes that need a code change"), on the new server
      (1a to 1d done 3 Nov; all on `main` since 02:56 IST).
- [x] AlpenGlow fix 2: `_migrations_applied` row security and no public
      access, on the new server (deployed 3 Nov, migration 012).
- [x] AlpenGlow fix 3: remove public write access on the CMS tables, on
      the new server (deployed 3 Nov, migration 013).
- [ ] Merge `claude/security-fixes` into `main` and push (your separate
      OK; carries the Phase 5 IP change and migrations 012, 013 to
      `main`).

Settled (2 Nov):

- [x] PSS `overtime_sessions`: row security already on live; no migration.
- [x] PSS `student-photos`: bucket gone, 0 files; nothing to do.
- [x] Old server: check `PasswordAuthentication`: checked 26 Oct, it was
      ON; switched off 26 Oct (`00-hardening.conf`).
- [x] Old server: the "Accepted password" count of 1 was our own check;
      no SSH password login in the logs (26 Oct).
- [x] Old server: today's `apt upgrade -y` (14:58 CET) was run by you
      (confirmed 26 Oct).
- [x] Old server: change the `deploy` sudo password (done 26 Oct).
- [x] Old server: Docker apt source stays disabled (your decision, 2 Nov).
- [x] Old server: switch password SSH login off: done 26 Oct with
      `00-hardening.conf` (loaded before `50-cloud-init.conf`, which is
      left unchanged); tested by you after the reload.
- [x] Old server housekeeping: leave the build cache and
      `tender_kowalevski` as they are (your decision, 2 Nov).

Recommended (planned 2 Nov; you set them up yourself):

- [ ] Cloudflare R2 bucket for off-server backups.
- [ ] The backup passphrase in a password manager.
- [ ] An outside uptime monitor (`https://api.alpenglowglobal.com`, later
      `https://api.perfectstudyspace.in`).
- [ ] A second SSH key from another machine.

Later:

- [x] A day before the AlpenGlow switch-over: lower the TTL of `api` in the
      `alpenglowglobal.com` zone to 5 minutes (300 s, checked 2 Nov).
- [ ] The PSS inputs in `INPUTS-NEEDED.md` ("For PSS").

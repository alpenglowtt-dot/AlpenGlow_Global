# PSS all-phases on the old server: plan

Deploy the full `pss-ai/all-phases` app of Perfect Study Space as its own
Supabase stack on the OLD server `169.58.43.191`, next to AlpenGlow's
rollback stack. Data comes from the cloud project `zripsszkprhtyccukrir`
(TEST DATA only). API address `https://api.perfectstudyspace.in`; it moves
to the new server later, when PSS `main` moves.

**Migration only.** No feature testing, load tests or feature switches
until you say "start testing". The only checks are the ones that prove a
step finished (containers healthy, row counts match, the API answers a
login).

This plan is based on `../PSS-MIGRATION-PLAN.md` (the PSS `main` move),
adapted to all-phases. That file, `../PROGRESS.md` and everything in
`../new-server/` belong to the main migration and are only read and run
from here, never edited. Progress for THIS migration: `PROGRESS.md` in this
folder.

## Branch and folders

| | AlpenGlow repo | PSS repo |
|---|---|---|
| Worktree | `Desktop\AlpenGlow WEB\AlpenGlow-pss-all-phases` | `Desktop\PSS\pss-all-phases` |
| Branch | `claude/sleepy-johnson-fmuoxd` from `92156bc` | `claude/sleepy-johnson-fmuoxd` from `65d8f1a` |
| Upstream | none yet; first push `git push -u origin claude/sleepy-johnson-fmuoxd` | `origin/claude/sleepy-johnson-fmuoxd` |

Never changed: `AlpenGlow-migration`, `AlpenGlow work`,
`PSS\perfect-study-space`; branches `main` (both repos),
`pss-ai/all-phases`, `pss-ai/*`, `claude/server-migration-kit`.

## Decisions

- **Branch (9 Nov):** `claude/sleepy-johnson-fmuoxd` created locally from
  `92156bc` (AlpenGlow) and `65d8f1a` (PSS), confirmed by you. The PSS
  branch is on GitHub (pushed from your cloud session; the PSS worktree
  tracks it). The AlpenGlow branch reaches GitHub with Claude's first push
  (`git push -u origin claude/sleepy-johnson-fmuoxd`).
- **Folders (9 Nov):** Claude does not use `EnterWorktree`. Both worktrees
  are added with `/add-dir`; files are edited by their full paths, and every
  Bash command first `cd`s into `AlpenGlow-pss-all-phases` or
  `PSS\pss-all-phases`. Claude never runs git or writes anything in
  `PSS\perfect-study-space`, `AlpenGlow-migration` or `AlpenGlow work`.
- **Supabase (9 Nov):** the only project for this migration is
  `zripsszkprhtyccukrir`. You log in to its dashboard yourself; Claude never
  needs your Supabase password. Claude never runs the Supabase CLI (`link`,
  `db push`, `functions deploy`, `secrets`, or anything else) against any
  project without asking you first. **The live PSS project
  `ozatixapvxwrwbpdxuzt` is never touched in any way.**
- **Signed Storage links: B (9 Nov).** In the two signed-link actions
  (`api/domains/payments.ts` `get_payment_proof_image`,
  `api/domains/tickets.ts` task photo) the link is built from
  `SUPABASE_PUBLIC_URL` when it is set, else `SUPABASE_URL`, so Supabase
  cloud (where `SUPABASE_PUBLIC_URL` is unset) is unchanged. Functions keep
  `SUPABASE_URL=http://kong:8000`. A (routing the functions through nginx)
  is not used.
- **nginx exposure (9 Nov):** public are only `/functions/v1/` (minus
  `main` and `_shared`), `GET`/`HEAD` on `/storage/v1/object/sign/`, and the
  Realtime websocket. `/rest/v1/`, Storage admin paths (and
  `/storage/v1/object/public/`) and `/realtime/v1/api/` are NOT opened to
  anyone, not even `172.16.0.0/12`; the functions reach them inside the
  stack through `kong:8000`.
- **Open choices 2, 3, 5 (9 Nov):** approved as proposed. **4:** settled
  by step 2: the buckets hold 0 files, nothing to copy. **6:** no PSS
  backup on the old server (`add-project-full.sh` writes no `~/ops` entry).
- **Feature switches, schedules, AI (9 Nov):** all 39 feature switches stay
  exactly as in the cloud (faithful copy of `app_settings`). Every schedule
  stays PAUSED on the stack. No AI keys in `functions.env` until you say.
- **Data (9 Nov, corrected by you):** `zripsszkprhtyccukrir` holds
  **made-up test data** (your 14:14 message; the "personal data" line at
  14:17 was only a safe default). Row contents are still never printed,
  logged or committed. As cleanup, **`~/projects/pss` is removed from the
  old server before it is cancelled** (see "Removing it again").
- **Working mode (9 Nov, replaces "stop after each step" and "ask before
  every change" for the steps in this plan):** steps 5, 6, 6b, 7 to 14 run
  one after another without waiting. Pushing both worktrees to
  `claude/sleepy-johnson-fmuoxd` is approved (never any other branch).
  Claude stops only for: (1) something only you can do (sudo/root
  commands, your password, a secret or the connection string at a
  `read -rs` prompt, the Cloudflare DNS record, Cloudflare Pages settings);
  (2) a failure or anything different from this plan (failed check,
  unhealthy container, row counts not matching, `nginx -t` failing, memory
  below the step 7 go/no-go): evidence, proposed fix, wait; (3) step 6b
  after the fresh billing dump: size and row counts, wait for "dump OK"
  before removing anything of the travel-app; (4) anything not in this
  plan or touching AlpenGlow's containers, the main branches,
  `PSS\perfect-study-space`, `AlpenGlow-migration`, `AlpenGlow work` or
  `ozatixapvxwrwbpdxuzt`. After step 14: stop and wait for "start testing".
- **Server tests (9 Nov):** the PSS server suites run inside a pinned
  `denoland/deno` container (no Deno installed on the laptop), dummy data
  only.
- **AlpenGlow on the old server (9 Nov):** the AlpenGlow rollback there no
  longer needs protecting (AlpenGlow is stable on the new server). Its own
  containers keep running if possible, so the server can be measured with
  both projects. If they block this migration (memory, ports, nginx),
  Claude tells you and proposes a change; nothing of AlpenGlow's is changed
  without your OK.
- **travel-app (9 Nov):** not needed any more; removed from the old server
  in the new **step 6b**, BEFORE the step 7 baseline (so the baseline is
  without it). The billing schema inside AlpenGlow's old database is left
  alone; it goes when the server is cancelled. You delete the `travel` DNS
  record in Cloudflare yourself. Recorded only in this folder's
  `PROGRESS.md`, never in the main migration's.
- **Server changes (9 Nov, later replaced):** were asked for one by one
  until the working-mode decision above.
- **Billing dates of the old server:** yours; not planned around here.
- **Tracking:** this folder's `PLAN.md` and `PROGRESS.md`. The AlpenGlow
  `CLAUDE.md` "Server migration" rules (`claude/server-migration-kit`,
  `../PROGRESS.md`) belong to the main migration and do not apply here.

## What all-phases is (checked in the code, 9 Nov 2026, at `65d8f1a`)

| | |
|---|---|
| Migrations | 73 (`001_initial` to `073_ai_provider_attempts`). Extension in migrations: only `pgcrypto` (001). No migration touches `auth.*`, Realtime, Vault, `cron.*` or `net.*` |
| Storage in migrations | 002, 010, 016 (old `student-photos` policies on `storage.objects`), 059 (`payment-proofs`), 062 (`id-photos`), 069 (`task-photos`): the last three insert private buckets into `storage.buckets`. (048 only matched the word `localStorage`.) |
| Functions | `api`, `cron`, `agent` + `_shared`; all `verify_jwt = false` in `config.toml` (each checks its own staff/student token or `x-cron-secret`) |
| Router | The stack template's `main` router serves any `/functions/v1/<name>` from the folder of that name, so `api`, `cron` and `agent` all work unchanged. `_shared` has no `index.ts`; a request to it fails with 500 and runs nothing (nginx will block it anyway, see step 3) |
| Storage in functions | Uploads, downloads and removals by the service role on `id-photos`, `payment-proofs`, `task-photos`. Two actions hand the browser a signed link: `get_payment_proof_image` (`api/domains/payments.ts:109`, 120 s) and the task photo action (`api/domains/tickets.ts:156`, 300 s) |
| Realtime | Functions POST an empty "changed" signal to `SUPABASE_URL/realtime/v1/api/broadcast` (`_shared/live.ts`), only while `pssai_realtime` is on. Frontend: one broadcast channel per topic (`src/lib/live.js`) |
| Frontend | `src/lib/api.js`: `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)`; only `functions.invoke` plus the Realtime channel. CSP in `public/_headers` and `vercel.json` allows only `*.supabase.co` |
| Schedules | `docs/ops/cron.sql`: Vault secrets `pss_project_url`, `pss_cron_secret`; helpers `pss_run_cron_job`, `pss_run_agent_job` (pg_net `http_post`); 27 `cron.schedule` jobs |
| Function secrets read | `STAFF_JWT_SECRET` (falls back to `JWT_SECRET`), `STUDENT_JWT_SECRET`, `CRON_SECRET`, `CERTIFICATE_SECRET`, `PORTAL_URL`, `ALLOWED_ORIGINS`, `PUBLIC_SITE_KEY`; AI: `OLLAMA_API_KEY`, `GEMINI_API_KEY`, `AI_API_KEY` and `OLLAMA_MODEL[_HARD]`, `GEMINI_MODEL[_HARD]`, `AI_MODEL[_HARD]`; from the stack: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |

Still to confirm against `zripsszkprhtyccukrir` in step 2: tables and row
counts, extensions, cron jobs, buckets and file counts, Postgres version,
secret names.

## Layout on the old server

| | AlpenGlow (kept running; rollback no longer needed) | PSS all-phases (new) |
|---|---|---|
| Folder | `~/projects/alpenglow-global/backend` | `~/projects/pss/backend` |
| Compose project, network | `supabase`, `supabase_default` | `pss`, `pss_default` |
| Containers | `supabase-*` (Kong STOPPED); travel-app removed in step 6b | `pss-db`, `pss-rest`, `pss-kong`, `pss-functions`, `pss-storage`, `realtime-dev.pss-realtime` |
| Gateway | `:8000`/`:8443` (stopped) | `127.0.0.1:8010` only |
| Database port | AlpenGlow pooler, dropped by `DOCKER-USER` | not published at all |
| nginx | existing site files, never edited | new: `sites-available/api.perfectstudyspace.in`, `conf.d/10-pss.conf` |
| Rate-limit zone | `alpenglow_api`, `alpenglow_otp` | `pss_api` |

**Memory (server has 8 GB; measured for real in step 7).** Proposed
ceilings (Docker `mem_limit`, a cap, not a reservation):

| Container | Ceiling |
|---|---|
| `pss-db` | 768 MB |
| `pss-rest` | 256 MB |
| `pss-kong` | 512 MB (2 workers; ~130 MB in the AlpenGlow rehearsal) |
| `pss-functions` | 512 MB (each request 256 MB / 150 s, as on Supabase cloud) |
| `pss-storage` | 256 MB |
| `realtime-dev.pss-realtime` | 384 MB |
| **Total ceiling** | **about 2.7 GB** (expected real use about 1 to 1.3 GB with test data) |

Go/no-go at step 7: start the stack only if `free -m` shows at least
3 GB "available" with AlpenGlow and travel-app as they are. Otherwise we
lower the ceilings first (with your OK).

## Open choices (as proposed on 9 Nov; outcomes in "Decisions")

1. **Signed Storage links: decided B (see Decisions); kept for the record.** supabase-js builds a signed link as
   `SUPABASE_URL + /storage/v1/object/sign/...`, client side. With the
   template's `SUPABASE_URL=http://kong:8000` the browser would get a
   `kong:8000` link it cannot open. The storage service cannot fix this; the
   base URL the functions use has to be the public one.
   - **Proposal A (template only, no app change; recommended, as you
     prefer):** functions get `SUPABASE_URL=https://api.perfectstudyspace.in`
     plus `extra_hosts: api.perfectstudyspace.in:host-gateway`, so the name
     resolves to this server inside the container and the call goes through
     the host nginx with the real certificate. The nginx site then allows
     `/rest/v1/`, the Storage admin paths and `/realtime/v1/api/` **only from
     Docker's private range `172.16.0.0/12`** (`allow ...; deny all;`, no
     rate limit), and 404s them for everyone else as before. The links the
     browser gets are `https://api.perfectstudyspace.in/storage/v1/object/sign/...`,
     which nginx serves publicly (GET only).
     Cost: every database call of the functions goes through nginx and TLS
     (a few ms), and the functions need the certificate (they are deployed
     in step 12, after TLS in step 9). Risk: a wrong `allow` line would open
     REST; step 3's diff and step 12's checks prove it does not.
   - **Fallback B (two lines of app code):** in the two signed-link actions,
     replace the internal base with `SUPABASE_PUBLIC_URL` (already set by the
     template; unset on Supabase cloud, so nothing changes there). Simpler,
     but it changes all-phases' code.
2. **Realtime tenant (step 3).** The self-hosted Realtime image finds its
   tenant from the first label of the host name; Supabase's own compose file
   therefore names the container `realtime-dev.supabase-realtime`. Ours:
   `realtime-dev.pss-realtime`, tenant `realtime-dev`, gateway route to
   `http://realtime-dev.pss-realtime:4000/socket/`. It also needs its
   `_realtime` schema init file in `volumes/db/`.
3. **Buckets (step 10).** The data arrives as a dump of `public` only, and
   001 to 073 are recorded as applied without being run. The three private
   buckets are therefore created separately with the exact settings of 059,
   062 and 069 (id, public=false, size limit, MIME types), and any
   `storage.objects` policies those migrations add are applied the same way.
   The old `student-photos` policies (002, 010, 016) are not recreated (that
   bucket is unused by this code).
4. **Storage files (step 10).** Decided from step 2's file counts: skip if
   the buckets are empty; otherwise copy with the cloud service key through
   the Storage API into the new stack (a script on the server; you paste the
   key at a `read -rs` prompt).
5. **Schedules without Supabase Vault, if needed (step 4).** `cron.sql`
   keeps its URL and secret in Vault. If the self-hosted image has
   `supabase_vault`, `cron-selfhosted.sql` uses it the same way; if not, it
   uses a private table readable only by `postgres`. The URL is the internal
   gateway `http://kong:8000` (from `pss-db`, on the stack's own network), so
   scheduled calls never leave the server. Every job is created **paused**,
   in the same transaction, so none can fire before you say so.
6. **Backups and health check on the old server.** The kit's `~/ops`
   nightly backup and health check were set up on the new server, not
   necessarily on the old one (checked in step 7). This is test data, so no
   PSS backup is planned unless you want one.

## Steps

Stop and wait for your OK after each numbered step. After every finished
step: `PROGRESS.md` updated, committed and pushed (pre-approved for this
folder).

### A. Prepare (no server changes)

1. **Worktrees and plan.** Worktrees made, `/add-dir` done; this file and
   `PROGRESS.md` written.
2. **Inventory of `zripsszkprhtyccukrir` (read-only).** Claude gives you SQL
   for the project's SQL editor (you run it in your own dashboard login):
   tables with exact row counts, extensions (installed and versions),
   `cron.job`, `storage.buckets` with file counts and total size, Postgres
   version, plus `docs/ops/full-system-diagnostic.sql`. You also give the
   secret NAMES set on the project (never values). Recorded in
   `PROGRESS.md`.
3. **Stack kit for the full app** (new files in this folder only):
   - `stack-template/`: copy of `../new-server/stack-template` plus
     Storage (`supabase/storage-api:v1.60.4`, file backend on a volume,
     `mem_limit`) and Realtime (`supabase/realtime:v2.102.3`, `mem_limit`),
     the same pinned versions as AlpenGlow; gateway routes for
     `/storage/v1/` and `/realtime/v1/`; the db init files they need;
     memory ceilings above; functions keep `SUPABASE_URL=http://kong:8000`
     and get `SUPABASE_PUBLIC_URL=https://<domain>` (decision B).
   - `add-project-full.sh`: copy of `../new-server/add-project.sh` using
     this template and the nginx template below; also checks for the
     `snippets/proxy-to-stack.conf` it includes and adds it as a NEW file if
     the old server lacks it (never edits an existing file).
   - `nginx/project-site-full.template`: like the kit's, plus only:
     `GET`/`HEAD` on `/storage/v1/object/sign/` and the websocket
     `/realtime/v1/websocket` (upgrade headers, long read timeout). Still
     404 for everyone (no internal `allow`) on `/rest/v1/`, `/auth/v1/`,
     every other `/storage/v1/` path, `/realtime/v1/api/`, Studio, `/pg/`,
     GraphQL, `/functions/v1/main` and `/functions/v1/_shared`.
   - Diff shown to you.
4. **PSS-side files** (PSS worktree, this branch only):
   - `deploy/vps-deploy.sh`: from the kit's `pss/vps-deploy.sh`; deploys
     `api`, `cron`, `agent` (+ `_shared`) and new migrations to the `pss`
     stack; refuses to replay a migration before 001 to 073 are recorded.
   - `public/_headers` and `vercel.json`: add `https://api.perfectstudyspace.in`
     to `connect-src` and `img-src`, and `wss://api.perfectstudyspace.in` to
     `connect-src`; `*.supabase.co` stays.
   - Decision B: `api/domains/payments.ts` (`get_payment_proof_image`) and
     `api/domains/tickets.ts` (task photo) build the signed link from
     `SUPABASE_PUBLIC_URL` when set, else `SUPABASE_URL`.
   - `docs/ops/cron-selfhosted.sql`: copy of `cron.sql` calling
     `http://kong:8000/functions/v1/cron|agent`, every job paused.
   - Diff shown to you.
5. **Local rehearsal**, if Docker Desktop runs on this laptop (installed;
   not running on 9 Nov): the stack from step 3 with dummy data, all 73
   migrations from empty (Storage ones included), the 3 functions answering,
   the 3 buckets, a signed link opened through a local nginx stand-in,
   pg_cron and pg_net loaded (`shared_preload_libraries`,
   `cron.database_name`), Vault present or not, `cron-selfhosted.sql` with
   all jobs paused. Also (your request, 9 Nov): Storage logs in to the
   database as `supabase_storage_admin` with the slim `roles.sql`, and
   Realtime connects as `supabase_admin`. No Supabase CLI. If Docker cannot
   run, we go carefully on the server.
6. **Commit and push** both worktrees to `claude/sleepy-johnson-fmuoxd`
   (your OK).

### B. Old server (each step only after your OK)

6b. **Remove the travel-app** (before the baseline):
    - a. **Billing data first (GST records).** Confirm
      `db/app-billing-schema+data.sql` is in the latest snapshot in
      `vps-migration-backup` and passes its `SHA256SUMS`. Then a FRESH,
      read-only dump of the billing schema from `supabase-db` into a new
      dated folder in `vps-migration-backup` (outside git, never printed).
      Report its size and the row count per table. Nothing is deleted
      until you confirm the dump is good.
    - b. Then, one command at a time, each with your OK:
      `docker compose down` in `~/projects/travel-app` (no `-v` until you
      confirm); remove its images; remove the nginx site
      `travel.alpenglowglobal.com` (`nginx -t` must pass before the reload;
      `api.alpenglowglobal.com` stays as it is); `certbot delete` for the
      `travel` certificate; finally remove the `~/projects/travel-app`
      folder. Root commands are written out; you run them.
    - c. You delete the `travel` DNS record in Cloudflare.
    - d. The billing schema inside AlpenGlow's old database stays; it goes
      when the server is cancelled.
7. **Baseline (read-only):** `free -m`, `df -h`, `uptime`,
   `docker stats --no-stream`, `docker ps`, listening ports; port 8010 free;
   nginx version, `snippets/`, `/etc/letsencrypt/options-ssl-nginx.conf`,
   `python3`, `openssl`; `~/ops` present or not. Recorded as "before PSS".
   Memory go/no-go.
8. **Create the stack.** Copy this folder's kit (and
   `../new-server/restore-public.sh` to `~/ops/`) to the server as `deploy`.
   Root-only commands are written out for you to run in your own terminal
   (sudo asks your password; root SSH is off):
   `bash add-project-full.sh pss api.perfectstudyspace.in 8010`.
   Check: all containers healthy, bound to 127.0.0.1 only, no database
   port, AlpenGlow containers unchanged.
9. **DNS and certificate.** You: Cloudflare zone `perfectstudyspace.in`, A
   record `api` → `169.58.43.191`, **DNS only** (grey cloud). Then (you, as
   root) `certbot certonly --webroot -w /var/www/html -d api.perfectstudyspace.in`
   and `add-project-full.sh` again with the same arguments (TLS on). Check:
   `https://api.perfectstudyspace.in/` 404, `/rest/v1/` 404, certificate
   valid.
10. **Data.**
    - You paste the session-pooler connection string of
      `zripsszkprhtyccukrir` at a `read -rs` prompt on the server;
      `docker exec pss-db pg_dump "$URL" --schema=public --no-owner` to a
      file; `unset`.
    - `~/ops/restore-public.sh pss-db <file>` (its own `ssh` call with
      `</dev/null`; never `psql < dump`).
    - Buckets (open choice 3), then Storage files (open choice 4).
    - **Before the first deploy:** record 001 to 073 in
      `public._migrations_applied` (row security on, no anon/authenticated
      access).
    - Compare every row count with step 2; all must match.
11. **Secrets.** Claude lists the lines for
    `~/projects/pss/backend/functions.env`; you type the values yourself.
    `STAFF_JWT_SECRET` must be set (otherwise staff tokens are signed with
    the stack's master `JWT_SECRET`). `ALLOWED_ORIGINS` includes the test
    frontend's address (from step 14). AI keys only if you say so. Then
    `docker compose up -d functions`.
12. **Deploy functions:** from the PSS worktree,
    `VPS_HOST=deploy@169.58.43.191 bash deploy/vps-deploy.sh` (expects "no
    new migrations"). One curl login through
    `https://api.perfectstudyspace.in/functions/v1/api` (you type the test
    password). Plus the read-only exposure check: REST, Auth, Studio, `/pg/`,
    GraphQL, Storage admin paths 404 from outside.
13. **Schedules:** `cron-selfhosted.sql` as `postgres` in `pss-db`, every
    job PAUSED; check `SELECT jobname, active FROM cron.job` shows 27 jobs,
    all `false`. None activated.
14. **Frontend:** find out how Cloudflare Pages project `perfectstudyspace`
    is connected (repo, Production branch, Preview branches). Propose how
    this branch gets built with `VITE_SUPABASE_URL=https://api.perfectstudyspace.in`
    and `VITE_SUPABASE_ANON_KEY` = `ANON_KEY` from the new `.env`. You change
    the Cloudflare settings yourself.

Then STOP: report the migration finished, with evidence, and wait for
"start testing".

## Known issues (noted, not fixed in this migration)

- **Release gate failed (`docs/ops/MANUAL-RELEASE-2026-10-30.md`):** the
  full predeploy run failed on `seats_test.ts` ("R2: coming back later the
  same day adds no second free day"): two concurrent `check_in_member`
  requests can both succeed and leave two active member sessions. Not fixed
  here; it matters once testing starts (and before any production use or
  seat automation).
- **`golden_test.ts` fails on `65d8f1a` itself** ("golden master differs";
  found in step 5, identical on an untouched export of the branch). Not
  caused by this migration, not fixed here.
- **CRLF on Windows:** the same document notes a CRLF/hashbang problem in a
  Windows checkout. `vps-deploy.sh` copies the working tree as it is; step
  5 (or step 12) checks the functions start from this laptop's files.
- **Function libraries load from `esm.sh`/`jsr` on first start;** after a
  restart that clears the Deno cache, the first call is slow.
- **The old server is the rollback for AlpenGlow** and has no host firewall
  (ufw gone since July; `DOCKER-USER` drops only 5432/6543). The PSS stack
  publishes nothing but `127.0.0.1:8010`, so it adds no open port.
- **Later move to the new server:** the stack folder, `.env` and data move
  with it; the `api` record is repointed then.

## Removing it again (if ever needed)

As `deploy`: `cd ~/projects/pss/backend && docker compose down -v`. As root
(you): `rm /etc/nginx/sites-enabled/api.perfectstudyspace.in
/etc/nginx/sites-available/api.perfectstudyspace.in /etc/nginx/conf.d/10-pss.conf`,
`nginx -t && systemctl reload nginx`, `rm -rf /home/deploy/projects/pss
/home/deploy/ops/projects/pss.conf`, `certbot delete --cert-name
api.perfectstudyspace.in`. You: delete the `api` DNS record. AlpenGlow is
not touched by any of this.

## Rules (from your brief)

- Ask before every step that changes anything (server, Cloudflare,
  Supabase, git). Pushing this folder's tracking files is pre-approved.
- Never print, paste, log or commit secrets, keys, connection strings,
  `.env` contents or customer data. You type secrets on the server.
- AlpenGlow on the old server (compose project `supabase`): keep it
  running and unchanged unless you approve a change (see Decisions; the
  rollback itself no longer needs protecting). Existing nginx site files:
  only add new ones, except the `travel` site removed in step 6b with your
  OK; `nginx -t` before every reload. No `01-base-setup.sh`, `apt upgrade`,
  `do-release-upgrade`, ufw/iptables/iptables-persistent changes.
- Multi-line remote scripts: here-string into `ssh <host> "tr -d '\r' | bash -s"`.
  Anything that reads stdin (`restore-public.sh`, `docker exec -i`,
  `psql < file`) runs as its own `ssh` call with `</dev/null`.
- Every report: what changed, evidence, risks, what is blocked, next step.

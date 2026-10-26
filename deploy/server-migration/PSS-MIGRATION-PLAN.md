# Perfect Study Space: Supabase cloud to VPS

Starts only after AlpenGlow has run on the new server for a week without
problems. The server kit for it is built and was rehearsed on 26 Oct 2026
(Phase 0); nothing has touched the live PSS project yet.

## Scope: `main` only

Only what the live site runs moves: the `main` branch's `api` function,
migrations 001 to 051 and the live data. The other branches
(`pss-ai/*`, `cloudflare/workers-autoconfig`) are not deployed anywhere,
are not touched by this move, and will get their own Supabase projects when
they are deployed. The cloud project `ozatixapvxwrwbpdxuzt` is used by the
live site alone, so after the move it is only a rollback copy and can be
retired after the rollback window.

## What the project is (checked in the repo, 26 Oct 2026)

| | |
|---|---|
| Repo | `Desktop\PSS\perfect-study-space`, GitHub `perfectstudyspacedev-sys/PerfectStudySpace` |
| Frontend | React + Vite on **Cloudflare Pages**, project `perfect-study-space`, serving both the staff site and `join.perfectstudyspace.in`. Security headers come from `public/_headers` (Cloudflare does not read `vercel.json`) |
| Supabase project | `ozatixapvxwrwbpdxuzt`, Postgres 17.6.1.127, region ap-northeast-1 |
| Backend | One edge function, `api` (5,827 lines, `verify_jwt = false`, CORS `*`). The frontend calls only `functions.invoke('api')`; it never reads tables directly |
| Database | `public` schema only, 51 migrations, 35 tables, extension `pgcrypto` |
| Not used by the code | Supabase Auth, Storage, Realtime, pg_cron, database webhooks |
| Function secrets | `STAFF_JWT_SECRET` (falls back to `JWT_SECRET`), `PUBLIC_SITE_KEY` |
| DNS | Cloudflare, proxied. `api.perfectstudyspace.in` is free |

New API address: `https://api.perfectstudyspace.in`.

Found while preparing (to confirm against the live project in Phase 1):

- **`overtime_sessions` has no row security.** It is the only one of the 35
  tables without it, so with the public key from the frontend bundle anyone
  can read and change it through the cloud REST API today. After the move
  it is unreachable (nginx exposes only `/functions/v1/`). The real fix is
  one PSS migration enabling row security on it; the `api` function uses
  the service role and is unaffected. Needs your go-ahead.
- **Old student photo bucket.** Migrations 002 and 010 created a public
  `student-photos` bucket for Aadhaar and ID photos. The current code no
  longer uses it, but the `aadhaar_photo_url` and `photo_url` columns are
  still there. If the bucket still holds files, those ID documents are
  publicly readable on the cloud project today. Decide in Phase 1: delete
  them, or move them (that would need the Storage service in the PSS stack).
- **`STAFF_JWT_SECRET` must be set explicitly.** If it is missing, the
  function signs staff logins with `JWT_SECRET`, which on the VPS is the
  stack's master secret (it also signs the service-role key).

## What it gets on the VPS

Its own stack in `~/projects/pss/backend`, created by
`new-server/add-project.sh` from `new-server/stack-template/`, sharing
nothing with AlpenGlow except the machine and the host nginx:

| | AlpenGlow | PSS |
|---|---|---|
| Folder | `~/projects/alpenglow-global/backend` | `~/projects/pss/backend` |
| Compose project, network | `supabase`, `supabase_default` | `pss`, `pss_default` |
| Containers | `supabase-*` (11, full stack) | `pss-db`, `pss-rest`, `pss-kong`, `pss-functions` |
| Gateway | `:8000`, dropped from the internet by the firewall unit | `127.0.0.1:8010` only |
| Database port | published by the pooler, dropped by the firewall unit | not published at all |
| Secrets | the old server's `.env` | new ones from `add-project.sh` (`.env`, `functions.env`) |
| nginx | `api.alpenglowglobal.com`, `/functions/v1/` and `/rest/v1/` | `api.perfectstudyspace.in`, `/functions/v1/` only |
| Rate-limit zones | `alpenglow_api`, `alpenglow_otp` | `pss_api` |
| Memory ceiling | about 4.6 GB (`docker-compose.limits.yml`; real use about 2 GB) | 2.2 GB (DB 768 MB, REST 384 MB, gateway 512 MB, functions 512 MB) |
| Function limits per request | 150 MB, 60 s (upstream default) | 256 MB, 150 s, as on Supabase cloud |
| Deploys | `deploy/vps-deploy.sh` in the AlpenGlow repo | `deploy/vps-deploy.sh` in the PSS repo |
| Backup and health check | `~/ops/projects/alpenglow-global.conf` | `~/ops/projects/pss.conf` |

`_migrations_applied` is created with row security on and no access for the
public roles (AlpenGlow's copy is still open; fix 2 in the runbook).

## Phase 0: the add-project kit — done

Built and rehearsed on 26 Oct 2026 in a sandbox (Ubuntu 24.04, nginx 1.24,
Docker) with the AlpenGlow stack running next to it:

- `add-project.sh pss api.perfectstudyspace.in 8010` created the stack and
  secrets, all 4 containers healthy; its second run switched on the TLS site.
- All 51 PSS migrations ran on the self-hosted Postgres 17 except 002, 010
  and 016, which touch Supabase Storage (absent here). This does not matter
  for the move, which restores a dump, but it is why `_migrations_applied`
  must be filled before the first deploy (Phase 2 step 5).
- The real `api` function from `main`: preflight 200, wrong password 401,
  staff login 200 with a signed token, `list_branches` with that token 200,
  without it 401.
- Through nginx: `/functions/v1/` works; `/rest/v1/`, `/`, Auth, Storage,
  Studio, `/pg/` and GraphQL all 404; a 200-request burst got 77 × 429 and
  normal traffic recovered.
- `pss/vps-deploy.sh` (the future PSS repo script) ran over SSH: functions
  synced without touching `main`, migrations skipped once recorded.
- Nightly backup, health check, and a full rebuild from a backup
  (`restore-public.sh`, counts matched for all 35 tables, login worked).

## Phase 1: inventory the live cloud project (read-only)

From the VPS, using the session-pooler connection string:

1. Count tables, rows per table, indexes, functions, triggers, RLS policies.
2. Confirm the "not used" list: `auth.users`, `storage.objects` (and the
   `student-photos` bucket above), `cron.job`, realtime publication,
   database webhooks, extensions.
3. Confirm whether `overtime_sessions` has row security off on the live
   project.
4. `supabase secrets list` to see which secret names are actually set.
5. Download the deployed `api` function and diff it against `main`. If they
   differ, stop and decide which one is right.

## Phase 2: build and rehearse (cloud stays live, nothing changes for users)

1. As root: `bash /root/new-server/add-project.sh pss api.perfectstudyspace.in 8010`.
   It starts the stack and serves only the certificate challenge.
2. Cloudflare, zone `perfectstudyspace.in`: A record `api` → the new server's
   IP, **DNS only** (grey cloud).
3. As root: `certbot certonly --webroot -w /var/www/html -d api.perfectstudyspace.in`,
   then run `add-project.sh` again with the same arguments to switch on the
   TLS site.
4. Copy the live data in, as `deploy`. The live database is the source of
   truth, not the migration files, in case anything was changed in the
   dashboard. `pss-db` has the matching `pg_dump` (Postgres 17):
   ```bash
   read -rs PSS_CLOUD_DB_URL     # paste the session-pooler URI; it holds the DB password
   docker exec pss-db pg_dump "$PSS_CLOUD_DB_URL" --schema=public --no-owner > ~/pss-cloud-public.sql
   unset PSS_CLOUD_DB_URL
   ~/ops/restore-public.sh pss-db ~/pss-cloud-public.sql
   ```
   Always `restore-public.sh`, never a plain `psql < dump` (see the runbook,
   "2. Database").
5. **Before the first deploy**, record 001 to 051 as applied. Otherwise the
   deploy script tries to replay them, and 002, 010 and 016 cannot run on
   this stack. From the PSS repo root on the laptop:
   ```bash
   { echo "INSERT INTO public._migrations_applied (filename) VALUES"; ls supabase/migrations/*.sql | xargs -n1 basename | sed "s/.*/  ('&'),/" | sed '$ s/,$/ ON CONFLICT DO NOTHING;/'; } \
     | ssh deploy@NEW_IP "docker exec -i pss-db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c 'CREATE TABLE IF NOT EXISTS public._migrations_applied (filename text PRIMARY KEY, applied_at timestamptz DEFAULT now()); ALTER TABLE public._migrations_applied ENABLE ROW LEVEL SECURITY; REVOKE ALL ON public._migrations_applied FROM anon, authenticated;' -f -"
   ```
   This was tested in the rehearsal (51 rows, then "no new migrations").
6. Function secrets, as `deploy`, in `~/projects/pss/backend/functions.env`:
   `STAFF_JWT_SECRET=` (the cloud value; a new one works, but every staff
   member must log in again) and `PUBLIC_SITE_KEY=` (must match what the
   signup site sends). Then `docker compose up -d functions`.
7. Add `deploy/vps-deploy.sh` to the PSS repo (copy of
   `deploy/server-migration/pss/vps-deploy.sh` in the AlpenGlow repo; a
   commit to PSS `main`, needs your OK). Deploy the function:
   `VPS_HOST=deploy@NEW_IP bash deploy/vps-deploy.sh`.
8. Compare every count from Phase 1 against `pss-db`. All must match.
9. Smoke-test from the laptop without DNS:
   `curl -s --resolve api.perfectstudyspace.in:443:NEW_IP https://api.perfectstudyspace.in/functions/v1/api -H 'content-type: application/json' -d '{"action":"login","username":"<staff>","password":"<password>"}'`
   and a full browser test through the hosts file.
10. Run the heaviest actions (reports, exports, month-end totals). The stack
    allows each request 256 MB and 150 s, the same as Supabase cloud; if one
    still hits the limit, raise `EDGE_WORKER_MEMORY_MB` /
    `EDGE_WORKER_TIMEOUT_MS` in `.env` and `docker compose up -d functions`.
11. `security-test.sh` from the PC with every table listed as locked (the
    command is in the script's header). Expected: every table 404, Studio and
    Auth paths 404, ports closed, a burst gets 429.
12. Prepare, but do not merge, the frontend change: a PSS branch from `main`
    with `deploy/server-migration/pss/frontend-csp.patch` applied (`git apply`;
    checked to apply cleanly to `main` at `cb7beeb`). It adds
    `https://api.perfectstudyspace.in` to `connect-src` and `img-src` in
    `public/_headers` and `vercel.json`, and keeps `https://*.supabase.co` so
    a rollback needs no code change. Without it the browser blocks every API
    call.

## Phase 3: cutover (about 15 minutes, outside opening hours)

1. Freeze writes: deploy a small "moving, back in 10 minutes" version of `api`
   to the cloud project. Every request goes through that one function, and
   only the live site uses the project, so nothing else is affected.
2. Final data: repeat Phase 2 step 4 into an emptied database, as `deploy`
   (`docker compose down`), as root (`rm -rf
   /home/deploy/projects/pss/backend/volumes/db/data`), as `deploy`
   (`docker compose up -d`, then the dump and `restore-public.sh`), then
   step 5, `docker compose restart rest functions`, and re-check counts.
3. Merge the CSP branch into PSS `main`. In Cloudflare Pages, project
   `perfect-study-space` → Settings → Variables, **Production** environment
   only: `VITE_SUPABASE_URL=https://api.perfectstudyspace.in` and
   `VITE_SUPABASE_ANON_KEY=` the `ANON_KEY` from `~/projects/pss/backend/.env`.
   Redeploy. Preview variables stay as they are.
4. Test (Phase 4). Anyone with the site still open sees the "moving" message
   until they refresh.

## Phase 4: verify

- Staff login works, on the staff site and after a refresh.
- Students, memberships, desks, lockers and bookings show the same numbers as
  before the move.
- Create and end a test session; add a food bill; record a payment.
- A signup request from `join.perfectstudyspace.in` arrives.
- Browser console shows no CSP errors.
- Health check passes and the next nightly backup contains `pss`.

## Rollback

Redeploy the real `api` function to the cloud project and put the two
Production variables back in Cloudflare Pages. Any data written on the VPS
in between has to be copied back by hand. Keep the cloud project for two
weeks; a paused free-tier project can still be restored for 90 days.

## Known risks

- **Lost secret values.** Supabase never shows a secret again. If
  `STAFF_JWT_SECRET` is not on record, a new one works but every staff member
  must log in again. `PUBLIC_SITE_KEY` must match whatever the signup site
  sends, so it has to be found there or changed on both sides.
- **Cloudflare proxy.** The `api` record must be DNS-only until the
  certificate exists.
- **CORS is `*` in the function.** Unchanged by the move; tightening it is a
  separate job.
- **Function libraries come from `esm.sh` at first start.** After any restart
  that clears the cache, call the function once while that site is reachable.
- **Migrations that need Storage.** A future PSS migration that touches
  `storage.*` will fail on this stack; the deploy script stops on it and
  applies nothing from that file.
- **Later merges of the `pss-ai` branches.** Their deploy guide
  (`docs/ops/DEPLOY.md` on those branches) targets a Supabase cloud project.
  When they reach `main`, their extra pieces (functions `cron` and `agent`,
  pg_cron and pg_net schedules, `CRON_SECRET`, `STUDENT_JWT_SECRET`,
  `AI_API_KEY`) have to be set up on the VPS stack instead.

Server-wide procedures that also cover this project: `DISASTER-RECOVERY.md`
and `UPDATE-PROCEDURE.md`.

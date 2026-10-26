# Server migration: progress

Read this at the start of every session (after `git checkout
claude/server-migration-kit` and `git pull`), and update it after every
finished step, then commit and push. Never write passwords, keys, tokens,
connection strings or customer data here.

## Current step

Ready, waiting for the new server (a new Contabo server).

In progress (26 Oct): read-only check of the old server. Steps 1 and 2
done (see Done). Waiting for your sudo output (sshd
`PasswordAuthentication`, "Accepted password" count, ufw, `DOCKER-USER`).

## Next step

Phase 1: base setup on the new server (`MIGRATION-RUNBOOK.md`, "Phase 1").
Not before your weekly usage reset on 1 Nov (~04:30 IST), in a fresh session.

## Done

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
- Multi-line remote commands from PowerShell: pipe a here-string into
  `ssh <host> "tr -d '\r' | bash -s"` (plain quoted commands get their
  quotes stripped). Bash scripts run in Git Bash.

## Waiting on me

Dates (your choice):

- [ ] Check the earliest cancellation date for the old server in the
      Contabo panel (16 Nov or 16 Dec).
- [ ] Choose the migration dates.

To start Phase 1:

- [ ] The new Contabo server: Ubuntu 24.04, 4 vCPU, 8 GB RAM, 100 GB disk,
      created with the laptop's public key (`~/.ssh/id_ed25519.pub`) as
      root's SSH key. Send its IP address.
- [ ] A fresh session on this laptop after 1 Nov ~04:30 IST.

Decisions still open (listed, not acted on):

- [ ] AlpenGlow fix 1: `trip_leads` behind an edge function (runbook,
      "Security fixes that need a code change").
- [ ] AlpenGlow fix 2: `_migrations_applied` row security and no public
      access.
- [ ] AlpenGlow fix 3: remove public write access on the CMS tables.
- [ ] PSS `overtime_sessions` has no row security: check on the live
      project first (PSS plan, Phase 1 step 3), then decide on the one-line
      migration.
- [ ] PSS old `student-photos` bucket may hold public Aadhaar/ID photos:
      delete or move.
- [ ] Old server: check `PasswordAuthentication`
      (`sudo sshd -T | grep -i passwordauthentication`).
- [ ] Old server: change the `deploy` sudo password.
- [ ] Old server housekeeping, only with your OK: clear the ~20 GB Docker
      build cache; remove the stopped container `tender_kowalevski`.

Recommended:

- [ ] Cloudflare R2 bucket for off-server backups.
- [ ] The backup passphrase in a password manager.
- [ ] An outside uptime monitor (`https://api.alpenglowglobal.com`, later
      `https://api.perfectstudyspace.in`).
- [ ] A second SSH key from another machine.

Later:

- [ ] A day before the AlpenGlow switch-over: lower the TTL of `api` in the
      `alpenglowglobal.com` zone to 5 minutes.
- [ ] The PSS inputs in `INPUTS-NEEDED.md` ("For PSS").

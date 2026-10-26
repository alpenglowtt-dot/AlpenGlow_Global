# Server migration: progress

Read this at the start of every session (after `git checkout
claude/server-migration-kit` and `git pull`), and update it at the end of
every sitting. Never write passwords, keys, connection strings or customer
data here.

## Current step

Ready, waiting for the new server.

## Next step

Phase 1: base setup on the new server (`MIGRATION-RUNBOOK.md`, "Phase 1").
Not before your weekly usage reset on 1 Nov (~04:30 IST), in a fresh session.

## Done

- **26 Oct 2026** Migration kit built and rehearsed end to end in a sandbox
  (commit `e6ce4aa`, see `README.md`).
- **26 Oct 2026** Old server checked: healthy; 27 `leads`, 72 `trip_leads`,
  11 migrations applied. Certificates valid until 17 Dec (`api`) and 24 Dec
  (`travel`).
- **26 Oct 2026** Readiness checks, all read-only, all passed:
  - SSH key `~/.ssh/id_ed25519` present (ed25519); `ssh deploy@169.58.43.191
    "echo ok"` answers `ok`.
  - Git Bash available (bash 5.2.37) for the `.sh` scripts.
  - Snapshot `vps-migration-backup/2026-10-05_1803` present; `SHA256SUMS`
    PASS (24 files, 0 failed); `host/root-only.SECRET.tar.gz` and
    `db/exact-row-counts.txt` present.
  - PSS repo `C:\Users\sriva\Desktop\PSS\perfect-study-space` reachable, on
    `main`, 51 migrations (001 to 051). `pss/frontend-csp.patch` passes
    `git apply --check` there. Local `main` (`bb3ec6a`) is 19 commits behind
    `origin/main` (`cb7beeb`, last fetched 23 Oct); the only uncommitted
    files are `.claude-flow/` tool folders.
  - Claude runs on the laptop that has the SSH key (remote control), so it
    can run the steps itself.
- **26 Oct 2026** This file created; billing-app decision recorded in
  `INPUTS-NEEDED.md`; session rule added to `CLAUDE.md`.

## Decisions made

- **Order.** AlpenGlow first: old VPS `deploy@169.58.43.191` to the new
  server. PSS about a week later: Supabase cloud project
  `ozatixapvxwrwbpdxuzt` to the same new server, as its own separate stack.
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

To start Phase 1:

- [ ] The new server: Ubuntu 24.04, 4 vCPU, 8 GB RAM, 100 GB disk, created
      with the laptop's public key (`~/.ssh/id_ed25519.pub`) as root's SSH
      key. Send its IP address.
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
- [ ] Before PSS Phase 2: OK to `git pull` PSS `main` (local is behind
      `origin/main`).
- [ ] The PSS inputs in `INPUTS-NEEDED.md` ("For PSS").

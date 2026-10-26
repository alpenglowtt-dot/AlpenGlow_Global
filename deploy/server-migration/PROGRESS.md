# Server migration: progress

Read this at the start of every session (after `git checkout
claude/server-migration-kit` and `git pull`), and update it after every
finished step, then commit and push. Never write passwords, keys, tokens,
connection strings or customer data here.

## Current step

Ready, waiting for the new server (a new Contabo server).

Finished on 26 Oct (see Done): read-only check of the old server, and its
hardening (new `deploy` password, password SSH login off).

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
- Never install `iptables-persistent` / `netfilter-persistent` on the new
  server: it uninstalls ufw (that is how the old server lost its firewall).
- Never run `do-release-upgrade` on the old server. The new server stays on
  Ubuntu 24.04 (the kit is built and rehearsed for it).
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
- [x] Old server: check `PasswordAuthentication`: checked 26 Oct, it was
      ON; switched off 26 Oct (`00-hardening.conf`).
- [x] Old server: the "Accepted password" count of 1 was our own check;
      no SSH password login in the logs (26 Oct).
- [x] Old server: today's `apt upgrade -y` (14:58 CET) was run by you
      (confirmed 26 Oct).
- [x] Old server: change the `deploy` sudo password (done 26 Oct).
- [ ] Old server: re-enable the Docker apt source left disabled by the
      aborted `do-release-upgrade` (rename `docker.list.disabled` back to
      `docker.list`, then `apt update`), only with your OK.
- [x] Old server: switch password SSH login off: done 26 Oct with
      `00-hardening.conf` (loaded before `50-cloud-init.conf`, which is
      left unchanged); tested by you after the reload.
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

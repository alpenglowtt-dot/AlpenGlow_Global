# Server migration: progress

Read this at the start of every session (after `git checkout
claude/server-migration-kit` and `git pull`), and update it after every
finished step, then commit and push. Never write passwords, keys, tokens,
connection strings or customer data here.

## Current step

AlpenGlow switch-over finished (2 Nov): `api` points at `84.247.184.195`
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
pushed (`9047ad7`, 02:56:57 IST). Current: final re-test (contact form,
trip planner, Compass; your dashboard login).
Until about 06:22 IST, browsers with the old cached `trip-planner.js`
cannot save trips (401); check Kong for such 401s after 06:22.

## Next step

Security fixes 1, 2, 3 are deployed, tested (`security-test.sh` 0 FAIL)
and on `main`. Left: re-run the final re-test (contact form, trip planner
final submit, Compass chat, your dashboard login) with times noted, and
let Claude confirm them in the counts and Kong log. Optional later: a
version tag on `trip-planner.js` in `index.html` (4 h browser cache);
remove the unused Supabase CDN script from `index.html`; `www` answers
Cloudflare 522. Later: Phase 6 (last `pull-backup.sh` of the
old server with `VPS_HOST=deploy@169.58.43.191`, then cancel it, delete
the `travel` DNS record, `ssh-keygen -R 169.58.43.191`), then the PSS
move.

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

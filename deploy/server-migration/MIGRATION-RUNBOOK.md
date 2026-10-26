# VPS migration runbook

Old server: `deploy@169.58.43.191` (Ubuntu 24.04, 4 vCPU, 8 GB RAM, 96 GB disk, 37 GB used).
Snapshot taken 2026-10-05. Re-pull any time with `bash pull-backup.sh`.

This runbook and the `new-server/` kit live in git. The snapshots do not:
they hold plaintext secrets and customer data (leads, invoices), so they
stay in the `vps-migration-backup` folder on the laptop, out of git, cloud
sync and shared drives. `pull-backup.sh` refuses to write into a git
checkout.

PSS moves onto the same server afterwards: `PSS-MIGRATION-PLAN.md`.

## Rehearsal, 26 October 2026

Phase 2 was run end to end in a disposable Ubuntu 24.04 sandbox with Docker
and nginx 1.24 (not the new server), with the 5 Oct snapshot, the real
`.env` (every third-party token swapped for a dummy) and the PSS stack
running next to it:

- All 11 AlpenGlow containers and the 4 PSS containers ran side by side: no
  clash of names, networks, volumes or ports.
- The restore gave the same row counts as the old server for all 11 public
  tables, all 23 RLS policies and all 4 functions, and the `otp-24h-cleanup`
  job came back. The anon key in `AlpenGlow/api.js` works unchanged.
- A plain restore silently re-opened table permissions that migrations 007
  and 009 had closed. Phase 2 now restores through `restore-public.sh`,
  which gave permissions identical to the old server (see "2. Database").
- The memory caps applied cleanly and Kong ran on two workers (145 MB
  instead of 274 MB).
- The new nginx site file and `security-test.sh`: everything PASS except
  the `trip_leads` and `_migrations_applied` rows (fixes 1 and 2 below,
  still to do) and ports 8000/8443 (the sandbox has no firewall).
- The nightly backup covered both projects, and a backup restored into a
  scratch database with matching counts.

Not covered, because a sandbox cannot do it: ufw, the Docker port block,
sshd, swap, unattended upgrades, the pooler (the sandbox could not raise its
open-file limit; it ran fine on the old server), real certificates and DNS.
Phase 2 on the new server is still the real test. Do it before touching DNS.

## Change of plan: travel-app is not moving

Decided after the snapshot: travel-app will not be hosted on the new server.
The descriptions of the old server below still mention it; the steps for the
new server (Phases 2 to 6) already leave it out:

- No `travel-app.tar.gz`, no `billing_admin` role, no billing restore, and
  only the `api.alpenglowglobal.com` nginx site.
- Row-count check: only the `public.*` lines.
- Only the `api` DNS record moves. `travel.alpenglowglobal.com` keeps
  pointing at the old server until that app is retired or rehosted.
- The ops scripts exclude travel-app.

The billing data (1 customer, 2 invoices) stays safe in every snapshot as
`db/app-billing-schema+data.sql`. It dies with the old server unless it is
restored somewhere, so decide its fate before the old server is cancelled.

## What is on the old server

Two independent Docker Compose projects behind one host nginx:

| | Supabase backend | travel-app (billing) |
|---|---|---|
| Domain | `api.alpenglowglobal.com` | `travel.alpenglowglobal.com` |
| Path on server | `~/projects/alpenglow-global/backend` | `~/projects/travel-app` |
| Compose project | `supabase` (11 containers) | `travel-app` (3 containers) |
| nginx proxies to | `127.0.0.1:8000` (Kong) | `127.0.0.1:8091` (web), `127.0.0.1:8090` (`/api/`) |
| Data | `public` schema in Postgres | `billing` schema in the same Postgres, role `billing_admin` |
| Images | pulled, pinned tags | built on the server from source |
| Local source | `Desktop\AlpenGlow WEB\AlpenGlow work` | `Desktop\AlpenGlow WEB\travel-app` |

travel-app joins the Supabase Docker network (`supabase_default`) to reach
`supabase-db`. So Supabase must be up first, and both must move together.

Host pieces: nginx 1.24 with two site files, certbot (nginx plugin, ECDSA
certs, auto-renew timer), ufw (SSH, 80, 443), fail2ban (default sshd jail),
`iptables-persistent`, sshd with root login and password login disabled.
Timezone `Europe/Berlin`. No user crontab. The only scheduled app job is
inside Postgres: pg_cron `otp-24h-cleanup`, hourly.

Pinned images: `supabase/postgres:17.6.1.136`, `supabase/edge-runtime:v1.74.0`,
`kong/kong:3.9.1`, `supabase/gotrue:v2.189.0`, `postgrest/postgrest:v14.12`,
`supabase/realtime:v2.102.3`, `supabase/storage-api:v1.60.4`,
`supabase/supavisor:2.9.5`, `supabase/postgres-meta:v0.96.6`,
`supabase/studio:2026.07.07-sha-a6a04f2`, `darthsim/imgproxy:v3.30.1`.
These are already written in the saved `docker-compose.yml`, so the new
server gets identical versions.

Data size is tiny: the `postgres` database is 12 MB. Storage buckets and
`auth.users` are empty.

## What is in a snapshot folder

| Path | Contents |
|---|---|
| `files/alpenglow-global.tar.gz` | The whole backend dir: live `.env`, compose files, `volumes/` (Kong config, DB init SQL, all functions including `main`), plus `repo/` and `deploy-scripts/`. Excludes the raw Postgres data dir. |
| `files/travel-app.tar.gz` | Full source, Dockerfiles, compose file, `server/.env`, deploy scripts. |
| `files/deploy-home-dotfiles.tar.gz` | `authorized_keys` (2 keys), shell history. |
| `db/app-public-schema+data.sql` | **Restore this.** `public` schema: tables, functions, RLS policies, grants, data. |
| `db/app-billing-schema+data.sql` | **Restore this.** `billing` schema, same. |
| `db/globals-roles.sql` | All roles with password hashes. Only the `billing_admin` lines are needed. |
| `db/exact-row-counts.txt` | Counts to compare after restore. |
| `db/full-cluster-dumpall.sql.gz`, `db/*.dump` | Full fallback dumps of everything, including Supabase internals. |
| `db/postgresql-custom-config-volume.tar.gz` | The `supabase_db-config` Docker volume. |
| `host/etc-readable.tar.gz` | nginx config, certbot renewal config, sshd, fail2ban, cron. |
| `host/system-inventory.txt`, `apt-manually-installed.txt` | OS, ports, services, packages. |
| `docker/` | Container list, image digests, resolved compose configs, full `docker inspect`. |
| `SHA256SUMS` | Checksums of every file in the snapshot. |

The first snapshot (`2026-10-05/`) also has `extracted/` (the archives
unpacked) and `db/snapshot-cron-grants-policies.txt`. It has no
`exact-row-counts.txt`; use the one from `2026-10-05_1803/` or a later pull.

### Not captured

- **travel-app Docker images** (the extraction image is 2.9 GB). They are
  rebuilt from the saved source.
- **`supabase_deno-cache` volume.** It is a download cache and refills itself.
- **Raw Postgres data directory.** Not readable, and a file copy of a running
  database is unsafe anyway. The SQL dumps replace it.

### Root-only files (captured 2026-10-07)

Saved in `2026-10-05_1803/host/`, fetched with sudo and streamed straight to
the laptop:

- `root-only.SECRET.tar.gz`: `/etc/letsencrypt` in full (both certificates,
  their private keys and the certbot account), `/etc/ufw`, `/etc/iptables`,
  `/etc/ssh/sshd_config.d`, `/etc/sudoers` and `/etc/sudoers.d`.
- `root-firewall-and-state.txt`: live `iptables-save`, `nft` ruleset, root
  crontab (none) and Docker log sizes.

`pull-backup.sh` does not re-fetch these. They only change when certbot
renews (next around 2026-11-17), and the saved certs stay valid until
2026-12-17 (api) and 2026-12-24 (travel).

With the saved certificates, the new server serves valid HTTPS before DNS
moves, so it can be tested fully and cut over with no TLS gap.

**The database-port block is on the server, not at the provider.** The pooler
publishes Postgres on `0.0.0.0:5432` and `:6543`, and these two rules in
`/etc/iptables/rules.v4` (loaded at boot by `iptables-persistent`) keep them
off the internet:

```
-A DOCKER-USER -i eth0 -p tcp -m tcp --dport 6543 -j DROP
-A DOCKER-USER -i eth0 -p tcp -m tcp --dport 5432 -j DROP
```

ufw does not filter Docker-published ports, so the new server needs these
same rules (check the interface name is still `eth0`) or the localhost
binding described in Phase 1. They have dropped about 4,500 connection
attempts so far.

**Unverified:** `/etc/ssh/sshd_config.d/50-cloud-init.conf` contains
`PasswordAuthentication yes` and is read before the lines that say `no`.
sshd keeps the first value it reads, so password login may be enabled on the
old server. Check with `sudo sshd -T | grep -i passwordauthentication`. On
the new server, delete or fix that file.

## Phase 1: prepare the new server

Fresh Ubuntu 24.04 with 4 vCPU, 8 GB RAM, 100 GB disk (room for both
projects), created with the laptop's SSH key as root's key. From the AlpenGlow
repo root on the laptop:

```bash
scp -r deploy/server-migration/new-server root@NEW_IP:/root/new-server
ssh root@NEW_IP "find /root/new-server -type f -exec sed -i 's/\r$//' {} + ; bash /root/new-server/01-base-setup.sh"
```

The `sed` strips Windows line endings, which make scripts fail on Linux.
`.gitattributes` already keeps them out of these files; the `sed` is a
second guard.

`new-server/01-base-setup.sh` is safe to re-run. It has not run on a real
server yet; this is its first test (its nginx and ops parts were exercised in
the rehearsal). It sets up:

- nginx, certbot, fail2ban, Docker, timezone `Europe/Berlin`
- the `deploy` user with the saved `authorized_keys` (no password yet)
- key-only SSH through a `00-hardening.conf` that overrides cloud-init
- ufw: default deny, allow SSH, 80, 443
- a systemd unit that drops 5432, 6543, 8000 and 8443 from the internet after
  every Docker start
- Docker log limits (20 MB x 5 per container), 2 GB swap
- automatic security patches with a reboot at 23:30 server time when needed
- the ops scripts in `/home/deploy/ops` (not scheduled yet) and AlpenGlow's
  entry in `~/ops/projects/`; `add-project.sh` adds the PSS entry later
- nginx rate-limit zones that belong to AlpenGlow alone (`alpenglow_api`,
  `alpenglow_otp`), so PSS traffic never uses up AlpenGlow's allowance

Root key login stays on during the migration. `deploy` cannot sudo until it
has a password, so every `sudo` command below is run as root instead.

Check before going on: log in as `deploy@NEW_IP` with the key. Once the stack
is up in Phase 2, confirm from the laptop that 5432, 6543, 8000 and 8443 are
closed.

## Phase 2: restore and rehearse (old server still live)

Copy a snapshot to the new server as `~/snapshot`, then as `deploy`:

```bash
mkdir -p ~/projects && cd ~/projects
tar xzf ~/snapshot/files/alpenglow-global.tar.gz
chmod 600 ~/projects/alpenglow-global/backend/.env

# 1. Supabase. Same .env means same JWT secret, so the anon key already in
#    the frontend keeps working and no frontend change is needed.
cd ~/projects/alpenglow-global/backend
# Supabase Auth is unused by the site but accepted sign-ups on the old
# server (phone sign-up even auto-confirmed). Switch it off before first start.
cp .env .env.from-old-server
sed -i -E 's/^DISABLE_SIGNUP=.*/DISABLE_SIGNUP=true/; s/^ENABLE_EMAIL_SIGNUP=.*/ENABLE_EMAIL_SIGNUP=false/; s/^ENABLE_PHONE_SIGNUP=.*/ENABLE_PHONE_SIGNUP=false/; s/^ENABLE_PHONE_AUTOCONFIRM=.*/ENABLE_PHONE_AUTOCONFIRM=false/' .env
docker compose pull && docker compose up -d
docker compose ps                      # wait until all are healthy

# Memory caps and two Kong workers, so AlpenGlow and PSS cannot starve each
# other. As root first:
#   cp /root/new-server/alpenglow/docker-compose.limits.yml /home/deploy/projects/alpenglow-global/backend/
#   chown deploy:deploy /home/deploy/projects/alpenglow-global/backend/docker-compose.limits.yml
sed -i 's/^COMPOSE_FILE=.*/COMPOSE_FILE=docker-compose.yml:docker-compose.override.yml:docker-compose.limits.yml/' .env
docker compose up -d
docker stats --no-stream              # every container shows a limit; Kong well under 512 MB

# 2. Database. Always through restore-public.sh, never a plain psql < dump:
#    see the note below.
S=~/snapshot/db
~/ops/restore-public.sh supabase-db "$S/app-public-schema+data.sql"
# the pg_cron job lives outside the public schema; migration 008 recreates it and is safe to re-run
docker exec -i supabase-db psql -U postgres -d postgres < ~/projects/alpenglow-global/repo/migrations/008_otp_auto_cleanup.sql
docker compose restart rest functions
```

**Why the script.** A fresh Supabase database automatically gives the public
roles (`anon`, `authenticated`) full access to every new table in `public`,
and `pg_dump` does not record that a grant was later taken away. In the
rehearsal, a plain restore gave the public key full permissions on `leads`,
`lead_activities`, `follow_ups` and `otp_verifications` again (locked by
migration 007), and DELETE and TRUNCATE on `trip_leads` (removed by 009).
Row security still hid the rows, so the security test passed, but one of
the two locks was silently gone. `restore-public.sh` switches the automatic
grants off while the dump creates its tables and back on afterwards. With
it, the permissions came out identical to the old server for all 11 tables.

The script prints each table's public-role permissions. They must read:

| Table | Public roles |
|---|---|
| `leads`, `lead_activities`, `follow_ups`, `otp_verifications` | none |
| `trip_leads` | `anon=arw` (insert, select, update) |
| `packages`, `package_pages`, `blog_posts`, `offers`, `destinations`, `_migrations_applied` | full (fixes 2 and 3 below change this) |

Expected noise, which the script reports but does not treat as failure:
`schema "public" already exists` (once) and `permission denied to change
default privileges` (12 times; the dump re-states `supabase_admin`'s built-in
defaults, which the fresh database already has). The script stops with
`UNEXPECTED ERRORS` on anything else; read its log before going further.

Check the data (public tables only; billing is not moving):

```bash
grep '^public\.' $S/exact-row-counts.txt > ~/expected-counts.txt
for t in $(cut -d' ' -f1 ~/expected-counts.txt); do echo "$t $(docker exec supabase-db psql -U postgres -d postgres -X -tAc "select count(*) from $t")"; done | diff - ~/expected-counts.txt && echo COUNTS MATCH
docker exec supabase-db psql -U postgres -d postgres -c "select jobname, schedule, active from cron.job"
docker exec supabase-db psql -U postgres -d postgres -tAc "select count(*) from pg_policies where schemaname = 'public'"   # 23
```

nginx and TLS:

```bash
# as root. Certificates, keys and the certbot account from the old server:
tar xzf /home/deploy/snapshot/host/root-only.SECRET.tar.gz -C / etc/letsencrypt
# The hardened site file from the kit, NOT the old server's one:
cp /root/new-server/nginx/api.alpenglowglobal.com /etc/nginx/sites-available/
ln -s /etc/nginx/sites-available/api.alpenglowglobal.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

The new site file lets only `/functions/v1/` and `/rest/v1/` through and
rate limits them. The old one passed every path to Kong. While testing in
the browser, watch the console for any request to another path that now
gets a 404; if the site turns out to need one, add that path to the file
instead of opening everything.

Test the new server from your laptop without changing DNS:

```bash
curl -s --resolve api.alpenglowglobal.com:443:NEW_IP "https://api.alpenglowglobal.com/rest/v1/packages?select=id" -H "apikey: <anon key from api.js>"
```

For a full browser test, add `api.alpenglowglobal.com` with `NEW_IP` to
`C:\Windows\System32\drivers\etc\hosts`, test, then remove it.

## Phase 2b: switch on backups and health checks

After the rehearsal passes, as `deploy` on the new server:

```bash
~/ops/backup-nightly.sh            # first backup by hand; must end with "ok"
~/ops/healthcheck.sh               # prints and emails any failing check
crontab ~/ops/crontab.deploy
```

Before DNS moves, the health check reports the public domain as it sees it,
which is still the old server. That is expected.

Then copy the backup passphrase off the server, from the PC:

```bash
scp deploy@NEW_IP:ops/backup.passphrase ./backup-passphrase.SECRET.txt
```

Put it in your password manager too. Off-server backups are encrypted with
it and cannot be opened without it.

What runs from then on:

| When (server time) | What |
|---|---|
| every 5 min | `healthcheck.sh`: for every project in `~/ops/projects/`, its containers, Postgres, API, domain and certificate expiry; for the server, disk, memory, load and backup age. Emails `AGENCY_EMAIL` through Resend when something changes. |
| 22:30 daily | `backup-nightly.sh`: for every project, its `public` schema, roles and full-cluster dumps, row counts, `.env`, compose files, Kong config and functions, in `~/backups/<date>/<project>/`; plus nginx and ops settings. Keeps 14 days. |
| 23:30 when needed | reboot after kernel or libc patches |
| Sunday 04:15 | clear Docker build cache older than a week |

Off-server copy (needs a bucket, for example Cloudflare R2): run
`rclone config` once to create a remote named `r2`, then set
`RCLONE_REMOTE="r2:<bucket>"` in `~/ops/ops.env`. Until then backups live only
on the server and do not survive a dead disk.

Restore test: the rehearsal in Phase 2 is the first one. Repeat it a few
times a year by restoring a nightly `<project>/public.sql.gz` into a scratch
database and comparing against that night's `<project>/row-counts.txt`.

## Audit before cutover

Run from the AlpenGlow repo root on the PC against the new server, before
DNS moves:

```bash
bash deploy/server-migration/new-server/security-test.sh api.alpenglowglobal.com <anon key> NEW_IP --burst
```

Baseline on the old server, 7 October 2026: 10 FAIL. The new server must
show 0 FAIL, except the two table rows listed under "Security fixes that
need a code change" until those are done.

| Check | Old server | New server must show |
|---|---|---|
| `leads`, `lead_activities`, `follow_ups`, `otp_verifications` closed to the public key | PASS | PASS |
| `trip_leads` closed to the public key | FAIL: 71 rows readable | PASS after fix 1 below |
| `_migrations_applied` closed to the public key | FAIL: 11 rows readable | PASS after fix 2 below |
| Studio (`/`, `/project/default`) not reachable | FAIL: password prompt on the internet | PASS |
| Auth (`/auth/v1/...`) not reachable | FAIL: reachable, sign-up open | PASS |
| Storage and analytics not reachable | FAIL | PASS |
| Ports 5432, 6543 closed | PASS | PASS |
| Ports 8000, 8443 closed | FAIL: open | PASS |
| TLS 1.0 and 1.1 refused | PASS | PASS |
| Rate limiting answers 429 under a burst | none | PASS |

Also in the audit, on the server:

- `sshd -T | grep -i passwordauthentication` prints `no`.
- `ls -l` shows mode 600 on every `.env`, `ops.env` and `backup.passphrase`.
- A nightly backup restores into a scratch database with matching counts.
- An alert email arrives when a container is stopped on purpose.
- Everything comes back after `reboot`, including the firewall unit
  (`iptables -S DOCKER-USER`).
- Kong runs with two workers inside its memory cap without restarting.

## Security fixes that need a code change

Found by testing the live system. They exist today and move with the data
unless fixed. Each needs your go-ahead because it changes the app.

1. **`trip_leads` is readable by anyone with the public key.** All 71
   trip-planner submissions (name, phone, email, budget, destination) can be
   listed, and any row can be changed. Migration 009 documents this as a
   known follow-up. Fix: send the trip planner's saves through an edge
   function using the service role, as `submit-lead` already does for
   `leads`, then remove the public key's access to the table. Touches
   `trip-planner.js`, one function and one migration.
2. **`_migrations_applied` is readable and writable by the public key.** It
   has no row security. Someone could delete its rows, and the next deploy
   would then re-run every migration. Fix: one migration that enables row
   security on it and revokes the public roles; `vps-deploy.sh` should
   create it that way from the start.
3. **The CMS tables accept writes from the public key** (`packages`,
   `package_pages`, `blog_posts`, `offers`, `destinations`), as
   `PRODUCTION_SECURITY.md` already records. Nothing legitimate writes them
   any more: `dev.html` edits local files and the site reads
   `data/bundle.js` and `data/*.json` (checked 26 Oct; the only table the
   frontend touches is `trip_leads`). Fix: one migration that removes the
   public roles' write access and write policies on those five tables.
   Reads stay, so the health check's probe on `packages` keeps working.

Fixes 2 and 3 are small and safe to do before cutover. Fix 1 should be done
before or straight after.

## Phase 3: cutover

1. A day before: lower the DNS TTL of `api` to 300 seconds.
2. Stop new writes on the old server so no lead lands there after the final
   dump: `ssh deploy@169.58.43.191 "cd ~/projects/alpenglow-global/backend && docker compose stop kong"`.
   Site forms are down from here until step 5. (This also stops the old
   server's billing app, which shares that gateway's network.)
3. Final data: `bash pull-backup.sh` (from the `vps-migration-backup`
   folder, never inside the repo), copy the new snapshot to the new server.
4. Reset the rehearsal database and restore the final dump:
   ```bash
   cd ~/projects/alpenglow-global/backend && docker compose down
   rm -rf volumes/db/data && docker compose up -d      # as root
   # then repeat "2. Database" from Phase 2 with the new snapshot
   ```
5. Change the `api` DNS A record to the new IP. It currently resolves
   straight to the server IP (not proxied).
6. Run the checks in Phase 4.

Expected downtime for forms: roughly 10 to 15 minutes. The public site
itself is on Cloudflare Pages and stays up throughout.

## Phase 4: verify

- Homepage and a package page load CMS data, no console errors.
- Contact form and trip planner each create a row in `leads` / `trip_leads`.
- Email OTP arrives. WhatsApp OTP arrives for an Indian and a non-Indian number.
- `dashboard.html` logs in and shows the existing 26 leads.
- Compass chat answers.
- `sudo certbot renew --dry-run` succeeds.
- From the laptop: ports 5432 and 6543 are closed on the new IP.
- `docker compose logs --tail 50 functions` shows no errors.

## Phase 5: update everything that names the old server

Hard-coded `169.58.43.191`:

| Project | File |
|---|---|
| AlpenGlow work | `deploy/vps-deploy.sh` line 20 (`VPS_HOST`) |
| AlpenGlow work | `scripts/setup-new-laptop.sh` line 34 (message text) |
| travel-app | `deploy/vps-deploy.sh` (`VPS_HOST`) |
| travel-app | `deploy/vps-app-deploy.sh` line 22 (`VPS_HOST`) |
| travel-app | `deploy/enable-tls.sh` lines 5, 17, 29 |
| this folder | `pull-backup.sh` default `VPS_HOST` |

Also: `ssh-keygen -R 169.58.43.191` on each laptop, and add each laptop's
public key on the new server.

Nothing to change if the domains stay the same: the four frontend files
(`api.js:22`, `compass.html:426`, `dashboard.html:2245`, `trip-planner.js:12`)
use `https://api.alpenglowglobal.com`, the anon key stays valid, the Meta
WhatsApp webhook URL is unchanged, and `ALLOWED_ORIGINS` lists only site
origins. Resend, Groq and WhatsApp keys move inside `.env`.

## Phase 6: rollback and decommission

Keep the old server untouched for one to two weeks. To roll back, point the
`api` A record back and run `docker compose start kong` on the old server.
Any leads created on the new server in between must be copied back by hand.
Before cancelling the old server, take one last `pull-backup.sh` snapshot.

## Server duties: old server versus new setup

| Duty | Old server | New setup |
|---|---|---|
| PostgreSQL hosting | Postgres 17 container | Same image and config |
| REST API, Realtime, Storage, Auth services | Running (Realtime, Storage, Auth unused by the site) | Same |
| Edge Functions | 10 functions, `vps-deploy.sh` | Same; restored from the snapshot |
| API gateway / reverse proxy | Kong behind nginx | Same nginx site files |
| SSL setup and renewal | certbot timer, working | Certs and certbot account restored; same timer |
| DNS | Two A records on Cloudflare | Repointed at cutover |
| Row Level Security | 26 policies, 13 tables | In the dump; counts verified |
| Connection pooling | Supavisor, 100 max connections | Same |
| Container management | Restart `unless-stopped`, health checks | Same |
| JWT and secrets | `.env`, world-readable | Same values, mode 600, in the nightly backup |
| Firewall and hardening | ufw + DB ports dropped; Kong ports open; password SSH possibly on | ufw + DB and Kong ports dropped; password SSH forced off |
| Security patching | Installed, never rebooted (79 days) | Installed, reboots at 23:30 when needed |
| Logs | nginx rotated; Docker logs unlimited (one at 240 MB) | Docker logs capped at 100 MB per container |
| Disk space | No alert; 13 GB stale build cache | Alert at 80%; weekly cache prune |
| Health checks | Docker only, nobody told | Email alert every time state changes |
| Memory | No swap | 2 GB swap; alert under 300 MB free |
| Database backups | None | Nightly, 14 days kept; off-server once a bucket is set |
| Restore testing | Never | Rehearsal restore with row-count check |
| Monitoring and uptime | None | On-server checks; an outside uptime monitor is still needed for "server is down" |
| Deployment | Two hand-run scripts | Same scripts, new address |
| Supabase / Docker image updates | Manual, pinned versions | Still manual, by design |
| PostgreSQL tuning | Supabase defaults | Same; fine at 12 MB |
| Point-in-time recovery | Off | Still off; worst case loses one day of data |
| High availability | Single server | Still single server |
| SMTP for Supabase Auth | Placeholder values | Unchanged; unused, the site emails through Resend |
| CI/CD | None | None |
| Central log collection | None | None |

## Migration checklist coverage

Checked against the live server on 2026-10-07.

| Area | Status | Detail |
|---|---|---|
| PostgreSQL dump and restore | Ready, restore untested | Dumps taken and verified; restore runs first in Phase 2 |
| Tables and data | Ready | 15 tables; row counts in the dump match live |
| Indexes | Ready | 19 in dump, 19 live |
| Functions | Ready | 6 in dump, 6 live |
| Triggers | Ready | 4 in dump, 4 live |
| RLS policies | Ready | 26 policies and 13 RLS tables in dump, same live |
| Database extensions | Ready | `pgcrypto`, `uuid-ossp`, `pg_net`, `supabase_vault` ship with the image; `pg_cron` and its job come back by re-running migration 008 |
| Auth users | Nothing to move | 0 users, 0 identities |
| Auth configuration | Ready | Lives in `.env`, copied as-is |
| OAuth | Nothing to move | No providers enabled |
| Storage files | Nothing to move | 0 objects |
| Storage buckets | Nothing to move | 0 buckets |
| Edge Functions | Ready | In the snapshot, identical to the repo, plus the server-only `main` |
| Function secrets | Ready | In `.env` and `docker-compose.override.yml` |
| Environment variables | Ready | Both projects' `.env` files copied |
| Supabase URL | No change | Frontend uses `https://api.alpenglowglobal.com`, which moves with DNS |
| Supabase keys | No change | Same `JWT_SECRET`, so the anon key in the frontend stays valid |
| DNS | To do at cutover | Two A records on Cloudflare |
| SSL | Ready | Certificates and keys saved, valid to mid-December |
| Webhooks | No change | Meta WhatsApp callback uses the domain; no database webhooks exist |
| CORS | No change | `ALLOWED_ORIGINS` lists site origins only |
| SMTP | Not needed | Site email goes through Resend; Supabase Auth email is unused |
| Realtime | Nothing to move | Service runs; no tables published and the site does not use it |
| Database connections | Ready | Pooler config copied |
| Backups | Built, untested | `backup-nightly.sh`; off-server copy needs a bucket |
| Monitoring | Built, untested | `healthcheck.sh`; outside uptime monitor still to add |
| Security | Built, untested | `01-base-setup.sh` |
| Deployment | Ready | Docker setup copied; update `VPS_HOST` in the deploy scripts |
| Testing | To do | Phase 4 list; OTP and login checks need a person |
| Cutover | Planned | Phase 3 |
| Rollback | Planned | Phase 6; old server kept one to two weeks |

## Related procedures

- `DISASTER-RECOVERY.md`: rebuilding everything on a new server from the
  off-server backup.
- `UPDATE-PROCEDURE.md`: how Ubuntu, Docker and the Supabase images get
  updated, and how to roll an update back.
- `PSS-MIGRATION-PLAN.md`: moving Perfect Study Space onto the same server.
- `INPUTS-NEEDED.md`: what is still needed from you.

## After cutover

0. Update `deploy/README.md` and the deploy section of `CLAUDE.md` in the
   AlpenGlow repo so they describe the new server.
1. `passwd deploy` on the new server, then set `PermitRootLogin no` in
   `/etc/ssh/sshd_config.d/00-hardening.conf` and `systemctl reload ssh`.
2. Set up the off-server backup remote (Phase 2b).
3. Add an outside uptime monitor on `https://api.alpenglowglobal.com`
   (and on `https://api.perfectstudyspace.in` once PSS has moved).
4. The old server's `deploy` sudo password was shared in chat on 2026-10-07.
   Change it if the old server stays up for the rollback window.

## Things noticed on the old server

- Kong's ports 8000 (plain HTTP) and 8443 are reachable from the internet,
  bypassing nginx. The new server's firewall unit closes them.
- `GOOGLE_SHEETS_WEBHOOK_URL` is empty in `.env`, so the Google Sheets copy
  of leads is currently switched off.
- `.env` in the backend dir is world-readable (mode 664). Use 600 on the new
  server.
- The WhatsApp template is named `alpenglow_otp_verfication` (that spelling).
  It is the real template name at Meta, so do not correct it.
- `deploy/README.md` in the AlpenGlow repo describes `/opt/supabase`. The live
  path is `~/projects/alpenglow-global/backend`.
- `~/projects/travel-app/-p` is an empty stray directory from a mistyped
  `mkdir -p`. Safe to drop.

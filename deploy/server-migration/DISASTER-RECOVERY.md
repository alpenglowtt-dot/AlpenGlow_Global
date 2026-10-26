# The server is gone: rebuild procedure

For when the VPS is dead, wiped, locked by the provider or compromised, and
the old server and the Supabase projects no longer exist as a fallback.
Not rehearsed on a real server yet. Its core, restoring a nightly backup
into a stack and matching the row counts, was rehearsed for both projects on
26 Oct 2026 (see the runbook).

## What you need, and where it must already be

| Thing | Where it lives | If it is missing |
|---|---|---|
| Last night's backup, encrypted (`<date>.tar.gpg`) | The R2 bucket | You fall back to your last manual copy; everything since is lost |
| The backup passphrase | Your password manager and the `vps-migration-backup` folder | The R2 backups cannot be opened at all |
| The `new-server` kit and these procedures | The AlpenGlow repo on GitHub (`deploy/server-migration/`) | The server must be configured by hand from the runbook |
| The `vps-migration-backup` snapshot folder | This PC, your hard disk | No copy of the original stack files or certificates |
| An SSH key that the new server accepts | This PC, plus a second machine | Use the provider's web console |
| Logins: hosting provider, Cloudflare, R2 | Your password manager | No way in |

Worst-case data loss with all of the above in place: everything written
since 22:30 server time the night before.

## Steps

1. **Buy a replacement server** (Ubuntu 24.04, same size) with your SSH key
   as root's key.
2. **Base setup.** From the AlpenGlow repo root on the PC:
   ```bash
   scp -r deploy/server-migration/new-server root@NEW_IP:/root/new-server
   ssh root@NEW_IP "find /root/new-server -type f -exec sed -i 's/\r$//' {} + ; bash /root/new-server/01-base-setup.sh"
   ```
3. **Fetch and open the newest backup.** On the PC (or the server), with
   rclone configured for the bucket and the passphrase in a file:
   ```bash
   rclone lsf r2:<bucket> | sort | tail -3
   rclone copy r2:<bucket>/<date>.tar.gpg .
   gpg --batch --pinentry-mode loopback --passphrase-file backup.passphrase -d <date>.tar.gpg | tar xf -
   ```
   Put the old passphrase back at `/home/deploy/ops/backup.passphrase` on the
   new server so old and new backups open with the same one.
4. **Recreate each project's stack.** A night's backup holds one folder per
   project (`<date>/alpenglow-global/`, `<date>/pss/`) and
   `server-config.tar.gz` (nginx sites and zones, `~/ops/ops.env`,
   `~/ops/projects/`).
   - AlpenGlow: the stack definition is in `files/alpenglow-global.tar.gz`
     of any snapshot in the `vps-migration-backup` folder. Unpack it, then
     unpack `<date>/alpenglow-global/config.tar.gz` in `~` (as `deploy`);
     it overwrites `.env`, the compose files (memory caps included), the
     Kong config and the functions with last night's versions.
   - PSS (and any project added later), in this order:
     1. `bash /root/new-server/add-project.sh pss api.perfectstudyspace.in 8010`
        (creates the folder, nginx zone and ops entry; its new keys are
        thrown away in the next steps).
     2. As `deploy`: `cd ~/projects/pss/backend && docker compose down -v`.
     3. As root: `rm -rf /home/deploy/projects/pss/backend/volumes/db/data`
        (the database was initialised with the throwaway keys).
     4. As `deploy`: unpack `<date>/pss/config.tar.gz` in `~`. That puts
        last night's `.env` and `functions.env` back, so the old keys, and
        the anon key in the PSS frontend, keep working.
5. **Start each stack, restore its data.**
   Always through `restore-public.sh`, never a plain `psql < dump`: a plain
   restore silently gives the public key back permissions that were taken
   away (see the runbook, "2. Database").
   ```bash
   cd ~/projects/alpenglow-global/backend && docker compose up -d
   ~/ops/restore-public.sh supabase-db <date>/alpenglow-global/public.sql.gz
   docker exec -i supabase-db psql -U postgres -d postgres < ~/projects/alpenglow-global/repo/migrations/008_otp_auto_cleanup.sql
   docker compose restart rest functions

   cd ~/projects/pss/backend && docker compose up -d
   ~/ops/restore-public.sh pss-db <date>/pss/public.sql.gz
   docker compose restart rest functions
   ```
   Compare each against its `<date>/<project>/row-counts.txt`, and the
   permissions the script prints against the runbook's table. Both
   restores were rehearsed on 26 Oct 2026 with matching counts.
6. **nginx and certificates.** Install each project's site file. The saved
   certificates in `host/root-only.SECRET.tar.gz` work only while they are
   still valid (they are from October 2026). If they have expired, point DNS
   at the new server first, serve plain HTTP for a minute, and run
   `certbot --nginx -d <hostname>` for each.
7. **Point DNS** for every API hostname at the new IP (Cloudflare).
8. **Test** with `security-test.sh` and the Phase 4 checks of each plan.
9. **Switch the schedule back on:** first backup by hand, then
   `crontab ~/ops/crontab.deploy`.
10. **Update `VPS_HOST`** in every project's deploy script.

Realistic time with everything at hand: two to three hours for both
projects. The sites themselves stay up throughout (both are on Cloudflare
Pages); only forms and logins are down.

## If the server was broken into, not just lost

Rebuild on a fresh server as above, never on the same disk, and before going
live replace every secret, because all of them were readable on the old one:

- each project's `JWT_SECRET`, anon key and service-role key (new anon keys
  must go into the frontends), and `POSTGRES_PASSWORD`
- dashboard and CRM passwords, staff JWT secrets
- Resend, Groq and Meta WhatsApp tokens
- the R2 access key and the backup passphrase
- SSH keys that were authorised on the server

## Keeping this procedure alive

- After any change to how the server is built, update `new-server/` first.
- Twice a year, restore one night's backup into a scratch database and
  compare the row counts.
- When a certificate renews or a secret changes, nothing needs doing: the
  nightly `config.tar.gz` carries the current `.env`, and certificates can
  always be issued again.

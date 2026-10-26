# What is needed from you

Never paste passwords, keys or connection strings into a chat or a commit.
Each secret below says where it goes; most are typed straight into the
server.

## To start (AlpenGlow rehearsal on the new server)

- [ ] **The server.** Ubuntu 24.04, 4 vCPU, 8 GB RAM, 100 GB disk. When
      creating it, paste the laptop's public key as root's SSH key
      (`cat ~/.ssh/id_ed25519.pub`). Send the IP address.
- [ ] **A way for Claude to run the steps.** The cloud session cannot reach
      the server. Either start Claude on the laptop that has the SSH key
      (`claude remote-control` in the AlpenGlow repo folder, or the Claude
      Desktop app), or run the commands yourself and share the output.
- [ ] **The `vps-migration-backup` folder** on that laptop (the 5 Oct
      snapshots). Its path is needed to copy a snapshot to the server.

## At the AlpenGlow cutover

- [ ] A 15-minute window when forms can be down.
- [ ] Cloudflare, zone `alpenglowglobal.com`: lower the TTL of `api` to
      5 minutes a day before, then change its A record to the new IP.
- [ ] Testing by you: an email OTP, a WhatsApp OTP (an Indian and a
      non-Indian number), the dashboard login.

## For PSS (a week later)

- [ ] **Database connection string** (Supabase dashboard, project
      `ozatixapvxwrwbpdxuzt`, Connect, Session pooler). Typed on the server
      at the `read -rs` prompt in the plan; it holds the database password.
- [ ] **A Supabase access token** for that account (to list secret names and
      download the deployed function for comparison, and to deploy the
      "moving" page at cutover). Used on the laptop only.
- [ ] **`STAFF_JWT_SECRET` and `PUBLIC_SITE_KEY`**, if you have them. They go
      straight into `~/projects/pss/backend/functions.env` on the server. If
      `STAFF_JWT_SECRET` is lost, a new one works and staff log in again.
- [ ] **Cloudflare, zone `perfectstudyspace.in`:** an A record `api` to the
      new IP, DNS only (grey cloud).
- [ ] **Cloudflare Pages, project `perfect-study-space`:** at cutover, set the
      two Production variables (the plan gives the values' location).
- [ ] A 15-minute window outside opening hours, and someone who knows the
      app to test: staff login, a session, a food bill, a payment, a signup
      from the join site.
- [ ] The supabase project awake (free projects pause after a week unused).

## Strongly recommended

- [ ] **Off-server backups:** a Cloudflare R2 bucket. You enter its keys on
      the server with `rclone config` (remote name `r2`), then set
      `RCLONE_REMOTE="r2:<bucket>"` in `~/ops/ops.env`. Until then backups
      live only on the server and die with its disk.
- [ ] **The backup passphrase** (`~/ops/backup.passphrase` on the server) in
      your password manager. Without it the off-server backups cannot be
      opened.
- [ ] A free outside uptime monitor (UptimeRobot or similar) on
      `https://api.alpenglowglobal.com`, later also `https://api.perfectstudyspace.in`.
- [ ] A second SSH key from another machine, so losing the laptop does not
      lock you out.

## Decisions

- [x] **travel-app (billing): removed, not moved** (decided 26 Oct). It
      stays on the old server until that server is cancelled; then delete
      the `travel` DNS record. Its data (1 customer, 2 invoices, GST
      records) is kept in the snapshots as `db/app-billing-schema+data.sql`;
      keep those.
- [ ] **AlpenGlow security fixes** (runbook, "Security fixes that need a code
      change"): fix 2 (`_migrations_applied`) and fix 3 (CMS tables), each
      one small migration, before cutover; fix 1 (`trip_leads` behind a
      function) before or straight after.
- [ ] **PSS `overtime_sessions`:** a one-line PSS migration to switch on its
      row security. It is open to the public key on the cloud project today.
- [ ] **PSS student photos:** if the old `student-photos` bucket still holds
      Aadhaar or ID photos, delete them or plan to move them.
- [ ] **Adding `deploy/vps-deploy.sh` to the PSS repo** (a commit to PSS
      `main`).

## Housekeeping on the old server

- [ ] `ssh -t deploy@169.58.43.191 "sudo sshd -T | grep -i passwordauthentication"`
      and share the output (password login may still be on).
- [ ] Change the `deploy` sudo password; it was typed into a chat on 7 Oct.

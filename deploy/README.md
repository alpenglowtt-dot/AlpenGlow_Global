# Migrating AlpenGlow from Supabase Cloud → self-hosted Supabase (VPS)

Cloud project ref: `yexrmmhadfscormovskn` (still referenced in `AlpenGlow/api.js`,
`compass.html`, `dashboard.html`, `trip-planner.js` until step 6 below).

Run everything below **on the VPS** unless noted otherwise. Assumes Ubuntu 22.04/24.04,
root or sudo access, and that you'll reach the instance at `http://VPS_IP:8000` for now
(no domain/TLS yet — add nginx + certbot later, see the bottom of this file).

## Order of operations

1. `01-vps-setup.sh` — installs Docker + the official self-hosted Supabase stack
2. `generate-keys.js` — generates your own `JWT_SECRET` / `ANON_KEY` / `SERVICE_ROLE_KEY`
   (self-hosted does NOT generate these for you like the cloud dashboard does)
3. Fill in `.env` (copied from `.env.selfhost.example`) with those keys + your secrets
4. `docker compose up -d` — brings up Postgres, Kong, Auth, Studio, Edge Functions, etc.
5. `02-migrate-data.sh` — dumps the cloud DB and restores it into the new Postgres
6. `03-deploy-functions.sh` — copies `supabase/functions/*` into the running stack
7. Update the 4 frontend files with your new `VPS_IP` + `ANON_KEY` (script provided)

## What stays the same

- All 9 edge functions (`send-email-otp`, `verify-email-otp`, `send-sms-otp`,
  `verify-sms-otp`, `submit-contact`, `submit-lead`, `crm`, `send-lead-email`,
  `chat-compass`, `whatsapp-webhook`) are already fully self-contained — no
  `_shared/` imports — so they run unmodified under self-hosted edge-runtime.
- `supabase/migrations/*.sql` — same schema, applied via the migration script.
- Your third-party secrets (Twilio/WhatsApp, Resend, `CRM_PASSWORD`) don't change,
  they just move from "Supabase → Edge Functions → Secrets" into the VPS `.env`.

## What changes

- `SUPABASE_URL` everywhere goes from `https://yexrmmhadfscormovskn.supabase.co`
  to `http://<VPS_IP>:8000` (or your domain once you add one).
- `SUPABASE_ANON_KEY` goes from the cloud-issued JWT to the one you generate in
  step 2 (signed with your own `JWT_SECRET`).
- No more Supabase dashboard for Studio — you get a self-hosted Studio at
  `http://<VPS_IP>:8000` (or `:3000` depending on compose config) protected by
  `DASHBOARD_USERNAME`/`DASHBOARD_PASSWORD` you set in `.env`.

## Adding a domain + TLS later

Once you point a domain (e.g. `api.alpenglobal.com`) at the VPS:
1. Install nginx + certbot: `sudo apt install nginx certbot python3-certbot-nginx`
2. Reverse-proxy `:8000` (Kong) behind nginx on 443, `certbot --nginx -d api.alpenglobal.com`
3. Update `API_EXTERNAL_URL` / `SUPABASE_PUBLIC_URL` in `.env`, `docker compose up -d`
4. Update the frontend files again to use `https://api.alpenglobal.com`

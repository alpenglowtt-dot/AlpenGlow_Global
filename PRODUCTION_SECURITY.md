# AlpenGlow — Production Security & Go-Live Checklist

This document covers the security hardening applied on 2026-07-04 and the
**manual steps you must complete** before/at deploy. Read the "Deploy order"
section carefully — the dashboard now depends on a backend function, so the
pieces must go live together or the CRM will show an error until they do.

---

## 1. What changed (and why)

### 🔴 Critical fix — customer/lead data was exposed
**Before:** the dashboard read/wrote `leads`, `lead_activities`, `follow_ups`
directly from the REST API using the **public** anon key, gated only by a
JavaScript password (`alpenglow2025`). Anyone could read/modify/delete all
customer PII with the key printed in the page source.

**Now:**
- All CRM data goes through a new authenticated Edge Function: `supabase/functions/crm`.
  It checks the CRM password **server-side** (`CRM_PASSWORD` secret) and uses the
  service-role key internally. The password is never in the shipped JavaScript.
- Migration `007_lock_crm_tables.sql` drops every anon/authenticated policy and
  privilege on the PII tables, so even a direct API call with the anon key is
  rejected by the database.
- Public lead capture (COMPASS chatbot in `compass.html`, offer-claim check in
  `api.js`) was rerouted through the `submit-lead` Edge Function.

### 🟠 OTP hardening
- **Rate limiting** added to `send-sms-otp` / `send-email-otp`: max 1 code / 45s
  and 5 codes / hour per contact (stops SMS/WhatsApp/email spam & cost abuse).
- **Brute-force lockout** added to `verify-sms-otp` / `verify-email-otp`: wrong
  guesses now count, and the code locks after 5 attempts (the 4-digit code was
  previously guessable without limit).

### 🟡 CORS locked
- All Edge Functions now reflect only allowed origins via `_shared/cors.ts`
  (default `https://alpenglowglobal.com,https://www.alpenglowglobal.com`),
  instead of `*`. Configure with the `ALLOWED_ORIGINS` secret.

### 🟡 Other
- `send-lead-email` (sends arbitrary emails) now requires the CRM password.
- Security response headers added for the static host (`AlpenGlow/_headers`).

---

## 2. Manual steps — REQUIRED before go-live

### a) Set Supabase secrets (Edge Functions → Secrets, or CLI)
```bash
# A long, random CRM password — this replaces the old 'alpenglow2025'.
supabase secrets set CRM_PASSWORD="<generate a long random string>"

# Comma-separated allowed browser origins. Add localhost while testing.
supabase secrets set ALLOWED_ORIGINS="https://alpenglowglobal.com,https://www.alpenglowglobal.com"
```
(`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, WhatsApp/Resend keys are already set.)

### b) Apply the database migration
```bash
supabase db push          # applies 007_lock_crm_tables.sql
```
> ⚠️ The moment this runs, the anon key can no longer read leads. The dashboard
> will only work once the `crm` function (step c) is deployed.

### c) Deploy the changed/new Edge Functions
```bash
supabase functions deploy crm
supabase functions deploy submit-lead
supabase functions deploy send-lead-email
supabase functions deploy send-sms-otp
supabase functions deploy send-email-otp
supabase functions deploy verify-sms-otp
supabase functions deploy verify-email-otp
# (unchanged but redeploy is harmless: submit-contact, whatsapp-webhook, chat-compass)
```

### d) Deploy the updated frontend
Push `AlpenGlow/dashboard.html`, `AlpenGlow/compass.html`, `AlpenGlow/api.js`,
and `AlpenGlow/_headers` to your host (Cloudflare Pages).

### ➤ Deploy order
Do **b + c + secrets FIRST**, then **d**. If the frontend ships before the `crm`
function/migration, the dashboard shows "log in again" errors until the backend
catches up. Doing them close together avoids a visible gap.

---

## 3. DEV_MODE — do NOT flip blindly

`AlpenGlow/api.js` line 17 is still `DEV_MODE = true`, which **bypasses all OTP
gating**. You said OTP isn't confirmed working in production yet, so leave it
`true` until you've run the test below — otherwise you may lock out every visitor.

**OTP test before setting `DEV_MODE = false`:**
1. On a staging copy set `DEV_MODE = false`.
2. Trigger an email OTP → confirm the email arrives and the code verifies.
3. Trigger a WhatsApp/SMS OTP → confirm delivery and verification.
4. Enter a wrong code 5× → confirm it locks with "Too many attempts".
5. Request 2 codes within 45s → confirm the 2nd is rate-limited.
Only then set `DEV_MODE = false` and redeploy the frontend.

---

## 4. Post-deploy smoke test (crash prevention)

- [ ] Dashboard: log in with the **new** CRM password; leads list loads.
- [ ] Dashboard: update a lead status, add a follow-up, log an activity, delete a test lead.
- [ ] Dashboard: "Today's follow-ups" panel populates.
- [ ] Public site: contact form submits (check it appears in CRM).
- [ ] COMPASS chatbot: complete a chat → a `compass_bot` lead appears in CRM.
- [ ] CORS: open the site on `alpenglowglobal.com` — calls succeed. From an
      unrelated origin, the browser should block them.
- [ ] Confirm the old password `alpenglow2025` no longer grants access anywhere.

---

## 5. Residual risks / recommended follow-ups (not yet done)

1. **`dev.html` content editor** writes to `offers`/`blog_posts`/`destinations`/
   `packages`/`package_pages` using the anon key (migrations 002–004 grant anon
   INSERT/UPDATE/DELETE). Anyone with the anon key can alter these tables
   (content defacement). The live site reads content from local `data/*.json`,
   so impact is limited — but recommend locking these the same way (route through
   an authenticated function) or restricting `dev.html` to a private deploy.
2. **`chat-compass`** (LLM backend) has only a client-side daily question limit,
   which is bypassable → potential API cost abuse. Add a server-side rate limit.
3. **4-digit OTP**: consider 6 digits for stronger codes.
4. **Anon key is public by design** — no rotation needed. But rotate the
   **service-role key** and any WhatsApp/Resend keys if they were ever shared.
5. **Content Security Policy**: `_headers` sets safe baseline headers; a full CSP
   was not added because the pages use inline scripts/styles (would need refactor).
6. Enable Supabase's **leaked-password protection** and **network restrictions**
   in the project dashboard for defense in depth.

---

## 6. Reality check on "unbreachable"

No website is unbreachable, and anyone promising a magic "firewall" is wrong.
Security here = the specific controls above, each closing a specific hole. The
biggest one (public access to customer data) is now closed at the database level,
which is the change that actually matters. Keep the service-role key and
`CRM_PASSWORD` secret, review the follow-ups above, and you're in solid shape
for launch.

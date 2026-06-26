# Alpen Glow Tours — Backend Setup Guide

## Architecture Overview

```
Browser (HTML pages)
  │
  ├─ api.js  ──────────────────────────────────► Supabase Edge Functions
  │                                                  │
  │   sendSMSOTP()   ──► send-sms-otp/index.ts  ──► WhatsApp Cloud API (Meta)
  │   verifySMSOTP() ──► verify-sms-otp/index.ts ──► Supabase DB
  │   sendEmailOTP() ──► send-email-otp/index.ts ──► Resend (email)
  │   verifyEmailOTP──► verify-email-otp/index.ts ──► Supabase DB
  │   submitContact()──► submit-contact/index.ts  ──► Supabase DB + Resend + (Sheets)
  │   submitLead()   ──► submit-lead/index.ts     ──► Supabase DB + (Sheets)
  │
  └─ All leads stored in Supabase Postgres `leads` table
     All OTPs stored (short-lived) in `otp_verifications` table
```

---

## Step 1 — Create a Supabase Project

1. Go to https://supabase.com and sign in / create an account
2. Click **New Project**, choose a region close to India (Singapore or Mumbai)
3. Save your **Database Password** somewhere safe
4. Wait for the project to finish provisioning (~1 min)

---

## Step 2 — Run the Database Migration

1. In Supabase Dashboard, open the **SQL Editor**
2. Create a new query, paste the contents of `supabase/migrations/001_schema.sql`
3. Click **Run** — you should see "Success. No rows returned"
4. Confirm in **Table Editor** that `leads` and `otp_verifications` tables appear

---

## Step 3 — Set Up WhatsApp OTP (Meta Cloud API)

> ⚠️ The "Send WhatsApp Code" buttons on this site call Meta's **WhatsApp
> Cloud API** directly (`send-sms-otp` / `verify-sms-otp` — named for the
> OTP flow, but they send real WhatsApp messages, not SMS). Earlier drafts
> of this guide described Twilio SMS setup; that is no longer what the
> code does, so don't set Twilio secrets expecting them to work here —
> that mismatch is the most common cause of "Could not send WhatsApp
> code" errors.

1. Create a Meta Business app at https://developers.facebook.com/apps →
   add the **WhatsApp** product.
2. In **WhatsApp → API Setup** note down:
   - **Phone Number ID** (the numeric ID shown under your sending number, not the phone number itself)
   - A **temporary access token** (for quick testing) or a **permanent token**
     generated via a System User (for production)
3. **Critical — an approved authentication template is required for real customers.**
   WhatsApp's Business Platform only allows business-initiated messages to
   numbers that haven't messaged you first if you use an **approved
   template**. Without one, the code falls back to a plain-text message,
   which **only delivers to test numbers you've added under WhatsApp →
   API Setup → "To" recipients** — for any real site visitor it will fail
   silently on Meta's side and the visitor sees "Could not send WhatsApp
   code. Please check your number and try again."
   - Go to **WhatsApp Manager → Account Tools → Message Templates → Create Template**
   - Category: **Authentication**, with a **Copy Code** (OTP) button
   - Submit for approval (usually minutes to a few hours)
   - Once approved, note the exact **template name**
4. Keep the Phone Number ID, access token, and template name for Step 5

---

## Step 4 — Set Up Resend (Email OTP + Notifications)

1. Sign up at https://resend.com (free tier: 3,000 emails/month)
2. Go to **API Keys → Create API Key** — copy the key
3. Add your domain under **Domains** (e.g. `alpenglowtours.com`)
   - Follow the DNS verification steps in their dashboard
   - Until your domain is verified, use `onboarding@resend.dev` as the from address
     and set `EMAIL_FROM_DOMAIN=resend.dev` in the secrets below
4. Keep your API key for Step 5

---

## Step 5 — Set Edge Function Secrets

In Supabase Dashboard → **Edge Functions → Secrets**, add each of these:

| Secret Name                | Value                                          |
|----------------------------|------------------------------------------------|
| `WHATSAPP_PHONE_NUMBER_ID` | Phone Number ID from WhatsApp → API Setup      |
| `WHATSAPP_ACCESS_TOKEN`    | Your Meta access token (temporary or permanent)|
| `WHATSAPP_TEMPLATE_NAME`   | Your approved AUTHENTICATION template name (leave blank only while testing with numbers added under "To" recipients) |
| `RESEND_API_KEY`           | Your Resend API key (`re_xxxxx`)               |
| `AGENCY_EMAIL`             | Agency inbox, e.g. `info@alpenglowtours.com`   |
| `EMAIL_FROM_DOMAIN`        | `alpenglowtours.com` (or `resend.dev` initially)|
| `GOOGLE_SHEETS_WEBHOOK_URL`| (optional) your Apps Script web app URL        |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically by
Supabase into every Edge Function — you do not need to add them.

---

## Step 6 — Deploy the Edge Functions

Install the Supabase CLI:
```bash
npm install -g supabase
```

Login and link to your project:
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
# Find YOUR_PROJECT_REF in Dashboard → Settings → General
```

Deploy all six functions:
```bash
supabase functions deploy send-sms-otp     --no-verify-jwt
supabase functions deploy verify-sms-otp   --no-verify-jwt
supabase functions deploy send-email-otp   --no-verify-jwt
supabase functions deploy verify-email-otp --no-verify-jwt
supabase functions deploy submit-contact   --no-verify-jwt
supabase functions deploy submit-lead      --no-verify-jwt
```

> `--no-verify-jwt` lets the frontend call functions with just the anon key
> (no user session required — appropriate for a public-facing site).

---

## Step 7 — Configure the Frontend

Open `api.js` (in the website root) and replace the two placeholders:

```js
const SUPABASE_URL      = 'https://YOUR_PROJECT_REF.supabase.co'
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'
```

Find these values in: **Supabase Dashboard → Settings → API**
- `SUPABASE_URL` → "Project URL"
- `SUPABASE_ANON_KEY` → "anon public" key

---

## Step 8 — Optional: Google Sheets Integration

1. Create a new Google Sheet named "Alpen Glow Leads"
2. Open **Extensions → Apps Script**
3. Paste the contents of `google-sheets-webhook.gs`
4. Click **Deploy → New Deployment → Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the web app URL
6. Add it as `GOOGLE_SHEETS_WEBHOOK_URL` in Supabase Secrets (Step 5)

Every contact form submission, blog lead, package gate verification, and offer
claim will now appear as a new row in the sheet automatically.

---

## Step 9 — Optional: Schedule OTP Cleanup

To auto-delete expired OTP records, enable pg_cron in Supabase:
**Dashboard → Database → Extensions → pg_cron → Enable**

Then run this SQL:
```sql
SELECT cron.schedule(
  'cleanup-otps',
  '0 * * * *',   -- every hour
  'SELECT cleanup_expired_otps()'
);
```

---

## File Reference

```
Alpen Glow/
├── index.html                    ← updated (real OTP, contact form, lead modal)
├── api.js                        ← ⚠️ set your Supabase URL + anon key here
├── packages/
│   ├── package.css               ← updated (OTP digit styles added)
│   ├── norway.html               ← updated (real 3-step gate card)
│   ├── bali.html                 ← updated
│   └── ... (all 19 package pages updated)
└── supabase/
    ├── migrations/
    │   └── 001_schema.sql        ← run once in SQL Editor
    └── functions/
        ├── _shared/cors.ts
        ├── send-sms-otp/index.ts
        ├── verify-sms-otp/index.ts
        ├── send-email-otp/index.ts
        ├── verify-email-otp/index.ts
        ├── submit-contact/index.ts
        └── submit-lead/index.ts
```

---

## What Each Flow Does Now

| User Action | What Happens |
|---|---|
| Clicks "Claim Offer" | Real WhatsApp OTP sent → on verify, lead stored in DB |
| Clicks "Unlock Article" | Real email OTP sent → on verify, email confirmed |
| Submits contact form | Lead stored + agency gets a formatted email notification |
| Fills package gate card | Real WhatsApp OTP → on verify, lead stored with package name + reference ID shown |
| Any lead | Optionally pushed to Google Sheets row in real time |

---

## Testing Checklist

- [ ] Run `001_schema.sql` — tables appear in Table Editor
- [ ] Deploy all 6 Edge Functions — visible in Edge Functions dashboard
- [ ] All secrets set in Supabase Secrets
- [ ] `api.js` has real URL + anon key
- [ ] WhatsApp authentication template created and **approved** in WhatsApp Manager (or test number added under "To" recipients for sandbox testing)
- [ ] Offer modal: enter real phone → receive WhatsApp message → enter code → promo code reveals
- [ ] Contact form: submit → check agency inbox for notification email
- [ ] Package gate: enter name + phone → receive WhatsApp message → verify → reference ID appears
- [ ] Blog unlock: enter email + phone → receive email OTP → verify → article unlocks
- [ ] Check `leads` table in Supabase — rows appearing for each action
- [ ] (Optional) Check Google Sheet — rows appearing

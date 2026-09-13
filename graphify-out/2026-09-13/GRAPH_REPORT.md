# Graph Report - AlpenGlow_Global  (2026-09-13)

## Corpus Check
- 82 files · ~610,985 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 285 nodes · 332 edges · 54 communities (22 shown, 22 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8c8192bf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- trip-planner.js
- Q: How does OTP verification connect to CRM lead creation?
- _bindStep
- _bindContact
- generate-keys.js
- crm/index.ts
- send-sms-otp/index.ts
- send-email-otp/index.ts
- cors.ts
- verify-sms-otp/index.ts
- chat-compass/index.ts
- send-lead-email/index.ts
- submit-contact/index.ts
- submit-lead/index.ts
- verify-email-otp/index.ts
- whatsapp-webhook/index.ts
- 01-vps-setup.sh
- 02-migrate-data.sh
- 03-deploy-functions.sh
- 04-apply-frontend-values.sh
- vps-deploy.sh
- Q: What are the two verification scopes and where do they apply?
- CLAUDE.md
- setup-new-laptop.sh
- Q: What is the RLS security model for the CRM tables?
- Q: Why did the WhatsApp OTP template keep failing with Meta API errors 132001 and 132018?
- Q: How does deploying a code change actually reach production?
- Q: Why does the graph barely represent compass.html even though it has hundreds of lines of real logic?
- update_updated_at
- AlpenGlow — Production Security & Go-Live Checklist
- Alpen Glow Tours — Backend Setup Guide
- seo-head.js
- 010_billing.sql
- Migrating AlpenGlow from Supabase Cloud → self-hosted Supabase (VPS)
- seo-homepage.js
- 005_crm.sql
- public.follow_ups
- public.lead_activities
- public.otp_verifications
- public.trip_leads
- public.leads
- public.trip_leads
- Q: How is SEO handled across the AlpenGlow site, and what silently undoes SEO edits?
- Q: How were the em/en dashes in the generated SEO content fixed, and what's the escaping pitfall?

## God Nodes (most connected - your core abstractions)
1. `Alpen Glow Tours — Backend Setup Guide` - 14 edges
2. `_bindStep()` - 11 edges
3. `_sbUpsert()` - 11 edges
4. `_enableNextBtn()` - 10 edges
5. `_heading()` - 10 edges
6. `_renderStep()` - 9 edges
7. `_nextBtnHtml()` - 9 edges
8. `_bindContact()` - 8 edges
9. `initTripPlanner()` - 7 edges
10. `update_updated_at()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `blog_posts_updated_at` --triggers--> `update_updated_at()`  [EXTRACTED]
  supabase/migrations/002_content.sql → supabase/migrations/001_schema.sql
- `offers_updated_at` --triggers--> `update_updated_at()`  [EXTRACTED]
  supabase/migrations/002_content.sql → supabase/migrations/001_schema.sql
- `destinations_updated_at` --triggers--> `update_updated_at()`  [EXTRACTED]
  supabase/migrations/003_destinations.sql → supabase/migrations/001_schema.sql
- `packages_updated_at` --triggers--> `update_updated_at()`  [EXTRACTED]
  supabase/migrations/003_destinations.sql → supabase/migrations/001_schema.sql
- `package_pages_updated_at` --triggers--> `update_updated_at()`  [EXTRACTED]
  supabase/migrations/004_package_pages.sql → supabase/migrations/001_schema.sql

## Import Cycles
- None detected.

## Communities (54 total, 22 thin omitted)

### Community 0 - "trip-planner.js"
Cohesion: 0.13
Nodes (32): _advance(), _bindGlobal(), _bindMouseGlow(), _bindNextBtn(), _ccOptions(), _cityRows(), _close(), _esc() (+24 more)

### Community 1 - "Q: How does OTP verification connect to CRM lead creation?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How does OTP verification connect to CRM lead creation?, Source Nodes

### Community 2 - "_bindStep"
Cohesion: 0.26
Nodes (15): _bindBudget(), _bindCount(), _bindDestination(), _bindDuration(), _bindMonth(), _bindOrigin(), _bindCityRows(), _filter() (+7 more)

### Community 3 - "_bindContact"
Cohesion: 0.25
Nodes (10): _bindContact(), _getSb(), _insertLeadRecord(), _sbSubmit(), _tpCheckBothVerified(), _tpConfirmEmailOTP(), _tpConfirmPhoneOTP(), _tpFinalSubmit() (+2 more)

### Community 4 - "generate-keys.js"
Cohesion: 0.22
Nodes (9): anonKey, base64url(), crypto, dashboardPassword, jwtSecret, now, postgresPassword, serviceRoleKey (+1 more)

### Community 6 - "crm/index.ts"
Cohesion: 0.29
Nodes (3): ALLOWED_ORIGINS, FOLLOWUP_WRITABLE, LEAD_WRITABLE

### Community 25 - "Q: What are the two verification scopes and where do they apply?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: What are the two verification scopes and where do they apply?, Source Nodes

### Community 26 - "CLAUDE.md"
Cohesion: 0.50
Nodes (3): Deploy workflow, graphify, SEO

### Community 28 - "Q: What is the RLS security model for the CRM tables?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: What is the RLS security model for the CRM tables?, Source Nodes

### Community 29 - "Q: Why did the WhatsApp OTP template keep failing with Meta API errors 132001 and 132018?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Why did the WhatsApp OTP template keep failing with Meta API errors 132001 and 132018?, Source Nodes

### Community 30 - "Q: How does deploying a code change actually reach production?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How does deploying a code change actually reach production?, Source Nodes

### Community 31 - "Q: Why does the graph barely represent compass.html even though it has hundreds of lines of real logic?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Why does the graph barely represent compass.html even though it has hundreds of lines of real logic?, Source Nodes

### Community 32 - "update_updated_at"
Cohesion: 0.12
Nodes (14): leads_updated_at, public.leads, public.otp_verifications, update_updated_at(), blog_posts_updated_at, offers_updated_at, public.blog_posts, public.offers (+6 more)

### Community 33 - "AlpenGlow — Production Security & Go-Live Checklist"
Cohesion: 0.12
Nodes (16): 1. What changed (and why), 2. Manual steps — REQUIRED before go-live, 3. DEV_MODE — do NOT flip blindly, 4. Post-deploy smoke test (crash prevention), 5. Residual risks / recommended follow-ups (not yet done), 6. Reality check on "unbreachable", a) Set Supabase secrets (Edge Functions → Secrets, or CLI), AlpenGlow — Production Security & Go-Live Checklist (+8 more)

### Community 34 - "Alpen Glow Tours — Backend Setup Guide"
Cohesion: 0.13
Nodes (14): Alpen Glow Tours — Backend Setup Guide, Architecture Overview, File Reference, Step 1 — Create a Supabase Project, Step 2 — Run the Database Migration, Step 3 — Set Up WhatsApp OTP (Meta Cloud API), Step 4 — Set Up Resend (Email OTP + Notifications), Step 5 — Set Edge Function Secrets (+6 more)

### Community 35 - "seo-head.js"
Cohesion: 0.15
Nodes (15): BIZ, block(), card(), esc(), faqSchema(), fs, groupedSlugs, GROUPS (+7 more)

### Community 36 - "010_billing.sql"
Cohesion: 0.28
Nodes (6): public, public.touch_billing_updated_at, billing_customers_touch, billing_invoices_touch, public.billing_customers, public.billing_invoices

### Community 37 - "Migrating AlpenGlow from Supabase Cloud → self-hosted Supabase (VPS)"
Cohesion: 0.33
Nodes (5): Adding a domain + TLS later, Migrating AlpenGlow from Supabase Cloud → self-hosted Supabase (VPS), Order of operations, What changes, What stays the same

### Community 38 - "seo-homepage.js"
Cohesion: 0.40
Nodes (4): F, faqs, fs, h

### Community 39 - "005_crm.sql"
Cohesion: 0.67
Nodes (3): public.follow_ups, public.lead_activities, public.leads

### Community 52 - "Q: How is SEO handled across the AlpenGlow site, and what silently undoes SEO edits?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How is SEO handled across the AlpenGlow site, and what silently undoes SEO edits?, Source Nodes

### Community 53 - "Q: How were the em/en dashes in the generated SEO content fixed, and what's the escaping pitfall?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How were the em/en dashes in the generated SEO content fixed, and what's the escaping pitfall?, Source Nodes

## Knowledge Gaps
- **105 isolated node(s):** `01-vps-setup.sh script`, `02-migrate-data.sh script`, `03-deploy-functions.sh script`, `04-apply-frontend-values.sh script`, `crypto` (+100 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 170 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `01-vps-setup.sh script`, `02-migrate-data.sh script`, `03-deploy-functions.sh script` to the rest of the system?**
  _105 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `trip-planner.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1319073083778966 - nodes in this community are weakly interconnected._
- **Should `update_updated_at` be split into smaller, more focused modules?**
  _Cohesion score 0.12280701754385964 - nodes in this community are weakly interconnected._
- **Should `AlpenGlow — Production Security & Go-Live Checklist` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `Alpen Glow Tours — Backend Setup Guide` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `seo-head.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14705882352941177 - nodes in this community are weakly interconnected._
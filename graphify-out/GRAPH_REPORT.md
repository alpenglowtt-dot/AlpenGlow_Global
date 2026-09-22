# Graph Report - AlpenGlow work  (2026-09-22)

## Corpus Check
- 86 files · ~738,715 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 261 nodes · 328 edges · 41 communities (25 shown, 16 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `29414d2c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- trip-planner.js
- Q: How does OTP verification connect to CRM lead creation?
- _bindStep
- Q: Why could OTPs for non-Indian numbers go to the wrong person or fail to verify?
- generate-keys.js
- api.js
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
- Q: How is site verification scoped, and what does the 30s popup do?
- AlpenGlow — Production Security & Go-Live Checklist
- Alpen Glow Tours — Backend Setup Guide
- seo-head.js
- Migrating AlpenGlow from Supabase Cloud → self-hosted Supabase (VPS)
- seo-homepage.js
- Q: How is SEO handled across the AlpenGlow site, and what silently undoes SEO edits?
- Q: How were the em/en dashes in the generated SEO content fixed, and what's the escaping pitfall?

## God Nodes (most connected - your core abstractions)
1. `Alpen Glow Tours — Backend Setup Guide` - 14 edges
2. `_bindStep()` - 11 edges
3. `_sbUpsert()` - 10 edges
4. `_heading()` - 10 edges
5. `_renderStep()` - 9 edges
6. `_nextBtnHtml()` - 9 edges
7. `_enableNextBtn()` - 9 edges
8. `_showSitePopup()` - 7 edges
9. `initTripPlanner()` - 7 edges
10. `_bindContact()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `_sbUpsert()` --calls--> `_getSb()`  [EXTRACTED]
  AlpenGlow/trip-planner.js → AlpenGlow/trip-planner.js  _Bridges community 0 → community 2_

## Import Cycles
- None detected.

## Communities (41 total, 16 thin omitted)

### Community 0 - "trip-planner.js"
Cohesion: 0.10
Nodes (44): _advance(), _bindContact(), _bindGlobal(), _bindMouseGlow(), _bindNextBtn(), _buildPayload(), _ccOptions(), _cityRows() (+36 more)

### Community 1 - "Q: How does OTP verification connect to CRM lead creation?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How does OTP verification connect to CRM lead creation?, Source Nodes

### Community 2 - "_bindStep"
Cohesion: 0.42
Nodes (11): _bindBudget(), _bindCount(), _bindDestination(), _bindDuration(), _bindMonth(), _bindOrigin(), _bindStep(), _bindTravelers() (+3 more)

### Community 3 - "Q: Why could OTPs for non-Indian numbers go to the wrong person or fail to verify?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Why could OTPs for non-Indian numbers go to the wrong person or fail to verify?, Source Nodes

### Community 4 - "generate-keys.js"
Cohesion: 0.22
Nodes (9): anonKey, base64url(), crypto, dashboardPassword, jwtSecret, now, postgresPassword, serviceRoleKey (+1 more)

### Community 5 - "api.js"
Cohesion: 0.18
Nodes (16): bindOtpInputs(), bindPhoneField(), canViewPackageContent(), cleanPhone(), _done(), isPackageUnlocked(), isValidEmail(), isVerified() (+8 more)

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

### Community 32 - "Q: How is site verification scoped, and what does the 30s popup do?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How is site verification scoped, and what does the 30s popup do?, Source Nodes

### Community 33 - "AlpenGlow — Production Security & Go-Live Checklist"
Cohesion: 0.12
Nodes (16): 1. What changed (and why), 2. Manual steps — REQUIRED before go-live, 3. DEV_MODE — do NOT flip blindly, 4. Post-deploy smoke test (crash prevention), 5. Residual risks / recommended follow-ups (not yet done), 6. Reality check on "unbreachable", a) Set Supabase secrets (Edge Functions → Secrets, or CLI), AlpenGlow — Production Security & Go-Live Checklist (+8 more)

### Community 34 - "Alpen Glow Tours — Backend Setup Guide"
Cohesion: 0.13
Nodes (14): Alpen Glow Tours — Backend Setup Guide, Architecture Overview, File Reference, Step 1 — Create a Supabase Project, Step 2 — Run the Database Migration, Step 3 — Set Up WhatsApp OTP (Meta Cloud API), Step 4 — Set Up Resend (Email OTP + Notifications), Step 5 — Set Edge Function Secrets (+6 more)

### Community 35 - "seo-head.js"
Cohesion: 0.15
Nodes (15): BIZ, block(), card(), esc(), faqSchema(), fs, groupedSlugs, GROUPS (+7 more)

### Community 37 - "Migrating AlpenGlow from Supabase Cloud → self-hosted Supabase (VPS)"
Cohesion: 0.33
Nodes (5): Adding a domain + TLS later, Migrating AlpenGlow from Supabase Cloud → self-hosted Supabase (VPS), Order of operations, What changes, What stays the same

### Community 38 - "seo-homepage.js"
Cohesion: 0.40
Nodes (4): F, faqs, fs, h

### Community 52 - "Q: How is SEO handled across the AlpenGlow site, and what silently undoes SEO edits?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How is SEO handled across the AlpenGlow site, and what silently undoes SEO edits?, Source Nodes

### Community 53 - "Q: How were the em/en dashes in the generated SEO content fixed, and what's the escaping pitfall?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How were the em/en dashes in the generated SEO content fixed, and what's the escaping pitfall?, Source Nodes

## Knowledge Gaps
- **104 isolated node(s):** `Answer`, `Outcome`, `Source Nodes`, `Answer`, `Outcome` (+99 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `Answer`, `Outcome`, `Source Nodes` to the rest of the system?**
  _104 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `trip-planner.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09758454106280193 - nodes in this community are weakly interconnected._
- **Should `AlpenGlow — Production Security & Go-Live Checklist` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `Alpen Glow Tours — Backend Setup Guide` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `seo-head.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14705882352941177 - nodes in this community are weakly interconnected._
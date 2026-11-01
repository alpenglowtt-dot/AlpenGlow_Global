# Graph Report - AlpenGlow_Global  (2026-11-01)

## Corpus Check
- 124 files · ~149,606 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 22 file(s) not represented in the graph (top: (none) 15, .css 2, .jsonl 1)

## Summary
- 327 nodes · 425 edges · 35 communities (24 shown, 11 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0b150042`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- trip-planner.js
- Q: How does OTP verification connect to CRM lead creation?
- environment
- Q: Why could OTPs for non-Indian numbers go to the wrong person or fail to verify?
- generate-keys.js
- api.js
- ref_https
- _bindStep
- cors.ts
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
- _bindContact
- Migrating AlpenGlow from Supabase Cloud → self-hosted Supabase (VPS)
- Q: How should dev.html generate complete package pages and keep SEO and sitemap data synchronized?
- Q: Why were package Destinations Page Group edits not reliably reflected in the destination list?
- Q: How is SEO handled across the AlpenGlow site, and what silently undoes SEO edits?
- Q: How were the em/en dashes in the generated SEO content fixed, and what's the escaping pitfall?

## God Nodes (most connected - your core abstractions)
1. `_showVerifyPopup()` - 14 edges
2. `environment` - 14 edges
3. `Alpen Glow Tours — Backend Setup Guide` - 14 edges
4. `_bindStep()` - 11 edges
5. `_sbUpsert()` - 11 edges
6. `_enableNextBtn()` - 10 edges
7. `_heading()` - 10 edges
8. `_renderStep()` - 9 edges
9. `_nextBtnHtml()` - 9 edges
10. `_bindContact()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `_sbUpsert()` --calls--> `_getSb()`  [EXTRACTED]
  AlpenGlow/trip-planner.js → AlpenGlow/trip-planner.js  _Bridges community 0 → community 7_

## Import Cycles
- None detected.

## Communities (35 total, 11 thin omitted)

### Community 0 - "trip-planner.js"
Cohesion: 0.10
Nodes (43): _advance(), _bindContact(), _bindGlobal(), _bindMouseGlow(), _bindNextBtn(), _buildPayload(), _ccOptions(), _close() (+35 more)

### Community 1 - "Q: How does OTP verification connect to CRM lead creation?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How does OTP verification connect to CRM lead creation?, Source Nodes

### Community 2 - "environment"
Cohesion: 0.12
Nodes (16): AGENCY_EMAIL, ALLOWED_ORIGINS, BILLING_PASSWORD, CRM_PASSWORD, EMAIL_FROM_DOMAIN, GOOGLE_SHEETS_WEBHOOK_URL, GROQ_API_KEY, RESEND_API_KEY (+8 more)

### Community 3 - "Q: Why could OTPs for non-Indian numbers go to the wrong person or fail to verify?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Why could OTPs for non-Indian numbers go to the wrong person or fail to verify?, Source Nodes

### Community 4 - "generate-keys.js"
Cohesion: 0.20
Nodes (9): anonKey, base64url(), crypto, dashboardPassword, jwtSecret, now, postgresPassword, serviceRoleKey (+1 more)

### Community 5 - "api.js"
Cohesion: 0.10
Nodes (33): activate(), applyNow(), bindOtpInputs(), bindPhoneField(), sync(), bypassOn(), canUseCompass(), canViewPackageContent() (+25 more)

### Community 6 - "ref_https"
Cohesion: 0.05
Nodes (12): ALLOWED_ORIGINS, ALLOWED_ORIGINS, FOLLOWUP_WRITABLE, LEAD_WRITABLE, ALLOWED_ORIGINS, ALLOWED_ORIGINS, ALLOWED_ORIGINS, ALLOWED_ORIGINS (+4 more)

### Community 7 - "_bindStep"
Cohesion: 0.29
Nodes (14): _bindBudget(), _bindCount(), _bindDestination(), _bindDuration(), _bindMonth(), _bindOrigin(), _bindCityRows(), _filter() (+6 more)

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
Cohesion: 0.08
Nodes (24): BIZ, block(), card(), dynamicPackageSlugs, esc(), faqSchema(), fs, groupedSlugs (+16 more)

### Community 36 - "_bindContact"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Which remaining dev.html hardening fixes were needed after the package-page generator work?, Source Nodes

### Community 37 - "Migrating AlpenGlow from Supabase Cloud → self-hosted Supabase (VPS)"
Cohesion: 0.33
Nodes (5): Adding a domain + TLS later, Migrating AlpenGlow from Supabase Cloud → self-hosted Supabase (VPS), Order of operations, What changes, What stays the same

### Community 39 - "Q: How should dev.html generate complete package pages and keep SEO and sitemap data synchronized?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should dev.html generate complete package pages and keep SEO and sitemap data synchronized?, Source Nodes

### Community 40 - "Q: Why were package Destinations Page Group edits not reliably reflected in the destination list?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Why were package Destinations Page Group edits not reliably reflected in the destination list?, Source Nodes

### Community 52 - "Q: How is SEO handled across the AlpenGlow site, and what silently undoes SEO edits?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How is SEO handled across the AlpenGlow site, and what silently undoes SEO edits?, Source Nodes

### Community 53 - "Q: How were the em/en dashes in the generated SEO content fixed, and what's the escaping pitfall?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How were the em/en dashes in the generated SEO content fixed, and what's the escaping pitfall?, Source Nodes

## Knowledge Gaps
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Work-memory lessons

**Preferred sources** — corroborated by past sessions; start here.
- `seo-head.js` (2× useful, score=1.955981164) _(code changed — re-verify)_

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Are the 3 inferred relationships involving `_showVerifyPopup()` (e.g. with `api.js` and `fail()`) actually correct?**
  _`_showVerifyPopup()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `trip-planner.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0966183574879227 - nodes in this community are weakly interconnected._
- **Should `environment` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `api.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0951219512195122 - nodes in this community are weakly interconnected._
- **Should `ref_https` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `AlpenGlow — Production Security & Go-Live Checklist` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `Alpen Glow Tours — Backend Setup Guide` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
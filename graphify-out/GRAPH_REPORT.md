# Graph Report - AlpenGlow-pss-all-phases  (2026-11-09)

## Corpus Check
- 152 files · ~780,612 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 436 nodes · 497 edges · 66 communities (42 shown, 24 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bb04612d`
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
- _bindContact
- Migrating AlpenGlow from Supabase Cloud → self-hosted Supabase (VPS)
- seo-homepage.js
- Q: How should dev.html generate complete package pages and keep SEO and sitemap data synchronized?
- Q: Why were package Destinations Page Group edits not reliably reflected in the destination list?
- PSS all-phases on the old server: plan
- Perfect Study Space: Supabase cloud to VPS
- new-server/stack-template/volumes/functions/main/index.ts
- pss-all-phases/stack-template/volumes/functions/main/index.ts
- What is needed from you
- Server migration: progress
- Updating the server
- PSS all-phases on the old server: progress
- The server is gone: rebuild procedure
- Server migration kit
- Q: How is SEO handled across the AlpenGlow site, and what silently undoes SEO edits?
- Q: How were the em/en dashes in the generated SEO content fixed, and what's the escaping pitfall?
- healthcheck.sh
- 01-base-setup.sh
- add-project.sh
- security-test.sh
- add-project-full.sh
- pull-backup.sh
- backup-nightly.sh
- restore-public.sh
- new-server/stack-template/volumes/api/kong-entrypoint.sh
- progress-hook.sh
- pss-all-phases/stack-template/volumes/api/kong-entrypoint.sh
- pss/vps-deploy.sh

## God Nodes (most connected - your core abstractions)
1. `VPS migration runbook` - 19 edges
2. `Alpen Glow Tours — Backend Setup Guide` - 14 edges
3. `_bindStep()` - 11 edges
4. `Perfect Study Space: Supabase cloud to VPS` - 11 edges
5. `_sbUpsert()` - 10 edges
6. `_heading()` - 10 edges
7. `PSS all-phases on the old server: plan` - 10 edges
8. `_renderStep()` - 9 edges
9. `_nextBtnHtml()` - 9 edges
10. `_enableNextBtn()` - 9 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (66 total, 24 thin omitted)

### Community 0 - "trip-planner.js"
Cohesion: 0.09
Nodes (55): _advance(), _bindBudget(), _bindContact(), _bindCount(), _bindDestination(), _bindDuration(), _bindGlobal(), _bindMonth() (+47 more)

### Community 1 - "Q: How does OTP verification connect to CRM lead creation?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How does OTP verification connect to CRM lead creation?, Source Nodes

### Community 2 - "_bindStep"
Cohesion: 0.09
Nodes (21): After cutover, Audit before cutover, Change of plan: travel-app is not moving, Migration checklist coverage, Not captured, Phase 1: prepare the new server, Phase 2: restore and rehearse (old server still live), Phase 2b: switch on backups and health checks (+13 more)

### Community 3 - "Q: Why could OTPs for non-Indian numbers go to the wrong person or fail to verify?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Why could OTPs for non-Indian numbers go to the wrong person or fail to verify?, Source Nodes

### Community 4 - "generate-keys.js"
Cohesion: 0.22
Nodes (9): anonKey, base64url(), crypto, dashboardPassword, jwtSecret, now, postgresPassword, serviceRoleKey (+1 more)

### Community 5 - "api.js"
Cohesion: 0.13
Nodes (22): activate(), applyNow(), bindOtpInputs(), bindPhoneField(), bypassOn(), canViewPackageContent(), cleanPhone(), devOn() (+14 more)

### Community 6 - "crm/index.ts"
Cohesion: 0.29
Nodes (3): ALLOWED_ORIGINS, FOLLOWUP_WRITABLE, LEAD_WRITABLE

### Community 25 - "Q: What are the two verification scopes and where do they apply?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: What are the two verification scopes and where do they apply?, Source Nodes

### Community 26 - "CLAUDE.md"
Cohesion: 0.40
Nodes (4): Deploy workflow, graphify, SEO, Server migration (until both projects have moved)

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
Cohesion: 0.10
Nodes (20): BIZ, block(), card(), dynamicPackageSlugs, esc(), faqSchema(), fs, groupedSlugs (+12 more)

### Community 36 - "_bindContact"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Which remaining dev.html hardening fixes were needed after the package-page generator work?, Source Nodes

### Community 37 - "Migrating AlpenGlow from Supabase Cloud → self-hosted Supabase (VPS)"
Cohesion: 0.33
Nodes (5): Adding a domain + TLS later, Migrating AlpenGlow from Supabase Cloud → self-hosted Supabase (VPS), Order of operations, What changes, What stays the same

### Community 38 - "seo-homepage.js"
Cohesion: 0.40
Nodes (4): F, faqs, fs, h

### Community 39 - "Q: How should dev.html generate complete package pages and keep SEO and sitemap data synchronized?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How should dev.html generate complete package pages and keep SEO and sitemap data synchronized?, Source Nodes

### Community 40 - "Q: Why were package Destinations Page Group edits not reliably reflected in the destination list?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: Why were package Destinations Page Group edits not reliably reflected in the destination list?, Source Nodes

### Community 42 - "PSS all-phases on the old server: plan"
Cohesion: 0.15
Nodes (12): A. Prepare (no server changes), B. Old server (each step only after your OK), Branch and folders, Decisions, Known issues (noted, not fixed in this migration), Layout on the old server, Open choices (as proposed on 9 Nov; outcomes in "Decisions"), PSS all-phases on the old server: plan (+4 more)

### Community 43 - "Perfect Study Space: Supabase cloud to VPS"
Cohesion: 0.17
Nodes (11): Known risks, Perfect Study Space: Supabase cloud to VPS, Phase 0: the add-project kit — done, Phase 1: inventory the live cloud project (read-only), Phase 2: build and rehearse (cloud stays live, nothing changes for users), Phase 3: cutover (about 15 minutes, outside opening hours), Phase 4: verify, Rollback (+3 more)

### Community 44 - "new-server/stack-template/volumes/functions/main/index.ts"
Cohesion: 0.28
Nodes (6): isValidHybridJWT(), isValidJWT(), isValidLegacyJWT(), JWT_SECRET, NOTE:(kallebysantos) We don't check for valid keys but just the bare array parsi, SUPABASE_JWKS

### Community 45 - "pss-all-phases/stack-template/volumes/functions/main/index.ts"
Cohesion: 0.28
Nodes (6): isValidHybridJWT(), isValidJWT(), isValidLegacyJWT(), JWT_SECRET, NOTE:(kallebysantos) We don't check for valid keys but just the bare array parsi, SUPABASE_JWKS

### Community 46 - "What is needed from you"
Cohesion: 0.25
Nodes (7): At the AlpenGlow cutover, Decisions, For PSS (a week later), Housekeeping on the old server, Strongly recommended, To start (AlpenGlow rehearsal on the new server), What is needed from you

### Community 47 - "Server migration: progress"
Cohesion: 0.25
Nodes (7): Current step, Decisions made, Done, Next step, Rules for every sitting, Server migration: progress, Waiting on me

### Community 48 - "Updating the server"
Cohesion: 0.25
Nodes (7): Edge function libraries, Postgres: minor versus major, Rolling back, Steps, one project at a time, Updating the server, What must never be done casually, When to update the Supabase images

### Community 49 - "PSS all-phases on the old server: progress"
Cohesion: 0.29
Nodes (6): Current step, Decisions, Done, Next step, PSS all-phases on the old server: progress, Waiting on me

### Community 50 - "The server is gone: rebuild procedure"
Cohesion: 0.33
Nodes (5): If the server was broken into, not just lost, Keeping this procedure alive, Steps, The server is gone: rebuild procedure, What you need, and where it must already be

### Community 51 - "Server migration kit"
Cohesion: 0.33
Nodes (5): Order of work, Server migration kit, Status, Still to do in this repo, What is here

### Community 52 - "Q: How is SEO handled across the AlpenGlow site, and what silently undoes SEO edits?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How is SEO handled across the AlpenGlow site, and what silently undoes SEO edits?, Source Nodes

### Community 53 - "Q: How were the em/en dashes in the generated SEO content fixed, and what's the escaping pitfall?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How were the em/en dashes in the generated SEO content fixed, and what's the escaping pitfall?, Source Nodes

### Community 55 - "01-base-setup.sh"
Cohesion: 0.67
Nodes (3): DEBIAN_FRONTEND, 01-base-setup.sh script, step()

### Community 56 - "add-project.sh"
Cohesion: 0.83
Nodes (3): as_deploy(), add-project.sh script, step()

### Community 58 - "add-project-full.sh"
Cohesion: 0.83
Nodes (3): as_deploy(), add-project-full.sh script, step()

### Community 59 - "pull-backup.sh"
Cohesion: 0.83
Nodes (3): check(), pull-backup.sh script, step()

## Knowledge Gaps
- **198 isolated node(s):** `01-vps-setup.sh script`, `02-migrate-data.sh script`, `03-deploy-functions.sh script`, `04-apply-frontend-values.sh script`, `crypto` (+193 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Work-memory lessons

**Preferred sources** — corroborated by past sessions; start here.
- `seo-head.js` (2× useful, score=1.955981164)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `01-vps-setup.sh script`, `02-migrate-data.sh script`, `03-deploy-functions.sh script` to the rest of the system?**
  _198 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `trip-planner.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08771929824561403 - nodes in this community are weakly interconnected._
- **Should `_bindStep` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `api.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1349206349206349 - nodes in this community are weakly interconnected._
- **Should `AlpenGlow — Production Security & Go-Live Checklist` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `Alpen Glow Tours — Backend Setup Guide` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `seo-head.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10276679841897234 - nodes in this community are weakly interconnected._
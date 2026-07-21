# Graph Report - AlpenGlow work  (2026-07-21)

## Corpus Check
- 67 files · ~523,351 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 165 nodes · 221 edges · 32 communities (15 shown, 17 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9006bff7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- _sbSubmit
- CLAUDE.md
- setup-new-laptop.sh
- Q: What is the RLS security model for the CRM tables?
- Q: Why did the WhatsApp OTP template keep failing with Meta API errors 132001 and 132018?
- Q: How does deploying a code change actually reach production?
- Q: Why does the graph barely represent compass.html even though it has hundreds of lines of real logic?

## God Nodes (most connected - your core abstractions)
1. `_bindStep()` - 11 edges
2. `_sbUpsert()` - 10 edges
3. `_heading()` - 10 edges
4. `_renderStep()` - 9 edges
5. `_nextBtnHtml()` - 9 edges
6. `_enableNextBtn()` - 9 edges
7. `initTripPlanner()` - 7 edges
8. `_bindContact()` - 7 edges
9. `_goTo()` - 5 edges
10. `renderContact()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `_sbUpsert()` --calls--> `_getSb()`  [EXTRACTED]
  AlpenGlow/trip-planner.js → AlpenGlow/trip-planner.js  _Bridges community 3 → community 2_
- `_bindVibe()` --calls--> `_setBg()`  [EXTRACTED]
  AlpenGlow/trip-planner.js → AlpenGlow/trip-planner.js  _Bridges community 0 → community 2_

## Import Cycles
- None detected.

## Communities (32 total, 17 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.13
Nodes (33): _advance(), _bindGlobal(), _bindMouseGlow(), _bindNextBtn(), _ccOptions(), _cityRows(), _close(), _esc() (+25 more)

### Community 1 - "Community 1"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: How does OTP verification connect to CRM lead creation?, Source Nodes

### Community 2 - "Community 2"
Cohesion: 0.42
Nodes (11): _bindBudget(), _bindCount(), _bindDestination(), _bindDuration(), _bindMonth(), _bindOrigin(), _bindStep(), _bindTravelers() (+3 more)

### Community 3 - "Community 3"
Cohesion: 0.25
Nodes (11): _bindContact(), _buildPayload(), _getSb(), _insertLeadRecord(), _sbSubmit(), _tpCheckBothVerified(), _tpConfirmEmailOTP(), _tpConfirmPhoneOTP() (+3 more)

### Community 4 - "Community 4"
Cohesion: 0.22
Nodes (9): anonKey, base64url(), crypto, dashboardPassword, jwtSecret, now, postgresPassword, serviceRoleKey (+1 more)

### Community 6 - "Community 6"
Cohesion: 0.29
Nodes (3): ALLOWED_ORIGINS, FOLLOWUP_WRITABLE, LEAD_WRITABLE

### Community 25 - "_sbSubmit"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: What are the two verification scopes and where do they apply?, Source Nodes

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

## Knowledge Gaps
- **46 isolated node(s):** `Deploy workflow`, `graphify`, `Answer`, `Outcome`, `Source Nodes` (+41 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `_bindStep()` connect `Community 2` to `Community 0`, `Community 3`?**
  _High betweenness centrality (0.001) - this node is a cross-community bridge._
- **Why does `_renderStep()` connect `Community 0` to `Community 2`?**
  _High betweenness centrality (0.001) - this node is a cross-community bridge._
- **What connects `Deploy workflow`, `graphify`, `Answer` to the rest of the system?**
  _46 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.12773109243697478 - nodes in this community are weakly interconnected._
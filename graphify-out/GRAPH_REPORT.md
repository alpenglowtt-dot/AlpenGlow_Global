# Graph Report - AlpenGlow work  (2026-07-20)

## Corpus Check
- 61 files · ~521,819 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 135 nodes · 197 edges · 28 communities (11 shown, 17 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `739cf3c0`
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
- `_bindContact()` --indirect_call--> `_tpFinalSubmit()`  [INFERRED]
  AlpenGlow/trip-planner.js → AlpenGlow/trip-planner.js  _Bridges community 3 → community 25_
- `_sbUpsert()` --calls--> `_getSb()`  [EXTRACTED]
  AlpenGlow/trip-planner.js → AlpenGlow/trip-planner.js  _Bridges community 25 → community 2_
- `_bindVibe()` --calls--> `_setBg()`  [EXTRACTED]
  AlpenGlow/trip-planner.js → AlpenGlow/trip-planner.js  _Bridges community 1 → community 2_
- `_bindStep()` --calls--> `_bindContact()`  [EXTRACTED]
  AlpenGlow/trip-planner.js → AlpenGlow/trip-planner.js  _Bridges community 2 → community 3_

## Import Cycles
- None detected.

## Communities (28 total, 17 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.25
Nodes (17): _ccOptions(), _cityRows(), _esc(), _field(), _fmt(), _heading(), _nextBtnHtml(), renderBudget() (+9 more)

### Community 1 - "Community 1"
Cohesion: 0.15
Nodes (16): _advance(), _bindGlobal(), _bindMouseGlow(), _bindNextBtn(), _close(), _goBack(), _goTo(), initTripPlanner() (+8 more)

### Community 2 - "Community 2"
Cohesion: 0.42
Nodes (11): _bindBudget(), _bindCount(), _bindDestination(), _bindDuration(), _bindMonth(), _bindOrigin(), _bindStep(), _bindTravelers() (+3 more)

### Community 3 - "Community 3"
Cohesion: 0.53
Nodes (6): _bindContact(), _tpCheckBothVerified(), _tpConfirmEmailOTP(), _tpConfirmPhoneOTP(), _tpSendEmailOTP(), _tpSendPhoneOTP()

### Community 4 - "Community 4"
Cohesion: 0.22
Nodes (9): anonKey, base64url(), crypto, dashboardPassword, jwtSecret, now, postgresPassword, serviceRoleKey (+1 more)

### Community 6 - "Community 6"
Cohesion: 0.29
Nodes (3): ALLOWED_ORIGINS, FOLLOWUP_WRITABLE, LEAD_WRITABLE

### Community 25 - "_sbSubmit"
Cohesion: 0.50
Nodes (5): _buildPayload(), _getSb(), _insertLeadRecord(), _sbSubmit(), _tpFinalSubmit()

## Knowledge Gaps
- **28 isolated node(s):** `Deploy workflow`, `graphify`, `vps-deploy.sh script`, `setup-new-laptop.sh script`, `01-vps-setup.sh script` (+23 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `_bindStep()` connect `Community 2` to `Community 0`, `Community 1`, `Community 3`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **Why does `_renderStep()` connect `Community 1` to `Community 0`, `Community 2`?**
  _High betweenness centrality (0.001) - this node is a cross-community bridge._
- **What connects `Deploy workflow`, `graphify`, `vps-deploy.sh script` to the rest of the system?**
  _28 weakly-connected nodes found - possible documentation gaps or missing edges._
---
type: "explain"
date: "2026-07-21T08:32:52.537186+00:00"
question: "What are the two verification scopes and where do they apply?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["_tpCheckBothVerified()", "initTripPlanner()", "compass.js"]
---

# Q: What are the two verification scopes and where do they apply?

## Answer

AlpenAPI in api.js has isVerified(scope) and markVerified(scope) taking a scope argument, defaulting to site if omitted. Site scope covers package pages, blog unlock, and offer claims on the main site. Planner scope is shared only between the Trip Planner wizard and the COMPASS chatbot, and is intentionally separate so verifying on the main site never unlocks COMPASS, and vice versa. Each scope has its own sessionStorage keys and its own independent 10 minute expiry window. compass.html gate checks isVerified planner scope specifically, and links back to index.html with a startPlanner=1 query param that auto opens the Trip Planner wizard rather than the generic site gate, since only the wizard can actually satisfy the planner scope.

## Outcome

- Signal: useful

## Source Nodes

- _tpCheckBothVerified()
- initTripPlanner()
- compass.js
---
type: "architecture"
date: "2026-09-22T12:17:02.160913+00:00"
question: "How is site verification scoped, and what does the 30s popup do?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["isPackageUnlocked", "canViewPackageContent", "markVerified", "generatePackageHTML"]
---

# Q: How is site verification scoped, and what does the 30s popup do?

## Answer

api.js has four independent sessionStorage scopes: package, blog, offer, planner (10-min TTL each). isPackageUnlocked() = package OR planner (Trip Planner/COMPASS dual verification also unlocks packages, not blog/offer). canViewPackageContent() adds the first-30s grace window (ag_session_start, set synchronously at script load) — package pages and teasers use it, but the popup scheduler must use isPackageUnlocked() or it never fires. The hard-block popup is built at runtime in api.js, re-appears on every load until verified (reload is not a bypass), then never again that session (ag_pkg_verified_once survives the TTL), skips pages with body data-verify-scope=planner (compass.html), defers while Trip Planner #tp-root.tp-open, and sets inert on the page behind it. Package pages declare body data-verify-scope=package. Package-page gate JS is hand-duplicated in 19 packages/*.html plus dev.html generatePackageHTML template — not covered by the marker sync, so edits need a migration script with match-exactly-once checks.

## Outcome

- Signal: useful

## Source Nodes

- isPackageUnlocked
- canViewPackageContent
- markVerified
- generatePackageHTML
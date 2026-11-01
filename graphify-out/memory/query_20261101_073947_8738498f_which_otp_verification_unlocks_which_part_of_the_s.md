---
type: "query"
date: "2026-11-01T07:39:47.940068+00:00"
question: "Which OTP verification unlocks which part of the site, and when does the 30s popup appear?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["api.js", "compass.html", "canUseCompass()", "isBlogUnlocked()", "_showVerifyPopup()", "_popupDue()"]
---

# Q: Which OTP verification unlocks which part of the site, and when does the 30s popup appear?

## Answer

Rules live in AlpenGlow/api.js (table at the top of the session-verification section). Scopes: planner (Trip Planner, phone+email) and package (30s popup, COMPASS's copy of it, or a package page gate card) both open package pages, COMPASS and blogs; blog opens only blogs; offer opens only offers, and nothing else ever opens offers. Pages must call isPackageUnlocked()/canUseCompass()/isBlogUnlocked()/isVerified('offer') rather than reading scopes directly. The 30s popup timer starts on the FIRST package page visited (ag_pkg_timer_start/ag_pkg_first in sessionStorage), never on the homepage; opening a different package page before verifying sets ag_popup_due and shows the popup at once; once due it hard-blocks every page that loads api.js until verified. COMPASS (data-verify-scope=compass) shows the same popup as its own gate via AlpenAPI.showVerifyPopup and starts the chat from window.unlockContent; popup/gate-card contacts reach COMPASS via submitLead() -> ag_verified_profile, so email-only verification works there. destinations.html does not load api.js, so the popup never shows on it. Verified end to end with a Playwright script using page.clock plus a route-faked backend; network round-trips need real waits, the fake clock alone does not resolve fetches.

## Outcome

- Signal: useful

## Source Nodes

- api.js
- compass.html
- canUseCompass()
- isBlogUnlocked()
- _showVerifyPopup()
- _popupDue()
---
type: "query"
date: "2026-07-21T08:32:29.855222+00:00"
question: "How does OTP verification connect to CRM lead creation?"
contributor: "graphify"
outcome: "corrected"
correction: "The graph shows only file-contains-function edges here; the real answer requires reading api.js, submit-lead/index.ts, crm/index.ts, and trip-planner.js directly, since the connection is an HTTP fetch call the AST parser cannot represent as an edge."
source_nodes: ["_tpCheckBothVerified()", "_tpFinalSubmit()", "_sbSubmit()", "_insertLeadRecord()", "submit-lead/index.ts", "crm/index.ts", "LEAD_WRITABLE"]
---

# Q: How does OTP verification connect to CRM lead creation?

## Answer

The connection is entirely via HTTP fetch calls, not resolvable code references, which is why a raw graphify query on this returns only useless contains edges. Real chain: trip-planner.js completes phone+email OTP (tpConfirmPhoneOTP, tpConfirmEmailOTP), tpCheckBothVerified marks the planner session verified and enables submit, tpFinalSubmit calls sbSubmit which calls insertLeadRecord. insertLeadRecord and compass.html both POST to the submit-lead Edge Function (not a direct anon-key table write, that was a real bug fixed this session since the RLS lockdown blocks anon writes to leads directly). submit-lead inserts into the leads table with verifiedPhone and verifiedEmail flags. The crm Edge Function (list_leads action, using the LEAD_WRITABLE column allowlist) later reads these rows for the dashboard. None of this chain is visible in the AST graph because it crosses an HTTP boundary between separately deployed files.

## Outcome

- Signal: corrected
- Correction: The graph shows only file-contains-function edges here; the real answer requires reading api.js, submit-lead/index.ts, crm/index.ts, and trip-planner.js directly, since the connection is an HTTP fetch call the AST parser cannot represent as an edge.

## Source Nodes

- _tpCheckBothVerified()
- _tpFinalSubmit()
- _sbSubmit()
- _insertLeadRecord()
- submit-lead/index.ts
- crm/index.ts
- LEAD_WRITABLE
---
type: "query"
date: "2026-07-21T08:32:52.968227+00:00"
question: "What is the RLS security model for the CRM tables?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["crm/index.ts", "safeEqual()", "LEAD_WRITABLE", "FOLLOWUP_WRITABLE"]
---

# Q: What is the RLS security model for the CRM tables?

## Answer

leads, lead_activities, follow_ups, and otp_verifications have zero anon or authenticated policies and zero grants, RLS enabled and forced. All access to these goes through the crm Edge Function using the service role key, gated by a server side CRM_PASSWORD secret compared with a constant time safeEqual check, never a client side password. trip_leads is the one exception with narrow anon policies for INSERT, SELECT, and UPDATE only, deliberately no DELETE. This was migration 007 for the first group and migration 009 for trip_leads. Before 007, the dashboard read and wrote these tables directly with the public anon key protected only by a JavaScript password check, which meant anyone could dump or delete all customer PII using the key visible in the page source.

## Outcome

- Signal: useful

## Source Nodes

- crm/index.ts
- safeEqual()
- LEAD_WRITABLE
- FOLLOWUP_WRITABLE
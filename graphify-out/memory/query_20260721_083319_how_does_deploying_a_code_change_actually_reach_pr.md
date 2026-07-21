---
type: "explain"
date: "2026-07-21T08:33:19.151028+00:00"
question: "How does deploying a code change actually reach production?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["crm/index.ts", "submit-lead/index.ts"]
---

# Q: How does deploying a code change actually reach production?

## Answer

Two completely independent paths, neither triggers the other. Frontend files in AlpenGlow folder deploy via git push alone, assuming Cloudflare Pages is connected to this repo for auto deploy. Backend files, supabase functions and supabase migrations, require running deploy/vps-deploy.sh which talks to the self hosted VPS directly over SSH and does not care about git at all, a git push has zero effect on the VPS. The deploy script mirrors supabase/functions to the VPS reference copy and the live volumes/functions copy the containers actually run from, then applies only migrations not yet recorded in a public._migrations_applied tracking table, then restarts the functions container. This project used to be on Supabase Cloud and migrated to a self hosted Supabase stack on a Contabo VPS, documented in deploy/README.md.

## Outcome

- Signal: useful

## Source Nodes

- crm/index.ts
- submit-lead/index.ts
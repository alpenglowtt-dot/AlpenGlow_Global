## Deploy workflow

This project has two independent deploy paths — neither triggers the other:

- **Frontend** (`AlpenGlow/*.html`, `*.js`): a `git push` is enough, assuming
  Cloudflare Pages is connected to this repo for auto-deploy.
- **Backend** (`supabase/functions/*`, `supabase/migrations/*.sql`): requires
  running `bash deploy/vps-deploy.sh` — this talks to the self-hosted VPS
  directly over SSH and is completely independent of git/GitHub. A `git push`
  has zero effect on the VPS.

**Rule for Claude:** whenever you (Claude) edit `supabase/functions/*` or
`supabase/migrations/*.sql` in a session, run `bash deploy/vps-deploy.sh`
yourself right after, without waiting to be asked. Never run `git push`
without explicit user confirmation in that same conversation — it's a
visible, shared action and should stay opt-in every time, even though the
VPS deploy script does not.

This applies on any machine this repo is cloned to, not just the one it was
authored on — that's the whole point of it living here instead of only
being said in a conversation.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

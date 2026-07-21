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

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships. graph.json, GRAPH_REPORT.md, graph.html, memory/, and reflections/ are committed to git (only graphify-out/cache/ is ignored) — so a fresh clone on any laptop has the full graph and every accumulated lesson immediately, not just after a hook fires there.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost). The post-commit/post-checkout git hooks already do this automatically — this is only needed if you change code without committing.
- **Read graphify-out/reflections/LESSONS.md near the start of any nontrivial session** — it holds real judgment-call knowledge (security decisions, debugging dead ends, cross-boundary connections the AST graph itself cannot represent) that plain graph queries cannot surface.
- **After genuinely significant work** (a real bug fully root-caused, a security decision, anything that took real back-and-forth to figure out — not routine edits), run `graphify save-result --question "..." --answer "..." --nodes <relevant node names> --outcome useful|corrected` to record it, then `graphify reflect --graph graphify-out/graph.json` to fold it into LESSONS.md. This is a judgment call, not something a hook can automate — the structural graph rebuilds itself, but deciding what was actually learned still needs a session to do it deliberately.
- Since graphify-out/ is now tracked, **commit it in the same commit as the code change it documents** (`git add graphify-out/ ...`) — not as an afterthought — so the knowledge reaches GitHub, and every other laptop, in the same push.

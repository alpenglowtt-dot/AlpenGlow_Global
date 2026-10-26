# Server migration kit

Moves the AlpenGlow backend from the old VPS (`169.58.43.191`) to a new
server, then moves Perfect Study Space (PSS) from Supabase cloud onto the
same server, each in its own stack so neither can affect the other.

Not in git, on purpose: snapshots, database dumps, `.env` files, certificates
and `authorized_keys`. They hold secrets and customer data and stay in the
`vps-migration-backup` folder on the laptop (`pull-backup.sh` refuses to
write into a git checkout; `.gitignore` is a second guard).

## Order of work

1. AlpenGlow: `MIGRATION-RUNBOOK.md`, Phases 1 to 6.
2. A week of AlpenGlow running cleanly on the new server.
3. PSS: `PSS-MIGRATION-PLAN.md` (`main` branch only).

`INPUTS-NEEDED.md` lists what has to come from you for each step.

## What is here

| Path | What it is |
|---|---|
| `MIGRATION-RUNBOOK.md` | AlpenGlow move, step by step, with the 26 Oct rehearsal results |
| `PSS-MIGRATION-PLAN.md` | PSS move, step by step |
| `INPUTS-NEEDED.md` | What is needed from you, and the decisions still open |
| `DISASTER-RECOVERY.md` | Rebuilding both projects on a fresh server from the nightly backups |
| `UPDATE-PROCEDURE.md` | Updating Ubuntu, Docker and the Supabase images |
| `pull-backup.sh` | Read-only snapshot of a server into `~/vps-migration-backup` on the laptop |
| `new-server/01-base-setup.sh` | Hardens a fresh Ubuntu 24.04 server and installs the ops scripts |
| `new-server/add-project.sh` | Adds a project (PSS) as its own slim stack: containers, secrets, nginx, backups, health checks |
| `new-server/stack-template/` | That slim stack: database, REST, gateway, edge functions |
| `new-server/restore-public.sh` | Restores a dump with table permissions intact (a plain restore re-opens them) |
| `new-server/backup-nightly.sh`, `healthcheck.sh`, `crontab.deploy`, `ops.env.example` | Nightly backups and 5-minute health checks for every project |
| `new-server/projects/alpenglow-global.conf` | AlpenGlow's entry for those scripts |
| `new-server/alpenglow/docker-compose.limits.yml` | Memory caps and two Kong workers for the AlpenGlow stack |
| `new-server/nginx/` | AlpenGlow's site file, and the template `add-project.sh` uses |
| `new-server/security-test.sh` | Outside-in test of what the internet can reach |
| `pss/vps-deploy.sh` | PSS deploy script, to be added to the PSS repo |
| `pss/frontend-csp.patch` | PSS frontend change for the cutover |

## Status

Rehearsed end to end on 26 Oct 2026 in a disposable Ubuntu 24.04 sandbox,
both stacks running side by side, with the real snapshot (third-party tokens
replaced by dummies). Everything checked matched the old server: row counts,
security policies, table permissions, functions, the scheduled job, and the
frontend's anon key. Details in each document.

The rehearsal found and fixed four problems in the kit before it reached a
server:

- A plain dump restore silently re-opened table permissions closed by
  migrations 007 and 009 (now `restore-public.sh`).
- Supabase's `roles.sql` stops the slim stack's first start halfway (fixed in
  the template).
- The functions runtime allowed 150 MB and 60 s per request, below Supabase
  cloud's 256 MB and 150 s (now set per stack).
- Three PSS migrations need Supabase Storage, so the applied-migrations list
  must be filled before the first PSS deploy (now a numbered step).

Not covered by a sandbox: firewall, sshd, swap, automatic patches, real
certificates and DNS. Phase 2 on the new server is still the real test, and
DNS moves only after it passes.

## Still to do in this repo

After the AlpenGlow cutover: update `deploy/README.md`, `deploy/vps-deploy.sh`
(`VPS_HOST`), `scripts/setup-new-laptop.sh` and the deploy section of
`CLAUDE.md` to the new server (runbook, Phase 5 and "After cutover").

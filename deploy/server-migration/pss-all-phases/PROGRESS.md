# PSS all-phases on the old server: progress

Plan: `PLAN.md` in this folder. Update this file after EVERY finished step,
then commit and push it to `claude/sleepy-johnson-fmuoxd` (pre-approved).
Never write passwords, keys, tokens, connection strings or customer data
here.

## Current step

Step 1 (worktrees and plan): worktrees made, `/add-dir` done, `PLAN.md`
and this file written. Waiting for your OK on `PLAN.md`.

## Next step

Step 2: read-only inventory of `zripsszkprhtyccukrir`. Claude gives you SQL
to paste in its SQL editor (tables and exact row counts, extensions, cron
jobs, storage buckets with file counts, Postgres version) plus
`docs/ops/full-system-diagnostic.sql`; you also give the secret NAMES.

## Done

- **9 Nov 2026** Step 1, worktrees (no server, Cloudflare or Supabase
  change):
  - `claude/sleepy-johnson-fmuoxd` was on GitHub in neither repo when
    checked (`git ls-remote`); created locally from `92156bc` (AlpenGlow,
    = `claude/server-migration-kit`) and `65d8f1a` (PSS, =
    `pss-ai/all-phases`), confirmed by you.
  - `Desktop\AlpenGlow WEB\AlpenGlow-pss-all-phases`: branch at `92156bc`,
    clean, no upstream yet (first push sets it).
  - `Desktop\PSS\pss-all-phases`: branch at `65d8f1a`, clean; after your
    cloud session pushed it, fetched and set to track
    `origin/claude/sleepy-johnson-fmuoxd` (same commit, nothing to merge).
  - Protected folders unchanged: `AlpenGlow-migration` still on
    `claude/server-migration-kit` (`92156bc`), `PSS\perfect-study-space`
    still on `main`.
  - Both folders added with `/add-dir`.
- **9 Nov 2026** Step 1, code read (all-phases at `65d8f1a`, read-only):
  73 migrations; Storage in 002, 010, 016, 059, 062, 069 (048 was a false
  match on `localStorage`); functions `api`, `cron`, `agent` + `_shared`,
  all served by the template's `main` router; signed Storage links built
  from `SUPABASE_URL` (would point at `kong:8000`: open choice 1 in
  `PLAN.md`); `cron.sql` uses Vault and pg_net, 27 jobs; secret names as in
  `PLAN.md`. Docker Desktop installed on the laptop, not running.
- **9 Nov 2026** `PLAN.md` and this file written.

## Decisions

See `PLAN.md`, "Decisions" (branch, folders, Supabase rules, billing,
tracking). In short:

- Only `zripsszkprhtyccukrir`; you log in to its dashboard yourself.
- No Supabase CLI against any project without asking you first.
- `ozatixapvxwrwbpdxuzt` (live PSS) is never touched.
- No `EnterWorktree`; edit by full path; never git or write in
  `PSS\perfect-study-space`, `AlpenGlow-migration`, `AlpenGlow work`.

## Waiting on me

- [ ] Your OK on `PLAN.md` (step 1), including the open choices
      (signed Storage links: proposal A, template only).
- [ ] For step 5 (optional): start Docker Desktop on this laptop if you
      want a local rehearsal.

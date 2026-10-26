# Updating the server

Three layers, three different rhythms. Not rehearsed yet.

| Layer | How it updates | Your part |
|---|---|---|
| Ubuntu packages and kernel | Automatically every night; reboots at 23:30 server time when a patch needs it | None. The health check emails if something does not come back |
| Docker engine | With the Ubuntu packages (it comes from Docker's apt repository) | None |
| Supabase images (Postgres, Kong, REST, functions runtime, Studio, Auth) | **Never by themselves.** Versions are pinned in each project's `docker-compose.yml` | Decide when, then follow the steps below |

## When to update the Supabase images

- A security advisory names one of the pinned images.
- You need a feature or fix from a newer version.
- Otherwise, a look every three to four months is enough. There is no need
  to follow every release.

Current pins (October 2026) are listed in the runbook under "What is on the
old server".

## Steps, one project at a time

Start with the least busy project. Never update two on the same day.

1. **Read the release notes** for each image you are changing. Stop if any
   mention a required migration you do not understand.
2. **Take a backup now** and confirm it finished:
   ```bash
   ~/ops/backup-nightly.sh && cat ~/backups/last-success
   ```
3. **Save the current compose file** next to itself:
   ```bash
   cd ~/projects/<project>/backend && cp docker-compose.yml docker-compose.yml.before-update
   ```
4. **Change the image tags** in `docker-compose.yml`. Change as few as the
   reason for updating requires.
5. **Pull, then restart only what changed:**
   ```bash
   docker compose pull && docker compose up -d
   docker compose ps          # everything healthy?
   ```
6. **Test:** run `~/ops/healthcheck.sh`, run `security-test.sh` from the PC,
   and do the Phase 4 checks for that project.
7. **Leave it a week** before updating the next project.

### Rolling back

```bash
cd ~/projects/<project>/backend
cp docker-compose.yml.before-update docker-compose.yml
docker compose up -d
```

This works for every image **except a Postgres major version**. Postgres
cannot open a data folder written by a newer major version.

## Postgres: minor versus major

- **Minor** (17.6.1.136 to a later 17.x): treated like any other image above.
- **Major** (17 to 18): not an image swap. It is a small migration: take a
  dump, start a new empty Postgres 18 stack, restore, compare row counts,
  switch. Use the same rehearsal-then-cutover routine as the original move,
  with the old data folder kept as the rollback.

## Edge function libraries

The functions download their libraries from `esm.sh` and `deno.land` the
first time they start, then keep them in a cache volume. After an image
update or a cache wipe, start the functions container while those sites are
reachable and call each function once before relying on it.

## What must never be done casually

- `docker compose down -v` or deleting `volumes/db/data`: this destroys the
  database. The only planned use is the cutover reset in the runbook.
- `docker system prune -a --volumes`: removes the function cache and unused
  volumes.
- Editing the live `.env` without a copy: the nightly backup has yesterday's,
  but make a `.env.bak` first anyway.

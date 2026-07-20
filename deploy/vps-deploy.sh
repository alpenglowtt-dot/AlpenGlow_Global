#!/usr/bin/env bash
# One-command backend deploy — run this after ANY change to
# supabase/functions/* or supabase/migrations/*.sql.
#
# What it does:
#   1. Syncs supabase/functions/ -> the VPS (both the reference copy at
#      repo/functions and the live copy the containers actually run from,
#      backend/volumes/functions).
#   2. Syncs supabase/migrations/ -> the VPS, then applies only the .sql
#      files NOT already recorded in public._migrations_applied (so it's
#      safe to run repeatedly — already-applied migrations are skipped).
#   3. Restarts the edge-functions container so new code takes effect.
#
# Requires: the ed25519 key at ~/.ssh/id_ed25519 already installed on the
# VPS (see the one-time setup done in-session — deploy@169.58.43.191).
#
# Usage: bash deploy/vps-deploy.sh
set -euo pipefail

VPS_HOST="deploy@169.58.43.191"
REMOTE_REPO_DIR="projects/alpenglow-global/repo"
REMOTE_BACKEND_DIR="projects/alpenglow-global/backend"
LOCAL_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> [1/3] Syncing edge functions..."
# rsync isn't available on Windows/Git Bash, so mirror via tar over ssh
# instead: wipe the reference copy and re-extract fresh (true mirror,
# handles deletions too, same end result as rsync --delete).
tar czf - -C "$LOCAL_ROOT/supabase/functions" . | \
  ssh "$VPS_HOST" "rm -rf $REMOTE_REPO_DIR/functions && mkdir -p $REMOTE_REPO_DIR/functions && tar xzf - -C $REMOTE_REPO_DIR/functions"
# Copy each function folder from the reference copy into the LIVE copy the
# containers actually mount. Done per-folder (not a wipe-and-replace of the
# whole directory) so the 'main' folder — which exists only in
# volumes/functions (Kong/edge-runtime routing entrypoint, not part of our
# repo) — is never touched or deleted.
ssh "$VPS_HOST" '
  for d in '"$REMOTE_REPO_DIR"'/functions/*/; do
    name=$(basename "$d")
    rm -rf "'"$REMOTE_BACKEND_DIR"'/volumes/functions/$name"
    cp -r "$d" "'"$REMOTE_BACKEND_DIR"'/volumes/functions/$name"
  done
'

echo "==> [2/3] Syncing + applying any new migrations..."
tar czf - -C "$LOCAL_ROOT/supabase/migrations" . | \
  ssh "$VPS_HOST" "mkdir -p $REMOTE_REPO_DIR/migrations && tar xzf - -C $REMOTE_REPO_DIR/migrations"

ssh "$VPS_HOST" bash -s <<'REMOTE_SCRIPT'
set -euo pipefail
cd ~/projects/alpenglow-global/repo/migrations

docker exec supabase-db psql -U postgres -v ON_ERROR_STOP=1 -c "
  CREATE TABLE IF NOT EXISTS public._migrations_applied (
    filename text PRIMARY KEY,
    applied_at timestamptz DEFAULT now()
  );
" > /dev/null

any_new=0
for f in *.sql; do
  already=$(docker exec supabase-db psql -U postgres -tAc "SELECT 1 FROM public._migrations_applied WHERE filename='$f'")
  if [ "$already" = "1" ]; then
    continue
  fi
  any_new=1
  echo "  - applying $f"
  docker exec -i supabase-db psql -U postgres -v ON_ERROR_STOP=1 < "$f"
  docker exec supabase-db psql -U postgres -c "INSERT INTO public._migrations_applied (filename) VALUES ('$f')" > /dev/null
done
if [ "$any_new" = "0" ]; then
  echo "  (no new migrations — everything already applied)"
fi
REMOTE_SCRIPT

echo "==> [3/3] Restarting functions container..."
ssh "$VPS_HOST" "cd ~/$REMOTE_BACKEND_DIR && docker compose restart functions"

echo "==> Done. Tail logs with:"
echo "    ssh $VPS_HOST 'docker compose -f ~/$REMOTE_BACKEND_DIR/docker-compose.yml logs -f functions'"

#!/usr/bin/env bash
# Deploys the AlpenGlow edge functions + JWT verification config to the
# self-hosted Supabase stack. Run this ON THE VPS from inside the cloned
# AlpenGlow_Global repo (or after rsync'ing supabase/functions there).
#
# Usage: sudo bash 03-deploy-functions.sh /opt/supabase /path/to/AlpenGlow_Global
set -euo pipefail

SUPABASE_DIR="${1:-/opt/supabase}"
REPO_DIR="${2:-$(pwd)}"

if [ ! -d "$REPO_DIR/supabase/functions" ]; then
  echo "Error: $REPO_DIR/supabase/functions not found." >&2
  exit 1
fi

echo "==> Copying functions into $SUPABASE_DIR/volumes/functions"
mkdir -p "$SUPABASE_DIR/volumes/functions"
rsync -a --delete "$REPO_DIR/supabase/functions/" "$SUPABASE_DIR/volumes/functions/"

echo "==> Copying docker-compose.override.yml (function secrets) if not already present"
if [ ! -f "$SUPABASE_DIR/docker-compose.override.yml" ]; then
  cp "$REPO_DIR/deploy/docker-compose.override.yml" "$SUPABASE_DIR/docker-compose.override.yml"
fi

echo "==> Restarting the functions container to pick up new code + env"
cd "$SUPABASE_DIR"
docker compose up -d functions
docker compose restart functions

echo "==> Done. Tail logs with: docker compose logs -f functions"
echo "    Every AlpenGlow call sends the ANON_KEY itself as the Authorization"
echo "    bearer token (see AlpenGlow/api.js callEdge()), which is already a"
echo "    valid signed JWT — so Kong's default JWT check at the gateway passes"
echo "    regardless of the cloud-only 'verify_jwt' setting in config.toml."
echo "    If you see 401s from Kong, check volumes/api/kong.yml's apikey/jwt"
echo "    plugin config on the /functions/v1/* routes."

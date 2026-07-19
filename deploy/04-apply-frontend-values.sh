#!/usr/bin/env bash
# Fills in the real VPS_IP + ANON_KEY across all 4 frontend files in one shot,
# once you have them (VPS_IP from your provider, ANON_KEY from generate-keys.js).
#
# Run from the repo root (on your dev machine, not the VPS):
#   bash deploy/04-apply-frontend-values.sh 203.0.113.10 eyJhbGciOi...
set -euo pipefail

VPS_IP="${1:?Usage: $0 <VPS_IP> <ANON_KEY>}"
ANON_KEY="${2:?Usage: $0 <VPS_IP> <ANON_KEY>}"

FILES=(
  "AlpenGlow/api.js"
  "AlpenGlow/compass.html"
  "AlpenGlow/dashboard.html"
  "AlpenGlow/trip-planner.js"
)

for f in "${FILES[@]}"; do
  sed -i \
    -e "s|http://VPS_IP:8000|http://${VPS_IP}:8000|g" \
    -e "s|PASTE_NEW_SELF_HOSTED_ANON_KEY_HERE|${ANON_KEY}|g" \
    "$f"
  echo "Updated $f"
done

echo "Done. Review the diffs (git diff) before committing/deploying."

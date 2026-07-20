#!/usr/bin/env bash
# One-time setup for graphify on a NEW laptop cloning this repo.
#
# Everything else (CLAUDE.md, .claude/settings.json, .gitattributes,
# deploy/vps-deploy.sh) already comes with `git pull` — this script only
# covers the two things Git deliberately never syncs: the local git hooks
# and the graphify binary itself.
#
# Usage: bash scripts/setup-new-laptop.sh
set -euo pipefail

if ! command -v uv >/dev/null 2>&1; then
  echo "==> Installing uv..."
  powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
  echo "    (restart your shell / open a new terminal window before continuing)"
  exit 0
fi

echo "==> Installing graphify CLI..."
uv tool install graphifyy

echo "==> Installing git hooks (post-commit/post-checkout + merge driver)..."
cd "$(dirname "${BASH_SOURCE[0]}")/.."
graphify hook install

echo "==> Done. graphify will now auto-rebuild the graph after every commit/checkout."
echo "    (CLAUDE.md and .claude/settings.json already came from git pull — nothing"
echo "     else to install for those.)"
echo
echo "==> For VPS deploy access (deploy/vps-deploy.sh), you still need an SSH key"
echo "    added to the VPS from THIS laptop. Generate one:"
echo "      ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N \"\""
echo "    then share the PUBLIC key (cat ~/.ssh/id_ed25519.pub) so it can be added"
echo "    to deploy@169.58.43.191's authorized_keys from an already-authorized machine —"
echo "    password auth is disabled on that server, so this is the only way in."

#!/usr/bin/env bash
# Stop hook for the server migration. Keeps the progress notes on GitHub:
# while deploy/server-migration/PROGRESS.md exists and this checkout is on
# claude/server-migration-kit, Claude may not finish a reply with PROGRESS.md
# uncommitted or with commits not pushed. Silent otherwise. Remove this hook
# (and its entry in .claude/settings.json) once both projects have moved.
input=$(cat)
# Already blocked once in this reply: let it finish, never loop.
case "$input" in *'"stop_hook_active":true'*|*'"stop_hook_active": true'*) exit 0 ;; esac
cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || true   # hooks already run in the project folder
[ -f deploy/server-migration/PROGRESS.md ] || exit 0
[ "$(git rev-parse --abbrev-ref HEAD 2>/dev/null)" = "claude/server-migration-kit" ] || exit 0
why=""
if git status --porcelain -- deploy/server-migration/PROGRESS.md | grep -q .; then
  why="PROGRESS.md has changes that are not committed."
fi
ahead=$(git rev-list --count '@{u}..HEAD' 2>/dev/null || echo 0)
if [ "${ahead:-0}" -gt 0 ]; then
  why="$why $ahead commit(s) on claude/server-migration-kit are not pushed."
fi
[ -z "$why" ] && exit 0
echo "Server migration:$why Commit deploy/server-migration/PROGRESS.md (and only migration files, never secrets) and push claude/server-migration-kit before finishing." >&2
exit 2

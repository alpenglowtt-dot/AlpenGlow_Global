#!/usr/bin/env bash
# Nightly backup, run by cron as the deploy user. The old server had no
# backup at all.
#
# Covers every project listed in ~/ops/projects/*.conf (AlpenGlow, PSS, ...).
# Each project has its own Postgres, so each gets its own folder:
#   ~/backups/<YYYY-MM-DD_HHMM>/<project>/{public,globals,cluster}.sql.gz,
#   row-counts.txt, config.tar.gz
# plus server-config.tar.gz (nginx, ops settings) once per night.
# Keeps KEEP_DAYS days locally. If RCLONE_REMOTE is set in ~/ops/ops.env, the
# night's folder is also encrypted and copied off the server. A local-only
# backup does not survive a dead disk, so set it.
#
# healthcheck.sh alerts when ~/backups/last-success is older than 26 hours.
set -uo pipefail
umask 077

ROOT="$HOME/backups"
KEEP_DAYS=14
KEEP_OFFSITE_DAYS=90
RCLONE_REMOTE=""
# shellcheck disable=SC1091
[ -f "$HOME/ops/ops.env" ] && . "$HOME/ops/ops.env"

D="$ROOT/$(date +%Y-%m-%d_%H%M)"
fail=0
mkdir -p "$D"
echo "== $(date -Is) backup -> $D"

dump() {  # dump <file> <command...>   (pipefail makes a failed dump fail the pipe)
  local out="$1"; shift
  if ! "$@" | gzip -c > "$out"; then echo "   FAILED: $out"; fail=1; fi
}

shopt -s nullglob
confs=("$HOME"/ops/projects/*.conf)
[ "${#confs[@]}" -gt 0 ] || { echo "   FAILED: no project files in ~/ops/projects"; fail=1; }

for conf in "${confs[@]}"; do
  # Fresh variables per project so nothing leaks from the previous one.
  unset NAME BACKEND DB_CONTAINER
  # shellcheck disable=SC1090
  . "$conf"
  P="$D/$NAME"
  mkdir -p "$P"
  DB="docker exec $DB_CONTAINER"
  echo "-- $NAME ($DB_CONTAINER)"

  dump "$P/public.sql.gz"  $DB pg_dump    -U supabase_admin -d postgres --schema=public --no-owner
  dump "$P/globals.sql.gz" $DB pg_dumpall -U supabase_admin --globals-only
  dump "$P/cluster.sql.gz" $DB pg_dumpall -U supabase_admin

  # A dump that stopped half way still gzips cleanly, so check the end marker.
  if ! zcat "$P/cluster.sql.gz" 2>/dev/null | tail -3 | grep -q "database cluster dump complete"; then
    echo "   FAILED: $NAME cluster dump is incomplete"; fail=1
  fi

  # Row counts, so a restore can be checked against them.
  for t in $($DB psql -U supabase_admin -d postgres -X -tAc "select table_schema||'.'||table_name from information_schema.tables where table_schema in ('public') and table_type='BASE TABLE' order by 1"); do
    echo "$t $($DB psql -U supabase_admin -d postgres -X -tAc "select count(*) from $t")"
  done > "$P/row-counts.txt"
  [ -s "$P/row-counts.txt" ] || { echo "   FAILED: $NAME row counts"; fail=1; }

  # Secrets and config that exist only on the server. Missing optional files
  # (functions.env, docker-compose.limits.yml) are skipped.
  rel="${BACKEND#"$HOME"/}"
  files=()
  for f in .env functions.env docker-compose.yml docker-compose.override.yml docker-compose.limits.yml volumes/api volumes/functions; do
    [ -e "$BACKEND/$f" ] && files+=("$rel/$f")
  done
  tar czf "$P/config.tar.gz" -C "$HOME" "${files[@]}" 2>/dev/null \
    || { echo "   FAILED: $NAME config archive"; fail=1; }
done

# Server-wide settings: ops settings, project list, nginx sites and zones.
tar czf "$D/server-config.tar.gz" --ignore-failed-read \
  -C "$HOME" ops/ops.env ops/projects \
  -C / etc/nginx/sites-available etc/nginx/conf.d 2>/dev/null \
  || { echo "   FAILED: server config archive"; fail=1; }

if [ -n "$RCLONE_REMOTE" ]; then
  # The folder holds every secret and all customer data, so it is encrypted
  # into one file before it leaves the server. To open it later:
  #   gpg --batch --passphrase-file backup.passphrase -d FILE.tar.gpg | tar xf -
  PASSFILE="$HOME/ops/backup.passphrase"
  ENC="$ROOT/$(basename "$D").tar.gpg"
  if [ ! -s "$PASSFILE" ]; then
    echo "   FAILED: $PASSFILE is missing, refusing to upload unencrypted"; fail=1
  elif tar cf - -C "$ROOT" "$(basename "$D")" \
       | gpg --batch --yes --pinentry-mode loopback --passphrase-file "$PASSFILE" \
             --symmetric --cipher-algo AES256 -o "$ENC" \
       && rclone copy "$ENC" "$RCLONE_REMOTE" --quiet; then
    rclone delete "$RCLONE_REMOTE" --min-age "${KEEP_OFFSITE_DAYS}d" --quiet || true
  else
    echo "   FAILED: encrypted off-server copy to $RCLONE_REMOTE"; fail=1
  fi
  rm -f "$ENC"
else
  echo "   note: RCLONE_REMOTE not set, backup is on this server only"
fi

# Drop local backups older than KEEP_DAYS. Only touches dated folders.
find "$ROOT" -mindepth 1 -maxdepth 1 -type d -name '20??-??-??_????' -mtime +"$KEEP_DAYS" -exec rm -rf {} +

if [ "$fail" = 0 ]; then
  date -Is > "$ROOT/last-success"
  echo "   ok: $(du -sh "$D" | cut -f1)"
else
  echo "   BACKUP FINISHED WITH ERRORS"
  exit 1
fi

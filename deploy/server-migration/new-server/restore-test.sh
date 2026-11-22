#!/usr/bin/env bash
# Monthly restore test, run by cron as the deploy user (crontab.deploy). A backup that
# has never been restored is only a hope: this restores the newest complete backup of
# every project into a scratch database, checks it, removes it, and emails the result.
#
# For each project in ~/ops/projects/*.conf:
#   1. the newest ~/backups/<date>/ folder with this project's public.sql.gz and
#      row-counts.txt (written by backup-nightly.sh)
#   2. a scratch database restore_test_<date> in the project's own database container
#   3. restore-public.sh into it (the same script a real restore uses)
#   4. every table's row count against row-counts.txt from that backup
#   5. the scratch database dropped again, whatever happened
# The live databases are only read from (never written to); the scratch database lives
# next to them for the few seconds the test takes.
#
#   restore-test.sh            normal run (emails PASS or FAIL)
#   restore-test.sh --no-mail  print only
set -uo pipefail

OPS="$HOME/ops"
ROOT="$HOME/backups"
ALERT_TO=""
ALERT_ENV="$HOME/projects/alpenglow-global/backend/.env"
# shellcheck disable=SC1091
[ -f "$OPS/ops.env" ] && . "$OPS/ops.env"
MAIL=1; [ "${1:-}" = "--no-mail" ] && MAIL=0

envval() { grep -E "^$2=" "$1" 2>/dev/null | head -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//'; }
report=()
fails=0
say() { echo "$1"; report+=("$1"); }

shopt -s nullglob
confs=("$OPS"/projects/*.conf)
[ "${#confs[@]}" -gt 0 ] || { say "FAIL: no project files in ~/ops/projects"; fails=1; }

for conf in "${confs[@]}"; do
  unset NAME DB_CONTAINER
  # shellcheck disable=SC1090
  . "$conf"
  latest=""
  for d in $(ls -1d "$ROOT"/20??-??-??_???? 2>/dev/null | sort -r); do
    if [ -s "$d/$NAME/public.sql.gz" ] && [ -s "$d/$NAME/row-counts.txt" ]; then latest="$d"; break; fi
  done
  if [ -z "$latest" ]; then say "FAIL $NAME: no complete backup found in $ROOT"; fails=1; continue; fi
  SCRATCH="restore_test_$(date +%Y%m%d_%H%M)"
  PSQL=(docker exec -i "$DB_CONTAINER" psql -U postgres -X -v ON_ERROR_STOP=1 -q)
  if ! "${PSQL[@]}" -d postgres -c "CREATE DATABASE $SCRATCH" > /dev/null 2>&1; then
    say "FAIL $NAME: could not create the scratch database"; fails=1; continue
  fi
  ok=1
  out=$("$OPS/restore-public.sh" "$DB_CONTAINER" "$latest/$NAME/public.sql.gz" "$SCRATCH" 2>&1) || ok=0
  [ "$ok" = 1 ] || { say "FAIL $NAME: restore-public.sh reported unexpected errors ($(basename "$latest"))"; printf '%s\n' "$out" | tail -5 | sed 's/^/    /'; }
  # Row counts: every table of the backup's row-counts.txt, in the scratch database.
  tables=0; wrong=0
  while read -r t n; do
    [ -n "$t" ] || continue
    tables=$((tables + 1))
    got=$(docker exec "$DB_CONTAINER" psql -U postgres -d "$SCRATCH" -X -tAc "select count(*) from $t" 2>/dev/null || echo "missing")
    if [ "$got" != "$n" ]; then wrong=$((wrong + 1)); [ "$wrong" -le 5 ] && say "    $NAME $t: backup $n, restored $got"; fi
  done < "$latest/$NAME/row-counts.txt"
  docker exec "$DB_CONTAINER" psql -U postgres -d postgres -X -q -c "DROP DATABASE IF EXISTS $SCRATCH WITH (FORCE)" > /dev/null 2>&1 \
    || say "    $NAME: could not drop $SCRATCH, drop it by hand"
  if [ "$ok" = 1 ] && [ "$wrong" = 0 ] && [ "$tables" -gt 0 ]; then
    say "PASS $NAME: backup $(basename "$latest") restored, $tables tables, every row count matches"
  else
    say "FAIL $NAME: backup $(basename "$latest"), $wrong of $tables tables differ"; fails=1
  fi
done

state="PASS"; [ "$fails" = 0 ] || state="FAIL"
echo "== $(date -Is) restore test: $state"
[ "$MAIL" = 1 ] || exit "$fails"

RESEND_API_KEY="$(envval "$ALERT_ENV" RESEND_API_KEY)"
FROM_DOMAIN="$(envval "$ALERT_ENV" EMAIL_FROM_DOMAIN)"
[ -n "$ALERT_TO" ] || ALERT_TO="$(envval "$ALERT_ENV" AGENCY_EMAIL)"
if [ -z "$RESEND_API_KEY" ] || [ -z "$ALERT_TO" ]; then echo "   (no RESEND_API_KEY or ALERT_TO, result not emailed)"; exit "$fails"; fi
from="onboarding@resend.dev"; [ -z "$FROM_DOMAIN" ] || from="info@$FROM_DOMAIN"
payload=$(SUBJECT="[AlpenGlow server] Monthly restore test: $state" BODY="$(printf '%s\n' "${report[@]}")" FROM="$from" TO="$ALERT_TO" HOST="$(hostname)" python3 -c '
import json, os
print(json.dumps({"from": "Alpen Glow Server <%s>" % os.environ["FROM"], "to": [os.environ["TO"]],
  "subject": os.environ["SUBJECT"], "text": os.environ["BODY"] + "\n\nServer: " + os.environ["HOST"]}))')
code=$(curl -s -o /dev/null -m 15 -w '%{http_code}' -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" -H "Content-Type: application/json" -d "$payload")
case "$code" in 2??) echo "   emailed $ALERT_TO" ;; *) echo "   email failed, Resend answered $code" ;; esac
exit "$fails"

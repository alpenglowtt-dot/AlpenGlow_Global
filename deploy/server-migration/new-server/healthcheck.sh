#!/usr/bin/env bash
# Health check, run by cron every 5 minutes as the deploy user. The old
# server had Docker health checks but told nobody when one failed.
#
# Emails ALERT_TO through Resend (the same key and sender the site already
# uses) when the set of problems changes, when everything recovers, and once
# a day while a problem lasts. Prints nothing when nothing changed.
#
# Checks every project listed in ~/ops/projects/*.conf (containers, database,
# API, domain, certificate), then the server itself (disk, memory, load,
# backup age). Problems are prefixed with the project name.
#
# Limit: it runs on the server, so it cannot report the server itself being
# down. An outside uptime monitor on each API domain covers that.
set -uo pipefail

STATE_DIR="$HOME/ops/state"
STATE="$STATE_DIR/health.state"
DISK_MAX=80          # percent
MEM_MIN_MB=300
CERT_MIN_DAYS=14
BACKUP_MAX_MIN=1560  # 26 hours
ALERT_TO=""
# Alerts are sent with AlpenGlow's Resend key and sender.
ALERT_ENV="$HOME/projects/alpenglow-global/backend/.env"
# shellcheck disable=SC1091
[ -f "$HOME/ops/ops.env" ] && . "$HOME/ops/ops.env"
mkdir -p "$STATE_DIR"

envval() { grep -E "^$2=" "$1" 2>/dev/null | head -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//'; }
RESEND_API_KEY="$(envval "$ALERT_ENV" RESEND_API_KEY)"
FROM_DOMAIN="$(envval "$ALERT_ENV" EMAIL_FROM_DOMAIN)"
[ -n "$ALERT_TO" ] || ALERT_TO="$(envval "$ALERT_ENV" AGENCY_EMAIL)"

problems=()
add() { problems+=("$1"); }
# Prints the HTTP status; curl itself prints 000 when the request fails.
http() { local c; c=$(curl -s -o /dev/null -m 15 -w '%{http_code}' "$@" 2>/dev/null); echo "${c:-000}"; }

shopt -s nullglob
confs=("$HOME"/ops/projects/*.conf)
[ "${#confs[@]}" -gt 0 ] || add "no project files in ~/ops/projects"

for conf in "${confs[@]}"; do
  unset NAME BACKEND DB_CONTAINER CONTAINERS DOMAIN PROBE_URL PROBE_KEY_VAR
  # shellcheck disable=SC1090
  . "$conf"

  for c in $CONTAINERS; do
    st=$(docker inspect -f '{{.State.Status}}{{if .State.Health}}/{{.State.Health.Status}}{{end}}' "$c" 2>/dev/null || echo missing)
    case "$st" in running|running/healthy|running/starting) ;; *) add "$NAME: container $c is $st" ;; esac
  done

  docker exec "$DB_CONTAINER" pg_isready -U postgres -q 2>/dev/null || add "$NAME: postgres is not accepting connections"

  key=""
  [ -n "${PROBE_KEY_VAR:-}" ] && key="$(envval "$BACKEND/.env" "$PROBE_KEY_VAR")"
  code=$(http "$PROBE_URL" -H "apikey: $key")
  [ "$code" = 200 ] || add "$NAME: API (rest via Kong) answered $code"

  d="$DOMAIN"
  code=$(http "https://$d/")
  case "$code" in 000|5??) add "$NAME: https://$d answered $code" ;; esac
  if ! echo | openssl s_client -servername "$d" -connect "$d:443" 2>/dev/null \
       | openssl x509 -noout -checkend $((CERT_MIN_DAYS * 86400)) >/dev/null 2>&1; then
    add "$NAME: certificate for $d expires within $CERT_MIN_DAYS days or could not be read"
  fi
done

use=$(df --output=pcent / | tail -1 | tr -dc 0-9)
[ "${use:-0}" -lt "$DISK_MAX" ] || add "disk is ${use}% full"

avail=$(awk '/MemAvailable/{print int($2/1024)}' /proc/meminfo)
[ "${avail:-9999}" -ge "$MEM_MIN_MB" ] || add "only ${avail} MB of memory available"

cores=$(nproc)
load5=$(awk '{print $2}' /proc/loadavg)
if awk -v l="$load5" -v c="$cores" 'BEGIN{exit !(l > c * 1.5)}'; then
  add "CPU load is $load5 over 5 minutes on $cores cores"
fi

if ! find "$HOME/backups/last-success" -mmin -"$BACKUP_MAX_MIN" 2>/dev/null | grep -q .; then
  add "no successful backup in the last 26 hours"
fi

current=$(printf '%s\n' "${problems[@]:-}" | sed '/^$/d' | sort)
previous=$(cat "$STATE" 2>/dev/null || true)

send=0
if [ "$current" != "$previous" ]; then
  send=1
elif [ -n "$current" ] && find "$STATE" -mmin +1440 2>/dev/null | grep -q .; then
  send=1   # still broken a day later: remind
fi
[ "$send" = 1 ] || exit 0

if [ -n "$current" ]; then
  subject="[AlpenGlow server] PROBLEM: $(printf '%s\n' "$current" | wc -l) issue(s)"
  body="$current"
else
  subject="[AlpenGlow server] RECOVERED"
  body="All checks pass again. Previously failing:
$previous"
fi
echo "== $(date -Is) $subject"
printf '%s\n' "$body" | sed 's/^/   /'
printf '%s\n' "$current" > "$STATE"

if [ -z "$RESEND_API_KEY" ] || [ -z "$ALERT_TO" ]; then
  echo "   (no RESEND_API_KEY or ALERT_TO, alert not emailed)"
  exit 0
fi
from="onboarding@resend.dev"
[ -z "$FROM_DOMAIN" ] || from="info@$FROM_DOMAIN"
payload=$(SUBJECT="$subject" BODY="$body" FROM="$from" TO="$ALERT_TO" HOST="$(hostname)" python3 -c '
import json, os
print(json.dumps({
  "from": "Alpen Glow Server <%s>" % os.environ["FROM"],
  "to": [os.environ["TO"]],
  "subject": os.environ["SUBJECT"],
  "text": os.environ["BODY"] + "\n\nServer: " + os.environ["HOST"],
}))')
code=$(http -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" -H "Content-Type: application/json" -d "$payload")
case "$code" in 2??) echo "   emailed $ALERT_TO" ;; *) echo "   email failed, Resend answered $code" ;; esac

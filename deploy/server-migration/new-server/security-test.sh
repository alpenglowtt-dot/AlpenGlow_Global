#!/usr/bin/env bash
# Outside-in security test for one project's API. Run from the laptop, never
# from the server, so it sees what the internet sees.
#
#   bash security-test.sh <api-host> <anon-key> [server-ip] [--burst]
#
# server-ip: test a server before DNS points at it.
# --burst:   also fire 200 quick requests to prove rate limiting answers 429.
#
# It only reads status codes and row counts. It never prints row contents and
# never writes anything.
#
# The defaults describe AlpenGlow. For another project, override the lists
# (an empty value means "none"). For PSS, whose site only calls functions,
# every table must be closed:
#   T=$(ssh deploy@NEW_IP "docker exec pss-db psql -U postgres -d postgres -tAc \"select string_agg(tablename, ' ') from pg_tables where schemaname = 'public'\"")
#   LOCKED="$T" PUBLIC_OK="" CLOSED_PORTS="5432 6543 8000 8010 8443 3000" \
#     bash security-test.sh api.perfectstudyspace.in <pss anon key> NEW_IP --burst
set -uo pipefail

HOST="${1:?api host, e.g. api.alpenglowglobal.com}"
KEY="${2:?anon key}"
IP=""; BURST=0
for a in "${@:3}"; do case "$a" in --burst) BURST=1 ;; *) IP="$a" ;; esac; done

# Tables the public key must NOT be able to read, and ones it may.
LOCKED="${LOCKED-leads lead_activities follow_ups otp_verifications trip_leads _migrations_applied}"
PUBLIC_OK="${PUBLIC_OK-packages package_pages blog_posts offers destinations}"
# Paths that must not be reachable at all (Studio, Auth, storage, admin).
BLOCKED_PATHS="${BLOCKED_PATHS-/ /project/default /auth/v1/settings /auth/v1/signup /storage/v1/status /pg/ /analytics/v1/ /realtime/v1/ /graphql/v1}"
CLOSED_PORTS="${CLOSED_PORTS-5432 6543 8000 8443 3000}"

R=(); [ -n "$IP" ] && R=(--resolve "$HOST:443:$IP")
TARGET="${IP:-$HOST}"
fails=0; warns=0
row() { printf '%-5s %-44s %s\n' "$1" "$2" "$3"; case "$1" in FAIL) fails=$((fails+1)) ;; WARN) warns=$((warns+1)) ;; esac; }
code() { local c; c=$(curl -s -o /dev/null -m 15 "${R[@]}" -w '%{http_code}' "$@" 2>/dev/null); echo "${c:-000}"; }

echo "Target: https://$HOST ${IP:+(forced to $IP)}"
echo

echo "-- tables that must be closed to the public key"
for t in $LOCKED; do
  h=$(curl -s -o /dev/null -m 15 "${R[@]}" -D - -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
        -H "Prefer: count=exact" -H "Range: 0-0" "https://$HOST/rest/v1/$t?select=*" 2>/dev/null | tr -d '\r')
  st=$(printf '%s\n' "$h" | awk 'NR==1{print $2}')
  n=$(printf '%s\n' "$h" | awk -F/ 'tolower($0) ~ /^content-range/{print $2}')
  case "$st" in
    401|403|404) row PASS "$t" "status $st" ;;
    200|206) if [ "${n:-0}" = "0" ] || [ "${n:-}" = "*" ]; then row PASS "$t" "status $st, 0 rows visible"; else row FAIL "$t" "$n rows readable with the public key"; fi ;;
    *) row WARN "$t" "status ${st:-none}" ;;
  esac
done

echo
echo "-- tables the site is allowed to read"
for t in $PUBLIC_OK; do
  st=$(code -H "apikey: $KEY" -H "Range: 0-0" "https://$HOST/rest/v1/$t?select=id")
  case "$st" in 200|206) row PASS "$t" "status $st" ;; 404) row WARN "$t" "status 404 (REST not exposed, fine if the site does not read it)" ;; *) row WARN "$t" "status $st" ;; esac
done

echo
echo "-- paths that must not be reachable"
for p in $BLOCKED_PATHS; do
  st=$(code -H "apikey: $KEY" "https://$HOST$p")
  case "$st" in
    404|403) row PASS "$p" "status $st" ;;
    401) row FAIL "$p" "status 401: reachable, protected only by a password or key" ;;
    000) row WARN "$p" "no answer" ;;
    *) row FAIL "$p" "status $st: reachable" ;;
  esac
done

echo
echo "-- ports that must be closed from the internet"
for port in $CLOSED_PORTS; do
  if timeout 5 bash -c "exec 3<>/dev/tcp/$TARGET/$port" 2>/dev/null; then row FAIL "port $port" "open"; else row PASS "port $port" "closed or filtered"; fi
done

echo
echo "-- TLS"
for v in tls1 tls1_1; do
  out=$(echo | openssl s_client -connect "$TARGET:443" -servername "$HOST" -$v 2>&1)
  if printf '%s' "$out" | grep -q "Cipher is (NONE)\|no protocols available\|unsupported protocol\|alert protocol version"; then row PASS "$v" "refused"
  elif printf '%s' "$out" | grep -qE "Cipher is [A-Z0-9]"; then row FAIL "$v" "accepted"
  else row WARN "$v" "could not tell (local openssl may not support it)"; fi
done
if echo | openssl s_client -connect "$TARGET:443" -servername "$HOST" 2>/dev/null | openssl x509 -noout -checkend $((14*86400)) >/dev/null 2>&1; then
  row PASS "certificate" "valid for more than 14 days"
else
  row FAIL "certificate" "expires within 14 days, or does not match $HOST"
fi

if [ "$BURST" = 1 ]; then
  echo
  echo "-- rate limiting (200 quick requests)"
  n429=0
  for i in $(seq 1 200); do
    [ "$(code -H "apikey: $KEY" "https://$HOST/functions/v1/does-not-exist")" = 429 ] && n429=$((n429+1))
  done
  if [ "$n429" -gt 0 ]; then row PASS "rate limit" "$n429 of 200 answered 429"; else row FAIL "rate limit" "no request was limited"; fi
fi

echo
echo "Result: $fails FAIL, $warns WARN"
[ "$fails" = 0 ]

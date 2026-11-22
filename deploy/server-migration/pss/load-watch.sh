#!/usr/bin/env bash
# Watches the shared server while a PSS load test runs. Read-only; leaves no file behind.
# Run from the laptop, as deploy, for the length of the test plus a little:
#   ssh deploy@NEW_IP 'bash -s' -- 150 < deploy/server-migration/pss/load-watch.sh
# Every 5 s: AlpenGlow's own API probe (the health check's, through its Kong on :8000),
# memory available, the PSS functions container's memory. At the end: AlpenGlow probe
# p50/p95/max, lowest memory available, highest memory per container, PSS functions
# restarts and out-of-memory kills, Kong 5xx and error lines, all during the window.
set -uo pipefail
SECS="${1:-120}"
envval() { grep -E "^$2=" "$1" 2>/dev/null | head -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//'; }
AG_KEY="$(envval "$HOME/projects/alpenglow-global/backend/.env" ANON_KEY)"   # kept in a variable, never printed
PROBE="http://127.0.0.1:8000/rest/v1/packages?select=id&limit=1"
since="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
rc0=$(docker inspect -f '{{.RestartCount}}' pss-functions 2>/dev/null || echo 0)
ms=(); minavail=999999; declare -A peak
end=$(( $(date +%s) + SECS ))
echo "time      alpenglow_ms  mem_available_MB  pss-functions"
while [ "$(date +%s)" -lt "$end" ]; do
  t=$(curl -s -o /dev/null -m 10 -w '%{http_code} %{time_total}' -H "apikey: $AG_KEY" -H "Authorization: Bearer $AG_KEY" "$PROBE")
  code=${t% *}; sec=${t#* }; m=$(awk -v s="$sec" 'BEGIN{printf "%d", s*1000}')
  [ "$code" = 200 ] || m="ERR$code"
  ms+=("$m")
  avail=$(awk '/MemAvailable/{print int($2/1024)}' /proc/meminfo); [ "$avail" -lt "$minavail" ] && minavail=$avail
  while read -r name mem; do
    v=$(awk -v x="$mem" 'BEGIN{n=x+0; if (x ~ /GiB/) n*=1024; else if (x ~ /KiB/) n/=1024; printf "%d", n}')
    [ "${peak[$name]:-0}" -lt "$v" ] && peak[$name]=$v
  done < <(docker stats --no-stream --format '{{.Name}} {{.MemUsage}}' | awk '{print $1, $2}')
  printf '%s  %12s  %16s  %s MiB\n' "$(date +%H:%M:%S)" "$m" "$avail" "${peak[pss-functions]:-?}"
  sleep 5
done
ok=$(printf '%s\n' "${ms[@]}" | grep -v ERR | sort -n)
n=$(printf '%s\n' "$ok" | grep -c .); errs=$(printf '%s\n' "${ms[@]}" | grep -c ERR)
pct() { printf '%s\n' "$ok" | awk -v p="$1" -v n="$n" 'NR==int((n-1)*p)+1{print; exit}'; }
echo "== summary ($since to now)"
echo "AlpenGlow probe: $n ok, $errs errors, p50 $(pct 0.5) ms, p95 $(pct 0.95) ms, max $(printf '%s\n' "$ok" | tail -1) ms"
echo "lowest memory available: $minavail MB"
echo "highest memory per container (MiB):"
for k in "${!peak[@]}"; do echo "  $k ${peak[$k]}"; done | sort -k2 -n -r
rc1=$(docker inspect -f '{{.RestartCount}}' pss-functions 2>/dev/null || echo 0)
echo "pss-functions restarts during the window: $((rc1 - rc0)), OOM-killed flag: $(docker inspect -f '{{.State.OOMKilled}}' pss-functions 2>/dev/null)"
echo "pss-kong 5xx answers: $(docker logs --since "$since" pss-kong 2>/dev/null | grep -cE '" 5[0-9][0-9] ')"
echo "pss-kong error lines: $(docker logs --since "$since" pss-kong 2>&1 >/dev/null | grep -ciE '\[(error|crit|alert|emerg)\]')"
echo "pss-functions CPU-limit cancels / worker errors: $(docker logs --since "$since" pss-functions 2>&1 | grep -ciE 'cpu time (soft|hard) limit|early drop|failed to respond|worker boot error')"

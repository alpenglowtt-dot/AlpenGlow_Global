#!/usr/bin/env bash
# Pulls a complete, dated snapshot of the VPS into $OUT/<YYYY-MM-DD_HHMM>/.
# Read-only on the server: every dump is streamed over SSH, nothing is
# written there. Re-run this right before cutover to get the final data.
#
# A snapshot holds every secret and all customer data, so it is written
# OUTSIDE the repo: OUT defaults to ~/vps-migration-backup. Never point OUT
# inside a git checkout.
#
# Usage:  bash pull-backup.sh                 (old server)
#         VPS_HOST=deploy@NEW_IP bash pull-backup.sh
#         OUT="/c/Users/<you>/Desktop/vps-migration-backup" bash pull-backup.sh
set -uo pipefail

VPS_HOST="${VPS_HOST:-deploy@169.58.43.191}"
OUT="${OUT:-$HOME/vps-migration-backup}"
if git -C "$OUT" rev-parse --is-inside-work-tree >/dev/null 2>&1 || git -C "$(dirname "$OUT")" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Refusing: $OUT is inside a git checkout, and a snapshot must never be committed."; exit 1
fi
B="$OUT/$(date +%Y-%m-%d_%H%M)"
S="ssh -o BatchMode=yes -o ConnectTimeout=20 $VPS_HOST"
DB="docker exec supabase-db"
fail=0
step() { echo "==> $1"; }
check() { if [ "$1" != "0" ]; then echo "    !! FAILED: $2"; fail=1; fi; }

mkdir -p "$B"/{files,db,host,docker}

step "project files (.env, compose, volumes, deploy scripts, travel-app source)"
$S 'cd ~/projects && tar czf - --exclude=alpenglow-global/backend/volumes/db/data alpenglow-global' > "$B/files/alpenglow-global.tar.gz"; check $? alpenglow-global
$S 'cd ~/projects && tar czf - travel-app' > "$B/files/travel-app.tar.gz"; check $? travel-app
$S 'cd ~ && tar czf - .ssh/authorized_keys .bash_history .bashrc .profile' > "$B/files/deploy-home-dotfiles.tar.gz"; check $? dotfiles

step "host config readable without root (nginx, certbot renewal, sshd, fail2ban, cron)"
$S 'tar czf - --ignore-failed-read /etc/nginx /etc/letsencrypt/renewal /etc/letsencrypt/renewal-hooks /etc/letsencrypt/options-ssl-nginx.conf /etc/letsencrypt/ssl-dhparams.pem /etc/letsencrypt/cli.ini /etc/ssh/sshd_config /etc/ssh/sshd_config.d /etc/fail2ban /etc/cron.d /etc/ufw/ufw.conf /etc/default/ufw /etc/sysctl.d /etc/apt/sources.list.d /etc/systemd/system 2>/dev/null' > "$B/host/etc-readable.tar.gz"
# root-only archive, if the owner has created it (see MIGRATION-RUNBOOK.md)
if $S 'test -f ~/root-only.tar.gz' 2>/dev/null; then
  $S 'cat ~/root-only.tar.gz' > "$B/host/root-only.SECRET.tar.gz"; echo "    picked up root-only.tar.gz"
fi

step "database dumps"
$S "$DB pg_dumpall -U supabase_admin | gzip -c" > "$B/db/full-cluster-dumpall.sql.gz"; check $? pg_dumpall
$S "$DB pg_dumpall -U supabase_admin --globals-only" > "$B/db/globals-roles.sql"; check $? globals
$S "$DB pg_dump -U supabase_admin -d postgres -Fc" > "$B/db/postgres-db.dump"; check $? postgres-db
$S "$DB pg_dump -U supabase_admin -d _supabase -Fc" > "$B/db/_supabase-db.dump"; check $? _supabase-db
$S "$DB pg_dump -U supabase_admin -d postgres --schema=public --no-owner" > "$B/db/app-public-schema+data.sql"; check $? public
$S "$DB pg_dump -U supabase_admin -d postgres --schema=billing --no-owner" > "$B/db/app-billing-schema+data.sql"; check $? billing
$S "$DB pg_dump -U supabase_admin -d postgres --schema=public --schema=billing --data-only --column-inserts" > "$B/db/app-data-only-inserts.sql"; check $? data-only
$S "$DB tar czf - -C /etc/postgresql-custom ." > "$B/db/postgresql-custom-config-volume.tar.gz"; check $? pg-config-volume
$S "$DB psql -U supabase_admin -d postgres -X -P pager=off -c 'select * from cron.job'" > "$B/db/snapshot-cron-jobs.txt"; check $? cron-snapshot
# exact counts, to compare against the new server after restore
: > "$B/db/exact-row-counts.txt"
for t in $($S "$DB psql -U supabase_admin -d postgres -X -tAc \"select table_schema||'.'||table_name from information_schema.tables where table_schema in ('public','billing') and table_type='BASE TABLE' order by 1\""); do
  t="${t%$'\r'}"
  n=$($S "$DB psql -U supabase_admin -d postgres -X -tAc 'select count(*) from $t'" | tr -d '\r')
  echo "$t $n" >> "$B/db/exact-row-counts.txt"
done
[ -s "$B/db/exact-row-counts.txt" ]; check $? rowcounts

step "docker metadata"
$S 'docker ps -a --no-trunc --format "{{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"' > "$B/docker/containers.tsv"
$S 'docker images --digests --format "{{.Repository}}:{{.Tag}}\t{{.Digest}}\t{{.ID}}\t{{.Size}}"' > "$B/docker/images-with-digests.tsv"
$S 'docker inspect $(docker ps -aq)' > "$B/docker/inspect-all-containers.json"
$S 'cd ~/projects/alpenglow-global/backend && docker compose config' > "$B/docker/supabase-compose-resolved.SECRET.yml" 2>/dev/null
$S 'cd ~/projects/travel-app && docker compose config' > "$B/docker/travel-app-compose-resolved.SECRET.yml" 2>/dev/null
$S 'docker version; docker compose version; docker compose ls -a' > "$B/docker/docker-version-info.txt" 2>/dev/null

step "host inventory"
$S 'cat /etc/os-release; uname -a; nproc; free -h; df -hT; ip -br addr; timedatectl; ss -tulnp; systemctl list-unit-files --state=enabled --no-pager; systemctl list-timers --all --no-pager; nginx -v 2>&1; certbot --version 2>&1' > "$B/host/system-inventory.txt"
$S 'apt-mark showmanual' > "$B/host/apt-manually-installed.txt"

step "integrity"
for f in "$B"/files/*.gz "$B"/host/*.gz "$B"/db/*.gz; do gzip -t "$f" || { echo "    !! corrupt: $f"; fail=1; }; done
zcat "$B/db/full-cluster-dumpall.sql.gz" | tail -3 | grep -q "database cluster dump complete" || { echo "    !! pg_dumpall did not finish"; fail=1; }
(cd "$B" && find . -type f ! -name SHA256SUMS -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS)
cat "$B/db/exact-row-counts.txt"
du -sh "$B"
if [ "$fail" = 0 ]; then echo "==> OK: $B"; else echo "==> FINISHED WITH ERRORS: $B"; exit 1; fi

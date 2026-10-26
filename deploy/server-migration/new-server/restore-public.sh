#!/usr/bin/env bash
# Restores a dump of the public schema (pg_dump --schema=public, plain SQL,
# optionally gzipped) into one project's database, with every table's
# permissions exactly as they were dumped. Run as deploy:
#
#   ~/ops/restore-public.sh <db-container> <dump.sql | dump.sql.gz> [database]
#   ~/ops/restore-public.sh supabase-db ~/snapshot/db/app-public-schema+data.sql
#   ~/ops/restore-public.sh pss-db ~/backups/<date>/pss/public.sql.gz
#
# Why this exists: a fresh Supabase database grants the public roles (anon,
# authenticated) full access to every table created in "public", and pg_dump
# does not record that a grant was later taken away. Restoring a dump the
# plain way therefore hands the public key back every permission that
# migrations 007 and 009 removed. This script switches those automatic grants
# off while the tables are created; the dump re-adds them at its end (and the
# script does if the dump does not), so tables created later behave as before.
#
# Expected noise, reported but not treated as failure:
#   schema "public" already exists
#   permission denied to change default privileges  (supabase_admin's built-in
#   defaults, which the fresh database already has)
set -uo pipefail

C="${1:?database container, e.g. supabase-db or pss-db}"
F="${2:?dump file (.sql or .sql.gz)}"
DBNAME="${3:-postgres}"
[ -f "$F" ] || { echo "No such file: $F"; exit 1; }
PSQL=(docker exec -i "$C" psql -U postgres -d "$DBNAME" -X)

echo "==> automatic grants off while the dump creates its tables"
"${PSQL[@]}" -v ON_ERROR_STOP=1 -q <<'SQL' || exit 1
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES    FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated, service_role;
SQL

LOG="$HOME/restore-$C-$(date +%Y%m%d-%H%M%S).log"
echo "==> restoring $F (log: $LOG)"
case "$F" in
  *.gz) zcat "$F" ;;
  *)    cat "$F" ;;
esac | "${PSQL[@]}" > "$LOG" 2>&1

echo "==> automatic grants back on for tables created later"
"${PSQL[@]}" -v ON_ERROR_STOP=1 -q <<'SQL' || exit 1
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES    TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
SQL

echo "==> errors in the restore log"
grep ERROR "$LOG" | sort | uniq -c | sed 's/^/    /'
unexpected=$(grep ERROR "$LOG" | grep -vE 'schema "public" already exists|permission denied to change default privileges' || true)

echo "==> public-role permissions per table (compare with the old server)"
"${PSQL[@]}" -tA -F' ' -c "
  select c.relname,
         coalesce((select string_agg(a, ' ') from unnest(c.relacl::text[]) a
                    where a like 'anon=%' or a like 'authenticated=%'),
                  '(no anon/authenticated grant)')
    from pg_class c
   where c.relnamespace = 'public'::regnamespace and c.relkind = 'r'
   order by 1" | awk '{t=$1; $1=""; printf "    %-28s%s\n", t, $0}'

if [ -n "$unexpected" ]; then
  echo "==> UNEXPECTED ERRORS: read $LOG before going further"
  exit 1
fi
echo "==> done; now compare row counts"

#!/usr/bin/env bash
# Dumps the Supabase Cloud Postgres DB and restores it into the new
# self-hosted Postgres running in Docker on this VPS.
#
# Run this ON THE VPS (so the restore target — localhost:5432 inside the
# db container — never needs to be exposed to the internet).
#
# Requires: postgresql-client (for pg_dump/pg_restore) matching major
# version 15 (both cloud and self-hosted default to Postgres 15).
#
# Usage:
#   CLOUD_DB_URL="postgresql://postgres.yexrmmhadfscormovskn:PASSWORD@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres" \
#   bash 02-migrate-data.sh
set -euo pipefail

: "${CLOUD_DB_URL:?Set CLOUD_DB_URL to your cloud project's connection string (Supabase Dashboard → Project Settings → Database → Connection string → URI, use the pooler one from supabase/.temp/pooler-url as a template but WITH your DB password filled in)}"

SUPABASE_DIR="${SUPABASE_DIR:-/opt/supabase}"
DUMP_FILE="/tmp/alpenglow_cloud_dump.sql"

if ! command -v pg_dump >/dev/null; then
  echo "==> Installing postgresql-client-15"
  apt-get update -y && apt-get install -y postgresql-client-15
fi

echo "==> Dumping schema + data from Supabase Cloud (public schema only —"
echo "    auth/storage internals are recreated fresh by the self-hosted stack)"
pg_dump "$CLOUD_DB_URL" \
  --schema=public \
  --no-owner --no-privileges \
  --format=plain \
  --file="$DUMP_FILE"

echo "==> Loading the .env to find POSTGRES_PASSWORD for the local instance"
# shellcheck disable=SC1091
source "$SUPABASE_DIR/.env"

echo "==> Applying migrations first (so extensions/policies referenced by data exist)"
LOCAL_DB_URL="postgresql://postgres:${POSTGRES_PASSWORD}@localhost:5432/postgres"
for f in "$(dirname "$0")/../supabase/migrations/"*.sql; do
  echo "  - applying $(basename "$f")"
  psql "$LOCAL_DB_URL" -v ON_ERROR_STOP=1 -f "$f"
done

echo "==> Restoring cloud data on top (using --data-only style: skip objects that"
echo "    already exist from migrations, just insert rows)"
psql "$LOCAL_DB_URL" -v ON_ERROR_STOP=0 -f "$DUMP_FILE" 2>&1 | tee /tmp/restore.log | grep -Ei "error|ERROR" || true

echo "==> Done. Review /tmp/restore.log for any errors (duplicate object errors"
echo "    for tables/policies already created by migrations are expected/harmless)."
echo "    Verify row counts, e.g.:"
echo "    psql \"$LOCAL_DB_URL\" -c 'select count(*) from leads;'"
rm -f "$DUMP_FILE"

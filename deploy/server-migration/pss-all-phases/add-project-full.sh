#!/usr/bin/env bash
# Adds one more project to a shared server as its own FULL Supabase stack
# (database, REST, gateway, edge functions, Storage, Realtime), fully separate
# from every other project: own containers, network, volumes, secrets, gateway
# port, nginx rate limits and certificate. Copy of new-server/add-project.sh
# for PSS all-phases (see PLAN.md); uses ./stack-template and
# ./nginx/project-site-full.template from this folder. Run as root from this
# folder:
#
#   bash add-project-full.sh <name> <api-domain> <gateway-port>
#   bash add-project-full.sh pss api.perfectstudyspace.in 8010
#
# Safe to re-run. An existing project's stack and secrets are never touched
# again; re-running only redoes the nginx step, which is how the full HTTPS
# site gets switched on once the certificate exists:
#   1st run: stack starts, nginx serves only the certificate challenge
#   certbot certonly --webroot -w /var/www/html -d <api-domain>
#   2nd run: nginx site with TLS, rate limits, and only /functions/v1/,
#            GET/HEAD /storage/v1/object/sign/ and /realtime/v1/websocket
#
# Differences from add-project.sh: Storage and Realtime containers and their
# secrets; __PROJECT__ also replaced in kong.yml; no ~/ops/projects entry (no
# nightly backup or health check for this project, PLAN.md decision 6); the
# nginx snippet proxy-to-stack.conf is added only if this server lacks it (an
# existing one is never changed); no other existing nginx file is edited.
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "Run as root."; exit 1; }

NAME="${1:?project name, e.g. pss}"
DOMAIN="${2:?API domain, e.g. api.perfectstudyspace.in}"
PORT="${3:?gateway port on 127.0.0.1, e.g. 8010}"

KIT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_HOME=/home/deploy
DIR="$DEPLOY_HOME/projects/$NAME/backend"
ZONE="${NAME//-/_}_api"
CONTAINERS="$NAME-db $NAME-rest $NAME-kong $NAME-functions $NAME-storage realtime-dev.$NAME-realtime"
step() { echo; echo "==> $1"; }
as_deploy() { sudo -u deploy -H bash -c "$1"; }

[[ "$NAME" =~ ^[a-z][a-z0-9-]{1,20}$ ]] || { echo "Name must be lowercase letters, digits and hyphens."; exit 1; }
case "$NAME" in supabase|alpenglow-global) echo "'$NAME' is the AlpenGlow stack; it is not created with this script."; exit 1 ;; esac
[[ "$DOMAIN" =~ ^[a-z0-9.-]+\.[a-z]{2,}$ ]] || { echo "Domain looks wrong: $DOMAIN"; exit 1; }
[[ "$PORT" =~ ^[0-9]+$ ]] && [ "$PORT" -ge 1024 ] && [ "$PORT" -le 65535 ] || { echo "Port must be a number from 1024 to 65535."; exit 1; }
case "$PORT" in 5432|6543|8000|8443) echo "Port $PORT belongs to the AlpenGlow stack."; exit 1 ;; esac

if [ ! -d "$DIR" ]; then
  step "checks before creating $NAME"
  if ss -ltnH "( sport = :$PORT )" | grep -q .; then echo "Port $PORT is already in use."; exit 1; fi
  if grep -rqs "127.0.0.1:${PORT}[;/ ]" /etc/nginx/sites-available; then echo "Port $PORT is already used by an nginx site."; exit 1; fi
  for c in $CONTAINERS; do
    if docker inspect "$c" >/dev/null 2>&1; then echo "A container named $c already exists."; exit 1; fi
  done

  step "stack folder $DIR"
  install -d -o deploy -g deploy "$DEPLOY_HOME/projects" "$DEPLOY_HOME/projects/$NAME"
  cp -r "$KIT/stack-template" "$DIR"
  rm -f "$DIR/.env.example"
  sed -i "s/__PROJECT__/$NAME/g" "$DIR/docker-compose.yml" "$DIR/volumes/api/kong.yml"
  install -d "$DIR/volumes/storage"

  step "secrets (new, used by this project only)"
  umask 077
  JWT_SECRET="$(openssl rand -hex 32)"
  POSTGRES_PASSWORD="$(openssl rand -hex 24)"
  SECRET_KEY_BASE="$(openssl rand -hex 32)"         # Realtime: 64 characters
  REALTIME_DB_ENC_KEY="$(openssl rand -hex 8)"      # Realtime: exactly 16 characters
  S3_KEY_ID="$(openssl rand -hex 16)"
  S3_KEY_SECRET="$(openssl rand -hex 32)"
  read -r ANON_KEY SERVICE_ROLE_KEY < <(JWT_SECRET="$JWT_SECRET" python3 - <<'PY'
import base64, hashlib, hmac, json, os, time
secret = os.environ["JWT_SECRET"].encode()
def b64(raw): return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()
def sign(role):
    now = int(time.time())
    head = b64(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode())
    body = b64(json.dumps({"role": role, "iss": "supabase", "iat": now, "exp": now + 10 * 365 * 86400}, separators=(",", ":")).encode())
    sig = b64(hmac.new(secret, f"{head}.{body}".encode(), hashlib.sha256).digest())
    return f"{head}.{body}.{sig}"
print(sign("anon"), sign("service_role"))
PY
)
  cat > "$DIR/.env" <<EOF
# $NAME stack, created $(date -Is) by add-project-full.sh. Mode 600; never commit.
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
JWT_SECRET=$JWT_SECRET
ANON_KEY=$ANON_KEY
SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
JWT_EXPIRY=3600
SECRET_KEY_BASE=$SECRET_KEY_BASE
REALTIME_DB_ENC_KEY=$REALTIME_DB_ENC_KEY
S3_PROTOCOL_ACCESS_KEY_ID=$S3_KEY_ID
S3_PROTOCOL_ACCESS_KEY_SECRET=$S3_KEY_SECRET
KONG_HTTP_PORT=$PORT
SUPABASE_PUBLIC_URL=https://$DOMAIN
DB_MEM_LIMIT=768m
REST_MEM_LIMIT=256m
KONG_MEM_LIMIT=512m
FUNCTIONS_MEM_LIMIT=512m
STORAGE_MEM_LIMIT=256m
REALTIME_MEM_LIMIT=384m
EDGE_WORKER_MEMORY_MB=256
EDGE_WORKER_TIMEOUT_MS=150000
EOF
  cat > "$DIR/functions.env" <<'EOF'
# This project's own edge-function secrets, one NAME=value per line.
# Fill in before deploying the functions, then: docker compose up -d functions
EOF
  umask 022
  chown -R deploy:deploy "$DEPLOY_HOME/projects/$NAME"
  chmod 600 "$DIR/.env" "$DIR/functions.env"

  step "no ops entry: no nightly backup or health check for $NAME (PLAN.md decision 6)"

  step "start the stack"
  as_deploy "cd '$DIR' && docker compose up -d"
  for _ in $(seq 1 60); do
    unhealthy=$(as_deploy "cd '$DIR' && docker compose ps --format '{{.Name}} {{.Health}}'" | awk '$2 != "healthy"' || true)
    [ -z "$unhealthy" ] && break
    sleep 5
  done
  as_deploy "cd '$DIR' && docker compose ps"
  if [ -n "$unhealthy" ]; then
    echo "Not healthy after 5 minutes: $unhealthy"
    echo "Logs: cd $DIR && docker compose logs. To start over (deletes this new, empty stack):"
    echo "  cd $DIR && sudo -u deploy docker compose down -v && cd / && rm -rf $DEPLOY_HOME/projects/$NAME"
    exit 1
  fi
else
  step "$DIR already exists: stack and secrets left as they are"
fi

step "nginx for $DOMAIN"
added_snippet=0
cat > "/etc/nginx/conf.d/10-$NAME.conf" <<EOF
# Rate limit zone for $NAME only, so its traffic never uses up another
# project's allowance. Written by add-project-full.sh.
limit_req_zone \$binary_remote_addr zone=$ZONE:10m rate=20r/s;
EOF
if [ ! -f /etc/nginx/snippets/proxy-to-stack.conf ]; then
  # Same content as new-server/01-base-setup.sh writes; added only if missing.
  install -d /etc/nginx/snippets
  cat > /etc/nginx/snippets/proxy-to-stack.conf <<'EOF'
proxy_http_version 1.1;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_read_timeout 120s;
EOF
  echo "    added /etc/nginx/snippets/proxy-to-stack.conf (was missing)"
  added_snippet=1
fi
SITE="/etc/nginx/sites-available/$DOMAIN"
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
  for f in /etc/letsencrypt/options-ssl-nginx.conf /etc/letsencrypt/ssl-dhparams.pem; do
    [ -f "$f" ] || { echo "$f is missing; it comes with certbot's nginx setup. Stop and check."; exit 1; }
  done
  sed -e "s/__DOMAIN__/$DOMAIN/g" -e "s/__PORT__/$PORT/g" -e "s/__ZONE__/$ZONE/g" -e "s/__PROJECT__/$NAME/g" \
    "$KIT/nginx/project-site-full.template" > "$SITE"
  tls=1
else
  cat > "$SITE" <<EOF
# $NAME: certificate challenge only, until the certificate exists.
# Then re-run: bash add-project-full.sh $NAME $DOMAIN $PORT
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;
    location /.well-known/acme-challenge/ { root /var/www/html; }
    location / { return 404; }
}
EOF
  tls=0
fi
# A server whose kernel has IPv6 switched off cannot open [::] sockets.
[ -f /proc/net/if_inet6 ] || sed -i '/listen \[::\]/d' "$SITE"
ln -sf "$SITE" "/etc/nginx/sites-enabled/$DOMAIN"
if ! nginx -t; then
  # Leave the server's nginx exactly as it was: take back only what this run
  # added, so other sites (AlpenGlow) can still be checked and reloaded.
  rm -f "/etc/nginx/sites-enabled/$DOMAIN" "/etc/nginx/conf.d/10-$NAME.conf"
  [ "$added_snippet" = 1 ] && rm -f /etc/nginx/snippets/proxy-to-stack.conf
  echo "nginx -t failed: this run's nginx changes were removed again; nginx was NOT reloaded."
  echo "The site file stays in $SITE for inspection (not enabled)."
  exit 1
fi
systemctl reload nginx

step "done"
if [ "$tls" = 0 ]; then
  echo "    Next: point DNS for $DOMAIN at this server (DNS only, not proxied), then"
  echo "      certbot certonly --webroot -w /var/www/html -d $DOMAIN"
  echo "      bash $KIT/add-project-full.sh $NAME $DOMAIN $PORT"
else
  echo "    https://$DOMAIN now reaches the $NAME stack: /functions/v1/, GET/HEAD"
  echo "    /storage/v1/object/sign/ and /realtime/v1/websocket; nothing else."
fi
echo "    Frontend values: URL https://$DOMAIN, anon key = ANON_KEY in $DIR/.env"
echo "    Function secrets go in $DIR/functions.env"

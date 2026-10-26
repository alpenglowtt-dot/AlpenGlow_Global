#!/usr/bin/env bash
# Adds one more project to the shared server as its own slim Supabase stack
# (database, REST, gateway, edge functions), fully separate from every other
# project: own containers, network, volumes, secrets, gateway port, nginx
# rate limits and certificate. Run as root from the kit folder:
#
#   bash add-project.sh <name> <api-domain> <gateway-port>
#   bash add-project.sh pss api.perfectstudyspace.in 8010
#
# Safe to re-run. An existing project's stack and secrets are never touched
# again; re-running only redoes the nginx step, which is how the full HTTPS
# site gets switched on once the certificate exists:
#   1st run: stack starts, nginx serves only the certificate challenge
#   certbot certonly --webroot -w /var/www/html -d <api-domain>
#   2nd run: nginx site with TLS, rate limits and /functions/v1/ only
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "Run as root."; exit 1; }

NAME="${1:?project name, e.g. pss}"
DOMAIN="${2:?API domain, e.g. api.perfectstudyspace.in}"
PORT="${3:?gateway port on 127.0.0.1, e.g. 8010}"

KIT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_HOME=/home/deploy
DIR="$DEPLOY_HOME/projects/$NAME/backend"
ZONE="${NAME//-/_}_api"
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
  for c in db rest kong functions; do
    if docker inspect "$NAME-$c" >/dev/null 2>&1; then echo "A container named $NAME-$c already exists."; exit 1; fi
  done

  step "stack folder $DIR"
  install -d -o deploy -g deploy "$DEPLOY_HOME/projects" "$DEPLOY_HOME/projects/$NAME"
  cp -r "$KIT/stack-template" "$DIR"
  rm -f "$DIR/.env.example"
  sed -i "s/__PROJECT__/$NAME/g" "$DIR/docker-compose.yml"

  step "secrets (new, used by this project only)"
  umask 077
  JWT_SECRET="$(openssl rand -hex 32)"
  POSTGRES_PASSWORD="$(openssl rand -hex 24)"
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
# $NAME stack, created $(date -Is) by add-project.sh. Mode 600; never commit.
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
JWT_SECRET=$JWT_SECRET
ANON_KEY=$ANON_KEY
SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
JWT_EXPIRY=3600
KONG_HTTP_PORT=$PORT
SUPABASE_PUBLIC_URL=https://$DOMAIN
DB_MEM_LIMIT=768m
REST_MEM_LIMIT=384m
KONG_MEM_LIMIT=512m
FUNCTIONS_MEM_LIMIT=512m
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

  step "ops entry (nightly backup and health check)"
  install -d -m 700 -o deploy -g deploy "$DEPLOY_HOME/ops/projects"
  cat > "$DEPLOY_HOME/ops/projects/$NAME.conf" <<EOF
# Read by backup-nightly.sh and healthcheck.sh. Written by add-project.sh.
NAME=$NAME
BACKEND="\$HOME/projects/$NAME/backend"
DB_CONTAINER=$NAME-db
CONTAINERS="$NAME-db $NAME-rest $NAME-kong $NAME-functions"
DOMAIN=$DOMAIN
# Gateway, REST and database together; must answer 200.
PROBE_URL="http://127.0.0.1:$PORT/rest/v1/"
PROBE_KEY_VAR=ANON_KEY
EOF
  chown deploy:deploy "$DEPLOY_HOME/ops/projects/$NAME.conf"
  chmod 600 "$DEPLOY_HOME/ops/projects/$NAME.conf"

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
    echo "  cd $DIR && sudo -u deploy docker compose down -v && cd / && rm -rf $DEPLOY_HOME/projects/$NAME $DEPLOY_HOME/ops/projects/$NAME.conf"
    exit 1
  fi
else
  step "$DIR already exists: stack and secrets left as they are"
fi

step "nginx for $DOMAIN"
cat > "/etc/nginx/conf.d/10-$NAME.conf" <<EOF
# Rate limit zone for $NAME only, so its traffic never uses up another
# project's allowance. Written by add-project.sh.
limit_req_zone \$binary_remote_addr zone=$ZONE:10m rate=20r/s;
EOF
SITE="/etc/nginx/sites-available/$DOMAIN"
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
  for f in /etc/letsencrypt/options-ssl-nginx.conf /etc/letsencrypt/ssl-dhparams.pem; do
    # Both come back with the AlpenGlow certificates from the old server.
    [ -f "$f" ] || { echo "$f is missing; restore /etc/letsencrypt first (runbook Phase 2)."; exit 1; }
  done
  sed -e "s/__DOMAIN__/$DOMAIN/g" -e "s/__PORT__/$PORT/g" -e "s/__ZONE__/$ZONE/g" -e "s/__PROJECT__/$NAME/g" \
    "$KIT/nginx/project-site.template" > "$SITE"
  tls=1
else
  cat > "$SITE" <<EOF
# $NAME: certificate challenge only, until the certificate exists.
# Then re-run: bash add-project.sh $NAME $DOMAIN $PORT
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
nginx -t
systemctl reload nginx

step "done"
if [ "$tls" = 0 ]; then
  echo "    Next: point DNS for $DOMAIN at this server (DNS only, not proxied), then"
  echo "      certbot certonly --webroot -w /var/www/html -d $DOMAIN"
  echo "      bash $KIT/add-project.sh $NAME $DOMAIN $PORT"
else
  echo "    https://$DOMAIN/functions/v1/ now reaches the $NAME stack; nothing else is exposed."
fi
echo "    Frontend values: URL https://$DOMAIN, anon key = ANON_KEY in $DIR/.env"
echo "    Function secrets go in $DIR/functions.env"

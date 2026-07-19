#!/usr/bin/env bash
# Bootstrap a fresh Ubuntu 22.04/24.04 VPS with Docker + self-hosted Supabase.
# Run as root (or a sudo user) on the VPS: sudo bash 01-vps-setup.sh
set -euo pipefail

echo "==> Updating packages"
apt-get update -y
apt-get upgrade -y

echo "==> Installing Docker Engine + Compose plugin"
apt-get install -y ca-certificates curl gnupg git
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable docker
systemctl start docker

echo "==> Configuring firewall (ufw)"
apt-get install -y ufw
ufw allow OpenSSH
ufw allow 8000/tcp   # Kong (API gateway — REST/Auth/Storage/Functions all go through this)
ufw --force enable
# NOTE: Postgres (5432) is intentionally NOT exposed here. For the one-time data
# migration in 02-migrate-data.sh, run the restore locally on the VPS (over SSH)
# instead of opening 5432 to the internet.

echo "==> Cloning the official Supabase self-hosting repo"
INSTALL_DIR=/opt/supabase
mkdir -p "$INSTALL_DIR"
git clone --depth 1 https://github.com/supabase/supabase "$INSTALL_DIR/supabase-src"
cp -r "$INSTALL_DIR/supabase-src/docker/"* "$INSTALL_DIR/"
rm -rf "$INSTALL_DIR/supabase-src"

echo "==> Done. Next steps:"
echo "  1. cd $INSTALL_DIR"
echo "  2. node generate-keys.js   # (copy this repo's deploy/generate-keys.js here first)"
echo "  3. cp .env.example .env    # then merge in values from deploy/.env.selfhost.example"
echo "  4. docker compose pull && docker compose up -d"
echo "  5. docker compose ps       # confirm all services are healthy"

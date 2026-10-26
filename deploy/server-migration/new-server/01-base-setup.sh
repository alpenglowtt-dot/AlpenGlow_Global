#!/usr/bin/env bash
# Base setup for the NEW server. Run once as root on a fresh Ubuntu 24.04:
#   bash 01-base-setup.sh
# Safe to re-run. It reproduces what the old server had (nginx, certbot,
# ufw, fail2ban, key-only SSH, Docker, the database-port block) and adds
# what it lacked (log size limits, swap, reboots after kernel patches,
# Kong ports closed, the ops scripts for backups and health checks).
#
# Not tested yet: the first run on the new server is the test.
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo "Run as root."; exit 1; }

KIT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TZ_NAME="${TZ_NAME:-Europe/Berlin}"        # same as the old server
REBOOT_TIME="${REBOOT_TIME:-23:30}"        # server time; about 03:00-04:00 IST
export DEBIAN_FRONTEND=noninteractive
step() { echo; echo "==> $1"; }

step "packages"
apt-get update -y
apt-get -y -o Dpkg::Options::=--force-confold upgrade
apt-get install -y nginx certbot python3-certbot-nginx fail2ban ufw \
  unattended-upgrades rclone gnupg curl ca-certificates openssl python3

step "nginx: TLS floor, rate-limit zones, shared proxy settings"
# Shared settings here; every project gets its own rate-limit zones (per
# client IP) so one project's traffic never uses up another's allowance.
# add-project.sh writes 10-<name>.conf for each further project.
sed -i -E 's/^\s*ssl_protocols .*/\tssl_protocols TLSv1.2 TLSv1.3;/' /etc/nginx/nginx.conf
cat > /etc/nginx/conf.d/00-ratelimit.conf <<'EOF'
server_tokens off;
limit_req_status 429;
EOF
cat > /etc/nginx/conf.d/10-alpenglow-global.conf <<'EOF'
limit_req_zone $binary_remote_addr zone=alpenglow_api:10m rate=20r/s;
limit_req_zone $binary_remote_addr zone=alpenglow_otp:10m rate=30r/m;
EOF
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
nginx -t
systemctl reload nginx

step "timezone"
timedatectl set-timezone "$TZ_NAME"

step "docker, with container log limits"
command -v docker >/dev/null || curl -fsSL https://get.docker.com | sh
# The old server had no limit and one container log reached 240 MB.
# This must exist before the first container is created.
if [ ! -f /etc/docker/daemon.json ]; then
  cat > /etc/docker/daemon.json <<'JSON'
{ "log-driver": "json-file", "log-opts": { "max-size": "20m", "max-file": "5" } }
JSON
  systemctl restart docker
fi
systemctl enable --now docker

step "deploy user"
id deploy >/dev/null 2>&1 || adduser --disabled-password --gecos "" deploy
usermod -aG sudo,docker deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
# Keys: the saved authorized_keys from the old server if it sits next to this
# script, plus whatever root was created with.
{ cat "$KIT/authorized_keys" 2>/dev/null; cat /root/.ssh/authorized_keys 2>/dev/null; cat /home/deploy/.ssh/authorized_keys 2>/dev/null; } \
  | grep -E '^(ssh-|ecdsa-)' | sort -u > /home/deploy/.ssh/authorized_keys.new
mv /home/deploy/.ssh/authorized_keys.new /home/deploy/.ssh/authorized_keys
chown deploy:deploy /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
echo "    $(wc -l < /home/deploy/.ssh/authorized_keys) key(s) installed for deploy"
# deploy has no password yet, so it cannot sudo. After cutover: run
# `passwd deploy`, then change PermitRootLogin below to `no`.

step "ssh: keys only"
# sshd keeps the FIRST value it reads. On the old server 50-cloud-init.conf
# said "PasswordAuthentication yes" and was read before the line saying no.
# A 00- file is read first, so these settings win.
cat > /etc/ssh/sshd_config.d/00-hardening.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
EOF
sshd -t
systemctl reload ssh
sshd -T | grep -iE '^(passwordauthentication|permitrootlogin|kbdinteractiveauthentication) ' | sed 's/^/    /'

step "firewall: ufw (host ports)"
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

step "firewall: Docker-published ports"
# ufw does not see ports that Docker publishes. The old server dropped 5432
# and 6543 (Postgres via the pooler) in the DOCKER-USER chain; 8000 and 8443
# (Kong) were left open and bypassed nginx. All four are closed here. nginx
# reaches Kong over localhost, which these rules do not touch.
cat > /usr/local/sbin/docker-user-firewall.sh <<'EOF'
#!/bin/sh
# Re-applied after every Docker start (the chain is empty after a reboot).
IFACE=$(ip route show default | awk '{print $5; exit}')
[ -n "$IFACE" ] || exit 1
for ipt in iptables ip6tables; do
  $ipt -L DOCKER-USER -n >/dev/null 2>&1 || continue
  $ipt -C DOCKER-USER -i "$IFACE" -p tcp -m multiport --dports 5432,6543,8000,8443 -j DROP 2>/dev/null \
    || $ipt -I DOCKER-USER -i "$IFACE" -p tcp -m multiport --dports 5432,6543,8000,8443 -j DROP
done
EOF
chmod 755 /usr/local/sbin/docker-user-firewall.sh
cat > /etc/systemd/system/docker-user-firewall.service <<'EOF'
[Unit]
Description=Block Docker-published database and Kong ports from the internet
After=docker.service
Requires=docker.service
PartOf=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/local/sbin/docker-user-firewall.sh

[Install]
WantedBy=multi-user.target docker.service
EOF
systemctl daemon-reload
systemctl enable docker-user-firewall.service
systemctl restart docker-user-firewall.service
iptables -S DOCKER-USER | sed 's/^/    /'

step "fail2ban"
systemctl enable --now fail2ban

step "swap (the old server had none)"
if ! swapon --show | grep -q .; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo 'vm.swappiness=10' > /etc/sysctl.d/99-swappiness.conf
  sysctl -q -p /etc/sysctl.d/99-swappiness.conf
fi

step "automatic security patches, with reboot"
# The old server installed patches but went 79 days without the reboot that
# activates kernel and libc fixes. Containers come back by themselves
# (restart: unless-stopped). Expect one or two minutes of downtime on the
# nights a reboot is needed.
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF
cat > /etc/apt/apt.conf.d/52-alpenglow-reboot <<EOF
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "$REBOOT_TIME";
EOF
systemctl enable --now unattended-upgrades

step "ops scripts (backups, health checks)"
install -d -m 700 -o deploy -g deploy /home/deploy/ops /home/deploy/ops/state /home/deploy/backups
for f in backup-nightly.sh healthcheck.sh restore-public.sh; do
  install -m 750 -o deploy -g deploy "$KIT/$f" "/home/deploy/ops/$f"
done
install -m 640 -o deploy -g deploy "$KIT/crontab.deploy" /home/deploy/ops/crontab.deploy
[ -f /home/deploy/ops/ops.env ] || install -m 600 -o deploy -g deploy "$KIT/ops.env.example" /home/deploy/ops/ops.env
# One file per project; both scripts loop over them. add-project.sh adds the
# others, this is AlpenGlow's.
install -d -m 700 -o deploy -g deploy /home/deploy/ops/projects
install -m 600 -o deploy -g deploy "$KIT/projects/alpenglow-global.conf" /home/deploy/ops/projects/alpenglow-global.conf
# Passphrase that encrypts backups before they leave the server. Without a
# copy of it kept somewhere else, off-server backups cannot be opened.
if [ ! -s /home/deploy/ops/backup.passphrase ]; then
  openssl rand -base64 36 > /home/deploy/ops/backup.passphrase
  chown deploy:deploy /home/deploy/ops/backup.passphrase
  chmod 600 /home/deploy/ops/backup.passphrase
  echo "    new backup passphrase created: copy /home/deploy/ops/backup.passphrase off this server"
fi
# The crontab is NOT installed here. Do it after the restore has passed:
#   sudo -u deploy crontab /home/deploy/ops/crontab.deploy

step "done"
echo "    nginx:    $(nginx -v 2>&1)"
echo "    docker:   $(docker --version)"
echo "    ufw:      $(ufw status | head -1)"
echo "    swap:     $(swapon --show --noheadings | awk '{print $3}')"
echo "    next:     restore the stack (runbook Phase 2), then install the crontab"

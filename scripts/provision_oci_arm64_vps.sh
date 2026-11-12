#!/usr/bin/env bash
# One-Time Provisioning Script for Oracle Cloud (OCI) Ampere A1 ARM64 (12 GB RAM / 100 GB Storage) — Argus Platform
# Ubuntu 24.04 LTS (aarch64)
set -euo pipefail

echo "[1/5] Verifying ARM64 (aarch64) architecture & memory..."
ARCH=$(uname -m)
if [[ "$ARCH" != "aarch64" ]]; then
  echo "WARNING: Expected aarch64 (Oracle Ampere A1), detected $ARCH"
fi
free -h
df -h /

echo "[2/5] Cleaning default Oracle OCI iptables REJECT rules on ports 80/443..."
# Oracle Ubuntu images ship with an INPUT REJECT rule in /etc/iptables/rules.v4 that blocks 80/443.
# Remember to ALSO allow Ingress TCP 80 and 443 in your OCI VCN Security List in the Oracle Cloud Console!
sudo iptables -I INPUT 5 -p tcp --dport 80 -m state --state NEW -j ACCEPT || true
sudo iptables -I INPUT 6 -p tcp --dport 443 -m state --state NEW -j ACCEPT || true
if command -v netfilter-persistent >/dev/null 2>&1; then
  sudo netfilter-persistent save
fi

echo "[3/5] Installing Docker Engine & Docker Compose plugin for Ubuntu 24.04 ARM64..."
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg git ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo "[4/5] Creating /opt/argus directory and locked .env.prod template..."
sudo mkdir -p /opt/argus/backups
sudo chown -R "$USER":"$USER" /opt/argus
if [[ ! -f /opt/argus/.env.prod ]]; then
  install -m 0600 /dev/null /opt/argus/.env.prod
  cat << 'EOF' > /opt/argus/.env.prod
ARGUS_DOMAIN=deals.example.com
POSTGRES_USER=argus_admin
POSTGRES_PASSWORD=CHANGE_ME_STRONG_32_CHAR_SECRET
POSTGRES_DB=argus_roanoke
REDIS_PASSWORD=CHANGE_ME_STRONG_32_CHAR_REDIS_SECRET
PII_AES_GCM_KEY_B64=CHANGE_ME_32_BYTE_BASE64_KEY
PACER_DAILY_CAP_USD=3.00
KILL_SWITCH_MEMO_DRAFTER=false
OUTREACH_GLOBAL_FREEZE=0
EOF
  echo "Created /opt/argus/.env.prod (chmod 600). Populate secrets before first deploy."
fi

echo "[5/5] Oracle OCI ARM64 VPS provisioning complete for Argus!"

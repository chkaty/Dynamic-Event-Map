#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="/root"                       
INFRA_DIR_NAME="infra"

if [ -d "/root/${INFRA_DIR_NAME}" ]; then
  INFRA="/root/${INFRA_DIR_NAME}"
else
  INFRA="$(dirname "$(find /root -maxdepth 2 -type d -name "${INFRA_DIR_NAME}" | head -n1)")/${INFRA_DIR_NAME}"
fi
[ -d "$INFRA" ] || { echo "[x] infra dir not found under /root. abort."; exit 1; }

echo "[*] Using INFRA: $INFRA"

# dependencies + setup
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y awscli logrotate jq curl ca-certificates
# install systemd units + timers
install_unit() {
  local svc="$1"
  local timer="$2"
  local src_dir="$3"

  cp "$src_dir/$svc"   "/etc/systemd/system/$svc"
  cp "$src_dir/$timer" "/etc/systemd/system/$timer"
  systemctl daemon-reload
  systemctl enable --now "$timer"
  echo "    enabled: $timer"
}


echo "[*] Installing docker-clean timers..."
install_unit "docker-clean.service" "docker-clean.timer" "$INFRA/system/dockerclean"

systemctl daemon-reload

# logrotate
echo "[*] Installing logrotate configs..."
cp "$INFRA/logrotate/nginx"        /etc/logrotate.d/nginx
cp "$INFRA/logrotate/docker-clean" /etc/logrotate.d/docker-clean
logrotate -d /etc/logrotate.conf >/dev/null || true
echo "    logrotate dry-run OK"

echo "[✓] Setup finished."

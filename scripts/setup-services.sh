#!/usr/bin/env bash
#
# VoiceClaude – richtet Caddy (HTTPS) + systemd-Dienste ein.
# Muss als root laufen:   sudo bash scripts/setup-services.sh
#
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Bitte mit sudo ausfuehren:  sudo bash scripts/setup-services.sh"; exit 1
fi

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_USER="${SUDO_USER:-root}"
USER_HOME="$(getent passwd "$RUN_USER" | cut -d: -f6)"
NODE_BIN="$(command -v node)"
VENV_PY="$DIR/.venv/bin/python"

# Ports aus .env lesen (mit Defaults)
PORT="$(grep -E '^PORT=' "$DIR/.env" 2>/dev/null | cut -d= -f2 || true)"; PORT="${PORT:-3000}"

echo "==> Projekt: $DIR"
echo "==> Dienst-Benutzer: $RUN_USER (HOME=$USER_HOME)"
echo "==> node: $NODE_BIN"

# ---------- 1. Oeffentliche IP + nip.io-Domain ----------
IP="$(curl -fsS https://api.ipify.org || curl -fsS https://ifconfig.me || true)"
if [ -z "$IP" ]; then
  read -rp "Konnte IP nicht ermitteln. Bitte oeffentliche IP des VPS eingeben: " IP
fi
DOMAIN="${IP//./-}.sslip.io"   # sslip.io: <ip>.sslip.io  ->  zeigt auf die IP, echtes Let's-Encrypt-Zertifikat
echo "==> Domain fuer HTTPS: https://$DOMAIN"

# ---------- 2. Caddy installieren ----------
if ! command -v caddy >/dev/null 2>&1; then
  echo "==> Installiere Caddy ..."
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl gnupg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y
  apt-get install -y caddy
fi

# ---------- 3. Caddyfile schreiben ----------
cat > /etc/caddy/Caddyfile <<EOF
# VoiceClaude – automatisches HTTPS via sslip.io
$DOMAIN {
    reverse_proxy 127.0.0.1:$PORT
}
EOF
echo "==> /etc/caddy/Caddyfile geschrieben."

# ---------- 4. systemd: Media-Dienst (Whisper + Piper) ----------
cat > /etc/systemd/system/voiceclaude-media.service <<EOF
[Unit]
Description=VoiceClaude Media (Whisper STT + Piper TTS)
After=network.target

[Service]
Type=simple
User=$RUN_USER
WorkingDirectory=$DIR
EnvironmentFile=$DIR/.env
ExecStart=$VENV_PY $DIR/media/media_service.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# ---------- 5. systemd: App-Dienst (Node + Claude) ----------
cat > /etc/systemd/system/voiceclaude-app.service <<EOF
[Unit]
Description=VoiceClaude App (Node-Backend + Claude CLI)
After=network.target voiceclaude-media.service

[Service]
Type=simple
User=$RUN_USER
WorkingDirectory=$DIR
EnvironmentFile=$DIR/.env
Environment=HOME=$USER_HOME
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$USER_HOME/.npm-global/bin
ExecStart=$NODE_BIN $DIR/server.js
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

echo "==> systemd-Units geschrieben."

# ---------- 6. Starten ----------
systemctl daemon-reload
systemctl enable --now voiceclaude-media.service
systemctl enable --now voiceclaude-app.service
systemctl reload caddy 2>/dev/null || systemctl restart caddy

echo
echo "============================================================"
echo " Fertig!  Oeffne im Browser:   https://$DOMAIN"
echo
echo " Logs ansehen:"
echo "   journalctl -u voiceclaude-app   -f"
echo "   journalctl -u voiceclaude-media -f"
echo "   journalctl -u caddy             -f"
echo
echo " Hinweis: Stelle sicher, dass in der Firewall Port 80 und 443 offen sind"
echo " (fuer Let's-Encrypt-Zertifikat noetig)."
echo "============================================================"

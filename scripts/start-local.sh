#!/usr/bin/env bash
#
# Zum lokalen Testen OHNE systemd: startet Media-Dienst + Node-Backend zusammen.
# Beenden mit Strg+C.
#
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

# .env laden (fuer den Python-Dienst)
set -a; [ -f .env ] && . ./.env; set +a

echo "==> Starte Media-Dienst (Whisper + Piper) ..."
./.venv/bin/python media/media_service.py &
MEDIA_PID=$!
trap 'kill $MEDIA_PID 2>/dev/null || true' EXIT

sleep 2
echo "==> Starte Node-Backend ..."
node server.js

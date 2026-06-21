#!/usr/bin/env bash
#
# VoiceClaude – Installer fuer Ubuntu/Debian VPS (z.B. Hostinger)
# Installiert: Node-Abhaengigkeiten, Python-venv mit Whisper+Piper,
# die deutsche Piper-Stimme und legt .env an.
#
# Aufruf:   bash scripts/install.sh
#
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"
echo "==> Projektverzeichnis: $DIR"

# ---------- 1. System-Pakete ----------
if command -v apt-get >/dev/null 2>&1; then
  echo "==> Installiere System-Pakete (benoetigt sudo) ..."
  sudo apt-get update -y
  sudo apt-get install -y curl ca-certificates python3 python3-venv python3-pip ffmpeg
else
  echo "WARN: Kein apt-get gefunden. Bitte python3, python3-venv, pip und ffmpeg manuell installieren."
fi

# ---------- 2. Node.js sicherstellen (>=18) ----------
if ! command -v node >/dev/null 2>&1 || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 18 ]; then
  echo "==> Installiere Node.js 20 ..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
echo "==> Node-Version: $(node --version)"

# ---------- 3. claude CLI sicherstellen ----------
if ! command -v claude >/dev/null 2>&1; then
  echo "==> Installiere Claude Code (claude CLI) ..."
  sudo npm install -g @anthropic-ai/claude-code || npm install -g @anthropic-ai/claude-code
fi
echo "==> claude: $(command -v claude) ($(claude --version 2>/dev/null || echo '?'))"
echo "    WICHTIG: Melde dich danach EINMAL mit deinem Abo an:  claude   (dann /login)"

# ---------- 4. Node-Abhaengigkeiten ----------
echo "==> Installiere Node-Abhaengigkeiten ..."
npm install --omit=dev

# ---------- 5. Python-venv + Whisper/Piper ----------
echo "==> Erstelle Python-venv und installiere Whisper + Piper ..."
python3 -m venv .venv
./.venv/bin/pip install --upgrade pip
./.venv/bin/pip install -r media/requirements.txt

# ---------- 6. Deutsche Piper-Stimme herunterladen ----------
VOICE_DIR="$DIR/voices"
mkdir -p "$VOICE_DIR"
BASE="https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/medium"
if [ ! -f "$VOICE_DIR/de_DE-thorsten-medium.onnx" ]; then
  echo "==> Lade deutsche Stimme 'Thorsten' herunter ..."
  curl -fL "$BASE/de_DE-thorsten-medium.onnx" -o "$VOICE_DIR/de_DE-thorsten-medium.onnx"
  curl -fL "$BASE/de_DE-thorsten-medium.onnx.json" -o "$VOICE_DIR/de_DE-thorsten-medium.onnx.json"
fi
echo "==> Stimme bereit: $VOICE_DIR/de_DE-thorsten-medium.onnx"

# ---------- 7. .env anlegen ----------
if [ ! -f .env ]; then
  echo "==> Erstelle .env ..."
  cp .env.example .env
  SECRET="$(openssl rand -hex 32 2>/dev/null || head -c32 /dev/urandom | xxd -p | tr -d '\n')"
  # SESSION_SECRET setzen
  sed -i "s|^SESSION_SECRET=.*|SESSION_SECRET=$SECRET|" .env
  echo
  echo "    >>> Bitte setze jetzt dein Passwort in der Datei .env (Variable APP_PASSWORD) <<<"
fi

mkdir -p data
echo
echo "============================================================"
echo " Installation fertig. Naechste Schritte:"
echo "   1) Bei Claude anmelden:        claude   (dann /login, Abo waehlen)"
echo "   2) Passwort setzen in .env:    APP_PASSWORD=DeinPasswort"
echo "   3) Dienste einrichten:         sudo bash scripts/setup-services.sh"
echo "============================================================"

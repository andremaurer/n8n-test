# 🎙️ VoiceClaude

Ein selbst-gehostetes **deutsches Sprach-Interface für Claude** – als bessere,
stabilere Alternative zu z.B. Google Gemini Voice.

- **Spracheingabe** mit **Whisper** (läuft offline auf deinem VPS, sehr gutes Deutsch)
- **Antwort von Claude** über das **`claude` CLI** → nutzt dein **Claude-Abo**, **keine API-Kosten**
- **Sprachausgabe** mit **Piper** (offline, deutsche Stimme „Thorsten")
- **Audio-Player** mit **Play/Pause**, **10-Sekunden vor/zurück**, Scrub-Leiste und Tempo –
  die Antwort wird als komplette Audiodatei abgespielt, reißt also nicht ab
- **Passwortschutz** + **automatisches HTTPS** (damit das Mikrofon im Browser funktioniert)

---

## Wie es funktioniert

```
 Browser (Handy/PC)                VPS (Hostinger)
 ┌────────────────┐   HTTPS   ┌──────────────────────────────────┐
 │  Mikrofon      │──────────▶│  Caddy  (HTTPS, sslip.io-Domain)  │
 │  Audio-Player  │◀──────────│    │                              │
 └────────────────┘           │    ▼                              │
                              │  Node-Backend (Login + Chat)      │
                              │    │            │                 │
                              │    ▼            ▼                 │
                              │  claude CLI   Python-Dienst       │
                              │  (dein Abo)   Whisper + Piper      │
                              └──────────────────────────────────┘
```

> **Wichtig:** Es entstehen **keine separaten API-Kosten**, solange du dich auf dem
> VPS mit deinem **Abo** (`claude` → `/login`) angemeldet hast. Das Backend ruft
> einfach dieses CLI auf – genau wie du es in Claude Code tun würdest.

---

## Schnellstart auf dem Hostinger-VPS (Ubuntu/Debian)

Per SSH auf den VPS verbinden, dann:

```bash
# 1) Repo holen
git clone https://github.com/andremaurer/n8n-test.git voiceclaude
cd voiceclaude

# 2) Alles installieren (Node, Python, Whisper, Piper, deutsche Stimme)
bash scripts/install.sh

# 3) EINMALIG bei deinem Claude-Abo anmelden
claude
#   -> im Menü "/login" wählen, Abo bestätigen, danach mit Strg+C / "/exit" raus

# 4) Passwort festlegen
nano .env
#   -> Zeile  APP_PASSWORD=bitte-aendern  auf dein Wunsch-Passwort setzen, speichern

# 5) HTTPS + Dauerbetrieb einrichten (Caddy + systemd)
sudo bash scripts/setup-services.sh
```

Am Ende zeigt das Skript deine Adresse an, z.B.:

```
Öffne im Browser:   https://203-0-113-45.sslip.io
```

Diese Adresse auf dem Handy oder PC öffnen, mit dem Passwort anmelden – fertig.

> **Firewall:** Port **80** und **443** müssen offen sein (für das Let's-Encrypt-Zertifikat).
> Bei Hostinger ggf. im Panel bzw. mit `sudo ufw allow 80,443/tcp` freigeben.

---

## Bedienung

- **🎤 Mikrofon-Knopf:** antippen zum Sprechen, erneut antippen zum Stoppen.
  Der Text wird erkannt, an Claude geschickt und die Antwort vorgelesen.
- **Textfeld:** alternativ tippen statt sprechen.
- **Player:** `«10` / `10»` = 10 Sekunden zurück/vor, mittlerer Knopf = Play/Pause,
  Leiste = beliebig spulen, `1×` = Wiedergabetempo.
- **＋ Neu:** beginnt ein neues Gespräch (Claude vergisst den bisherigen Verlauf).

---

## Konfiguration (`.env`)

| Variable          | Bedeutung                                                                 |
|-------------------|---------------------------------------------------------------------------|
| `APP_PASSWORD`    | Login-Passwort für die Web-Oberfläche                                     |
| `SESSION_SECRET`  | Zufallswert für Login-Cookies (Installer setzt das automatisch)          |
| `CLAUDE_MODEL`    | `sonnet` (Standard), `opus` (klüger) oder `haiku` (schnell)               |
| `CLAUDE_WORKDIR`  | Verzeichnis, in dem Claude arbeitet (für Datei-/Code-Aufgaben)            |
| `WHISPER_MODEL`   | `small` (Standard), `medium` (besser) oder `large-v3` (am besten, mehr CPU)|
| `WHISPER_COMPUTE` | `int8` (schnell) … `float32` (genauer)                                    |
| `PIPER_MODEL`     | Pfad zur deutschen Stimme                                                  |

Nach Änderungen die Dienste neu starten:

```bash
sudo systemctl restart voiceclaude-media voiceclaude-app
```

### Bessere Spracherkennung
Für noch besseres Deutsch in `.env` setzen: `WHISPER_MODEL=medium` (oder `large-v3`
bei genügend RAM/CPU). Das `medium`-Modell ist deutlich genauer als die meisten
Browser-Lösungen, braucht aber etwas mehr Rechenzeit.

### Andere deutsche Stimme
Weitere Stimmen gibt es bei [Piper Voices](https://huggingface.co/rhasspy/piper-voices/tree/main/de/de_DE).
Einfach `.onnx` + `.onnx.json` nach `voices/` laden und `PIPER_MODEL` anpassen.

---

## Lokal testen (ohne systemd)

```bash
bash scripts/install.sh
# .env: APP_PASSWORD setzen, dann:
bash scripts/start-local.sh
# -> http://localhost:3000  (Mikrofon braucht hier localhost ODER HTTPS)
```

---

## Logs & Fehlersuche

```bash
journalctl -u voiceclaude-app   -f     # Node / Claude
journalctl -u voiceclaude-media -f     # Whisper / Piper
journalctl -u caddy             -f     # HTTPS / Zertifikat
```

- **„Mikrofon-Zugriff verweigert":** Du brauchst **HTTPS**. Die `sslip.io`-Adresse aus
  Schritt 5 verwenden, nicht die nackte IP.
- **„Claude-Aufruf fehlgeschlagen":** Auf dem VPS einmal `claude` starten und prüfen,
  ob du angemeldet bist (`/login`). Der systemd-Dienst läuft als derselbe Benutzer,
  der sich angemeldet hat.
- **Zertifikat kommt nicht:** Port 80/443 in der Firewall offen? Die IP muss öffentlich
  erreichbar sein (`sslip.io` zeigt automatisch auf deine IP).

---

## Technik / Dateien

| Datei                         | Zweck                                              |
|-------------------------------|----------------------------------------------------|
| `server.js`                   | Node-Backend: Login, Chat, Proxy zu Whisper/Piper  |
| `lib/claude.js`               | Aufruf des `claude` CLI (Abo, Sitzungs-Verlauf)    |
| `media/media_service.py`      | Python-Dienst: Whisper (STT) + Piper (TTS)         |
| `public/`                     | Web-Oberfläche (HTML/CSS/JS, Audio-Player)         |
| `scripts/install.sh`          | Installation aller Abhängigkeiten + Stimme         |
| `scripts/setup-services.sh`   | Caddy (HTTPS) + systemd-Dienste                    |
| `scripts/start-local.sh`      | Lokaler Start zum Testen                           |

---

## Sicherheit

- Die Oberfläche ist passwortgeschützt; das Backend lauscht nur lokal, nach außen
  steht nur Caddy (HTTPS).
- Wähle ein **starkes Passwort** in `.env`.
- Claude läuft im **Print-Modus ohne automatische Berechtigungen** – es führt also
  keine unbestätigten System-Aktionen aus.

# Native Mac-App (Tauri)

Diese App hat ein Node/Prisma-Backend (SQLite, lokale Berechnungen, optionale KI),
läuft also nicht rein statisch. Für eine **native Mac-App** verpacken wir das Ganze
mit **Tauri** — eine echte `.app`/`.dmg`, deutlich schlanker als Electron.

> Tauri kompiliert die native Binärdatei und muss daher **auf einem Mac** gebaut werden
> (Xcode Command Line Tools + Rust). Die Konfiguration liegt bereit; du brauchst nur einen
> Build-Befehl auf deinem Mac.

## Einmalige Einrichtung (auf dem Mac)

```bash
# 1. Rust (falls noch nicht vorhanden)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 2. Xcode Command Line Tools
xcode-select --install

# 3. Tauri-CLI als Dev-Dependency
npm install -D @tauri-apps/cli@^2

# 4. App-Icon erzeugen (aus dem vorhandenen SVG/PNG)
#    Lege ein 1024x1024 PNG unter src-tauri/icons/icon.png ab, dann:
npx tauri icon src-tauri/icons/icon.png
```

## Entwickeln (Live-Fenster)

```bash
npx tauri dev
```
Startet `npm run dev` und öffnet die App in einem nativen Fenster.

## Fertige App bauen

```bash
npm run build          # Next.js Production-Build + Prisma
npx tauri build        # erzeugt .app und .dmg unter src-tauri/target/release/bundle/
```

## Architektur-Hinweis

Weil ein lokaler Server (Next.js + SQLite) nötig ist, gibt es zwei saubere Wege:

1. **Sidecar (empfohlen für Distribution):** Den Next-Server als Tauri-Sidecar bündeln,
   sodass die App ihn beim Start selbst hochfährt. Dafür `tauri.conf.json` um einen
   `externalBin`-Eintrag ergänzen und den Server (z. B. via `next build` + Node) als
   Binary verpacken. Etwas mehr Aufwand, aber ein Doppelklick genügt dem Endnutzer.

2. **Einfachster Weg (für dich als Single-User):** In einem Terminal `npm run start`
   laufen lassen und die Tauri-App auf `http://localhost:3000` zeigen lassen
   (`frontendDist` ist bereits so gesetzt). Doppelklick-Komfort kommt mit Variante 1.

Wenn du Variante 1 willst, sag Bescheid — ich ergänze das Sidecar-Setup und ein
Start-Skript, das den Server headless startet.

## Datenschutz

Alles bleibt lokal (`prisma/dev.db`). Die Mac-App fügt keinerlei Cloud-Verbindung hinzu.

# Native Mac-App (Tauri)

Diese App hat ein Node/Prisma-Backend (SQLite, lokale Berechnungen, optionale KI),
läuft also nicht rein statisch. Für eine **native Mac-App** verpacken wir das Ganze
mit **Tauri** — eine echte `.app`/`.dmg`, deutlich schlanker als Electron.

Beim Start fährt die App den lokalen Next.js-Server selbst hoch (Port 3777) und zeigt
ihn in einem nativen Fenster. **Doppelklick genügt** — kein manuelles `npm start`.

> Tauri kompiliert die native Binärdatei und muss auf einem **Mac** gebaut werden
> (Xcode Command Line Tools + Rust). Node muss auf dem Zielrechner vorhanden sein,
> weil Prisma/SQLite zur Laufzeit Node nutzt.

## Einmalige Einrichtung (auf dem Mac)

```bash
# 1. Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 2. Xcode Command Line Tools
xcode-select --install

# 3. Tauri-CLI
npm install -D @tauri-apps/cli@^2

# 4. App-Icon (1024x1024 PNG nach src-tauri/icons/icon.png, dann)
npx tauri icon src-tauri/icons/icon.png
```

## Entwickeln (Live-Fenster)

```bash
npm run tauri dev
```

## Fertige App bauen

```bash
npm run build       # Next.js Production-Build + Prisma Client
npm run tauri build # -> src-tauri/target/release/bundle/{macos,dmg}/
```

Ergebnis: `Lebens-Optimierer.app` und eine `.dmg` zum Verteilen.

## Wie der Start funktioniert (Sidecar)

- `src-tauri/src/main.rs` startet beim App-Launch `npm run start:packaged`
  (= `scripts/server-prod.mjs`, bindet `next start` an `127.0.0.1:3777`).
- Das Fenster (`tauri.conf.json` → `app.windows[0].url`) lädt `http://127.0.0.1:3777`.
- Beim Schliessen des Fensters wird der Server-Prozess beendet.

### Standalone-Build (schlank, empfohlen)
`next.config.js` ist bereits auf `output: "standalone"` gesetzt. Nach `npm run build`
liegt ein eigenständiger Server unter `.next/standalone/`. Next kopiert `static`/`public`
**nicht** automatisch dorthin — einmal pro Build nachziehen:

```bash
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
```

`scripts/server-prod.mjs` startet bevorzugt diesen Standalone-Server und setzt
`DATABASE_URL` auf einen **absoluten** Pfad zu `prisma/dev.db` (wichtig, da der
Standalone-Server aus einem anderen Verzeichnis läuft). Lokal getestet: `/`, `/finance`,
`/strategy` liefern 200 mit echten Daten.

Für die `.app` als Resources bündeln: `.next/standalone/**`, `.next/static/**`,
`public/**`, `prisma/**`, `package.json`, `scripts/**`.

### Variante mit vollem node_modules (einfacher, grösser)
Damit die `.app` den Server findet, müssen `node_modules`, der `.next`-Build,
`prisma/` und `package.json` als **Resources** mitgebündelt werden. Ergänze dazu in
`tauri.conf.json` unter `bundle` einen `resources`-Eintrag, z. B.:

```json
"resources": [".next/**/*", "node_modules/**/*", "prisma/**/*", "package.json", "scripts/**/*", "public/**/*"]
```

Das macht das Bundle gross (node_modules). Schlankere Alternative: den Server mit
einem Bundler (z. B. `@vercel/ncc` oder `next build` + standalone output) zu einer
einzelnen Binärdatei packen und als echten Tauri-`externalBin`-Sidecar einbinden.
Sag Bescheid, wenn du den schlanken Standalone-Weg willst — dann stelle ich
`next.config.js` auf `output: "standalone"` um und verdrahte den Sidecar entsprechend.

## Datenschutz

Alles bleibt lokal (`prisma/dev.db`). Die Mac-App fügt keinerlei Cloud-Verbindung hinzu.
Server lauscht nur auf `127.0.0.1`.

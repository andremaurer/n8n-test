# Integrationen & Plattform-Optionen

## 🔒 Passwortschutz (optional)
Standardmässig aus (Single-User, lokal). Aktivieren in `.env`:
```bash
APP_PASSWORD="dein-geheimes-passwort"
```
Danach verlangt jede Seite eine Anmeldung unter `/login`. Der Cookie speichert nur einen
SHA-256-Hash, nie das Klartext-Passwort. Ohne `APP_PASSWORD` ist die Middleware inaktiv.

## 🧱 Verschlüsselte Backups
- `/data` → „Verschlüsseltes Backup (AES-256)" mit Passwort erzeugt eine `*.enc.json`.
- Import erkennt verschlüsselte Dateien automatisch und fragt nach dem Passwort.
- Für Verschlüsselung der **ganzen DB at-rest**: SQLCipher oder OS-Festplatten-
  verschlüsselung (FileVault/BitLocker/LUKS). Die App-DB liegt unter `prisma/dev.db`.

## 📱 PWA / Mobile
Installierbar (Manifest + Service Worker). In Chrome/Safari „Zum Startbildschirm hinzufügen".
Funktioniert offline für bereits besuchte Seiten; API-Aufrufe (private Daten) werden bewusst
nicht gecacht.

## 🔁 n8n-Automation: Wochenreport
1. Endpoint: `GET /api/report/weekly` liefert JSON **und** ein fertiges `text`-Feld.
2. Importiere `docs/n8n-weekly-report.json` in n8n (Workflows → Import from File).
3. Setze in n8n `OPTIMIZER_BASE_URL`, `REPORT_FROM`, `REPORT_TO` und ein SMTP-Credential.
4. Aktivieren — jeden Montag 08:00 kommt dein Report per Mail.

## ☁️ Multi-Device-Sync via Supabase (optional)
Die App nutzt lokal SQLite. Für Sync über Geräte auf Supabase (Postgres) umstellen:
1. `prisma/schema.prisma` → `datasource db { provider = "postgresql" }`.
2. `DATABASE_URL` auf die Supabase-Connection-URL setzen (Pooler-URL für Serverless).
3. `npx prisma db push` gegen die Supabase-DB.
4. Optional Supabase Auth statt des Passwort-Gates.

Hinweis: Sensible Daten verlassen damit dein Gerät. Aktiviere Row-Level-Security und
Verschlüsselung, bevor du das tust.

## 📈 Markt-/Trenddaten fürs Geschäftsfeld-Scoring (optional)
Aktuell manuell (du bewertest Marktgrösse 1–5). Für automatische Nachfrage-Signale lässt sich
eine Keyword-/Trend-API (z. B. Semrush) anbinden — benötigt einen eigenen API-Key und ist
daher als optionaler Ausbau dokumentiert, nicht vorkonfiguriert.

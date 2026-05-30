# Lebens-Optimierer (Life-Optimization-Planner)

Persönliche Web-App, um dich selbst besser zu verstehen, passende Geschäftsfelder zu
finden, dein Leben über alle Phasen auszurichten und Familien-/Team-Konstellationen zu
analysieren — mit dem Oberziel **genug Wohlstand für echte Freiheit**.

> Konzept & Strategie: siehe [`PLAN.md`](./PLAN.md).
> Ausbau-Ideen nach v1: siehe [`ROADMAP-NEXT.md`](./ROADMAP-NEXT.md).

## Leitprinzip: ehrliche Evidenz-Labels

Jedes Ergebnis trägt ein Label — Inspiration der Deutungssysteme **und** Verlässlichkeit
der Wissenschaft, sauber getrennt:

- 🟢 **Evidenzbasiert** — Big Five (IPIP-50), Finanzmathematik (FIRE).
- 🟡 **Plausibel/Heuristik** — Coaching-Werkzeuge, Konstellations-Heuristiken.
- 🔵 **Deutungssystem** — Astrologie, Human Design, Numerologie (Reflexion, kein Fakt).
- ⚪ **Mindset/Praxis** — „Geldanziehung“ als Zielklarheit, Priming, Habit-Tracking.

## Funktionen (v1)

- **Profile** (du + Familie/Team, ohne Login): editierbare Geburtsdaten (Datum, **Zeit**, Ort).
- **Astrologie** — tropisches Geburtshoroskop (echte Ephemeride), Aszendent/MC + Whole-Sign-Häuser.
- **Human Design** — Typ, Profil, Autorität, definierte Zentren & Kanäle (verifiziertes Gate-Wheel).
- **Numerologie** — Lebenszahl, Ausdruck/Seele/Persönlichkeit, persönliches Jahr.
- **Big Five** — IPIP-50-Test mit Auswertung (Public Domain).
- **Freiheit & Geld** — FIRE-Rechner: Freiheits-Zahl, Sparquote, Runway, Szenarien.
- **Geschäftsfelder** — Ideen-Scoring (Fit × Markt × Skalierbarkeit × Passiv-Potenzial).
- **Konstellationen** — paarweise Dynamik-Analyse (Big-Five-Komplementarität, Astro-Elemente, HD-Typen).
- **Praxis & Journal** — Gewohnheiten (28-Tage-Tracking), Gelegenheits-Log, Check-ins.
- **KI-Synthese** — führt alle Systeme zusammen, markiert Widersprüche, leitet nächste Schritte ab.
- **Aktuell-Ebene** — heutige Transite + persönliches Jahr auf dem Dashboard.

## Tech-Stack

- **Next.js 14** (App Router, Server Actions) · **React 18** · **TypeScript** · **Tailwind 3**
- **Prisma + SQLite** — lokal, datenschutzfreundlich (deine Daten bleiben auf deinem Gerät).
- **astronomy-engine** — präzise Ephemeride lokal, **ohne** externe Astro-API.
- **@anthropic-ai/sdk** — optionale KI-Synthese (Claude); ohne Key läuft eine regelbasierte Auswertung.

## Schnellstart

```bash
npm install
cp .env.example .env          # DATABASE_URL ist schon auf lokale SQLite gesetzt
npm run setup                 # Prisma generate + DB-Schema + Seed (dein Profil)
npm run dev                   # http://localhost:3000
```

Optional für die volle KI-Synthese: `ANTHROPIC_API_KEY` in `.env` setzen.

### Nützliche Skripte

```bash
npm run build      # Production-Build (inkl. prisma generate)
npm run start      # Production-Server
npm run db:push    # Schema in die DB übernehmen
npm run db:seed    # Seed erneut ausführen
npx tsx scripts/validate-calc.ts   # Berechnungen gegen Beispiel-Geburtsdaten prüfen
```

## Datenschutz & Haftung

Alle Daten liegen lokal in `prisma/dev.db`. Geburts-, Persönlichkeits- und Finanzdaten sind
hochsensibel. Die App ist **kein** Ersatz für medizinische, psychologische, steuerliche oder
Anlageberatung. Deutungssysteme sind als Reflexionswerkzeuge gekennzeichnet, nicht als Fakten.

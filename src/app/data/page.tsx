import { Card } from "@/components/ui";
import { importData } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default function DataPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">Daten & Backup</h1>
        <p className="mt-1 text-slate-400">Volle Datenhoheit: exportiere alles als JSON, oder stelle ein Backup wieder her.</p>
      </header>

      <Card title="Export">
        <p className="mb-3 text-sm text-slate-300">Lädt deine gesamten Daten als JSON-Datei herunter.</p>
        <a href="/api/export" className="btn" download>⬇️ Backup herunterladen</a>
        <form method="get" action="/api/export" className="mt-3 flex flex-wrap items-center gap-2">
          <input name="password" type="password" className="input w-auto" placeholder="Passwort (optional)" />
          <button className="btn-ghost">🔒 Verschlüsseltes Backup (AES-256)</button>
        </form>
      </Card>

      <Card title="Import / Wiederherstellen">
        <p className="mb-3 text-sm text-amber-300/80">
          ⚠️ Achtung: Der Import <strong>ersetzt alle aktuellen Daten</strong> durch das Backup.
        </p>
        <form action={importData} className="flex flex-wrap items-center gap-2">
          <input type="file" name="file" accept="application/json,.json" className="input w-auto" required />
          <input name="password" type="password" className="input w-auto" placeholder="Passwort (falls verschlüsselt)" />
          <button className="btn-ghost text-red-300">Backup einspielen</button>
        </form>
      </Card>

      <Card title="Datenschutz">
        <p className="text-sm text-slate-400">
          Alle Daten liegen lokal in <code>prisma/dev.db</code> auf deinem Gerät. Es gibt keine Cloud-Synchronisation,
          solange du keine einrichtest. Geburts-, Persönlichkeits- und Finanzdaten sind hochsensibel — bewahre Backups sicher auf.
        </p>
      </Card>
    </div>
  );
}

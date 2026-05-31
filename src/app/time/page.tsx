import { getSelf } from "@/lib/queries";
import { prisma } from "@/lib/db";
import { Card, Stat, Bar, Empty } from "@/components/ui";
import { summarizeTime, fmtHours, TIME_CATEGORIES } from "@/lib/timeanalysis";
import { addTimeEntry, deleteTimeEntry, importCalendarIcs, clearTimeRange } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function TimePage() {
  const self = await getSelf();
  if (!self) return <Empty>Lege zuerst dein Profil an.</Empty>;

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const [entries, goals] = await Promise.all([
    prisma.timeEntry.findMany({ where: { personId: self.id, start: { gte: sevenDaysAgo } }, orderBy: { start: "desc" } }),
    prisma.goal.findMany({ where: { personId: self.id, status: { not: "DONE" } } }),
  ]);
  const sum = summarizeTime(entries);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">Zeitanalyse</h1>
        <p className="mt-1 text-slate-400">
          Wohin gehen deine Stunden — und zahlen sie auf deine Ziele ein? Quellen: dein 15-Min-Mac-Tracker (API),
          Kalender-Import (ICS) und manuelle Einträge. Auswertung der letzten 7 Tage.
        </p>
      </header>

      {entries.length === 0 ? (
        <Empty>Noch keine Zeitdaten. Importiere unten einen Kalender (.ics), trage manuell ein, oder schicke deinen Mac-Tracker an die Ingest-API (siehe unten).</Empty>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Erfasst (7 Tage)" value={fmtHours(sum.totalMin)} sub={`${entries.length} Einträge`} />
            <Stat label="Produktiv" value={`${sum.productivePct}%`} sub={fmtHours(sum.productiveMin)} />
            <Stat label="Zielwirksam" value={`${sum.goalAlignedPct}%`} sub={fmtHours(sum.goalAlignedMin)} />
            <Stat label="Ø / Tag" value={fmtHours(Math.round(sum.totalMin / 7))} />
          </div>

          <Card title="Verteilung nach Kategorie">
            <div className="space-y-2">
              {sum.byCategory.map((c) => (
                <div key={c.category}>
                  <div className="mb-0.5 flex justify-between text-sm">
                    <span className="text-slate-200">{c.label}</span>
                    <span className="text-slate-500">{fmtHours(c.minutes)} · {c.pct}%</span>
                  </div>
                  <Bar value={c.pct} color={c.productive ? "#34d399" : "#f59e0b"} />
                </div>
              ))}
            </div>
          </Card>

          <Card title="Grösste Zeitfresser">
            <ul className="space-y-1 text-sm">
              {sum.topActivities.map((a, i) => (
                <li key={i} className="flex justify-between"><span className="text-slate-200">{a.activity}</span><span className="text-slate-500">{fmtHours(a.minutes)}</span></li>
              ))}
            </ul>
          </Card>
        </>
      )}

      <Card title="Kalender importieren (.ics)">
        <p className="mb-3 text-sm text-slate-300">Exportiere deinen Kalender als .ics (Apple Kalender, Google Calendar) und lade ihn hier hoch. Ereignisse werden automatisch kategorisiert.</p>
        <form action={importCalendarIcs} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="personId" value={self.id} />
          <input type="file" name="file" accept=".ics,text/calendar" className="input w-auto" required />
          <button className="btn-ghost">Importieren</button>
        </form>
      </Card>

      <Card title="Manueller Eintrag">
        <form action={addTimeEntry} className="grid gap-2 sm:grid-cols-6">
          <input type="hidden" name="personId" value={self.id} />
          <input name="activity" className="input sm:col-span-2" placeholder="Aktivität" required />
          <select name="category" className="input" defaultValue="BUSINESS">
            {Object.entries(TIME_CATEGORIES).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
          </select>
          <input name="minutes" type="number" className="input" placeholder="Min" defaultValue={15} />
          <select name="goalId" className="input" defaultValue="">
            <option value="">— Ziel —</option>
            {goals.map((g) => <option key={g.id} value={g.id}>{g.text.slice(0, 30)}</option>)}
          </select>
          <button className="btn">+ Eintrag</button>
        </form>
      </Card>

      <Card title="Mac-Tracker anbinden (15-Min-Abfrage)">
        <p className="mb-2 text-sm text-slate-300">
          Dein lokaler Tracker kann die Aktivitäten direkt an die App schicken. Endpoint (lokal):
        </p>
        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-ink-soft/60 p-3 text-xs text-slate-300">{`POST http://127.0.0.1:3777/api/ingest/time
Content-Type: application/json
x-ingest-token: <optional, = INGEST_TOKEN>

{ "activity": "AI-Angebot für Kunde X", "minutes": 15 }
# oder Batch:
{ "entries": [ { "activity": "Video-Schnitt", "minutes": 15, "start": "2026-02-01T09:00:00Z" } ] }`}</pre>
        <p className="mt-2 text-xs text-slate-500">
          Kategorie wird automatisch geraten (Business/Lernen/Admin/…). Zum Schutz optional <code>INGEST_TOKEN</code> in <code>.env</code> setzen.
          In der Mac-App läuft der Server auf Port 3777, im Dev auf 3000.
        </p>
      </Card>

      {entries.length > 0 && (
        <Card title="Letzte Einträge">
          <ul className="space-y-1 text-sm">
            {entries.slice(0, 25).map((e) => (
              <li key={e.id} className="flex items-center justify-between border-b border-white/5 py-1">
                <span className="text-slate-300">{new Date(e.start).toLocaleString("de-CH", { dateStyle: "short", timeStyle: "short" })} · {e.activity}</span>
                <span className="flex items-center gap-2 text-slate-500">
                  {TIME_CATEGORIES[e.category || "OTHER"]?.label.split(" ")[0]} · {e.minutes}m · {e.source}
                  <form action={deleteTimeEntry}><input type="hidden" name="id" value={e.id} /><button className="text-red-300">×</button></form>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

import { getSelf } from "@/lib/queries";
import { prisma } from "@/lib/db";
import { Card, Empty, EvidenceBadge, Bar } from "@/components/ui";
import { addHabit, toggleHabitToday, addJournal, addWheelCheckin } from "@/lib/actions";

export const dynamic = "force-dynamic";

const CAT_LABEL: Record<string, string> = { MINDSET: "Mindset", FINANCE: "Finanzen", HEALTH: "Gesundheit", GROWTH: "Wachstum" };

const WHEEL_AREAS: { key: string; label: string }[] = [
  { key: "career", label: "Beruf/Berufung" },
  { key: "finance", label: "Finanzen" },
  { key: "health", label: "Gesundheit" },
  { key: "relationships", label: "Beziehungen" },
  { key: "family", label: "Familie" },
  { key: "growth", label: "Wachstum" },
  { key: "fun", label: "Freude/Spass" },
  { key: "spirituality", label: "Sinn/Spiritualität" },
];

export default async function FreedomPage() {
  const self = await getSelf();
  if (!self) return <Empty>Lege zuerst dein Profil an.</Empty>;
  const today = new Date().toISOString().slice(0, 10);

  const since = new Date(Date.now() - 27 * 86400000).toISOString().slice(0, 10);
  const [habits, journal] = await Promise.all([
    prisma.habit.findMany({
      where: { personId: self.id, active: true },
      include: { logs: { where: { date: { gte: since } } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.journalEntry.findMany({ where: { personId: self.id }, orderBy: { date: "desc" }, take: 14 }),
  ]);
  const lastWheel = await prisma.wheelCheckin.findFirst({ where: { personId: self.id }, orderBy: { createdAt: "desc" } });
  const wheelAvg = lastWheel
    ? Math.round((WHEEL_AREAS.reduce((s, a) => s + (lastWheel as any)[a.key], 0) / WHEEL_AREAS.length) * 10) / 10
    : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">Praxis & Journal</h1>
        <p className="mt-1 text-slate-400">
          „Geldanziehung" wirkt über Verhalten, nicht über Energie: Zielklarheit, Priming, Gelegenheiten erkennen, dranbleiben.
        </p>
      </header>

      <Card title="Tägliche Gewohnheiten" level="PRACTICE" action={<EvidenceBadge level="PRACTICE" withNote />}>
        <form action={addHabit} className="mb-4 flex flex-wrap gap-2">
          <input type="hidden" name="personId" value={self.id} />
          <input name="title" className="input flex-1" placeholder="z. B. 10 Min Ziel-Visualisierung / 1 Gelegenheit notieren" required />
          <select name="category" className="input w-auto">
            {Object.entries(CAT_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button className="btn">+ Gewohnheit</button>
        </form>
        {habits.length === 0 ? (
          <Empty>Starte mit 1–2 Schlüsselgewohnheiten. Weniger ist mehr.</Empty>
        ) : (
          <ul className="space-y-2">
            {habits.map((h) => {
              const doneToday = h.logs.some((l) => l.date === today && l.done);
              const streak = h.logs.filter((l) => l.done).length;
              return (
                <li key={h.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-ink-soft/50 px-3 py-2">
                  <div>
                    <span className="font-medium text-white">{h.title}</span>
                    <span className="chip ml-2 text-slate-400">{CAT_LABEL[h.category]}</span>
                    <span className="ml-2 text-xs text-slate-500">{streak}× / 28 Tage</span>
                  </div>
                  <form action={toggleHabitToday}>
                    <input type="hidden" name="habitId" value={h.id} />
                    <button className={doneToday ? "btn text-xs" : "btn-ghost text-xs"}>{doneToday ? "✓ heute erledigt" : "heute erledigen"}</button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card title="Wheel of Life" level="HEURISTIC" action={wheelAvg !== null ? <span className="chip text-slate-300">Balance Ø {wheelAvg}/10</span> : undefined}>
        {lastWheel && (
          <div className="mb-4 space-y-1.5">
            {WHEEL_AREAS.map((a) => {
              const v = (lastWheel as any)[a.key] as number;
              return (
                <div key={a.key}>
                  <div className="mb-0.5 flex justify-between text-xs"><span className="text-slate-200">{a.label}</span><span className="text-slate-500">{v}/10</span></div>
                  <Bar value={v * 10} color={v >= 7 ? "#34d399" : v >= 4 ? "#7c6cf6" : "#f59e0b"} />
                </div>
              );
            })}
            <div className="pt-1 text-xs text-slate-500">Letzter Check-in: {lastWheel.date}</div>
          </div>
        )}
        <form action={addWheelCheckin} className="space-y-3">
          <input type="hidden" name="personId" value={self.id} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {WHEEL_AREAS.map((a) => (
              <div key={a.key}>
                <label className="label">{a.label}</label>
                <select name={a.key} className="input" defaultValue={lastWheel ? String((lastWheel as any)[a.key]) : "5"}>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            ))}
          </div>
          <button className="btn">Check-in speichern</button>
        </form>
      </Card>

      <Card title="Journal & Check-in" action={<EvidenceBadge level="HEURISTIC" />}>
        <form action={addJournal} className="mb-4 space-y-2">
          <input type="hidden" name="personId" value={self.id} />
          <textarea name="text" className="input" rows={3} placeholder="Was war heute wichtig? Welche Gelegenheit ist mir begegnet? Wie fühle ich mich?" required />
          <div className="flex items-center gap-2">
            <label className="label mb-0">Stimmung</label>
            <select name="mood" className="input w-auto">
              <option value="">–</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <button className="btn">Eintrag speichern</button>
          </div>
        </form>
        {journal.length === 0 ? (
          <Empty>Noch keine Einträge.</Empty>
        ) : (
          <ul className="space-y-2">
            {journal.map((j) => (
              <li key={j.id} className="rounded-lg border border-white/10 bg-ink-soft/40 p-3">
                <div className="mb-1 flex justify-between text-xs text-slate-400">
                  <span>{j.date}</span>
                  {j.mood && <span>Stimmung {j.mood}/10</span>}
                </div>
                <p className="whitespace-pre-wrap text-sm text-slate-200">{j.text}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

import { getSelf } from "@/lib/queries";
import { prisma } from "@/lib/db";
import { Card, Empty, EvidenceBadge } from "@/components/ui";
import { addHabit, toggleHabitToday, addJournal } from "@/lib/actions";

export const dynamic = "force-dynamic";

const CAT_LABEL: Record<string, string> = { MINDSET: "Mindset", FINANCE: "Finanzen", HEALTH: "Gesundheit", GROWTH: "Wachstum" };

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

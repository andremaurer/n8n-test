import { getSelf } from "@/lib/queries";
import { prisma } from "@/lib/db";
import { Card, Stat, Bar, Empty } from "@/components/ui";
import { buildWeekReview, VERDICT_META } from "@/lib/weekreview";
import { reviewWeek } from "@/lib/ai";
import { fmtHours } from "@/lib/timeanalysis";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const self = await getSelf();
  if (!self) return <Empty>Lege zuerst dein Profil an.</Empty>;

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const [goals, todos, time] = await Promise.all([
    prisma.goal.findMany({ where: { personId: self.id, status: { not: "DONE" } } }),
    prisma.todo.findMany({ where: { personId: self.id } }),
    prisma.timeEntry.findMany({ where: { personId: self.id, start: { gte: weekAgo } } }),
  ]);

  const review = buildWeekReview(
    goals.map((g) => ({ id: g.id, text: g.text, area: g.area, horizon: g.horizon })),
    todos.map((t) => ({ id: t.id, title: t.title, goalId: t.goalId, status: t.status, alignment: t.alignment, effortMin: t.effortMin, completedAt: t.completedAt })),
    time.map((t) => ({ goalId: t.goalId, category: t.category, minutes: t.minutes }))
  );
  const ai = await reviewWeek(review);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Wochenreview</h1>
          <p className="mt-1 text-slate-400">Ziele × Todos × Zeit zusammengezogen — wo deine erklärten Prioritäten und dein tatsächlicher Einsatz auseinanderlaufen.</p>
        </div>
        <span className="chip text-slate-400">{ai.source === "ai" ? "✨ Claude" : "⚙️ regelbasiert"}</span>
      </header>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Erfasste Zeit" value={fmtHours(review.totalTrackedMin)} sub="letzte 7 Tage" />
        <Stat label="Zielbezogen" value={`${review.goalLinkedPct}%`} sub={fmtHours(review.goalLinkedMin)} />
        <Stat label="Todos erledigt" value={review.todosDoneThisWeek} sub={`${review.alignedOpen} zielwirksame offen`} />
        <Stat label="Busywork offen" value={review.busyworkOpen} sub={review.busyworkOpen > 0 ? "reduzieren" : "sauber"} />
      </div>

      <Card title="🤖 Auswertung">
        <p className="text-slate-200">{ai.summary}</p>
        {ai.focus.length > 0 && (
          <div className="mt-4">
            <div className="label">Fokus für nächste Woche</div>
            <ul className="space-y-1.5">
              {ai.focus.map((f, i) => <li key={i} className="flex gap-2 text-sm text-slate-200"><span className="text-accent-soft">{i + 1}.</span><span>{f}</span></li>)}
            </ul>
          </div>
        )}
      </Card>

      {ai.warnings.length > 0 && (
        <Card title="⚠️ Prioritäts-Lücken">
          <ul className="space-y-2">
            {ai.warnings.map((w, i) => (
              <li key={i} className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-100/90">{w}</li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Ziele: erklärt vs. gelebt">
        {review.goals.length === 0 ? (
          <Empty>Keine aktiven Ziele. Lege Ziele an (Dashboard) und ordne ihnen Todos + Zeit zu.</Empty>
        ) : (
          <div className="space-y-3">
            {review.goals.map((g) => {
              const v = VERDICT_META[g.verdict];
              return (
                <div key={g.goalId} className="rounded-lg border border-white/10 bg-ink-soft/50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-white">{g.text}</span>
                    <span className="chip" style={{ color: v.color }}>{v.label}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {fmtHours(g.timeMin)} Zeit ({g.timePct}% der zielbezogenen) · {g.openTodos} offen · {g.doneTodos} erledigt
                  </div>
                  <div className="mt-1"><Bar value={g.timePct} color={v.color} /></div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <p className="text-xs text-slate-500">
        Mehr Aussagekraft: ordne <a href="/todos" className="text-accent-soft underline">Todos</a> und
        <a href="/time" className="text-accent-soft underline"> Zeiteinträge</a> deinen Zielen zu, dann erkennt der Review die Lücken präziser.
      </p>
    </div>
  );
}

import { getSelf } from "@/lib/queries";
import { prisma } from "@/lib/db";
import { Card, Stat, Empty } from "@/components/ui";
import { addTodo, setTodoStatus, deleteTodo } from "@/lib/actions";
import { TodoReviewButton } from "@/components/TodoReviewButton";

export const dynamic = "force-dynamic";

const PRIO: Record<string, { label: string; color: string }> = {
  HIGH: { label: "Hoch", color: "#f87171" },
  MEDIUM: { label: "Mittel", color: "#fbbf24" },
  LOW: { label: "Tief", color: "#94a3b8" },
};
const ALIGN: Record<string, { label: string; color: string }> = {
  ALIGNED: { label: "🎯 zielwirksam", color: "#34d399" },
  NEUTRAL: { label: "• neutral", color: "#94a3b8" },
  BUSYWORK: { label: "⚠️ Busywork", color: "#f87171" },
};

export default async function TodosPage() {
  const self = await getSelf();
  if (!self) return <Empty>Lege zuerst dein Profil an.</Empty>;

  const [todos, goals] = await Promise.all([
    prisma.todo.findMany({ where: { personId: self.id }, orderBy: [{ status: "asc" }, { createdAt: "desc" }] }),
    prisma.goal.findMany({ where: { personId: self.id, status: { not: "DONE" } }, orderBy: { createdAt: "desc" } }),
  ]);
  const goalText = new Map(goals.map((g) => [g.id, g.text]));
  const open = todos.filter((t) => t.status === "OPEN" || t.status === "DOING");
  const done = todos.filter((t) => t.status === "DONE");
  const aligned = open.filter((t) => t.alignment === "ALIGNED").length;
  const busywork = open.filter((t) => t.alignment === "BUSYWORK").length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Todos</h1>
          <p className="mt-1 text-slate-400">Aufgaben mit Zielzuordnung. Der KI-Rückcheck markiert, was wirklich auf deine Ziele einzahlt — und was Busywork ist.</p>
        </div>
        <TodoReviewButton />
      </header>

      {open.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Offen" value={open.length} />
          <Stat label="Zielwirksam" value={aligned} sub={`${Math.round((aligned / open.length) * 100)}% der offenen`} />
          <Stat label="Busywork" value={busywork} sub={busywork > 0 ? "delegieren/streichen?" : "sauber"} />
        </div>
      )}

      <Card title="Neues Todo">
        <form action={addTodo} className="grid gap-3 sm:grid-cols-6">
          <input type="hidden" name="personId" value={self.id} />
          <input name="title" className="input sm:col-span-3" placeholder="Was ist zu tun?" required />
          <select name="goalId" className="input sm:col-span-1" defaultValue="">
            <option value="">— Ziel —</option>
            {goals.map((g) => <option key={g.id} value={g.id}>{g.text.slice(0, 40)}</option>)}
          </select>
          <select name="priority" className="input" defaultValue="MEDIUM">
            {Object.entries(PRIO).map(([v, p]) => <option key={v} value={v}>{p.label}</option>)}
          </select>
          <input name="effortMin" type="number" className="input" placeholder="Min" defaultValue={30} />
          <input name="due" type="date" className="input sm:col-span-2" />
          <button className="btn sm:col-span-6">+ Todo</button>
        </form>
        {goals.length === 0 && <p className="mt-2 text-xs text-amber-300/80">Tipp: Lege zuerst Ziele an (Dashboard), damit Todos zugeordnet werden können.</p>}
      </Card>

      <Card title={`Offen (${open.length})`}>
        {open.length === 0 ? (
          <Empty>Keine offenen Todos.</Empty>
        ) : (
          <ul className="space-y-2">
            {open.map((t) => (
              <li key={t.id} className="rounded-lg border border-white/10 bg-ink-soft/50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-white">{t.title}</span>
                      <span className="chip" style={{ color: PRIO[t.priority]?.color }}>{PRIO[t.priority]?.label}</span>
                      {t.alignment && <span className="chip" style={{ color: ALIGN[t.alignment]?.color }}>{ALIGN[t.alignment]?.label}</span>}
                      <span className="text-xs text-slate-500">{t.effortMin} Min{t.due ? ` · fällig ${t.due}` : ""}</span>
                    </div>
                    {t.goalId && <div className="mt-0.5 text-xs text-emerald-300/80">↳ Ziel: {goalText.get(t.goalId) ?? "—"}</div>}
                    {t.aiNote && <div className="mt-0.5 text-xs text-slate-400">🤖 {t.aiNote}</div>}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <form action={setTodoStatus}><input type="hidden" name="id" value={t.id} /><input type="hidden" name="status" value="DONE" /><button className="btn-ghost text-xs">✓</button></form>
                    <form action={deleteTodo}><input type="hidden" name="id" value={t.id} /><button className="btn-ghost text-xs text-red-300">×</button></form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {done.length > 0 && (
        <Card title={`Erledigt (${done.length})`}>
          <ul className="space-y-1 text-sm text-slate-500">
            {done.slice(0, 20).map((t) => (
              <li key={t.id} className="flex items-center justify-between">
                <span className="line-through">{t.title}</span>
                <form action={setTodoStatus}><input type="hidden" name="id" value={t.id} /><input type="hidden" name="status" value="OPEN" /><button className="text-xs text-slate-400">↺</button></form>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

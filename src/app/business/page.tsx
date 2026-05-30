import { getSelf } from "@/lib/queries";
import { prisma } from "@/lib/db";
import { scoreBusinessIdea, SCORE_DIMENSIONS } from "@/lib/business";
import { Card, Bar, Empty } from "@/components/ui";
import { addBusinessIdea, deleteBusinessIdea } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function BusinessPage() {
  const self = await getSelf();
  if (!self) return <Empty>Lege zuerst dein Profil an.</Empty>;
  const ideas = await prisma.businessIdea.findMany({ where: { personId: self.id } });
  const ranked = ideas
    .map((i) => ({ idea: i, ...scoreBusinessIdea(i) }))
    .sort((a, b) => b.percent - a.percent);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">Geschäftsfelder</h1>
        <p className="mt-1 text-slate-400">Ideen gegen deine Stärken und den Markt bewerten — gewichtet auf das Freiheits-Ziel (Fit, Skalierbarkeit, Passiv-Potenzial zählen am meisten).</p>
      </header>

      {ranked.length === 0 ? (
        <Empty>Noch keine Ideen erfasst. Trage unten deine erste ein.</Empty>
      ) : (
        <div className="space-y-3">
          {ranked.map(({ idea, percent, score, max }, i) => (
            <Card key={idea.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-white">#{i + 1} {idea.title}</span>
                    <span className="chip text-accent-soft">{percent}%</span>
                  </div>
                  {idea.description && <p className="mt-1 text-sm text-slate-400">{idea.description}</p>}
                </div>
                <form action={deleteBusinessIdea}>
                  <input type="hidden" name="id" value={idea.id} />
                  <button className="btn-ghost text-xs text-red-300">Löschen</button>
                </form>
              </div>
              <div className="mt-3"><Bar value={percent} color={percent >= 70 ? "#34d399" : percent >= 50 ? "#7c6cf6" : "#f59e0b"} /></div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-400 sm:grid-cols-4">
                {SCORE_DIMENSIONS.map((d) => (
                  <div key={d.key} className="flex justify-between">
                    <span>{d.label}</span>
                    <span className="text-slate-200">{(idea as any)[d.key]}/5</span>
                  </div>
                ))}
              </div>
              <div className="mt-1 text-xs text-slate-500">Gewichteter Score: {score} / {max}</div>
            </Card>
          ))}
        </div>
      )}

      <Card title="Idee bewerten">
        <form action={addBusinessIdea} className="space-y-4">
          <input type="hidden" name="personId" value={self.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Titel</label>
              <input name="title" className="input" required placeholder="z. B. Online-Kurs für …" />
            </div>
            <div>
              <label className="label">Kurzbeschreibung</label>
              <input name="description" className="input" placeholder="Was & für wen?" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SCORE_DIMENSIONS.map((d) => (
              <div key={d.key}>
                <label className="label" title={d.hint}>{d.label}</label>
                <select name={d.key} className="input" defaultValue="3">
                  {[1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
                <div className="mt-0.5 text-[11px] text-slate-500">{d.hint}</div>
              </div>
            ))}
          </div>
          <button className="btn">Hinzufügen & bewerten</button>
        </form>
      </Card>
    </div>
  );
}

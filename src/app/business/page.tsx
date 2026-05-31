import Link from "next/link";
import { getSelf } from "@/lib/queries";
import { prisma } from "@/lib/db";
import { scoreBusinessIdea, SCORE_DIMENSIONS } from "@/lib/business";
import { Card, Bar, Empty } from "@/components/ui";
import { addBusinessIdea, deleteBusinessIdea, addSkill, deleteSkill, saveIkigai } from "@/lib/actions";
import { RIASEC_TYPES, RiasecType, hollandCode, RiasecScores } from "@/lib/assessments";

export const dynamic = "force-dynamic";

export default async function BusinessPage() {
  const self = await getSelf();
  if (!self) return <Empty>Lege zuerst dein Profil an.</Empty>;
  const ideas = await prisma.businessIdea.findMany({ where: { personId: self.id } });
  const skills = await prisma.skill.findMany({ where: { personId: self.id } });
  const ikigai = await prisma.ikigai.findUnique({ where: { personId: self.id } });
  const rankedSkills = skills
    .map((s) => ({ s, pct: Math.round(((s.proficiency * 0.4 + s.marketDemand * 0.4 + s.enjoyment * 0.2) / 5) * 100) }))
    .sort((a, b) => b.pct - a.pct);
  const riasecRec = await prisma.assessmentResult.findFirst({ where: { personId: self.id, type: "RIASEC" }, orderBy: { createdAt: "desc" } });
  let code: RiasecType[] | null = null;
  if (riasecRec) {
    try { code = hollandCode(JSON.parse(riasecRec.scores) as RiasecScores); } catch {}
  }
  const ranked = ideas
    .map((i) => ({ idea: i, ...scoreBusinessIdea(i) }))
    .sort((a, b) => b.percent - a.percent);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">Geschäftsfelder</h1>
        <p className="mt-1 text-slate-400">Ideen gegen deine Stärken und den Markt bewerten — gewichtet auf das Freiheits-Ziel (Fit, Skalierbarkeit, Passiv-Potenzial zählen am meisten).</p>
      </header>

      {code ? (
        <Card title="Aus deinem Interessen-Profil" level="EVIDENCE">
          <p className="text-sm text-slate-300">
            Holland-Code <span className="font-semibold text-white">{code.join("")}</span> →{" "}
            naheliegende Felder: <span className="text-slate-200">{code.map((c) => RIASEC_TYPES[c].fields).join("; ")}</span>.
          </p>
          <p className="mt-1 text-xs text-slate-500">Nutze diese Richtungen als Ausgangspunkt und bewerte konkrete Ideen unten.</p>
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-slate-300">
            Tipp: Mach den <Link href={`/assessments/${self.id}/riasec`} className="text-accent-soft underline">Interessen-Test (RIASEC)</Link> —
            er schlägt dir passende Geschäftsfeld-Richtungen vor.
          </p>
        </Card>
      )}

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

      <Card title="Skill-Monetarisierungs-Matrix" level="EVIDENCE">
        <p className="mb-3 text-sm text-slate-400">Welche Fähigkeiten lassen sich am schnellsten zu Geld machen? (Können × Nachfrage × Freude)</p>
        {rankedSkills.length > 0 && (
          <ul className="mb-4 space-y-2">
            {rankedSkills.map(({ s, pct }) => (
              <li key={s.id} className="rounded-lg border border-white/10 bg-ink-soft/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">{s.name} <span className="chip ml-1 text-accent-soft">{pct}%</span></span>
                  <form action={deleteSkill}><input type="hidden" name="id" value={s.id} /><button className="text-xs text-red-300">×</button></form>
                </div>
                <div className="mt-1 text-xs text-slate-400">Können {s.proficiency}/5 · Nachfrage {s.marketDemand}/5 · Freude {s.enjoyment}/5{s.proficiency >= 4 && s.marketDemand >= 4 ? " · 🟢 jetzt monetarisierbar" : ""}</div>
                <div className="mt-1"><Bar value={pct} color={pct >= 70 ? "#34d399" : "#7c6cf6"} /></div>
              </li>
            ))}
          </ul>
        )}
        <form action={addSkill} className="grid gap-2 sm:grid-cols-5">
          <input type="hidden" name="personId" value={self.id} />
          <input name="name" className="input sm:col-span-2" placeholder="Fähigkeit" required />
          <select name="proficiency" className="input" defaultValue="3" title="Können">{[1,2,3,4,5].map(v=><option key={v} value={v}>Können {v}</option>)}</select>
          <select name="marketDemand" className="input" defaultValue="3" title="Nachfrage">{[1,2,3,4,5].map(v=><option key={v} value={v}>Nachfrage {v}</option>)}</select>
          <select name="enjoyment" className="input" defaultValue="3" title="Freude">{[1,2,3,4,5].map(v=><option key={v} value={v}>Freude {v}</option>)}</select>
          <button className="btn sm:col-span-5">+ Skill</button>
        </form>
      </Card>

      <Card title="Ikigai" level="HEURISTIC">
        <p className="mb-3 text-sm text-slate-400">Die Schnittmenge aus vier Kreisen. Dein Sweet Spot liegt dort, wo alle vier sich überlappen.</p>
        <form action={saveIkigai} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="personId" value={self.id} />
          <div><label className="label">Was ich liebe</label><textarea name="love" rows={2} className="input" defaultValue={ikigai?.love ?? ""} /></div>
          <div><label className="label">Worin ich gut bin</label><textarea name="goodAt" rows={2} className="input" defaultValue={ikigai?.goodAt ?? ""} /></div>
          <div><label className="label">Wofür ich bezahlt werden kann</label><textarea name="paidFor" rows={2} className="input" defaultValue={ikigai?.paidFor ?? ""} /></div>
          <div><label className="label">Was die Welt braucht</label><textarea name="worldNeeds" rows={2} className="input" defaultValue={ikigai?.worldNeeds ?? ""} /></div>
          <div className="sm:col-span-2"><button className="btn">Ikigai speichern</button></div>
        </form>
      </Card>

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

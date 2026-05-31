import { getSelf } from "@/lib/queries";
import { prisma } from "@/lib/db";
import { Card, Empty } from "@/components/ui";
import { addLifePhase, setLifePhaseStatus, deleteLifePhase } from "@/lib/actions";

export const dynamic = "force-dynamic";

const AREA: Record<string, string> = { CAREER: "Beruf", FINANCE: "Finanzen", FAMILY: "Familie", HEALTH: "Gesundheit", GROWTH: "Wachstum", GENERAL: "Allgemein" };
const STATUS: Record<string, string> = { PLANNED: "Geplant", ACTIVE: "Aktiv", CLOSED: "Abgeschlossen" };

export default async function PhasesPage() {
  const self = await getSelf();
  if (!self) return <Empty>Lege zuerst dein Profil an.</Empty>;
  const phases = await prisma.lifePhase.findMany({ where: { personId: self.id }, orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">Lebensphasen</h1>
        <p className="mt-1 text-slate-400">Welche Phase lebst du gerade? Prioritäten und offene Entscheidungen pro Kapitel.</p>
      </header>

      {phases.length === 0 ? (
        <Empty>Noch keine Phase erfasst. Lege unten deine aktuelle an (z. B. „Aufbau-Phase 2026").</Empty>
      ) : (
        <div className="space-y-3">
          {phases.map((p) => {
            let prios: string[] = [];
            try { prios = JSON.parse(p.priorities || "[]"); } catch {}
            return (
              <Card key={p.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-white">{p.title}</span>
                      <span className="chip text-slate-400">{AREA[p.area] ?? p.area}</span>
                      <span className="chip" style={{ color: p.status === "ACTIVE" ? "#34d399" : p.status === "PLANNED" ? "#60a5fa" : "#94a3b8" }}>{STATUS[p.status]}</span>
                    </div>
                    {(p.startDate || p.endDate) && <div className="mt-1 text-xs text-slate-400">{p.startDate ?? "?"} → {p.endDate ?? "offen"}</div>}
                    {prios.length > 0 && <ul className="mt-2 flex flex-wrap gap-1.5">{prios.map((x, i) => <li key={i} className="chip text-slate-200">★ {x}</li>)}</ul>}
                    {p.notes && <p className="mt-2 text-sm text-slate-400">{p.notes}</p>}
                  </div>
                  <div className="flex flex-col gap-1">
                    {["PLANNED", "ACTIVE", "CLOSED"].filter((s) => s !== p.status).map((s) => (
                      <form key={s} action={setLifePhaseStatus}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="status" value={s} />
                        <button className="btn-ghost text-xs">→ {STATUS[s]}</button>
                      </form>
                    ))}
                    <form action={deleteLifePhase}><input type="hidden" name="id" value={p.id} /><button className="btn-ghost text-xs text-red-300">Löschen</button></form>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Card title="Phase hinzufügen">
        <form action={addLifePhase} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="personId" value={self.id} />
          <div><label className="label">Titel</label><input name="title" className="input" required placeholder="z. B. Aufbau-Phase" /></div>
          <div><label className="label">Bereich</label><select name="area" className="input">{Object.entries(AREA).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <div><label className="label">Start</label><input name="startDate" type="date" className="input" /></div>
          <div><label className="label">Ende (optional)</label><input name="endDate" type="date" className="input" /></div>
          <div className="sm:col-span-2"><label className="label">Prioritäten (Komma-getrennt)</label><input name="priorities" className="input" placeholder="Umsatz verdoppeln, Gesundheit, Familie" /></div>
          <div className="sm:col-span-2"><label className="label">Notizen / offene Entscheidungen</label><textarea name="notes" className="input" rows={2} /></div>
          <div className="sm:col-span-2"><button className="btn">Phase speichern</button></div>
        </form>
      </Card>
    </div>
  );
}

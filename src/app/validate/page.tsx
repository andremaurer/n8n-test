import { getSelf } from "@/lib/queries";
import { prisma } from "@/lib/db";
import { Card, Stat, Bar, Empty } from "@/components/ui";
import { addExperiment, updateExperimentResult, deleteExperiment } from "@/lib/actions";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; color: string }> = {
  PLANNED: { label: "Geplant", color: "#60a5fa" },
  RUNNING: { label: "Läuft", color: "#fbbf24" },
  VALIDATED: { label: "Bestätigt ✓", color: "#34d399" },
  INVALIDATED: { label: "Widerlegt", color: "#f87171" },
};

export default async function ValidatePage() {
  const self = await getSelf();
  if (!self) return <Empty>Lege zuerst dein Profil an.</Empty>;
  const experiments = await prisma.experiment.findMany({
    where: { personId: self.id },
    orderBy: { createdAt: "desc" },
  });

  const totalSpent = experiments.reduce((s, e) => s + e.cost, 0);
  const validated = experiments.filter((e) => e.status === "VALIDATED").length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">Markt-Validierung</h1>
        <p className="mt-1 text-slate-400">
          Teste ein Angebot <strong>billig</strong>, bevor du Wochen investierst. Definiere die riskanteste Annahme,
          eine günstige Testmethode und eine klare Erfolgsschwelle — gerade wenn Kapital knapp ist der wichtigste Reflex.
        </p>
      </header>

      {experiments.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Experimente" value={experiments.length} sub={`${validated} bestätigt`} />
          <Stat label="Testkosten gesamt" value={`${Math.round(totalSpent).toLocaleString("de-CH")} CHF`} sub="billig validieren" />
          <Stat label="Trefferquote" value={experiments.length ? `${Math.round((validated / experiments.length) * 100)}%` : "—"} />
        </div>
      )}

      {experiments.length === 0 ? (
        <Empty>
          Noch kein Experiment. Beispiel für dich: „5 KMU aus dem BNI fragen, ob sie 3'000 CHF für ein AI-Audit zahlen" —
          Methode: 5 Gespräche; Schwelle: 2 zahlende Zusagen; Kosten: ~0.
        </Empty>
      ) : (
        <div className="space-y-3">
          {experiments.map((e) => {
            const st = STATUS[e.status] ?? STATUS.PLANNED;
            const hit = e.result != null && e.threshold > 0 ? Math.min(100, (e.result / e.threshold) * 100) : 0;
            return (
              <Card key={e.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-white">{e.title}</span>
                      <span className="chip" style={{ color: st.color }}>{st.label}</span>
                    </div>
                    {e.hypothesis && <p className="mt-1 text-sm text-slate-300"><span className="text-slate-500">Hypothese:</span> {e.hypothesis}</p>}
                    {e.riskiest && <p className="text-sm text-amber-300/80"><span className="text-slate-500">Riskanteste Annahme:</span> {e.riskiest}</p>}
                    {e.method && <p className="text-sm text-slate-400"><span className="text-slate-500">Test:</span> {e.method}</p>}
                    <p className="mt-1 text-sm text-slate-400">
                      <span className="text-slate-500">Metrik:</span> {e.metric || "—"} · Schwelle: {e.threshold}
                      {e.result != null ? ` · Ergebnis: ${e.result}` : ""} · Kosten: {Math.round(e.cost)} CHF
                    </p>
                  </div>
                  <form action={deleteExperiment}><input type="hidden" name="id" value={e.id} /><button className="btn-ghost text-xs text-red-300">Löschen</button></form>
                </div>
                {e.result != null && e.threshold > 0 && (
                  <div className="mt-2"><Bar value={hit} color={hit >= 100 ? "#34d399" : "#fbbf24"} /></div>
                )}
                <form action={updateExperimentResult} className="mt-3 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={e.id} />
                  <input name="result" type="number" step="any" className="input w-32" placeholder="Ergebnis" defaultValue={e.result ?? ""} />
                  <select name="status" className="input w-auto" defaultValue={e.status}>
                    {Object.entries(STATUS).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
                  </select>
                  <button className="btn-ghost text-xs">Ergebnis speichern</button>
                </form>
              </Card>
            );
          })}
        </div>
      )}

      <Card title="Neues Experiment">
        <form action={addExperiment} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="personId" value={self.id} />
          <div className="sm:col-span-2"><label className="label">Titel</label><input name="title" className="input" required placeholder="z. B. KMU zahlen 3'000 CHF für AI-Audit" /></div>
          <div className="sm:col-span-2"><label className="label">Hypothese (was glaubst du?)</label><input name="hypothesis" className="input" placeholder="KMU im Mittelstand brauchen AI-Einstiegshilfe und zahlen dafür" /></div>
          <div className="sm:col-span-2"><label className="label">Riskanteste Annahme</label><input name="riskiest" className="input" placeholder="Dass sie VORHER zahlen, nicht nur Interesse zeigen" /></div>
          <div><label className="label">Testmethode (billig!)</label><input name="method" className="input" placeholder="5 BNI-Gespräche / Landing Page" /></div>
          <div><label className="label">Metrik</label><input name="metric" className="input" placeholder="zahlende Zusagen" /></div>
          <div><label className="label">Erfolgsschwelle</label><input name="threshold" type="number" step="any" className="input" placeholder="2" /></div>
          <div><label className="label">Testkosten (CHF)</label><input name="cost" type="number" step="any" className="input" placeholder="0" /></div>
          <div className="sm:col-span-2"><button className="btn">Experiment anlegen</button></div>
        </form>
        <p className="mt-3 text-xs text-slate-500">
          🟢 Lean-Startup-Prinzip: erst die riskanteste Annahme widerlegen wollen. Ein „Pre-Sale" (jemand zahlt vorab)
          ist das stärkste Signal — stärker als Umfragen oder „würde ich nutzen".
        </p>
      </Card>
    </div>
  );
}

import { getSelf } from "@/lib/queries";
import { prisma } from "@/lib/db";
import { Card, Empty } from "@/components/ui";
import { DecisionBuilder } from "@/components/DecisionBuilder";
import { deleteDecision } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function DecisionsPage() {
  const self = await getSelf();
  if (!self) return <Empty>Lege zuerst dein Profil an.</Empty>;
  const decisions = await prisma.decision.findMany({ where: { personId: self.id }, orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">Entscheidungs-Assistent</h1>
        <p className="mt-1 text-slate-400">Grosse Geld-/Lebensentscheidungen strukturiert: gewichtete Faktoren statt Bauchgefühl allein.</p>
      </header>

      <Card title="Neue Entscheidung">
        <DecisionBuilder personId={self.id} />
      </Card>

      {decisions.length > 0 && (
        <Card title="Gespeicherte Entscheidungen">
          <ul className="space-y-2">
            {decisions.map((d) => {
              let factors: any[] = [];
              try { factors = JSON.parse(d.factors); } catch {}
              return (
                <li key={d.id} className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-ink-soft/50 p-3">
                  <div>
                    <div className="font-medium text-white">{d.title}</div>
                    <div className="text-sm text-slate-400">{d.optionA} vs. {d.optionB} → <span className="text-accent-soft">{d.decision}</span></div>
                    <div className="mt-1 text-xs text-slate-500">{factors.map((f) => f.name).join(", ")}</div>
                  </div>
                  <form action={deleteDecision}><input type="hidden" name="id" value={d.id} /><button className="btn-ghost text-xs text-red-300">Löschen</button></form>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}

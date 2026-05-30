import { getSelf } from "@/lib/queries";
import { prisma } from "@/lib/db";
import { computeFire } from "@/lib/fire";
import { Card, Stat, Bar, Empty } from "@/components/ui";
import { saveFinance } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const self = await getSelf();
  if (!self) return <Empty>Lege zuerst dein Profil an.</Empty>;
  const finance = await prisma.financeProfile.findUnique({ where: { personId: self.id } });

  const f = finance
    ? computeFire({
        monthlyIncomeActive: finance.monthlyIncomeActive,
        monthlyIncomePassive: finance.monthlyIncomePassive,
        monthlyExpenses: finance.monthlyExpenses,
        netWorth: finance.netWorth,
        withdrawalRate: finance.withdrawalRate,
        expectedReturn: finance.expectedReturn,
        targetMonthlySpend: finance.targetMonthlySpend,
        currency: finance.currency,
      })
    : null;

  // Scenarios: what +10% income / -10% spend does to time-to-freedom.
  const base = finance;
  const scen = (mod: Partial<{ income: number; expenses: number }>) =>
    base
      ? computeFire({
          monthlyIncomeActive: base.monthlyIncomeActive * (mod.income ?? 1),
          monthlyIncomePassive: base.monthlyIncomePassive,
          monthlyExpenses: base.monthlyExpenses * (mod.expenses ?? 1),
          netWorth: base.netWorth,
          withdrawalRate: base.withdrawalRate,
          expectedReturn: base.expectedReturn,
          targetMonthlySpend: base.targetMonthlySpend,
          currency: base.currency,
        })
      : null;
  const incomeUp = scen({ income: 1.1 });
  const spendDown = scen({ expenses: 0.9 });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">Freiheit & Geld</h1>
        <p className="mt-1 text-slate-400">Wohlstand als Mittel zur Freiheit — als konkrete Zahl und Zeitlinie.</p>
      </header>

      {f && (
        <Card title="Deine Freiheits-Zahl" level="EVIDENCE">
          <div className="grid gap-4 sm:grid-cols-4">
            <Stat label="Freiheits-Kapital" value={`${fmt(f.freedomNumber)} ${f.currency}`} sub={`${Math.round(finance!.withdrawalRate * 100)} % Entnahme`} />
            <Stat label="Monatl. Überschuss" value={`${fmt(f.monthlySurplus)} ${f.currency}`} sub={`Sparquote ${Math.round(f.savingsRate * 100)}%`} />
            <Stat label="Zeit bis Freiheit" value={f.yearsToFreedom !== null ? `${f.yearsToFreedom} J.` : "—"} />
            <Stat label="Runway" value={f.runwayMonths !== null ? `${f.runwayMonths} Mt.` : "—"} sub="ohne Einkommen" />
          </div>
          <div className="mt-4 space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-xs text-slate-400"><span>Fortschritt zum Kapitalziel</span><span>{Math.round(f.progress * 100)}%</span></div>
              <Bar value={f.progress * 100} color="#34d399" />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-slate-400"><span>Ausgaben durch passives Einkommen gedeckt</span><span>{Math.round(f.coveredByPassive * 100)}%</span></div>
              <Bar value={f.coveredByPassive * 100} color="#60a5fa" />
            </div>
          </div>
          {(incomeUp || spendDown) && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-ink-soft/50 p-3 text-sm">
                <div className="font-medium text-white">Szenario: +10 % Einkommen</div>
                <div className="text-slate-400">Zeit bis Freiheit: {incomeUp?.yearsToFreedom ?? "—"} J. ({delta(f.yearsToFreedom, incomeUp?.yearsToFreedom)})</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-ink-soft/50 p-3 text-sm">
                <div className="font-medium text-white">Szenario: −10 % Ausgaben</div>
                <div className="text-slate-400">Zeit bis Freiheit: {spendDown?.yearsToFreedom ?? "—"} J. ({delta(f.yearsToFreedom, spendDown?.yearsToFreedom)})</div>
              </div>
            </div>
          )}
        </Card>
      )}

      <Card title="Finanzprofil">
        <form action={saveFinance} className="grid gap-3 sm:grid-cols-3">
          <input type="hidden" name="personId" value={self.id} />
          <Field name="monthlyIncomeActive" label="Aktives Einkommen / Monat" def={finance?.monthlyIncomeActive} />
          <Field name="monthlyIncomePassive" label="Passives Einkommen / Monat" def={finance?.monthlyIncomePassive} />
          <Field name="monthlyExpenses" label="Ausgaben / Monat" def={finance?.monthlyExpenses} />
          <Field name="netWorth" label="Vermögen (netto)" def={finance?.netWorth} />
          <Field name="debt" label="Schulden" def={finance?.debt} />
          <Field name="targetMonthlySpend" label="Wunsch-Ausgaben in Freiheit / Monat" def={finance?.targetMonthlySpend} hint="0 = aktuelle Ausgaben verwenden" />
          <div>
            <label className="label">Währung</label>
            <input name="currency" className="input" defaultValue={finance?.currency ?? "CHF"} />
          </div>
          <Field name="withdrawalRatePct" label="Entnahmerate %" def={finance ? finance.withdrawalRate * 100 : 4} hint="4 % = klassische FIRE-Regel" />
          <Field name="expectedReturnPct" label="Erwartete Rendite % (real)" def={finance ? finance.expectedReturn * 100 : 5} />
          <div className="sm:col-span-3"><button className="btn">Speichern & berechnen</button></div>
        </form>
        <p className="mt-3 text-xs text-slate-500">
          Freiheits-Kapital = Jahresausgaben ÷ Entnahmerate. Bei 4 % entspricht das dem 25-Fachen deiner Jahresausgaben (4-%-Regel, Trinity-Studie).
        </p>
      </Card>
    </div>
  );
}

function Field({ name, label, def, hint }: { name: string; label: string; def?: number | null; hint?: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input name={name} type="number" step="any" className="input" defaultValue={def ?? ""} />
      {hint && <div className="mt-0.5 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

function fmt(n: number) {
  return isFinite(n) ? Math.round(n).toLocaleString("de-CH") : "∞";
}
function delta(a: number | null, b: number | null | undefined) {
  if (a == null || b == null) return "—";
  const d = Math.round((a - b) * 10) / 10;
  return d > 0 ? `${d} J. früher` : d < 0 ? `${Math.abs(d)} J. später` : "gleich";
}

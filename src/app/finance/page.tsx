import Link from "next/link";
import { getSelf } from "@/lib/queries";
import { prisma } from "@/lib/db";
import { computeFire, computeFireVariants } from "@/lib/fire";
import { summarizeAccounts, projectNetWorth } from "@/lib/swissfinance";
import { Card, Stat, Bar, Empty } from "@/components/ui";
import { saveFinance, importExpensesCsv, addAccount, deleteAccount } from "@/lib/actions";

export const dynamic = "force-dynamic";

const ACCOUNT_KINDS: { v: string; label: string }[] = [
  { v: "BANK", label: "Bankkonto" },
  { v: "CASH", label: "Bargeld" },
  { v: "P2P", label: "P2P (Mintos/Debitum)" },
  { v: "INVEST", label: "Wertschriften/ETF" },
  { v: "CRYPTO", label: "Krypto" },
  { v: "PILLAR3A", label: "Säule 3a" },
  { v: "PILLAR2", label: "Pensionskasse (2. Säule)" },
  { v: "DEBT", label: "Schuld" },
  { v: "OTHER", label: "Anderes" },
];

export default async function FinancePage() {
  const self = await getSelf();
  if (!self) return <Empty>Lege zuerst dein Profil an.</Empty>;
  const finance = await prisma.financeProfile.findUnique({ where: { personId: self.id } });
  const accounts = await prisma.account.findMany({ where: { personId: self.id }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  const nw = summarizeAccounts(accounts);
  // Accounts drive net worth when present; otherwise fall back to manual field.
  const effectiveNetWorth = accounts.length ? nw.total : finance?.netWorth ?? 0;

  const f = finance
    ? computeFire({
        monthlyIncomeActive: finance.monthlyIncomeActive,
        monthlyIncomePassive: finance.monthlyIncomePassive,
        monthlyExpenses: finance.monthlyExpenses,
        netWorth: effectiveNetWorth,
        withdrawalRate: finance.withdrawalRate,
        expectedReturn: finance.expectedReturn,
        targetMonthlySpend: finance.targetMonthlySpend,
        currency: finance.currency,
      })
    : null;

  // Net-worth projection toward your 1M / 3M / 5M targets.
  const projection = finance
    ? projectNetWorth(
        effectiveNetWorth,
        finance.monthlyIncomeActive + finance.monthlyIncomePassive - finance.monthlyExpenses,
        nw.blendedYield > 0 ? nw.blendedYield : finance.expectedReturn,
        [1_000_000, 3_000_000, 5_000_000]
      )
    : [];

  // Scenarios: what +10% income / -10% spend does to time-to-freedom.
  const base = finance;
  const scen = (mod: Partial<{ income: number; expenses: number }>) =>
    base
      ? computeFire({
          monthlyIncomeActive: base.monthlyIncomeActive * (mod.income ?? 1),
          monthlyIncomePassive: base.monthlyIncomePassive,
          monthlyExpenses: base.monthlyExpenses * (mod.expenses ?? 1),
          netWorth: effectiveNetWorth,
          withdrawalRate: base.withdrawalRate,
          expectedReturn: base.expectedReturn,
          targetMonthlySpend: base.targetMonthlySpend,
          currency: base.currency,
        })
      : null;
  const incomeUp = scen({ income: 1.1 });
  const spendDown = scen({ expenses: 0.9 });

  // FIRE variants (target age 60) + CH wealth tax estimate.
  const birthYear = self.birthDate ? Number(self.birthDate.slice(0, 4)) : null;
  const age = birthYear ? new Date().getFullYear() - birthYear : 40;
  const variants = f ? computeFireVariants(f.annualSpend, finance!.withdrawalRate, finance!.expectedReturn, Math.max(0, 60 - age)) : null;
  const totalWealth = accounts.length ? nw.total : finance ? finance.netWorth + finance.pillar2 + finance.pillar3a : 0;
  const wealthTax = finance ? Math.round(Math.max(0, effectiveNetWorth) * finance.wealthTaxRate) : 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Freiheit & Geld</h1>
          <p className="mt-1 text-slate-400">Wohlstand als Mittel zur Freiheit — als konkrete Zahl und Zeitlinie.</p>
        </div>
        <Link href="/strategy" className="btn-ghost">→ Einkommens-Strategie</Link>
      </header>

      <Card title="Konten & Vermögen" level="EVIDENCE" action={<span className="chip text-slate-300">Total {fmt(nw.total)} CHF</span>}>
        {accounts.length === 0 ? (
          <Empty>Noch keine Konten. Erfasse unten Bankkonten, Mintos/Debitum, Säule 3a usw. — sie fliessen automatisch in dein Vermögen und die Freiheits-Rechnung.</Empty>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-4">
              <Stat label="Gesamtvermögen" value={`${fmt(nw.total)}`} sub="CHF netto" />
              <Stat label="Liquide" value={`${fmt(nw.liquid)}`} sub="sofort verfügbar" />
              <Stat label="Vorsorge (2./3a)" value={`${fmt(nw.retirement)}`} sub="gebunden" />
              <Stat label="P2P (Mintos/Debitum)" value={`${fmt(nw.p2p)}`} sub={`Ø Rendite ${(nw.blendedYield * 100).toFixed(1)}%`} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-slate-400">
                  <tr><th className="py-1">Konto</th><th>Typ</th><th>Rendite</th><th className="text-right">Saldo</th><th></th></tr>
                </thead>
                <tbody>
                  {accounts.map((a) => (
                    <tr key={a.id} className="border-t border-white/5">
                      <td className="py-1.5">{a.name}{a.institution ? <span className="text-slate-500"> · {a.institution}</span> : ""}</td>
                      <td className="text-slate-400">{ACCOUNT_KINDS.find((k) => k.v === a.kind)?.label ?? a.kind}</td>
                      <td className="text-slate-400">{a.expectedYield > 0 ? `${(a.expectedYield * 100).toFixed(1)}%` : "—"}</td>
                      <td className={`text-right ${a.kind === "DEBT" ? "text-red-300" : "text-white"}`}>{a.kind === "DEBT" ? "−" : ""}{fmt(Math.abs(a.balance))} {a.currency}</td>
                      <td className="text-right">
                        <form action={deleteAccount}><input type="hidden" name="id" value={a.id} /><button className="text-xs text-red-300">×</button></form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <form action={addAccount} className="mt-4 grid gap-2 sm:grid-cols-6">
          <input type="hidden" name="personId" value={self.id} />
          <input name="name" className="input sm:col-span-2" placeholder="Kontoname" required />
          <input name="institution" className="input" placeholder="Institut" />
          <select name="kind" className="input" defaultValue="BANK">{ACCOUNT_KINDS.map((k) => <option key={k.v} value={k.v}>{k.label}</option>)}</select>
          <input name="balance" type="number" step="any" className="input" placeholder="Saldo" required />
          <input name="expectedYieldPct" type="number" step="any" className="input" placeholder="Rendite %" />
          <label className="flex items-center gap-2 text-xs text-slate-400 sm:col-span-2"><input type="checkbox" name="liquid" defaultChecked /> liquide (vor Pension verfügbar)</label>
          <button className="btn sm:col-span-4">+ Konto hinzufügen</button>
        </form>
      </Card>

      {projection.length > 0 && (
        <Card title="Pfad zum Vermögensziel" level="EVIDENCE">
          <div className="grid gap-3 sm:grid-cols-3">
            {projection.map((p) => (
              <Stat key={p.target} label={`${fmt(p.target)} CHF`} value={p.years === null ? "> 80 J." : p.years === 0 ? "erreicht ✓" : `${p.years} J.`} sub={p.target === 1_000_000 ? "Freiheit (Minimum)" : p.target === 3_000_000 ? "Zielkorridor" : "komfortabel"} />
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">Projektion mit aktuellem Monatsüberschuss und {nw.blendedYield > 0 ? `Ø Konto-Rendite ${(nw.blendedYield * 100).toFixed(1)}%` : "erwarteter Rendite"}. Reines Sparen ohne Einkommenswachstum.</p>
        </Card>
      )}

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
          <Field name="pillar2" label="Säule 2 / Pensionskasse (CH)" def={finance?.pillar2} />
          <Field name="pillar3a" label="Säule 3a Guthaben (CH)" def={finance?.pillar3a} />
          <Field name="wealthTaxRatePct" label="Vermögenssteuer % (CH, ca.)" def={finance ? finance.wealthTaxRate * 100 : 0.5} hint="kantonal verschieden, grobe Schätzung" />
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

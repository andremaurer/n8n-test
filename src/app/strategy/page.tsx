import { getSelf } from "@/lib/queries";
import { prisma } from "@/lib/db";
import { Card, Stat, Bar, Empty } from "@/components/ui";
import {
  summarizeAccounts,
  computeIncomeFreedom,
  computeSalaryStrategy,
} from "@/lib/swissfinance";
import {
  saveStrategy,
  addRevenueStream,
  updateRevenueStream,
  deleteRevenueStream,
} from "@/lib/actions";

export const dynamic = "force-dynamic";

const STREAM_STATUS: Record<string, string> = { IDEA: "Idee", BUILDING: "Im Aufbau", LIVE: "Läuft", SCALING: "Skaliert" };
const STREAM_KIND: Record<string, string> = { ACTIVE: "Aktiv", PASSIVE: "Passiv", PORTFOLIO: "Portfolio" };

function fmt(n: number) {
  return isFinite(n) ? Math.round(n).toLocaleString("de-CH") : "∞";
}

export default async function StrategyPage() {
  const self = await getSelf();
  if (!self) return <Empty>Lege zuerst dein Profil an.</Empty>;

  const [finance, accounts, streams] = await Promise.all([
    prisma.financeProfile.findUnique({ where: { personId: self.id } }),
    prisma.account.findMany({ where: { personId: self.id } }),
    prisma.revenueStream.findMany({ where: { personId: self.id }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
  ]);

  const targetPayout = finance?.targetMonthlyPayout || 17500; // default mid of 15-20k
  const inc = computeIncomeFreedom(streams, accounts, targetPayout);
  const totalTarget = streams.reduce((s, x) => s + x.monthlyTarget, 0);

  const salary = finance
    ? computeSalaryStrategy({
        companyProfit: finance.companyProfit,
        ownerSalary: finance.ownerSalary,
        partnerSalary: finance.partnerSalary,
        marginalTaxRate: finance.marginalTaxRate,
      })
    : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">Einkommens-Strategie</h1>
        <p className="mt-1 text-slate-400">
          Der kurzfristige Weg zu {fmt(targetPayout)} CHF/Monat — Foto/Video heute, AI-Implementierung als Skalierung. Plus Schweizer Haushalts-Setup.
        </p>
      </header>

      {/* Income-freedom progress */}
      <Card title={`Einkommens-Freiheit · Ziel ${fmt(targetPayout)} CHF/Monat`} level="EVIDENCE">
        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Aktuell / Monat" value={`${fmt(inc.currentMonthly)}`} sub="aktiv + passiv" />
          <Stat label="Lücke / Monat" value={`${fmt(inc.gap)}`} sub="bis zum Ziel" />
          <Stat label="Passiv / Monat" value={`${fmt(inc.passiveMonthly)}`} sub={`${Math.round(inc.passivePctOfTarget * 100)}% des Ziels`} />
          <Stat label="Fortschritt" value={`${Math.round(inc.pct * 100)}%`} />
        </div>
        <div className="mt-3">
          <Bar value={inc.pct * 100} color={inc.pct >= 1 ? "#34d399" : "#7c6cf6"} />
        </div>
        {totalTarget > 0 && (
          <p className="mt-3 text-xs text-slate-500">
            Summe der Zielwerte deiner Einkommensquellen: {fmt(totalTarget)} CHF/Monat
            {totalTarget < targetPayout ? " — das deckt dein Gesamtziel noch nicht. Plane weitere Quellen oder höhere Ziele." : " — deckt dein Ziel ✓"}.
          </p>
        )}
      </Card>

      {/* Revenue streams */}
      <Card title="Einkommensquellen" action={<span className="chip text-slate-300">{streams.length}</span>}>
        {streams.length === 0 ? (
          <Empty>Noch keine Einkommensquellen. Starte mit „Foto/Video Aufträge" (aktiv) und „AI-Implementierung Retainer" (im Aufbau).</Empty>
        ) : (
          <ul className="mb-4 space-y-2">
            {streams.map((s) => {
              const pct = s.monthlyTarget > 0 ? Math.min(100, (s.monthlyNow / s.monthlyTarget) * 100) : 0;
              return (
                <li key={s.id} className="rounded-lg border border-white/10 bg-ink-soft/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">{s.name}
                      <span className="chip ml-2 text-slate-400">{STREAM_KIND[s.kind]}</span>
                      <span className="chip ml-1" style={{ color: s.status === "LIVE" || s.status === "SCALING" ? "#34d399" : s.status === "BUILDING" ? "#60a5fa" : "#94a3b8" }}>{STREAM_STATUS[s.status]}</span>
                    </span>
                    <form action={deleteRevenueStream}><input type="hidden" name="id" value={s.id} /><button className="text-xs text-red-300">×</button></form>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">{fmt(s.monthlyNow)} → Ziel {fmt(s.monthlyTarget)} CHF/Monat</div>
                  <div className="mt-1"><Bar value={pct} color={pct >= 80 ? "#34d399" : "#7c6cf6"} /></div>
                  {s.notes && <p className="mt-1 text-xs text-slate-500">{s.notes}</p>}
                </li>
              );
            })}
          </ul>
        )}
        <form action={addRevenueStream} className="grid gap-2 sm:grid-cols-6">
          <input type="hidden" name="personId" value={self.id} />
          <input name="name" className="input sm:col-span-2" placeholder="z. B. AI-Implementierung Retainer" required />
          <select name="kind" className="input" defaultValue="ACTIVE">{Object.entries(STREAM_KIND).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          <input name="monthlyNow" type="number" step="any" className="input" placeholder="jetzt CHF/M" />
          <input name="monthlyTarget" type="number" step="any" className="input" placeholder="Ziel CHF/M" />
          <select name="status" className="input" defaultValue="BUILDING">{Object.entries(STREAM_STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          <button className="btn sm:col-span-6">+ Einkommensquelle</button>
        </form>
      </Card>

      {/* Swiss household / salary strategy */}
      <Card title="Schweizer Haushalts-Strategie (GmbH/AG, AHV, Partnerin)" level="EVIDENCE">
        <form action={saveStrategy} className="grid gap-3 sm:grid-cols-3">
          <input type="hidden" name="personId" value={self.id} />
          <div><label className="label">Ziel-Auszahlung / Monat</label><input name="targetMonthlyPayout" type="number" step="any" className="input" defaultValue={finance?.targetMonthlyPayout || 17500} /></div>
          <div><label className="label">Firmengewinn / Jahr (verteilbar)</label><input name="companyProfit" type="number" step="any" className="input" defaultValue={finance?.companyProfit ?? ""} /></div>
          <div><label className="label">Grenzsteuersatz % (Haushalt)</label><input name="marginalTaxRatePct" type="number" step="any" className="input" defaultValue={finance ? finance.marginalTaxRate * 100 : 25} /></div>
          <div><label className="label">Dein Lohn / Jahr (brutto)</label><input name="ownerSalary" type="number" step="any" className="input" defaultValue={finance?.ownerSalary ?? ""} /></div>
          <div><label className="label">Lohn Partnerin / Jahr (brutto)</label><input name="partnerSalary" type="number" step="any" className="input" defaultValue={finance?.partnerSalary ?? ""} placeholder="0 = nicht angestellt" /></div>
          <div className="flex items-end"><button className="btn w-full">Berechnen & speichern</button></div>
        </form>

        {salary && (finance?.companyProfit ?? 0) > 0 && (
          <div className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-4">
              <Stat label="AHV-Kosten total" value={`${fmt(salary.totalAhvCost)}`} sub="AN+AG, beide Löhne" />
              <Stat label="Dividenden-Spielraum" value={`${fmt(salary.dividendRoom)}`} sub="Gewinn nach Löhnen" />
              <Stat label="Dividendensteuer (ca.)" value={`${fmt(salary.dividendTax)}`} sub="70% steuerbar" />
              <Stat label="3a-Potenzial" value={`${fmt(salary.pillar3aRoomOwner + salary.pillar3aRoomPartner)}`} sub="beide zusammen" />
            </div>
            <ul className="space-y-1.5 text-sm text-slate-300">
              {salary.notes.map((n, i) => <li key={i} className="flex gap-2"><span className="text-accent-soft">•</span><span>{n}</span></li>)}
            </ul>
          </div>
        )}
        <p className="mt-3 text-xs text-slate-500">
          ⚠️ Vereinfachte Richtwerte, keine Steuer-/Rechtsberatung. AHV-Sätze und Säule-3a-Maxima 2026; kantonale Steuern variieren. Für die konkrete Umsetzung Treuhänder beiziehen.
        </p>
      </Card>

      <Card title="Kontext: dein Weg">
        <ul className="space-y-1.5 text-sm text-slate-300">
          <li className="flex gap-2"><span className="text-accent-soft">▸</span> <span><strong>Heute:</strong> Foto/Video-Agentur — bestehender Cashflow, dein Fundament.</span></li>
          <li className="flex gap-2"><span className="text-accent-soft">▸</span> <span><strong>Aufbau:</strong> AI-Strategie & -Implementierung (Weiterbildung läuft) — höhere Stundensätze, Retainer, skalierbarer als reine Produktion.</span></li>
          <li className="flex gap-2"><span className="text-accent-soft">▸</span> <span><strong>Hebel:</strong> Foto/Video-Kunden sind warme Leads für AI-Projekte. Cross-Sell statt Kaltakquise.</span></li>
          <li className="flex gap-2"><span className="text-accent-soft">▸</span> <span><strong>Netzwerk:</strong> BNI-Kontakte gezielt für AI-Implementierungs-Empfehlungen aktivieren (erfasse sie unter Konstellationen als Team).</span></li>
          <li className="flex gap-2"><span className="text-accent-soft">▸</span> <span><strong>Kapital knapp:</strong> Modelle mit geringem Kapitalbedarf + schnellem Time-to-Cash priorisieren (Retainer, Vorauszahlung). Siehe Geschäftsfeld-Scoring.</span></li>
        </ul>
      </Card>
    </div>
  );
}

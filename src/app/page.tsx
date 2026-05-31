import Link from "next/link";
import { getSelfProfile } from "@/lib/queries";
import { prisma } from "@/lib/db";
import { Card, Stat, Bar, CardLink, Empty, EvidenceBadge } from "@/components/ui";
import { addGoal, toggleGoal, goalToHabit } from "@/lib/actions";
import { LIFE_PATH_MEANINGS } from "@/lib/numerology";
import { currentTransits } from "@/lib/astrology";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const profile = await getSelfProfile();
  if (!profile) {
    return (
      <Empty>
        Noch kein Profil vorhanden. <Link className="text-accent-soft underline" href="/people">Lege dein Profil an.</Link>
      </Empty>
    );
  }
  const { person, astro, hd, numerology, bigFive, fire } = profile;
  const goals = await prisma.goal.findMany({
    where: { personId: person.id },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  // Income-freedom snapshot (your short-term 15-20k/month goal).
  const [financeRow, accounts, streams] = await Promise.all([
    prisma.financeProfile.findUnique({ where: { personId: person.id } }),
    prisma.account.findMany({ where: { personId: person.id } }),
    prisma.revenueStream.findMany({ where: { personId: person.id } }),
  ]);
  const targetPayout = financeRow?.targetMonthlyPayout || 0;
  const incomeNow =
    streams.reduce((s, x) => s + x.monthlyNow, 0) +
    accounts.reduce((s, a) => s + (a.balance > 0 ? a.balance * a.expectedYield : 0), 0) / 12;
  const incomePct = targetPayout > 0 ? Math.min(100, (incomeNow / targetPayout) * 100) : 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Hallo {person.name.split(" ")[0]} 👋</h1>
          <p className="mt-1 text-slate-400">
            Dein Cockpit für Selbstverständnis, Ausrichtung und den Weg zur Freiheit.
          </p>
        </div>
        <Link href={`/people/${person.id}`} className="btn-ghost">Profil & Geburtsdaten</Link>
      </header>

      {/* Snapshot */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Sonne / Mond"
          value={astro ? `${astro.sunSign} / ${astro.moonSign}` : "—"}
          sub={astro?.ascendant ? `Aszendent ${astro.ascendant.sign}` : "Geburtsort für Aszendent ergänzen"}
        />
        <Stat label="Human Design" value={hd?.type ?? "—"} sub={hd ? `Profil ${hd.profile} · ${hd.authority}` : undefined} />
        <Stat
          label="Lebenszahl"
          value={numerology?.lifePath ?? "—"}
          sub={numerology ? LIFE_PATH_MEANINGS[numerology.lifePath]?.split(",")[0] : undefined}
        />
        <Stat
          label="Persönlichkeitskern"
          value={bigFive ? bigFiveHeadline(bigFive) : "Test offen"}
          sub={bigFive ? "Big Five erfasst" : "Big-Five-Test machen"}
        />
      </div>

      {/* Current "specific to me right now" layer */}
      <Card title="Aktuell · heute" level="INTERPRETIVE" action={<span className="text-xs text-slate-400">{new Date().toLocaleDateString("de-CH")}</span>}>
        {(() => {
          const t = currentTransits();
          const sun = t[0];
          const moon = t[1];
          const retro = t.filter((p) => p.retrograde).map((p) => p.name);
          return (
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Sonne heute" value={`${sun.signGlyph} ${sun.sign}`} sub={`${sun.degreeInSign.toFixed(0)}°`} />
              <Stat label="Mond heute" value={`${moon.signGlyph} ${moon.sign}`} />
              <Stat
                label="Persönliches Jahr"
                value={numerology?.personalYear ?? "—"}
                sub={retro.length ? `Rückläufig: ${retro.join(", ")}` : "keine Planeten rückläufig"}
              />
            </div>
          );
        })()}
        <p className="mt-3 text-xs text-slate-500">Deutungsebene — als Impuls, nicht als Vorhersage. Vertiefe deine Reflexion im Journal.</p>
      </Card>

      {/* Freedom progress */}
      {targetPayout > 0 && (
        <Card title="Einkommens-Freiheit · kurzfristiges Ziel" level="EVIDENCE" action={<Link href="/strategy" className="btn-ghost">Strategie</Link>}>
          <div className="mb-1 flex justify-between text-sm text-slate-300">
            <span>{fmt(incomeNow)} CHF/Monat aktuell</span>
            <span>Ziel {fmt(targetPayout)} CHF/Monat · {Math.round(incomePct)}%</span>
          </div>
          <Bar value={incomePct} color={incomePct >= 100 ? "#34d399" : "#7c6cf6"} />
        </Card>
      )}

      <Card title="Weg zur finanziellen Freiheit" level="EVIDENCE" action={<Link href="/finance" className="btn-ghost">Bearbeiten</Link>}>
        {fire ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="Freiheits-Zahl" value={`${fmt(fire.freedomNumber)} ${fire.currency}`} sub={`bei ${(fire.annualSpend / 12 / 1).toLocaleString("de-CH", { maximumFractionDigits: 0 })} ${fire.currency}/Monat`} />
              <Stat label="Sparquote" value={`${Math.round(fire.savingsRate * 100)}%`} sub={fire.savingsRate >= 0.4 ? "sehr schneller Pfad" : fire.savingsRate < 0.2 ? "grösster Hebel" : "solide"} />
              <Stat label="Zeit bis Freiheit" value={fire.yearsToFreedom !== null ? `${fire.yearsToFreedom} J.` : "—"} sub={fire.runwayMonths !== null ? `Runway: ${fire.runwayMonths} Monate` : undefined} />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-slate-400">
                <span>Fortschritt zur Freiheits-Zahl</span>
                <span>{Math.round(fire.progress * 100)}%</span>
              </div>
              <Bar value={fire.progress * 100} color="#34d399" />
            </div>
          </div>
        ) : (
          <Empty>
            <Link className="text-accent-soft underline" href="/finance">Finanzprofil ausfüllen</Link>, um deine Freiheits-Zahl zu berechnen.
          </Empty>
        )}
      </Card>

      {/* Goals */}
      <Card title="Ziele" action={<EvidenceBadge level="PRACTICE" />}>
        <form action={addGoal} className="mb-4 flex flex-wrap gap-2">
          <input type="hidden" name="personId" value={person.id} />
          <input name="text" placeholder="Neues Ziel…" className="input flex-1" required />
          <select name="horizon" className="input w-auto">
            <option value="ONE_YEAR">1 Jahr</option>
            <option value="THREE_YEARS">3 Jahre</option>
            <option value="TEN_YEARS">10 Jahre</option>
            <option value="LIFE">Lebensziel</option>
          </select>
          <select name="area" className="input w-auto">
            <option value="FINANCE">Finanzen</option>
            <option value="CAREER">Beruf</option>
            <option value="FAMILY">Familie</option>
            <option value="HEALTH">Gesundheit</option>
            <option value="GROWTH">Wachstum</option>
            <option value="GENERAL">Allgemein</option>
          </select>
          <button className="btn">Hinzufügen</button>
        </form>
        {goals.length === 0 ? (
          <Empty>Noch keine Ziele. Formuliere dein erstes — Zielklarheit ist der wirksame Kern von „Geldanziehung".</Empty>
        ) : (
          <ul className="space-y-2">
            {goals.map((g) => (
              <li key={g.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-ink-soft/50 px-3 py-2">
                <span className={g.status === "DONE" ? "text-slate-500 line-through" : ""}>
                  <span className="chip mr-2 text-slate-400">{horizonLabel(g.horizon)}</span>
                  {g.text}
                </span>
                <div className="flex gap-1">
                  {g.status !== "DONE" && (
                    <form action={goalToHabit}>
                      <input type="hidden" name="id" value={g.id} />
                      <button className="btn-ghost text-xs" title="In tägliche Gewohnheit umwandeln">→ Gewohnheit</button>
                    </form>
                  )}
                  <form action={toggleGoal}>
                    <input type="hidden" name="id" value={g.id} />
                    <button className="btn-ghost text-xs">{g.status === "DONE" ? "↺" : "✓ erledigt"}</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Module links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CardLink href={`/people/${person.id}`} emoji="🔭" title="Deine Karten" desc="Astrologie, Human Design, Numerologie & Big Five im Detail." />
        <CardLink href="/business" emoji="🚀" title="Geschäftsfelder" desc="Ideen gegen deine Stärken & den Markt bewerten." />
        <CardLink href="/constellations" emoji="🕸️" title="Konstellationen" desc="Familie & Team analysieren — Synergie und Reibung." />
        <CardLink href="/freedom" emoji="🌱" title="Praxis & Journal" desc="Gewohnheiten, Gelegenheits-Log, Reflexion." />
        <CardLink href="/synthesis" emoji="✨" title="KI-Synthese" desc="Alle Systeme zusammengeführt → nächste Schritte." />
        <CardLink href="/finance" emoji="💸" title="Freiheit & Geld" desc="FIRE-Rechner, Sparquote, Runway, Szenarien." />
      </div>
    </div>
  );
}

function bigFiveHeadline(b: { O: number; C: number; E: number; A: number; N: number }) {
  const entries = [
    ["Offen", b.O],
    ["Gewissenhaft", b.C],
    ["Extravertiert", b.E],
    ["Verträglich", b.A],
    ["Sensibel", b.N],
  ] as const;
  const top = entries.slice().sort((a, c) => c[1] - a[1])[0];
  return top[0];
}

function horizonLabel(h: string) {
  return { ONE_YEAR: "1J", THREE_YEARS: "3J", TEN_YEARS: "10J", LIFE: "Leben" }[h] ?? h;
}
function fmt(n: number) {
  return isFinite(n) ? Math.round(n).toLocaleString("de-CH") : "∞";
}

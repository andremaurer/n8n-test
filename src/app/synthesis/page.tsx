import Link from "next/link";
import { getSelfProfile } from "@/lib/queries";
import { prisma } from "@/lib/db";
import { synthesize, SynthesisProfile } from "@/lib/ai";
import { Card, Empty } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SynthesisPage() {
  const profile = await getSelfProfile();
  if (!profile) return <Empty>Lege zuerst dein Profil an.</Empty>;
  const { person, astro, hd, numerology, bigFive, fire } = profile;

  const goals = await prisma.goal.findMany({ where: { personId: person.id, status: { not: "DONE" } }, take: 5 });

  const input: SynthesisProfile = {
    name: person.name,
    role: person.role,
    bigFive: bigFive ?? null,
    astro: astro ? { sunSign: astro.sunSign, moonSign: astro.moonSign, ascendant: astro.ascendant?.sign } : null,
    hd: hd ? { type: hd.type, authority: hd.authority, profile: hd.profile, strategy: hd.strategy } : null,
    numerology: numerology ? { lifePath: numerology.lifePath, personalYear: numerology.personalYear } : null,
    fire: fire
      ? { currency: fire.currency, freedomNumber: fire.freedomNumber, progress: fire.progress, yearsToFreedom: fire.yearsToFreedom, savingsRate: fire.savingsRate }
      : null,
    topGoals: goals.map((g) => g.text),
  };

  const result = await synthesize(input);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">KI-Synthese</h1>
          <p className="mt-1 text-slate-400">Alle Systeme zusammengeführt — evidenzbasiert gewichtet, Widersprüche markiert, konkrete nächste Schritte.</p>
        </div>
        <span className="chip text-slate-400">{result.source === "ai" ? "✨ Claude" : "⚙️ regelbasiert"}</span>
      </header>

      {result.source === "fallback" && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3 text-sm text-amber-200/90">
          Kein <code>ANTHROPIC_API_KEY</code> gesetzt → deterministische, regelbasierte Auswertung. Für die vollwertige KI-Synthese
          den Key in <code>.env</code> hinterlegen. Die App funktioniert ohne Key vollständig.
        </div>
      )}

      <Card title="Zusammenfassung"><p className="text-slate-200">{result.summary}</p></Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Stärken" emoji="💪" items={result.strengths} />
        <Section title="Worauf achten" emoji="⚠️" items={result.watchouts} />
        <Section title="Geschäftsfeld-Richtungen" emoji="🚀" items={result.businessDirections} />
        <Section title="Nächste Schritte" emoji="✅" items={result.nextSteps} />
      </div>

      {result.contradictions.length > 0 && (
        <Card title="Widersprüche zwischen Systemen">
          <p className="mb-2 text-xs text-slate-400">Evidenzbasierte Aussagen (Big Five, Finanzen) wiegen schwerer als Deutungssysteme.</p>
          <ul className="space-y-2">
            {result.contradictions.map((c, i) => (
              <li key={i} className="rounded-lg border border-blue-400/20 bg-blue-400/5 p-3 text-sm text-slate-200">{c}</li>
            ))}
          </ul>
        </Card>
      )}

      <div className="text-sm text-slate-400">
        Mehr Daten = bessere Synthese:{" "}
        <Link href={`/assessments/${person.id}/bigfive`} className="text-accent-soft underline">Big-Five-Test</Link>,{" "}
        <Link href="/finance" className="text-accent-soft underline">Finanzprofil</Link>,{" "}
        <Link href={`/people/${person.id}`} className="text-accent-soft underline">Geburtsort ergänzen</Link>.
      </div>
    </div>
  );
}

function Section({ title, emoji, items }: { title: string; emoji: string; items: string[] }) {
  return (
    <Card title={`${emoji} ${title}`}>
      {items.length === 0 ? (
        <Empty>Noch nichts — mehr Daten erfassen.</Empty>
      ) : (
        <ul className="space-y-2">
          {items.map((t, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-200"><span className="text-accent-soft">•</span> <span>{t}</span></li>
          ))}
        </ul>
      )}
    </Card>
  );
}

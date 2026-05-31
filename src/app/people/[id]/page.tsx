import Link from "next/link";
import { notFound } from "next/navigation";
import { getPersonProfile } from "@/lib/queries";
import { prisma } from "@/lib/db";
import { Card, Stat, Bar, Empty, EvidenceBadge } from "@/components/ui";
import { updatePerson, deletePerson } from "@/lib/actions";
import { LIFE_PATH_MEANINGS } from "@/lib/numerology";
import { BIG_FIVE_FACTORS, describeBigFive, RIASEC_TYPES, RiasecType, hollandCode } from "@/lib/assessments";
import { CENTER_LABELS } from "@/lib/humandesign";
import { ASSESSMENT_LIST } from "@/lib/assess-registry";

export const dynamic = "force-dynamic";

export default async function PersonPage({ params }: { params: { id: string } }) {
  const profile = await getPersonProfile(params.id);
  if (!profile) notFound();
  const { person, astro, hd, numerology, bigFive, riasec } = profile;
  const code = riasec ? hollandCode(riasec) : null;

  // Extra registry assessments (HEXACO, Values, VIA, Enneagram, DISC).
  const extraRows = await prisma.assessmentResult.findMany({
    where: { personId: person.id, type: { in: ASSESSMENT_LIST.map((a) => a.key) } },
    orderBy: { createdAt: "desc" },
  });
  const extra = new Map<string, Record<string, number>>();
  for (const r of extraRows) {
    if (extra.has(r.type)) continue;
    try { extra.set(r.type, JSON.parse(r.scores)); } catch {}
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/people" className="text-sm text-slate-400 hover:text-white">← Profile</Link>
          <h1 className="text-3xl font-bold text-white">{person.name}</h1>
        </div>
        <Link href={`/assessments/${person.id}/bigfive`} className="btn">Big-Five-Test machen</Link>
      </header>

      {/* Birth data — editable (backend + frontend) */}
      <Card title="Geburtsdaten" action={<span className="text-xs text-slate-400">treibt Astrologie · Human Design · Numerologie</span>}>
        <form action={updatePerson} className="grid gap-3 sm:grid-cols-3">
          <input type="hidden" name="id" value={person.id} />
          <div className="sm:col-span-1">
            <label className="label">Name</label>
            <input name="name" className="input" defaultValue={person.name} required />
          </div>
          <div>
            <label className="label">Rolle</label>
            <select name="role" className="input" defaultValue={person.role}>
              <option value="SELF">Ich</option>
              <option value="FAMILY">Familie</option>
              <option value="TEAM">Team</option>
              <option value="OTHER">Andere</option>
            </select>
          </div>
          <div>
            <label className="label">Geschlecht (optional)</label>
            <input name="gender" className="input" defaultValue={person.gender ?? ""} />
          </div>
          <div>
            <label className="label">Geburtsdatum</label>
            <input name="birthDate" type="date" className="input" defaultValue={person.birthDate ?? ""} />
          </div>
          <div>
            <label className="label">Geburtszeit</label>
            <input name="birthTime" type="time" className="input" defaultValue={person.birthTime ?? ""} />
          </div>
          <div>
            <label className="label">Zeitzone (IANA)</label>
            <input name="timezone" className="input" defaultValue={person.timezone ?? "Europe/Zurich"} />
          </div>
          <div>
            <label className="label">Geburtsort</label>
            <input name="birthPlace" className="input" defaultValue={person.birthPlace ?? ""} placeholder="Ort (für Aszendent)" />
          </div>
          <div>
            <label className="label">Breite (Lat)</label>
            <input name="birthLat" className="input" defaultValue={person.birthLat ?? ""} placeholder="47.37" />
          </div>
          <div>
            <label className="label">Länge (Lng)</label>
            <input name="birthLng" className="input" defaultValue={person.birthLng ?? ""} placeholder="8.54" />
          </div>
          <div className="sm:col-span-3">
            <label className="label">Notizen</label>
            <textarea name="notes" className="input" rows={2} defaultValue={person.notes ?? ""} />
          </div>
          <div className="flex items-center gap-2 sm:col-span-3">
            <button className="btn">Speichern</button>
            {person.role !== "SELF" && (
              <form action={deletePerson}>
                <input type="hidden" name="id" value={person.id} />
                <button className="btn-ghost text-red-300">Löschen</button>
              </form>
            )}
          </div>
        </form>
        {!person.birthTime && (
          <p className="mt-3 text-xs text-amber-300/80">⚠️ Ohne Geburtszeit sind Aszendent, Häuser und das Human-Design-Profil unsicher.</p>
        )}
        {person.birthTime && (person.birthLat == null || person.birthLng == null) && (
          <p className="mt-3 text-xs text-amber-300/80">ℹ️ Für Aszendent & Häuser bitte Breite/Länge des Geburtsorts ergänzen.</p>
        )}
      </Card>

      {/* Big Five */}
      <Card title="Persönlichkeit · Big Five" level="EVIDENCE" action={<Link href={`/assessments/${person.id}/bigfive`} className="btn-ghost">{bigFive ? "Erneut testen" : "Test machen"}</Link>}>
        {bigFive ? (
          <div className="space-y-3">
            {describeBigFive(bigFive).map((d) => (
              <div key={d.factor}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-white">{d.name}</span>
                  <span className="text-slate-400">{d.score.toFixed(1)} / 5 · {d.text}</span>
                </div>
                <Bar value={d.percent} color={d.factor === "N" ? "#f59e0b" : "#7c6cf6"} />
              </div>
            ))}
            <p className="text-xs text-slate-500">Skala 1–5 (Mittelwert über 10 Items je Dimension, IPIP-50, Public Domain).</p>
          </div>
        ) : (
          <Empty>Noch kein Big-Five-Ergebnis — die belastbarste Datenquelle über diese Person.</Empty>
        )}
      </Card>

      {/* RIASEC interests */}
      <Card title="Interessen · RIASEC (Holland)" level="EVIDENCE" action={<Link href={`/assessments/${person.id}/riasec`} className="btn-ghost">{riasec ? "Erneut testen" : "Test machen"}</Link>}>
        {riasec && code ? (
          <div className="space-y-3">
            <div className="text-sm text-slate-300">
              Holland-Code: <span className="font-semibold text-white">{code.join("")}</span> ·{" "}
              passende Felder: <span className="text-slate-200">{code.map((c) => RIASEC_TYPES[c].fields).join("; ")}</span>
            </div>
            {(Object.keys(RIASEC_TYPES) as RiasecType[]).map((t) => (
              <div key={t}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-white">{RIASEC_TYPES[t].name}</span>
                  <span className="text-slate-400">{riasec[t].toFixed(1)} / 5 · {RIASEC_TYPES[t].desc}</span>
                </div>
                <Bar value={((riasec[t] - 1) / 4) * 100} color={code.includes(t) ? "#34d399" : "#7c6cf6"} />
              </div>
            ))}
          </div>
        ) : (
          <Empty>Noch kein Interessen-Profil — der direkteste Input für passende Geschäftsfelder.</Empty>
        )}
      </Card>

      {/* Further assessments (generic registry) */}
      <Card title="Weitere Profile" action={<span className="text-xs text-slate-400">HEXACO · Werte · Stärken · Enneagramm · DISG</span>}>
        <div className="space-y-5">
          {ASSESSMENT_LIST.map((a) => {
            const scores = extra.get(a.key);
            const dims = Object.keys(a.dimensions);
            const ranked = scores ? dims.slice().sort((x, y) => scores[y] - scores[x]) : dims;
            return (
              <div key={a.key} className="border-t border-white/5 pt-4 first:border-0 first:pt-0">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{a.title}</span>
                    <EvidenceBadge level={a.evidence} />
                  </div>
                  <Link href={`/assessments/${person.id}/q/${a.key.toLowerCase()}`} className="btn-ghost text-xs">
                    {scores ? "Erneut testen" : "Test machen"}
                  </Link>
                </div>
                {scores ? (
                  <div className="space-y-1.5">
                    {ranked.map((d) => (
                      <div key={d}>
                        <div className="mb-0.5 flex justify-between text-xs">
                          <span className="text-slate-200">{a.dimensions[d].name}</span>
                          <span className="text-slate-500">{scores[d].toFixed(1)}</span>
                        </div>
                        <Bar value={((scores[d] - 1) / 4) * 100} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">{a.intro}</p>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Astrology */}
      <Card title="Astrologie · Geburtshoroskop" level="INTERPRETIVE">
        {astro ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Sonne" value={`${astro.sunSign}`} />
              <Stat label="Mond" value={`${astro.moonSign}`} />
              <Stat label="Aszendent" value={astro.ascendant ? astro.ascendant.sign : "—"} sub={astro.ascendant ? `${astro.ascendant.degreeInSign.toFixed(1)}°` : "Ort fehlt"} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-slate-400">
                  <tr><th className="py-1">Planet</th><th>Zeichen</th><th>Grad</th><th>Rückläufig</th></tr>
                </thead>
                <tbody>
                  {astro.planets.map((p) => (
                    <tr key={p.name} className="border-t border-white/5">
                      <td className="py-1.5">{p.glyph} {p.name}</td>
                      <td>{p.signGlyph} {p.sign}</td>
                      <td>{p.degreeInSign.toFixed(2)}°</td>
                      <td>{p.retrograde ? "℞" : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {astro.houses && (
              <div className="text-xs text-slate-400">
                Häuser (Whole-Sign): {astro.houses.map((h) => `${h.house}. ${h.sign}`).join(" · ")}
              </div>
            )}
          </div>
        ) : (
          <Empty>Geburtsdatum eingeben, um das Horoskop zu berechnen.</Empty>
        )}
      </Card>

      {/* Human Design */}
      <Card title="Human Design" level="INTERPRETIVE">
        {hd ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <Stat label="Typ" value={hd.type} />
              <Stat label="Profil" value={hd.profile} />
              <Stat label="Autorität" value={hd.authority} />
              <Stat label="Signatur" value={hd.signature} sub={`Not-Self: ${hd.notSelf}`} />
            </div>
            <p className="text-sm text-slate-300"><span className="text-slate-400">Strategie:</span> {hd.strategy}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="label">Definierte Zentren</div>
                <div className="flex flex-wrap gap-1.5">
                  {hd.definedCenters.map((c) => <span key={c} className="chip text-emerald-300">{CENTER_LABELS[c]}</span>)}
                  {hd.definedCenters.length === 0 && <span className="text-sm text-slate-400">keine (Reflektor)</span>}
                </div>
              </div>
              <div>
                <div className="label">Offene Zentren</div>
                <div className="flex flex-wrap gap-1.5">
                  {hd.openCenters.map((c) => <span key={c} className="chip text-slate-400">{CENTER_LABELS[c]}</span>)}
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-400">Kanäle: {hd.definedChannels.join(" · ") || "—"} · {hd.note}</div>
          </div>
        ) : (
          <Empty>Geburtsdatum eingeben, um das BodyGraph zu berechnen.</Empty>
        )}
      </Card>

      {/* Numerology */}
      <Card title="Numerologie" level="INTERPRETIVE">
        {numerology ? (
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Stat label="Lebenszahl" value={numerology.lifePath} sub={LIFE_PATH_MEANINGS[numerology.lifePath]} />
            <Stat label="Geburtstag" value={numerology.birthday} />
            <Stat label="Persönl. Jahr" value={numerology.personalYear} sub="aktueller Zyklus" />
            {numerology.expression != null && <Stat label="Ausdruckszahl" value={numerology.expression} />}
            {numerology.soulUrge != null && <Stat label="Seelenzahl" value={numerology.soulUrge} />}
          </div>
        ) : (
          <Empty>Geburtsdatum eingeben.</Empty>
        )}
      </Card>
    </div>
  );
}

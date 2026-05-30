import { prisma } from "@/lib/db";
import { getAllPeople } from "@/lib/queries";
import { buildProfile } from "@/lib/profile";
import { analyzePair, PersonSummary, Insight } from "@/lib/constellation";
import { EVIDENCE } from "@/lib/evidence";
import { Card, Empty } from "@/components/ui";
import { createConstellation, addMember, removeMember, deleteConstellation } from "@/lib/actions";

export const dynamic = "force-dynamic";

async function summaryFor(personId: string): Promise<PersonSummary> {
  const person = await prisma.person.findUnique({ where: { id: personId } });
  const assessments = await prisma.assessmentResult.findMany({ where: { personId } });
  const prof = buildProfile(person!, assessments, null);
  return {
    id: person!.id,
    name: person!.name,
    sunSign: prof.astro?.sunSign,
    hdType: prof.hd?.type,
    bigFive: prof.bigFive
      ? { O: prof.bigFive.O, C: prof.bigFive.C, E: prof.bigFive.E, A: prof.bigFive.A, N: prof.bigFive.N }
      : undefined,
  };
}

export default async function ConstellationsPage() {
  const [constellations, people] = await Promise.all([
    prisma.constellation.findMany({
      include: { members: { include: { person: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getAllPeople(),
  ]);

  // Precompute summaries for everyone who is a member somewhere.
  const memberIds = new Set(constellations.flatMap((c) => c.members.map((m) => m.personId)));
  const summaries = new Map<string, PersonSummary>();
  for (const id of memberIds) summaries.set(id, await summaryFor(id));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">Konstellationen</h1>
        <p className="mt-1 text-slate-400">Familie & Team als Beziehungs-Map — Synergie und Reibung, evidenzbasiert und als Deutung gekennzeichnet.</p>
      </header>

      {constellations.length === 0 && <Empty>Noch keine Konstellation. Erstelle unten deine erste (z. B. „Familie" oder „Gründerteam").</Empty>}

      {constellations.map((c) => {
        const members = c.members;
        const pairs: { a: PersonSummary; b: PersonSummary; insights: Insight[] }[] = [];
        for (let i = 0; i < members.length; i++)
          for (let j = i + 1; j < members.length; j++) {
            const a = summaries.get(members[i].personId)!;
            const b = summaries.get(members[j].personId)!;
            pairs.push({ a, b, insights: analyzePair(a, b) });
          }

        return (
          <Card key={c.id} title={`${c.type === "TEAM" ? "👥" : "🏠"} ${c.name}`} action={
            <form action={deleteConstellation}><input type="hidden" name="id" value={c.id} /><button className="btn-ghost text-xs text-red-300">Löschen</button></form>
          }>
            {c.notes && <p className="mb-3 text-sm text-slate-400">{c.notes}</p>}

            {/* Members */}
            <div className="mb-4 flex flex-wrap gap-2">
              {members.map((m) => (
                <span key={m.id} className="chip text-slate-200">
                  {m.person.name}{m.roleLabel ? ` · ${m.roleLabel}` : ""}
                  <form action={removeMember} className="inline">
                    <input type="hidden" name="id" value={m.id} />
                    <button className="ml-1 text-red-300" title="Entfernen">×</button>
                  </form>
                </span>
              ))}
              {members.length === 0 && <span className="text-sm text-slate-500">Noch keine Mitglieder.</span>}
            </div>

            {/* Add member */}
            <form action={addMember} className="mb-4 flex flex-wrap gap-2">
              <input type="hidden" name="constellationId" value={c.id} />
              <select name="personId" className="input w-auto" required>
                <option value="">Person wählen…</option>
                {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input name="roleLabel" className="input w-auto" placeholder="Rolle (z. B. CTO, Vater)" />
              <button className="btn-ghost">+ Mitglied</button>
            </form>

            {/* Pairwise analysis */}
            {pairs.length === 0 ? (
              <Empty>Mindestens zwei Mitglieder für eine Dynamik-Analyse hinzufügen.</Empty>
            ) : (
              <div className="space-y-3">
                {pairs.map(({ a, b, insights }, idx) => (
                  <div key={idx} className="rounded-xl border border-white/10 bg-ink-soft/40 p-3">
                    <div className="mb-2 text-sm font-semibold text-white">{a.name} ↔ {b.name}</div>
                    <ul className="space-y-1.5">
                      {insights.map((ins, k) => (
                        <li key={k} className="text-sm text-slate-300">
                          <span className="chip mr-2 align-middle" style={{ borderColor: `${EVIDENCE[ins.level].color}55`, color: EVIDENCE[ins.level].color }}>
                            {EVIDENCE[ins.level].emoji} {ins.title}
                          </span>
                          {ins.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}

      <Card title="Konstellation erstellen">
        <form action={createConstellation} className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="label">Name</label>
            <input name="name" className="input" required placeholder="z. B. Familie Maurer" />
          </div>
          <div>
            <label className="label">Typ</label>
            <select name="type" className="input">
              <option value="FAMILY">Familie</option>
              <option value="TEAM">Team</option>
            </select>
          </div>
          <div>
            <label className="label">Notiz</label>
            <input name="notes" className="input" placeholder="optional" />
          </div>
          <div className="sm:col-span-3"><button className="btn">Erstellen</button></div>
        </form>
      </Card>
    </div>
  );
}

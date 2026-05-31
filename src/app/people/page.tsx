import Link from "next/link";
import { getAllPeople } from "@/lib/queries";
import { Card, Empty } from "@/components/ui";
import { createPerson } from "@/lib/actions";
import { PlaceAutocomplete } from "@/components/PlaceAutocomplete";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = { SELF: "Ich", FAMILY: "Familie", TEAM: "Team", OTHER: "Andere" };

export default async function PeoplePage() {
  const people = await getAllPeople();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">Profile</h1>
        <p className="mt-1 text-slate-400">Du, Familie und Teammitglieder — alle ohne Login, du pflegst sie hier.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {people.map((p) => (
          <Link key={p.id} href={`/people/${p.id}`} className="card transition hover:border-accent/50">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-white">{p.name}</span>
              <span className="chip text-slate-400">{ROLE_LABEL[p.role] ?? p.role}</span>
            </div>
            <div className="mt-2 text-sm text-slate-400">
              {p.birthDate ? (
                <>🎂 {p.birthDate}{p.birthTime ? ` · ${p.birthTime}` : " · Zeit fehlt"}{p.birthPlace ? ` · ${p.birthPlace}` : ""}</>
              ) : (
                "Geburtsdaten fehlen"
              )}
            </div>
          </Link>
        ))}
        {people.length === 0 && <Empty>Noch keine Profile.</Empty>}
      </div>

      <Card title="Person hinzufügen">
        <form action={createPerson} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Name</label>
            <input name="name" className="input" required placeholder="z. B. Anna Maurer" />
          </div>
          <div>
            <label className="label">Rolle</label>
            <select name="role" className="input">
              <option value="FAMILY">Familie</option>
              <option value="TEAM">Team</option>
              <option value="OTHER">Andere</option>
              <option value="SELF">Ich</option>
            </select>
          </div>
          <div>
            <label className="label">Geburtsdatum</label>
            <input name="birthDate" type="date" className="input" />
          </div>
          <div>
            <label className="label">Geburtszeit</label>
            <input name="birthTime" type="time" className="input" />
          </div>
          <PlaceAutocomplete />
          <div className="sm:col-span-2">
            <button className="btn">Hinzufügen</button>
          </div>
        </form>
      </Card>
    </div>
  );
}

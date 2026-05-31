import { prisma } from "./db";
import { buildProfile, FullProfile } from "./profile";

export async function getSelf() {
  let self = await prisma.person.findFirst({ where: { role: "SELF" } });
  if (!self) self = await prisma.person.findFirst();
  return self;
}

export async function getSelfProfile(): Promise<FullProfile | null> {
  const self = await getSelf();
  if (!self) return null;
  const [assessments, finance] = await Promise.all([
    prisma.assessmentResult.findMany({ where: { personId: self.id }, orderBy: { createdAt: "desc" } }),
    prisma.financeProfile.findUnique({ where: { personId: self.id } }),
  ]);
  return buildProfile(self, assessments, finance);
}

export async function getPersonProfile(id: string): Promise<FullProfile | null> {
  const person = await prisma.person.findUnique({ where: { id } });
  if (!person) return null;
  const [assessments, finance] = await Promise.all([
    prisma.assessmentResult.findMany({ where: { personId: id }, orderBy: { createdAt: "desc" } }),
    prisma.financeProfile.findUnique({ where: { personId: id } }),
  ]);
  return buildProfile(person, assessments, finance);
}

export async function getAllPeople() {
  return prisma.person.findMany({ orderBy: [{ role: "asc" }, { createdAt: "asc" }] });
}

// Build the input object used by the AI synthesis / chat from the owner profile.
export async function getSelfSynthesisInput() {
  const profile = await getSelfProfile();
  if (!profile) return null;
  const { person, astro, hd, numerology, bigFive, fire } = profile;
  const goals = await prisma.goal.findMany({ where: { personId: person.id, status: { not: "DONE" } }, take: 5 });
  return {
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
}

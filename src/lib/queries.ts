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

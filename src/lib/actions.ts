"use server";

import { prisma } from "./db";
import { revalidatePath } from "next/cache";

// ---- People ----------------------------------------------------------------
export async function createPerson(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return;
  await prisma.person.create({
    data: {
      name,
      role: String(formData.get("role") || "FAMILY"),
      birthDate: str(formData.get("birthDate")),
      birthTime: str(formData.get("birthTime")),
      birthPlace: str(formData.get("birthPlace")),
      birthLat: num(formData.get("birthLat")),
      birthLng: num(formData.get("birthLng")),
      timezone: str(formData.get("timezone")) || "Europe/Zurich",
      notes: str(formData.get("notes")),
    },
  });
  revalidatePath("/people");
}

export async function updatePerson(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.person.update({
    where: { id },
    data: {
      name: String(formData.get("name") || "").trim(),
      role: String(formData.get("role") || "FAMILY"),
      birthDate: str(formData.get("birthDate")),
      birthTime: str(formData.get("birthTime")),
      birthPlace: str(formData.get("birthPlace")),
      birthLat: num(formData.get("birthLat")),
      birthLng: num(formData.get("birthLng")),
      timezone: str(formData.get("timezone")),
      gender: str(formData.get("gender")),
      notes: str(formData.get("notes")),
    },
  });
  revalidatePath(`/people/${id}`);
  revalidatePath("/people");
  revalidatePath("/");
}

export async function deletePerson(formData: FormData) {
  const id = String(formData.get("id"));
  const p = await prisma.person.findUnique({ where: { id } });
  if (p?.role === "SELF") return; // never delete the owner
  await prisma.person.delete({ where: { id } });
  revalidatePath("/people");
}

// ---- Finance ---------------------------------------------------------------
export async function saveFinance(formData: FormData) {
  const personId = String(formData.get("personId"));
  const data = {
    currency: String(formData.get("currency") || "CHF"),
    monthlyIncomeActive: num(formData.get("monthlyIncomeActive")) ?? 0,
    monthlyIncomePassive: num(formData.get("monthlyIncomePassive")) ?? 0,
    monthlyExpenses: num(formData.get("monthlyExpenses")) ?? 0,
    netWorth: num(formData.get("netWorth")) ?? 0,
    debt: num(formData.get("debt")) ?? 0,
    withdrawalRate: (num(formData.get("withdrawalRatePct")) ?? 4) / 100,
    expectedReturn: (num(formData.get("expectedReturnPct")) ?? 5) / 100,
    targetMonthlySpend: num(formData.get("targetMonthlySpend")) ?? 0,
  };
  await prisma.financeProfile.upsert({
    where: { personId },
    update: data,
    create: { personId, ...data },
  });
  revalidatePath("/finance");
  revalidatePath("/");
}

// ---- Assessments -----------------------------------------------------------
export async function saveBigFive(personId: string, answers: Record<number, number>, scores: unknown) {
  await prisma.assessmentResult.create({
    data: {
      personId,
      type: "BIG_FIVE",
      answers: JSON.stringify(answers),
      scores: JSON.stringify(scores),
    },
  });
  revalidatePath(`/people/${personId}`);
  revalidatePath("/");
}

export async function saveRiasec(personId: string, answers: Record<number, number>, scores: unknown) {
  await prisma.assessmentResult.create({
    data: {
      personId,
      type: "RIASEC",
      answers: JSON.stringify(answers),
      scores: JSON.stringify(scores),
    },
  });
  revalidatePath(`/people/${personId}`);
  revalidatePath("/business");
}

// ---- Business ideas --------------------------------------------------------
export async function addBusinessIdea(formData: FormData) {
  const personId = String(formData.get("personId"));
  await prisma.businessIdea.create({
    data: {
      personId,
      title: String(formData.get("title") || "Idee"),
      description: str(formData.get("description")),
      fitStrengths: int(formData.get("fitStrengths")),
      fitValues: int(formData.get("fitValues")),
      marketSize: int(formData.get("marketSize")),
      scalability: int(formData.get("scalability")),
      timeToCash: int(formData.get("timeToCash")),
      capitalNeed: int(formData.get("capitalNeed")),
      passiveness: int(formData.get("passiveness")),
    },
  });
  revalidatePath("/business");
}

export async function deleteBusinessIdea(formData: FormData) {
  await prisma.businessIdea.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/business");
}

// ---- Goals & life phases ---------------------------------------------------
export async function addGoal(formData: FormData) {
  const personId = String(formData.get("personId"));
  await prisma.goal.create({
    data: {
      personId,
      text: String(formData.get("text") || ""),
      horizon: String(formData.get("horizon") || "ONE_YEAR"),
      area: String(formData.get("area") || "GENERAL"),
    },
  });
  revalidatePath("/");
  revalidatePath(`/people/${personId}`);
}

export async function toggleGoal(formData: FormData) {
  const id = String(formData.get("id"));
  const g = await prisma.goal.findUnique({ where: { id } });
  if (!g) return;
  const next = g.status === "DONE" ? "OPEN" : "DONE";
  await prisma.goal.update({ where: { id }, data: { status: next } });
  revalidatePath("/");
}

// ---- Constellations --------------------------------------------------------
export async function createConstellation(formData: FormData) {
  await prisma.constellation.create({
    data: {
      name: String(formData.get("name") || "Konstellation"),
      type: String(formData.get("type") || "FAMILY"),
      notes: str(formData.get("notes")),
    },
  });
  revalidatePath("/constellations");
}

export async function addMember(formData: FormData) {
  const constellationId = String(formData.get("constellationId"));
  const personId = String(formData.get("personId"));
  if (!personId) return;
  await prisma.constellationMember.upsert({
    where: { constellationId_personId: { constellationId, personId } },
    update: { roleLabel: str(formData.get("roleLabel")) },
    create: { constellationId, personId, roleLabel: str(formData.get("roleLabel")) },
  });
  revalidatePath("/constellations");
}

export async function removeMember(formData: FormData) {
  await prisma.constellationMember.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/constellations");
}

export async function deleteConstellation(formData: FormData) {
  await prisma.constellation.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/constellations");
}

// ---- Habits & journal ------------------------------------------------------
export async function addHabit(formData: FormData) {
  const personId = String(formData.get("personId"));
  await prisma.habit.create({
    data: {
      personId,
      title: String(formData.get("title") || "Gewohnheit"),
      category: String(formData.get("category") || "MINDSET"),
      cadence: String(formData.get("cadence") || "DAILY"),
    },
  });
  revalidatePath("/freedom");
}

export async function toggleHabitToday(formData: FormData) {
  const habitId = String(formData.get("habitId"));
  const date = new Date().toISOString().slice(0, 10);
  const existing = await prisma.habitLog.findUnique({
    where: { habitId_date: { habitId, date } },
  });
  if (existing) await prisma.habitLog.delete({ where: { id: existing.id } });
  else await prisma.habitLog.create({ data: { habitId, date, done: true } });
  revalidatePath("/freedom");
}

export async function addJournal(formData: FormData) {
  const personId = String(formData.get("personId"));
  await prisma.journalEntry.create({
    data: {
      personId,
      date: new Date().toISOString().slice(0, 10),
      mood: int(formData.get("mood")) || null,
      text: String(formData.get("text") || ""),
    },
  });
  revalidatePath("/freedom");
}

// ---- helpers ---------------------------------------------------------------
function str(v: FormDataEntryValue | null): string | null {
  const s = v ? String(v).trim() : "";
  return s.length ? s : null;
}
function num(v: FormDataEntryValue | null): number | null {
  if (v === null || String(v).trim() === "") return null;
  const n = Number(String(v).replace(",", "."));
  return isNaN(n) ? null : n;
}
function int(v: FormDataEntryValue | null): number {
  const n = num(v);
  return n === null ? 3 : Math.round(n);
}

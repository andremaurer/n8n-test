"use server";

"use server";

import { prisma } from "./db";
import { revalidatePath } from "next/cache";
import { askProfile, type AskResult } from "./ai";
import { getSelfSynthesisInput } from "./queries";

// Chat: ask a question against your own profile + knowledge base.
export async function askMyProfile(question: string): Promise<AskResult> {
  const input = await getSelfSynthesisInput();
  if (!input) return { source: "fallback", answer: "Kein Profil vorhanden.", sources: [] };
  return askProfile(question, input as any);
}

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

// ---- Accounts (multiple bank/P2P/pension positions) ------------------------
export async function addAccount(formData: FormData) {
  const personId = String(formData.get("personId"));
  await prisma.account.create({
    data: {
      personId,
      name: String(formData.get("name") || "Konto"),
      institution: str(formData.get("institution")),
      kind: String(formData.get("kind") || "BANK"),
      currency: String(formData.get("currency") || "CHF"),
      balance: num(formData.get("balance")) ?? 0,
      expectedYield: (num(formData.get("expectedYieldPct")) ?? 0) / 100,
      liquid: formData.get("liquid") === "on" || formData.get("liquid") === "true",
      notes: str(formData.get("notes")),
    },
  });
  revalidatePath("/finance");
  revalidatePath("/");
}

export async function updateAccount(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.account.update({
    where: { id },
    data: {
      name: String(formData.get("name") || "Konto"),
      institution: str(formData.get("institution")),
      kind: String(formData.get("kind") || "BANK"),
      currency: String(formData.get("currency") || "CHF"),
      balance: num(formData.get("balance")) ?? 0,
      expectedYield: (num(formData.get("expectedYieldPct")) ?? 0) / 100,
      liquid: formData.get("liquid") === "on" || formData.get("liquid") === "true",
      notes: str(formData.get("notes")),
    },
  });
  revalidatePath("/finance");
  revalidatePath("/");
}

export async function deleteAccount(formData: FormData) {
  await prisma.account.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/finance");
  revalidatePath("/");
}

// ---- Revenue streams (path to 15-20k CHF/month) ----------------------------
export async function addRevenueStream(formData: FormData) {
  const personId = String(formData.get("personId"));
  await prisma.revenueStream.create({
    data: {
      personId,
      name: String(formData.get("name") || "Einkommensquelle"),
      kind: String(formData.get("kind") || "ACTIVE"),
      monthlyNow: num(formData.get("monthlyNow")) ?? 0,
      monthlyTarget: num(formData.get("monthlyTarget")) ?? 0,
      status: String(formData.get("status") || "BUILDING"),
      notes: str(formData.get("notes")),
    },
  });
  revalidatePath("/strategy");
  revalidatePath("/");
}

export async function updateRevenueStream(formData: FormData) {
  await prisma.revenueStream.update({
    where: { id: String(formData.get("id")) },
    data: {
      name: String(formData.get("name") || "Einkommensquelle"),
      kind: String(formData.get("kind") || "ACTIVE"),
      monthlyNow: num(formData.get("monthlyNow")) ?? 0,
      monthlyTarget: num(formData.get("monthlyTarget")) ?? 0,
      status: String(formData.get("status") || "BUILDING"),
      notes: str(formData.get("notes")),
    },
  });
  revalidatePath("/strategy");
  revalidatePath("/");
}

export async function deleteRevenueStream(formData: FormData) {
  await prisma.revenueStream.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/strategy");
  revalidatePath("/");
}

// ---- Market-validation experiments -----------------------------------------
export async function addExperiment(formData: FormData) {
  const personId = String(formData.get("personId"));
  await prisma.experiment.create({
    data: {
      personId,
      title: String(formData.get("title") || "Experiment"),
      hypothesis: String(formData.get("hypothesis") || ""),
      method: String(formData.get("method") || ""),
      riskiest: String(formData.get("riskiest") || ""),
      metric: String(formData.get("metric") || ""),
      threshold: num(formData.get("threshold")) ?? 0,
      cost: num(formData.get("cost")) ?? 0,
      status: String(formData.get("status") || "PLANNED"),
      notes: str(formData.get("notes")),
    },
  });
  revalidatePath("/validate");
}

export async function updateExperimentResult(formData: FormData) {
  const id = String(formData.get("id"));
  const result = num(formData.get("result"));
  const status = String(formData.get("status") || "RUNNING");
  await prisma.experiment.update({ where: { id }, data: { result, status } });
  revalidatePath("/validate");
}

export async function deleteExperiment(formData: FormData) {
  await prisma.experiment.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/validate");
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
    pillar2: num(formData.get("pillar2")) ?? 0,
    pillar3a: num(formData.get("pillar3a")) ?? 0,
    wealthTaxRate: (num(formData.get("wealthTaxRatePct")) ?? 0.5) / 100,
  };
  await prisma.financeProfile.upsert({
    where: { personId },
    update: data,
    create: { personId, ...data },
  });
  revalidatePath("/finance");
  revalidatePath("/");
}

// ---- Household / income strategy (CH) --------------------------------------
export async function saveStrategy(formData: FormData) {
  const personId = String(formData.get("personId"));
  const data = {
    targetMonthlyPayout: num(formData.get("targetMonthlyPayout")) ?? 0,
    companyProfit: num(formData.get("companyProfit")) ?? 0,
    ownerSalary: num(formData.get("ownerSalary")) ?? 0,
    partnerSalary: num(formData.get("partnerSalary")) ?? 0,
    marginalTaxRate: (num(formData.get("marginalTaxRatePct")) ?? 25) / 100,
  };
  await prisma.financeProfile.upsert({
    where: { personId },
    update: data,
    create: { personId, ...data },
  });
  revalidatePath("/strategy");
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

export async function saveAssessment(personId: string, type: string, answers: Record<number, number>, scores: unknown) {
  await prisma.assessmentResult.create({
    data: { personId, type, answers: JSON.stringify(answers), scores: JSON.stringify(scores) },
  });
  revalidatePath(`/people/${personId}`);
  revalidatePath("/");
}

// ---- Wheel of Life ---------------------------------------------------------
export async function addWheelCheckin(formData: FormData) {
  const personId = String(formData.get("personId"));
  await prisma.wheelCheckin.create({
    data: {
      personId,
      date: new Date().toISOString().slice(0, 10),
      career: int(formData.get("career")),
      finance: int(formData.get("finance")),
      health: int(formData.get("health")),
      relationships: int(formData.get("relationships")),
      family: int(formData.get("family")),
      growth: int(formData.get("growth")),
      fun: int(formData.get("fun")),
      spirituality: int(formData.get("spirituality")),
    },
  });
  revalidatePath("/freedom");
  revalidatePath("/");
}

// ---- Decision assistant ----------------------------------------------------
export async function saveDecision(personId: string, payload: unknown) {
  const p = payload as { title: string; optionA: string; optionB: string; factors: unknown; decision?: string };
  await prisma.decision.create({
    data: {
      personId,
      title: p.title || "Entscheidung",
      optionA: p.optionA || "Option A",
      optionB: p.optionB || "Option B",
      factors: JSON.stringify(p.factors ?? []),
      decision: p.decision ?? null,
    },
  });
  revalidatePath("/decisions");
}

export async function deleteDecision(formData: FormData) {
  await prisma.decision.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/decisions");
}

// ---- Skills & Ikigai -------------------------------------------------------
export async function addSkill(formData: FormData) {
  const personId = String(formData.get("personId"));
  await prisma.skill.create({
    data: {
      personId,
      name: String(formData.get("name") || "Skill"),
      proficiency: int(formData.get("proficiency")),
      enjoyment: int(formData.get("enjoyment")),
      marketDemand: int(formData.get("marketDemand")),
    },
  });
  revalidatePath("/business");
}

export async function deleteSkill(formData: FormData) {
  await prisma.skill.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/business");
}

export async function saveIkigai(formData: FormData) {
  const personId = String(formData.get("personId"));
  const data = {
    love: String(formData.get("love") || ""),
    goodAt: String(formData.get("goodAt") || ""),
    paidFor: String(formData.get("paidFor") || ""),
    worldNeeds: String(formData.get("worldNeeds") || ""),
  };
  await prisma.ikigai.upsert({ where: { personId }, update: data, create: { personId, ...data } });
  revalidatePath("/business");
}

// ---- CSV expense import ----------------------------------------------------
export async function importExpensesCsv(formData: FormData) {
  const personId = String(formData.get("personId"));
  const file = formData.get("file");
  if (!file || typeof file === "string") return;
  const text = await (file as File).text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  let total = 0;
  let count = 0;
  const months = new Set<string>();
  for (const line of lines) {
    const cols = line.split(/[,;\t]/);
    let amount: number | null = null;
    let monthKey: string | null = null;
    for (const c of cols) {
      const t = c.trim().replace(/["']/g, "");
      const n = Number(t.replace(/[^0-9.,-]/g, "").replace(",", "."));
      if (amount === null && t && !isNaN(n) && Math.abs(n) > 0 && /\d/.test(t) && !/^\d{4}-\d{2}/.test(t)) amount = Math.abs(n);
      const m1 = t.match(/(\d{4})-(\d{2})/);
      const m2 = t.match(/\d{2}\.(\d{2})\.(\d{4})/);
      if (m1) monthKey = `${m1[1]}-${m1[2]}`;
      else if (m2) monthKey = `${m2[2]}-${m2[1]}`;
    }
    if (amount !== null) {
      total += amount;
      count++;
      if (monthKey) months.add(monthKey);
    }
  }
  if (count === 0) return;
  const monthlyExpenses = Math.round(total / Math.max(1, months.size));
  await prisma.financeProfile.upsert({
    where: { personId },
    update: { monthlyExpenses },
    create: { personId, monthlyExpenses },
  });
  revalidatePath("/finance");
}

// ---- Life phases -----------------------------------------------------------
export async function addLifePhase(formData: FormData) {
  const personId = String(formData.get("personId"));
  const priorities = String(formData.get("priorities") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  await prisma.lifePhase.create({
    data: {
      personId,
      title: String(formData.get("title") || "Phase"),
      area: String(formData.get("area") || "GENERAL"),
      startDate: str(formData.get("startDate")),
      endDate: str(formData.get("endDate")),
      status: String(formData.get("status") || "ACTIVE"),
      priorities: JSON.stringify(priorities),
      notes: str(formData.get("notes")),
    },
  });
  revalidatePath("/phases");
}

export async function setLifePhaseStatus(formData: FormData) {
  await prisma.lifePhase.update({
    where: { id: String(formData.get("id")) },
    data: { status: String(formData.get("status")) },
  });
  revalidatePath("/phases");
}

export async function deleteLifePhase(formData: FormData) {
  await prisma.lifePhase.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/phases");
}

export async function goalToHabit(formData: FormData) {
  const goalId = String(formData.get("id"));
  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal) return;
  const cat = ({ FINANCE: "FINANCE", HEALTH: "HEALTH", GROWTH: "GROWTH" } as Record<string, string>)[goal.area] || "MINDSET";
  await prisma.habit.create({
    data: { personId: goal.personId, title: `Schritt zu: ${goal.text}`, category: cat, cadence: "DAILY" },
  });
  await prisma.goal.update({ where: { id: goalId }, data: { status: "IN_PROGRESS" } });
  revalidatePath("/freedom");
  revalidatePath("/");
}

// ---- Data import / restore -------------------------------------------------
export async function importData(formData: FormData) {
  const file = formData.get("file");
  if (!file || typeof file === "string") return;
  let text = await (file as File).text();
  const password = String(formData.get("password") || "");
  let dump: any;
  try {
    dump = JSON.parse(text);
    if (dump && dump._enc === "aes-256-gcm") {
      if (!password) return;
      const { decryptJson } = await import("./crypto");
      dump = JSON.parse(decryptJson(text, password));
    }
  } catch {
    return;
  }
  if (!dump || dump._meta?.app !== "life-optimization-planner") return;

  await prisma.$transaction([
    prisma.habitLog.deleteMany(),
    prisma.habit.deleteMany(),
    prisma.assessmentResult.deleteMany(),
    prisma.goal.deleteMany(),
    prisma.lifePhase.deleteMany(),
    prisma.journalEntry.deleteMany(),
    prisma.wheelCheckin.deleteMany(),
    prisma.decision.deleteMany(),
    prisma.skill.deleteMany(),
    prisma.ikigai.deleteMany(),
    prisma.businessIdea.deleteMany(),
    prisma.constellationMember.deleteMany(),
    prisma.constellation.deleteMany(),
    prisma.financeProfile.deleteMany(),
    prisma.appSettings.deleteMany(),
    prisma.person.deleteMany(),
  ]);

  const d = (k: string) => (Array.isArray(dump[k]) ? dump[k] : []);
  if (d("people").length) await prisma.person.createMany({ data: d("people") });
  if (d("finance").length) await prisma.financeProfile.createMany({ data: d("finance") });
  if (d("assessments").length) await prisma.assessmentResult.createMany({ data: d("assessments") });
  if (d("goals").length) await prisma.goal.createMany({ data: d("goals") });
  if (d("lifePhases").length) await prisma.lifePhase.createMany({ data: d("lifePhases") });
  if (d("journal").length) await prisma.journalEntry.createMany({ data: d("journal") });
  if (d("habits").length) await prisma.habit.createMany({ data: d("habits") });
  if (d("habitLogs").length) await prisma.habitLog.createMany({ data: d("habitLogs") });
  if (d("business").length) await prisma.businessIdea.createMany({ data: d("business") });
  if (d("constellations").length) await prisma.constellation.createMany({ data: d("constellations") });
  if (d("members").length) await prisma.constellationMember.createMany({ data: d("members") });
  if (d("wheel").length) await prisma.wheelCheckin.createMany({ data: d("wheel") });
  if (d("decisions").length) await prisma.decision.createMany({ data: d("decisions") });
  if (d("skills").length) await prisma.skill.createMany({ data: d("skills") });
  if (d("ikigai").length) await prisma.ikigai.createMany({ data: d("ikigai") });
  if (d("settings").length) await prisma.appSettings.createMany({ data: d("settings") });

  revalidatePath("/");
  revalidatePath("/data");
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

// Aggregates everything we can compute for a Person from their stored data.
import type { Person, AssessmentResult, FinanceProfile } from "@prisma/client";
import { computeNatalChart, NatalChart } from "./astrology";
import { computeHumanDesign, HumanDesignChart } from "./humandesign";
import { computeNumerology, NumerologyResult } from "./numerology";
import { computeFire, FireResult } from "./fire";
import { scoreBigFive, BigFiveScores, RiasecScores } from "./assessments";

export interface FullProfile {
  person: Person;
  astro?: NatalChart;
  hd?: HumanDesignChart;
  numerology?: NumerologyResult;
  bigFive?: BigFiveScores;
  riasec?: RiasecScores;
  fire?: FireResult;
}

export function buildProfile(
  person: Person,
  assessments: AssessmentResult[] = [],
  finance?: FinanceProfile | null
): FullProfile {
  const out: FullProfile = { person };

  if (person.birthDate) {
    try {
      out.astro = computeNatalChart(
        person.birthDate,
        person.birthTime,
        person.timezone,
        person.birthLat,
        person.birthLng
      );
    } catch {}
    try {
      out.hd = computeHumanDesign(person.birthDate, person.birthTime, person.timezone);
    } catch {}
    try {
      out.numerology = computeNumerology(person.birthDate, person.name);
    } catch {}
  }

  const bigFive = assessments.find((a) => a.type === "BIG_FIVE");
  if (bigFive) {
    try {
      const answers = JSON.parse(bigFive.answers || "{}");
      out.bigFive = Object.keys(answers).length ? scoreBigFive(answers) : JSON.parse(bigFive.scores);
    } catch {
      try {
        out.bigFive = JSON.parse(bigFive.scores);
      } catch {}
    }
  }

  const riasec = assessments.find((a) => a.type === "RIASEC");
  if (riasec) {
    try {
      out.riasec = JSON.parse(riasec.scores);
    } catch {}
  }

  if (finance) {
    out.fire = computeFire({
      monthlyIncomeActive: finance.monthlyIncomeActive,
      monthlyIncomePassive: finance.monthlyIncomePassive,
      monthlyExpenses: finance.monthlyExpenses,
      netWorth: finance.netWorth,
      withdrawalRate: finance.withdrawalRate,
      expectedReturn: finance.expectedReturn,
      targetMonthlySpend: finance.targetMonthlySpend,
      currency: finance.currency,
    });
  }

  return out;
}

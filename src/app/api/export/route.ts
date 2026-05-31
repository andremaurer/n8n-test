import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { encryptJson } from "@/lib/crypto";

// Full local backup as a downloadable JSON file. Your data, your control.
// Optional ?password=… returns an AES-256-GCM encrypted backup.
export async function GET(req: Request) {
  const password = new URL(req.url).searchParams.get("password");
  const [people, assessments, goals, lifePhases, journal, habits, habitLogs, finance, business, constellations, members, wheel, decisions, skills, ikigai, settings] =
    await Promise.all([
      prisma.person.findMany(),
      prisma.assessmentResult.findMany(),
      prisma.goal.findMany(),
      prisma.lifePhase.findMany(),
      prisma.journalEntry.findMany(),
      prisma.habit.findMany(),
      prisma.habitLog.findMany(),
      prisma.financeProfile.findMany(),
      prisma.businessIdea.findMany(),
      prisma.constellation.findMany(),
      prisma.constellationMember.findMany(),
      prisma.wheelCheckin.findMany(),
      prisma.decision.findMany(),
      prisma.skill.findMany(),
      prisma.ikigai.findMany(),
      prisma.appSettings.findMany(),
    ]);
  const dump = {
    _meta: { app: "life-optimization-planner", version: 1, exportedAt: new Date().toISOString() },
    people, assessments, goals, lifePhases, journal, habits, habitLogs,
    finance, business, constellations, members, wheel, decisions, skills, ikigai, settings,
  };
  const date = new Date().toISOString().slice(0, 10);
  const plain = JSON.stringify(dump, null, 2);
  if (password && password.length >= 4) {
    return new NextResponse(encryptJson(plain, password), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="lebensoptimierer-backup-${date}.enc.json"`,
      },
    });
  }
  return new NextResponse(plain, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="lebensoptimierer-backup-${date}.json"`,
    },
  });
}

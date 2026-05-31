import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSelf, getSelfSynthesisInput } from "@/lib/queries";
import { synthesize } from "@/lib/ai";

// Weekly report endpoint — designed to be polled by n8n (Schedule → HTTP Request).
export async function GET() {
  const self = await getSelf();
  if (!self) return NextResponse.json({ error: "no profile" }, { status: 404 });

  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const [habits, journalCount, wheel] = await Promise.all([
    prisma.habit.findMany({ where: { personId: self.id, active: true }, include: { logs: { where: { date: { gte: weekAgo } } } } }),
    prisma.journalEntry.count({ where: { personId: self.id, date: { gte: weekAgo } } }),
    prisma.wheelCheckin.findFirst({ where: { personId: self.id }, orderBy: { createdAt: "desc" } }),
  ]);

  const habitStats = habits.map((h) => ({ title: h.title, doneThisWeek: h.logs.filter((l) => l.done).length }));
  const input = await getSelfSynthesisInput();
  const synth = input ? await synthesize(input as any) : null;

  const lines: string[] = [];
  lines.push(`Wochenreport für ${self.name} (${new Date().toLocaleDateString("de-CH")})`);
  lines.push("");
  if (synth) {
    lines.push("Zusammenfassung:");
    lines.push(synth.summary);
    lines.push("");
    if (synth.nextSteps.length) {
      lines.push("Nächste Schritte:");
      synth.nextSteps.slice(0, 3).forEach((s) => lines.push(`• ${s}`));
      lines.push("");
    }
  }
  lines.push("Gewohnheiten diese Woche:");
  habitStats.forEach((h) => lines.push(`• ${h.title}: ${h.doneThisWeek}/7`));
  lines.push(`Journal-Einträge: ${journalCount}`);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    person: self.name,
    summary: synth?.summary ?? null,
    nextSteps: synth?.nextSteps?.slice(0, 3) ?? [],
    contradictions: synth?.contradictions ?? [],
    sources: synth?.sources ?? [],
    habits: habitStats,
    journalEntriesThisWeek: journalCount,
    wheelOfLife: wheel,
    text: lines.join("\n"),
  });
}

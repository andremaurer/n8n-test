import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { guessCategory } from "@/lib/timeanalysis";

// Ingest endpoint for the 15-min Mac activity tracker.
// POST JSON: { activity, start?, minutes?, category?, externalId? }
//   or batch: { entries: [ { ... }, ... ] }
// Optional protection: set INGEST_TOKEN and send header `x-ingest-token`.
// Bind only to localhost in the packaged app — this is for your local tracker.
export async function POST(req: Request) {
  const token = process.env.INGEST_TOKEN;
  if (token && req.headers.get("x-ingest-token") !== token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const self = await prisma.person.findFirst({ where: { role: "SELF" } });
  if (!self) return NextResponse.json({ error: "no profile" }, { status: 404 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const raw = Array.isArray(body?.entries) ? body.entries : [body];
  let created = 0;
  for (const e of raw) {
    const activity = String(e.activity ?? e.title ?? "").trim();
    if (!activity) continue;
    const start = e.start ? new Date(e.start).toISOString() : new Date().toISOString();
    const minutes = Number.isFinite(e.minutes) ? Math.round(e.minutes) : 15;
    const category = e.category || guessCategory(activity);
    const externalId = e.externalId ?? `${start}-${activity}`;
    try {
      await prisma.timeEntry.upsert({
        where: { personId_source_externalId: { personId: self.id, source: "TRACKER", externalId } },
        update: { activity, minutes, category, start },
        create: { personId: self.id, start, minutes, activity, category, source: "TRACKER", externalId },
      });
      created++;
    } catch {
      // ignore individual failures, keep ingesting the batch
    }
  }

  return NextResponse.json({ ok: true, ingested: created });
}

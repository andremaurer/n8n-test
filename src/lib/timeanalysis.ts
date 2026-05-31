// Time analysis: aggregate tracked/calendar time by category and goal-alignment,
// and a minimal ICS (calendar) parser for import. All local.

export const TIME_CATEGORIES: Record<string, { label: string; productive: boolean }> = {
  BUSINESS: { label: "Business (umsatzwirksam)", productive: true },
  LEARNING: { label: "Lernen/Weiterbildung", productive: true },
  ADMIN: { label: "Admin/Orga", productive: false },
  FAMILY: { label: "Familie", productive: true },
  HEALTH: { label: "Gesundheit", productive: true },
  REST: { label: "Erholung", productive: true },
  OTHER: { label: "Sonstiges", productive: false },
};

export interface TimeEntryLike {
  minutes: number;
  category?: string | null;
  goalId?: string | null;
  activity: string;
  start: string;
}

export interface TimeSummary {
  totalMin: number;
  byCategory: { category: string; label: string; minutes: number; pct: number; productive: boolean }[];
  productiveMin: number;
  productivePct: number;
  goalAlignedMin: number;
  goalAlignedPct: number;
  topActivities: { activity: string; minutes: number }[];
}

export function summarizeTime(entries: TimeEntryLike[]): TimeSummary {
  const total = entries.reduce((s, e) => s + e.minutes, 0);
  const catMap = new Map<string, number>();
  const actMap = new Map<string, number>();
  let goalAligned = 0;
  for (const e of entries) {
    const cat = e.category || "OTHER";
    catMap.set(cat, (catMap.get(cat) ?? 0) + e.minutes);
    actMap.set(e.activity, (actMap.get(e.activity) ?? 0) + e.minutes);
    if (e.goalId) goalAligned += e.minutes;
  }
  const byCategory = Array.from(catMap.entries())
    .map(([category, minutes]) => ({
      category,
      label: TIME_CATEGORIES[category]?.label ?? category,
      minutes,
      pct: total ? Math.round((minutes / total) * 100) : 0,
      productive: TIME_CATEGORIES[category]?.productive ?? false,
    }))
    .sort((a, b) => b.minutes - a.minutes);
  const productiveMin = byCategory.filter((c) => c.productive).reduce((s, c) => s + c.minutes, 0);
  const topActivities = Array.from(actMap.entries())
    .map(([activity, minutes]) => ({ activity, minutes }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 8);
  return {
    totalMin: total,
    byCategory,
    productiveMin,
    productivePct: total ? Math.round((productiveMin / total) * 100) : 0,
    goalAlignedMin: goalAligned,
    goalAlignedPct: total ? Math.round((goalAligned / total) * 100) : 0,
    topActivities,
  };
}

export function fmtHours(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// --- Minimal ICS parser -----------------------------------------------------
export interface IcsEvent {
  uid: string;
  start: string; // ISO
  end?: string;
  minutes: number;
  title: string;
}

function parseIcsDate(v: string): Date | null {
  // Forms: 20260131T140000Z, 20260131T140000, 20260131
  const m = v.match(/(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?/);
  if (!m) return null;
  const [, y, mo, d, hh = "0", mm = "0", ss = "0", z] = m;
  if (z) return new Date(Date.UTC(+y, +mo - 1, +d, +hh, +mm, +ss));
  return new Date(+y, +mo - 1, +d, +hh, +mm, +ss);
}

export function parseIcs(text: string): IcsEvent[] {
  // Unfold folded lines (RFC 5545: continuation lines start with space/tab).
  const unfolded = text.replace(/\r?\n[ \t]/g, "");
  const lines = unfolded.split(/\r?\n/);
  const events: IcsEvent[] = [];
  let cur: Partial<IcsEvent> & { _start?: Date; _end?: Date } = {};
  let inEvent = false;
  for (const line of lines) {
    if (line.startsWith("BEGIN:VEVENT")) {
      inEvent = true;
      cur = {};
      continue;
    }
    if (line.startsWith("END:VEVENT")) {
      if (cur._start) {
        const startD = cur._start;
        const endD = cur._end;
        const minutes = endD ? Math.max(0, Math.round((endD.getTime() - startD.getTime()) / 60000)) : 0;
        events.push({
          uid: cur.uid || `${startD.toISOString()}-${cur.title || ""}`,
          start: startD.toISOString(),
          end: endD ? endD.toISOString() : undefined,
          minutes,
          title: cur.title || "(ohne Titel)",
        });
      }
      inEvent = false;
      continue;
    }
    if (!inEvent) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const keyPart = line.slice(0, idx);
    const val = line.slice(idx + 1);
    const key = keyPart.split(";")[0].toUpperCase();
    if (key === "UID") cur.uid = val.trim();
    else if (key === "SUMMARY") cur.title = val.trim();
    else if (key === "DTSTART") cur._start = parseIcsDate(val) ?? undefined;
    else if (key === "DTEND") cur._end = parseIcsDate(val) ?? undefined;
  }
  return events;
}

// Heuristic auto-categorization for imported events / tracker samples.
export function guessCategory(text: string): string {
  const t = text.toLowerCase();
  if (/kunde|client|shoot|video|foto|auftrag|projekt|sales|akquise|angebot|rechnung|pitch|bni/.test(t)) return "BUSINESS";
  if (/lern|kurs|weiterbildung|tutorial|study|ai |ki |course|read|buch/.test(t)) return "LEARNING";
  if (/mail|admin|orga|buchhalt|steuer|ablage|meeting intern/.test(t)) return "ADMIN";
  if (/familie|kind|frau|partner|essen|family/.test(t)) return "FAMILY";
  if (/sport|gym|lauf|training|health|arzt|schlaf|sleep/.test(t)) return "HEALTH";
  if (/pause|rest|erholung|netflix|frei|urlaub/.test(t)) return "REST";
  return "OTHER";
}

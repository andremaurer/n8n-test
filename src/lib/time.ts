// Convert a local wall-clock birth date/time in a given IANA timezone into a
// precise UTC instant — without any external dependency. Uses the Intl API to
// find the timezone's UTC offset at that moment (handles historical DST, e.g.
// CEST in June 1989 = UTC+2).

function offsetMinutes(utcDate: Date, timeZone: string): number {
  // Format the given UTC instant as wall time in `timeZone`, then diff.
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(utcDate);
  const map: Record<string, number> = {};
  for (const p of parts) if (p.type !== "literal") map[p.type] = parseInt(p.value, 10);
  // Handle "24" hour edge from some environments.
  const asUTC = Date.UTC(
    map.year,
    map.month - 1,
    map.day,
    map.hour % 24,
    map.minute,
    map.second
  );
  return (asUTC - utcDate.getTime()) / 60000;
}

/**
 * Build a UTC Date from a local date ("YYYY-MM-DD"), time ("HH:MM") and IANA tz.
 * If timeZone is omitted, the input is treated as already UTC.
 */
export function localToUtc(
  dateStr: string,
  timeStr: string | null | undefined,
  timeZone?: string | null
): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  let hh = 12;
  let mm = 0; // default noon if unknown (reduces ascendant error band)
  if (timeStr && /^\d{1,2}:\d{2}/.test(timeStr)) {
    const [h, mi] = timeStr.split(":").map(Number);
    hh = h;
    mm = mi;
  }
  // First guess: treat wall time as if it were UTC.
  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm, 0));
  if (!timeZone) return guess;
  // Correct by the timezone offset at the guessed instant (two passes for DST edges).
  let off = offsetMinutes(guess, timeZone);
  let corrected = new Date(guess.getTime() - off * 60000);
  const off2 = offsetMinutes(corrected, timeZone);
  if (off2 !== off) corrected = new Date(guess.getTime() - off2 * 60000);
  return corrected;
}

export function hasBirthTime(timeStr: string | null | undefined): boolean {
  return !!(timeStr && /^\d{1,2}:\d{2}/.test(timeStr));
}

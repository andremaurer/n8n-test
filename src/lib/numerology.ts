// Numerology (🔵 interpretive). Pythagorean system. Trivial to compute locally.

function reduce(n: number, keepMaster = true): number {
  while (n > 9 && !(keepMaster && (n === 11 || n === 22 || n === 33))) {
    n = String(n)
      .split("")
      .reduce((s, d) => s + Number(d), 0);
  }
  return n;
}

const LETTER_VALUES: Record<string, number> = {};
"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach((ch, i) => {
  LETTER_VALUES[ch] = (i % 9) + 1;
});
const VOWELS = new Set(["A", "E", "I", "O", "U"]);

function normalizeName(name: string): string {
  return name
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^A-Z]/g, "");
}

function nameNumber(name: string, filter: (ch: string) => boolean): number {
  const sum = normalizeName(name)
    .split("")
    .filter(filter)
    .reduce((s, ch) => s + (LETTER_VALUES[ch] || 0), 0);
  return reduce(sum);
}

export interface NumerologyResult {
  lifePath: number;
  birthday: number;
  expression?: number; // Destiny (all letters)
  soulUrge?: number; // vowels
  personality?: number; // consonants
  personalYear: number; // current-year cycle
}

export function computeNumerology(
  birthDate: string,
  name?: string | null,
  forYear = new Date().getFullYear()
): NumerologyResult {
  const [y, m, d] = birthDate.split("-").map(Number);
  const lifePath = reduce(reduce(y, false) + reduce(m, false) + reduce(d, false));
  const birthday = reduce(d);
  // Personal year = day + month + current year, reduced.
  const personalYear = reduce(reduce(d, false) + reduce(m, false) + reduce(forYear, false));

  const res: NumerologyResult = { lifePath, birthday, personalYear };
  if (name && normalizeName(name).length > 0) {
    res.expression = nameNumber(name, () => true);
    res.soulUrge = nameNumber(name, (ch) => VOWELS.has(ch));
    res.personality = nameNumber(name, (ch) => !VOWELS.has(ch));
  }
  return res;
}

export const LIFE_PATH_MEANINGS: Record<number, string> = {
  1: "Führung, Eigenständigkeit, Pioniergeist.",
  2: "Kooperation, Diplomatie, Sensibilität.",
  3: "Ausdruck, Kreativität, Kommunikation.",
  4: "Struktur, Disziplin, Aufbau.",
  5: "Freiheit, Wandel, Vielseitigkeit.",
  6: "Verantwortung, Fürsorge, Harmonie.",
  7: "Analyse, Tiefe, Spiritualität.",
  8: "Macht, Wohlstand, Manifestation im Materiellen.",
  9: "Vollendung, Humanität, Loslassen.",
  11: "Meisterzahl: Intuition, Inspiration, Vision.",
  22: "Meisterzahl: Der Baumeister — grosse Ideen real machen.",
  33: "Meisterzahl: Der Lehrer — Dienst aus Liebe.",
};

// Constellation analysis (family / team). Combines evidence-based (Big Five
// complementarity) with interpretive layers (astro elements, HD type dynamics),
// each clearly labelled.

import { SIGNS } from "./astrology";
import type { EvidenceLevel } from "./evidence";

const ELEMENT_OF_SIGN: Record<string, "Feuer" | "Erde" | "Luft" | "Wasser"> = {
  Widder: "Feuer", Löwe: "Feuer", Schütze: "Feuer",
  Stier: "Erde", Jungfrau: "Erde", Steinbock: "Erde",
  Zwillinge: "Luft", Waage: "Luft", Wassermann: "Luft",
  Krebs: "Wasser", Skorpion: "Wasser", Fische: "Wasser",
};

export interface PersonSummary {
  id: string;
  name: string;
  sunSign?: string;
  bigFive?: Record<string, number>; // O,C,E,A,N on 1-5
  hdType?: string;
}

export interface Insight {
  level: EvidenceLevel;
  title: string;
  text: string;
}

function elementHarmony(a: string, b: string): string {
  const ea = ELEMENT_OF_SIGN[a];
  const eb = ELEMENT_OF_SIGN[b];
  if (!ea || !eb) return "";
  if (ea === eb) return `Gleiches Element (${ea}) → intuitives Verständnis, aber Gefahr von blinden Flecken.`;
  const friendly: Record<string, string> = { Feuer: "Luft", Luft: "Feuer", Erde: "Wasser", Wasser: "Erde" };
  if (friendly[ea] === eb) return `${ea} & ${eb} → natürlich anregend, gute Dynamik.`;
  return `${ea} & ${eb} → unterschiedliche Rhythmen; bewusste Übersetzung nötig.`;
}

function bigFivePair(a: Record<string, number>, b: Record<string, number>, na: string, nb: string): Insight[] {
  const out: Insight[] = [];
  const diff = (k: string) => Math.abs((a[k] ?? 3) - (b[k] ?? 3));
  // Conscientiousness alignment matters for execution.
  if (diff("C") >= 1.5)
    out.push({
      level: "EVIDENCE",
      title: "Unterschiedliche Gewissenhaftigkeit",
      text: `${na} und ${nb} arbeiten unterschiedlich strukturiert. Klärt explizit Deadlines, Standards und Verbindlichkeit — sonst entsteht hier Reibung.`,
    });
  // Two very disagreeable people → conflict; complementary A can help.
  if ((a["A"] ?? 3) < 2.5 && (b["A"] ?? 3) < 2.5)
    out.push({
      level: "EVIDENCE",
      title: "Beide niedrig in Verträglichkeit",
      text: "Direkt und durchsetzungsstark — produktiv für Entscheidungen, aber Konflikte eskalieren leicht. Vereinbart Streitregeln.",
    });
  // Complementary extraversion can balance a team (outward vs. depth).
  if (diff("E") >= 1.5)
    out.push({
      level: "HEURISTIC",
      title: "Energie-Balance",
      text: `Unterschiedliche Extraversion: ${na} und ${nb} ergänzen sich (Aussenwirkung vs. Tiefe), brauchen aber Respekt für das jeweils andere Tempo.`,
    });
  // High combined neuroticism → stress amplification.
  if (((a["N"] ?? 3) + (b["N"] ?? 3)) / 2 >= 3.7)
    out.push({
      level: "EVIDENCE",
      title: "Stress-Verstärkung möglich",
      text: "Beide reagieren sensibel auf Stress. Baut bewusst Stabilisatoren ein (klare Rollen, Pausen, externe Ruhepole).",
    });
  return out;
}

const HD_DYNAMICS: Record<string, string> = {
  "Generator|Manifestor": "Manifestor initiiert, Generator setzt nachhaltig um — starkes Duo, wenn der Manifestor informiert.",
  "Generator|Projektor": "Projektor sieht das System, Generator liefert die Energie — sehr produktiv, wenn der Projektor eingeladen/gehört wird.",
  "Manifestor|Projektor": "Vision + Führung treffen aufeinander; Klärung von Anerkennung und Autonomie ist zentral.",
  "Projektor|Projektor": "Viel Einsicht, wenig Eigen-Energie — Gefahr von Erschöpfung; braucht externe Umsetzungskraft.",
  "Generator|Generator": "Viel gemeinsame Lebenskraft — achtet darauf, beide auf das Richtige reagieren zu lassen.",
};

export function analyzePair(a: PersonSummary, b: PersonSummary): Insight[] {
  const insights: Insight[] = [];

  if (a.bigFive && b.bigFive) insights.push(...bigFivePair(a.bigFive, b.bigFive, a.name, b.name));

  if (a.sunSign && b.sunSign) {
    const h = elementHarmony(a.sunSign, b.sunSign);
    if (h) insights.push({ level: "INTERPRETIVE", title: "Astrologische Elemente", text: h });
  }

  if (a.hdType && b.hdType) {
    const norm = (t: string) =>
      t.includes("Manifestierender") ? "Generator" : t.includes("Generator") ? "Generator" : t.includes("Manifestor") ? "Manifestor" : t.includes("Projektor") ? "Projektor" : "Reflektor";
    const key = [norm(a.hdType), norm(b.hdType)].sort().join("|");
    if (HD_DYNAMICS[key]) insights.push({ level: "INTERPRETIVE", title: "Human-Design-Dynamik", text: HD_DYNAMICS[key] });
  }

  if (insights.length === 0)
    insights.push({
      level: "HEURISTIC",
      title: "Mehr Daten nötig",
      text: "Erfasse für beide Personen Geburtsdaten und/oder einen Persönlichkeitstest, um eine fundierte Dynamik-Analyse zu erhalten.",
    });

  return insights;
}

export { SIGNS };

// Business-field scoring (🟢/🟡). Combines personal fit with market attractiveness
// to rank candidate fields against the goal "Wohlstand = Freiheit".

export interface BusinessScoreInput {
  fitStrengths: number; // 1-5 matches my strengths
  fitValues: number; // 1-5 matches my personality/values
  marketSize: number; // 1-5
  scalability: number; // 1-5
  timeToCash: number; // 1-5 (5 = fast)
  capitalNeed: number; // 1-5 (5 = low capital needed)
  passiveness: number; // 1-5 (5 = can become passive income)
}

// Weights reflect the freedom goal: fit + scalability + passiveness matter most.
const WEIGHTS: Record<keyof BusinessScoreInput, number> = {
  fitStrengths: 1.5,
  fitValues: 1.2,
  marketSize: 1.0,
  scalability: 1.4,
  timeToCash: 1.0,
  capitalNeed: 0.8,
  passiveness: 1.3,
};

export function scoreBusinessIdea(i: BusinessScoreInput): { score: number; max: number; percent: number } {
  let score = 0;
  let max = 0;
  (Object.keys(WEIGHTS) as (keyof BusinessScoreInput)[]).forEach((k) => {
    const v = Math.min(5, Math.max(1, i[k]));
    score += v * WEIGHTS[k];
    max += 5 * WEIGHTS[k];
  });
  return { score: Math.round(score * 10) / 10, max: Math.round(max * 10) / 10, percent: Math.round((score / max) * 100) };
}

export const SCORE_DIMENSIONS: { key: keyof BusinessScoreInput; label: string; hint: string }[] = [
  { key: "fitStrengths", label: "Passt zu meinen Stärken", hint: "Nutze ich, worin ich von Natur aus gut bin?" },
  { key: "fitValues", label: "Passt zu Werten/Persönlichkeit", hint: "Fühlt es sich langfristig stimmig an?" },
  { key: "marketSize", label: "Marktgrösse / Nachfrage", hint: "Gibt es genug zahlende Nachfrage?" },
  { key: "scalability", label: "Skalierbarkeit", hint: "Wächst Umsatz ohne proportional mehr Zeit?" },
  { key: "timeToCash", label: "Time-to-Cash", hint: "Wie schnell fliesst erstes Geld? (5 = schnell)" },
  { key: "capitalNeed", label: "Geringer Kapitalbedarf", hint: "Wie wenig Startkapital nötig? (5 = wenig)" },
  { key: "passiveness", label: "Passiv-Potenzial", hint: "Kann es zu passivem Einkommen werden? (5 = ja)" },
];

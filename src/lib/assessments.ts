// Psychometric assessments. Flagship: Big Five via IPIP-50 (public domain,
// International Personality Item Pool — Goldberg's Big-Five Factor Markers).
// Items translated to German. 5-point Likert; reverse-keyed items inverted.

export type BigFiveFactor = "O" | "C" | "E" | "A" | "N";

export interface AssessmentItem {
  id: number;
  text: string;
  factor: BigFiveFactor;
  reverse: boolean;
}

export const BIG_FIVE_FACTORS: Record<
  BigFiveFactor,
  { name: string; high: string; low: string }
> = {
  O: { name: "Offenheit", high: "neugierig, ideenreich, fantasievoll", low: "bodenständig, konventionell, praktisch" },
  C: { name: "Gewissenhaftigkeit", high: "organisiert, diszipliniert, verlässlich", low: "spontan, flexibel, locker" },
  E: { name: "Extraversion", high: "gesellig, energiegeladen, durchsetzungsstark", low: "zurückhaltend, ruhig, in sich gekehrt" },
  A: { name: "Verträglichkeit", high: "warmherzig, kooperativ, mitfühlend", low: "direkt, wettbewerbsorientiert, kritisch" },
  N: { name: "Neurotizismus", high: "sensibel, reaktiv, emotional", low: "stabil, gelassen, stressresistent" },
};

export const LIKERT_LABELS = [
  "trifft gar nicht zu",
  "trifft eher nicht zu",
  "teils/teils",
  "trifft eher zu",
  "trifft voll zu",
];

export const IPIP50: AssessmentItem[] = [
  { id: 1, text: "Ich bin gern im Mittelpunkt von Geselligkeit.", factor: "E", reverse: false },
  { id: 2, text: "Ich mache mir wenig Gedanken um andere.", factor: "A", reverse: true },
  { id: 3, text: "Ich bin immer gut vorbereitet.", factor: "C", reverse: false },
  { id: 4, text: "Ich gerate schnell unter Stress.", factor: "N", reverse: false },
  { id: 5, text: "Ich habe einen reichen Wortschatz.", factor: "O", reverse: false },
  { id: 6, text: "Ich rede nicht viel.", factor: "E", reverse: true },
  { id: 7, text: "Ich interessiere mich für Menschen.", factor: "A", reverse: false },
  { id: 8, text: "Ich lasse meine Sachen herumliegen.", factor: "C", reverse: true },
  { id: 9, text: "Ich bin die meiste Zeit entspannt.", factor: "N", reverse: true },
  { id: 10, text: "Ich habe Mühe, abstrakte Ideen zu verstehen.", factor: "O", reverse: true },
  { id: 11, text: "Ich fühle mich in Gesellschaft wohl.", factor: "E", reverse: false },
  { id: 12, text: "Ich beleidige Menschen.", factor: "A", reverse: true },
  { id: 13, text: "Ich achte auf Details.", factor: "C", reverse: false },
  { id: 14, text: "Ich mache mir Sorgen über Dinge.", factor: "N", reverse: false },
  { id: 15, text: "Ich habe eine lebhafte Vorstellungskraft.", factor: "O", reverse: false },
  { id: 16, text: "Ich halte mich im Hintergrund.", factor: "E", reverse: true },
  { id: 17, text: "Ich fühle mit den Gefühlen anderer mit.", factor: "A", reverse: false },
  { id: 18, text: "Ich bringe Dinge durcheinander.", factor: "C", reverse: true },
  { id: 19, text: "Ich fühle mich selten niedergeschlagen.", factor: "N", reverse: true },
  { id: 20, text: "Ich interessiere mich nicht für abstrakte Ideen.", factor: "O", reverse: true },
  { id: 21, text: "Ich beginne Gespräche.", factor: "E", reverse: false },
  { id: 22, text: "Die Probleme anderer interessieren mich nicht.", factor: "A", reverse: true },
  { id: 23, text: "Ich erledige Aufgaben sofort.", factor: "C", reverse: false },
  { id: 24, text: "Ich bin leicht aus der Ruhe zu bringen.", factor: "N", reverse: false },
  { id: 25, text: "Ich habe ausgezeichnete Ideen.", factor: "O", reverse: false },
  { id: 26, text: "Ich habe wenig zu sagen.", factor: "E", reverse: true },
  { id: 27, text: "Ich habe ein weiches Herz.", factor: "A", reverse: false },
  { id: 28, text: "Ich vergesse oft, Dinge zurückzulegen.", factor: "C", reverse: true },
  { id: 29, text: "Ich rege mich leicht auf.", factor: "N", reverse: false },
  { id: 30, text: "Ich habe keine gute Vorstellungskraft.", factor: "O", reverse: true },
  { id: 31, text: "Ich rede an Festen mit vielen verschiedenen Menschen.", factor: "E", reverse: false },
  { id: 32, text: "Andere Menschen interessieren mich wenig.", factor: "A", reverse: true },
  { id: 33, text: "Ich mag Ordnung.", factor: "C", reverse: false },
  { id: 34, text: "Meine Stimmung wechselt häufig.", factor: "N", reverse: false },
  { id: 35, text: "Ich verstehe Dinge schnell.", factor: "O", reverse: false },
  { id: 36, text: "Ich ziehe ungern Aufmerksamkeit auf mich.", factor: "E", reverse: true },
  { id: 37, text: "Ich nehme mir Zeit für andere.", factor: "A", reverse: false },
  { id: 38, text: "Ich drücke mich vor meinen Pflichten.", factor: "C", reverse: true },
  { id: 39, text: "Ich habe häufige Stimmungsschwankungen.", factor: "N", reverse: false },
  { id: 40, text: "Ich benutze anspruchsvolle Wörter.", factor: "O", reverse: false },
  { id: 41, text: "Es macht mir nichts aus, im Mittelpunkt zu stehen.", factor: "E", reverse: false },
  { id: 42, text: "Ich spüre die Emotionen anderer.", factor: "A", reverse: false },
  { id: 43, text: "Ich folge einem Zeitplan.", factor: "C", reverse: false },
  { id: 44, text: "Ich bin schnell gereizt.", factor: "N", reverse: false },
  { id: 45, text: "Ich verbringe Zeit damit, über Dinge nachzudenken.", factor: "O", reverse: false },
  { id: 46, text: "Ich bin still unter Fremden.", factor: "E", reverse: true },
  { id: 47, text: "Ich gebe Menschen ein gutes Gefühl.", factor: "A", reverse: false },
  { id: 48, text: "Ich bin genau bei meiner Arbeit.", factor: "C", reverse: false },
  { id: 49, text: "Ich fühle mich oft niedergeschlagen.", factor: "N", reverse: false },
  { id: 50, text: "Ich stecke voller Ideen.", factor: "O", reverse: false },
];

export interface BigFiveScores {
  O: number;
  C: number;
  E: number;
  A: number;
  N: number; // each 1-5 (mean of 10 items)
}

export function scoreBigFive(answers: Record<number, number>): BigFiveScores {
  const acc: Record<BigFiveFactor, number[]> = { O: [], C: [], E: [], A: [], N: [] };
  for (const item of IPIP50) {
    const raw = answers[item.id];
    if (!raw) continue;
    const val = item.reverse ? 6 - raw : raw;
    acc[item.factor].push(val);
  }
  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 3);
  return {
    O: Math.round(mean(acc.O) * 100) / 100,
    C: Math.round(mean(acc.C) * 100) / 100,
    E: Math.round(mean(acc.E) * 100) / 100,
    A: Math.round(mean(acc.A) * 100) / 100,
    N: Math.round(mean(acc.N) * 100) / 100,
  };
}

export function describeBigFive(scores: BigFiveScores): { factor: BigFiveFactor; name: string; score: number; percent: number; text: string }[] {
  return (Object.keys(BIG_FIVE_FACTORS) as BigFiveFactor[]).map((f) => {
    const s = scores[f];
    const pct = Math.round(((s - 1) / 4) * 100);
    const meta = BIG_FIVE_FACTORS[f];
    const text = s >= 3.5 ? meta.high : s <= 2.5 ? meta.low : `ausgewogen zwischen „${meta.high}“ und „${meta.low}“`;
    return { factor: f, name: meta.name, score: s, percent: pct, text };
  });
}

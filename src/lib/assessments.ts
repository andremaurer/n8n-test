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

// Extra 50 items (10 per factor) → combined with IPIP50 forms a 100-item set.
// Public-domain IPIP markers; ids offset by 100 to avoid clashing with IPIP50.
export const IPIP_EXTRA: AssessmentItem[] = [
  { id: 101, text: "Ich mag es, mit Theorien zu spielen.", factor: "O", reverse: false },
  { id: 102, text: "Ich vermeide philosophische Diskussionen.", factor: "O", reverse: true },
  { id: 103, text: "Ich liebe es, über Kunst und Schönheit nachzudenken.", factor: "O", reverse: false },
  { id: 104, text: "Ich brauche keine kreativen Hobbys.", factor: "O", reverse: true },
  { id: 105, text: "Ich sehe in allem tiefere Bedeutung.", factor: "O", reverse: false },
  { id: 106, text: "Ich ziehe Bekanntes dem Neuen vor.", factor: "O", reverse: true },
  { id: 107, text: "Ich probiere gern neue Dinge aus.", factor: "O", reverse: false },
  { id: 108, text: "Ich interessiere mich für viele Themen.", factor: "O", reverse: false },
  { id: 109, text: "Ich halte mich an erprobte Methoden.", factor: "O", reverse: true },
  { id: 110, text: "Ich stelle Bestehendes gern infrage.", factor: "O", reverse: false },
  { id: 111, text: "Ich erledige meine Pflichten sofort.", factor: "C", reverse: false },
  { id: 112, text: "Ich verschwende meine Zeit.", factor: "C", reverse: true },
  { id: 113, text: "Ich arbeite nach einem klaren Plan.", factor: "C", reverse: false },
  { id: 114, text: "Es fällt mir schwer, mich zu konzentrieren.", factor: "C", reverse: true },
  { id: 115, text: "Ich halte meine Versprechen.", factor: "C", reverse: false },
  { id: 116, text: "Ich treffe Entscheidungen ohne nachzudenken.", factor: "C", reverse: true },
  { id: 117, text: "Ich strebe nach Exzellenz.", factor: "C", reverse: false },
  { id: 118, text: "Ich lasse mich leicht ablenken.", factor: "C", reverse: true },
  { id: 119, text: "Ich bin zuverlässig.", factor: "C", reverse: false },
  { id: 120, text: "Ich handle oft ohne Plan.", factor: "C", reverse: true },
  { id: 121, text: "Ich fühle mich wohl unter vielen Menschen.", factor: "E", reverse: false },
  { id: 122, text: "Ich meide grosse Menschenmengen.", factor: "E", reverse: true },
  { id: 123, text: "Ich knüpfe leicht neue Kontakte.", factor: "E", reverse: false },
  { id: 124, text: "Ich bevorzuge es, allein zu arbeiten.", factor: "E", reverse: true },
  { id: 125, text: "Ich strahle Energie aus.", factor: "E", reverse: false },
  { id: 126, text: "Ich rede ungern vor Gruppen.", factor: "E", reverse: true },
  { id: 127, text: "Ich übernehme gern die Initiative.", factor: "E", reverse: false },
  { id: 128, text: "Ich bin lieber Zuhörer als Sprecher.", factor: "E", reverse: true },
  { id: 129, text: "Ich suche Aufregung und Abwechslung.", factor: "E", reverse: false },
  { id: 130, text: "Ich bin zurückhaltend und still.", factor: "E", reverse: true },
  { id: 131, text: "Ich vertraue anderen Menschen.", factor: "A", reverse: false },
  { id: 132, text: "Ich bin anderen gegenüber misstrauisch.", factor: "A", reverse: true },
  { id: 133, text: "Ich helfe gern ohne Hintergedanken.", factor: "A", reverse: false },
  { id: 134, text: "Ich nutze andere für meine Zwecke.", factor: "A", reverse: true },
  { id: 135, text: "Ich bin nachsichtig mit Fehlern.", factor: "A", reverse: false },
  { id: 136, text: "Ich kann hart und kühl sein.", factor: "A", reverse: true },
  { id: 137, text: "Ich nehme Rücksicht auf andere.", factor: "A", reverse: false },
  { id: 138, text: "Ich setze meine Interessen über die anderer.", factor: "A", reverse: true },
  { id: 139, text: "Ich bin kooperativ.", factor: "A", reverse: false },
  { id: 140, text: "Ich streite gern.", factor: "A", reverse: true },
  { id: 141, text: "Ich bleibe auch unter Druck ruhig.", factor: "N", reverse: true },
  { id: 142, text: "Ich mache mir oft Sorgen.", factor: "N", reverse: false },
  { id: 143, text: "Ich fühle mich selten ängstlich.", factor: "N", reverse: true },
  { id: 144, text: "Ich werde leicht nervös.", factor: "N", reverse: false },
  { id: 145, text: "Meine Stimmung ist stabil.", factor: "N", reverse: true },
  { id: 146, text: "Ich fühle mich oft angespannt.", factor: "N", reverse: false },
  { id: 147, text: "Ich erhole mich schnell von Rückschlägen.", factor: "N", reverse: true },
  { id: 148, text: "Ich grüble über Probleme.", factor: "N", reverse: false },
  { id: 149, text: "Ich bin emotional ausgeglichen.", factor: "N", reverse: true },
  { id: 150, text: "Kleinigkeiten bringen mich aus der Fassung.", factor: "N", reverse: false },
];

export const IPIP100: AssessmentItem[] = [...IPIP50, ...IPIP_EXTRA];

export function scoreBigFive(answers: Record<number, number>, items: AssessmentItem[] = IPIP50): BigFiveScores {
  const acc: Record<BigFiveFactor, number[]> = { O: [], C: [], E: [], A: [], N: [] };
  for (const item of items) {
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

// ---------------------------------------------------------------------------
// RIASEC (Holland Codes) — interest profile, feeds business-field matching.
// 🟢 Evidence-based (Holland's vocational theory). Items from open O*NET/IPIP pools.

export type RiasecType = "R" | "I" | "A" | "S" | "E" | "C";

export const RIASEC_TYPES: Record<RiasecType, { name: string; desc: string; fields: string }> = {
  R: { name: "Realistisch", desc: "praktisch, handwerklich, technisch", fields: "Handwerk, Technik, Ingenieurwesen, Produktion, Outdoor" },
  I: { name: "Investigativ", desc: "analytisch, forschend, neugierig", fields: "Forschung, Daten/IT, Wissenschaft, Strategie, Analyse" },
  A: { name: "Künstlerisch", desc: "kreativ, ausdrucksstark, originell", fields: "Design, Content, Medien, Marke, Produktgestaltung" },
  S: { name: "Sozial", desc: "helfend, lehrend, beziehungsorientiert", fields: "Coaching, Bildung, Beratung, Gesundheit, Community" },
  E: { name: "Unternehmerisch", desc: "führend, überzeugend, wagemutig", fields: "Vertrieb, Gründung, Führung, Marketing, Deals" },
  C: { name: "Konventionell", desc: "ordnend, genau, prozessorientiert", fields: "Finanzen, Operations, Buchhaltung, Recht, Admin" },
};

interface RiasecItem { id: number; text: string; type: RiasecType }

export const RIASEC_ITEMS: RiasecItem[] = [
  { id: 1, text: "An Maschinen, Geräten oder Werkzeugen arbeiten", type: "R" },
  { id: 2, text: "Etwas mit den Händen bauen oder reparieren", type: "R" },
  { id: 3, text: "Draussen / körperlich aktiv arbeiten", type: "R" },
  { id: 4, text: "Wissenschaftliche Probleme durchdenken", type: "I" },
  { id: 5, text: "Daten analysieren und Muster finden", type: "I" },
  { id: 6, text: "Komplexe Zusammenhänge erforschen", type: "I" },
  { id: 7, text: "Etwas Kreatives gestalten (Design, Text, Musik)", type: "A" },
  { id: 8, text: "Eigene Ideen originell ausdrücken", type: "A" },
  { id: 9, text: "In einem freien, unkonventionellen Umfeld arbeiten", type: "A" },
  { id: 10, text: "Anderen helfen oder etwas beibringen", type: "S" },
  { id: 11, text: "Menschen beraten und begleiten", type: "S" },
  { id: 12, text: "In einem Team eng zusammenarbeiten", type: "S" },
  { id: 13, text: "Ein Projekt oder Geschäft leiten", type: "E" },
  { id: 14, text: "Andere überzeugen und etwas verkaufen", type: "E" },
  { id: 15, text: "Risiken eingehen, um etwas aufzubauen", type: "E" },
  { id: 16, text: "Mit Zahlen, Budgets und Plänen arbeiten", type: "C" },
  { id: 17, text: "Klare Abläufe und Ordnung schaffen", type: "C" },
  { id: 18, text: "Genau und sorgfältig Details verwalten", type: "C" },
];

export type RiasecScores = Record<RiasecType, number>;

export function scoreRiasec(answers: Record<number, number>): RiasecScores {
  const acc: RiasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  const count: RiasecScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  for (const it of RIASEC_ITEMS) {
    const v = answers[it.id];
    if (!v) continue;
    acc[it.type] += v;
    count[it.type] += 1;
  }
  (Object.keys(acc) as RiasecType[]).forEach((t) => {
    acc[t] = count[t] ? Math.round((acc[t] / count[t]) * 100) / 100 : 0;
  });
  return acc;
}

export function hollandCode(scores: RiasecScores): RiasecType[] {
  return (Object.keys(scores) as RiasecType[]).sort((a, b) => scores[b] - scores[a]).slice(0, 3);
}

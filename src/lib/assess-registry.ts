// Generic Likert-based assessment engine + registry. Lets us add many
// questionnaires cheaply, all driven by one dynamic test page.
import type { EvidenceLevel } from "./evidence";

export interface LikertItem {
  id: number;
  text: string;
  dim: string;
  reverse?: boolean;
}

export interface LikertAssessment {
  key: string;
  title: string;
  evidence: EvidenceLevel;
  intro: string;
  scale: string[]; // 5 labels
  dimensions: Record<string, { name: string; desc?: string }>;
  items: LikertItem[];
  /** Optional: how to summarize (e.g. top dimension code). */
  summarize?: (scores: Record<string, number>) => string;
}

const FIVE = ["trifft gar nicht zu", "eher nicht", "teils/teils", "eher zu", "trifft voll zu"];
const LIKE = ["gar nicht", "wenig", "neutral", "gern", "sehr gern"];

export function scoreLikert(a: LikertAssessment, answers: Record<number, number>): Record<string, number> {
  const acc: Record<string, number[]> = {};
  for (const d of Object.keys(a.dimensions)) acc[d] = [];
  for (const it of a.items) {
    const raw = answers[it.id];
    if (!raw) continue;
    acc[it.dim].push(it.reverse ? 6 - raw : raw);
  }
  const out: Record<string, number> = {};
  for (const d of Object.keys(acc)) {
    const xs = acc[d];
    out[d] = xs.length ? Math.round((xs.reduce((s, x) => s + x, 0) / xs.length) * 100) / 100 : 0;
  }
  return out;
}

export function topDims(scores: Record<string, number>, n = 3): string[] {
  return Object.keys(scores).sort((x, y) => scores[y] - scores[x]).slice(0, n);
}

// --- HEXACO (🟢) ------------------------------------------------------------
const HEXACO: LikertAssessment = {
  key: "HEXACO",
  title: "HEXACO-Persönlichkeit",
  evidence: "EVIDENCE",
  intro: "Big Five + Ehrlichkeit-Bescheidenheit (H). Besserer Prädiktor für Integrität und Umgang mit Geld/Macht.",
  scale: FIVE,
  dimensions: {
    H: { name: "Ehrlichkeit-Bescheidenheit", desc: "aufrichtig, bescheiden, fair" },
    E: { name: "Emotionalität", desc: "ängstlich, sentimental, verbunden" },
    X: { name: "Extraversion", desc: "gesellig, lebhaft, selbstsicher" },
    A: { name: "Verträglichkeit", desc: "geduldig, versöhnlich, sanft" },
    C: { name: "Gewissenhaftigkeit", desc: "organisiert, sorgfältig, diszipliniert" },
    O: { name: "Offenheit", desc: "neugierig, kreativ, unkonventionell" },
  },
  items: [
    { id: 1, text: "Ich würde nicht schummeln, selbst wenn ich sicher nicht erwischt würde.", dim: "H" },
    { id: 2, text: "Ich möchte reich und berühmt sein.", dim: "H", reverse: true },
    { id: 3, text: "Mir steht keine Sonderbehandlung zu.", dim: "H" },
    { id: 4, text: "Ich würde jemanden manipulieren, um zu bekommen, was ich will.", dim: "H", reverse: true },
    { id: 5, text: "Ich mache mir schnell Sorgen.", dim: "E" },
    { id: 6, text: "Ich brauche emotionale Unterstützung von anderen.", dim: "E" },
    { id: 7, text: "Ich fühle mich selten ängstlich oder verletzlich.", dim: "E", reverse: true },
    { id: 8, text: "Ich werde sehr emotional bei Abschieden.", dim: "E" },
    { id: 9, text: "Ich rede gern und viel mit Menschen.", dim: "X" },
    { id: 10, text: "In Gruppen übernehme ich oft das Reden.", dim: "X" },
    { id: 11, text: "Ich fühle mich in sozialen Situationen unwohl.", dim: "X", reverse: true },
    { id: 12, text: "Ich sehe mich als beliebt.", dim: "X" },
    { id: 13, text: "Ich vergebe Fehler leicht.", dim: "A" },
    { id: 14, text: "Ich bin selten nachtragend.", dim: "A" },
    { id: 15, text: "Ich werde schnell wütend.", dim: "A", reverse: true },
    { id: 16, text: "Ich bin geduldig mit schwierigen Menschen.", dim: "A" },
    { id: 17, text: "Ich plane voraus und halte mich an Pläne.", dim: "C" },
    { id: 18, text: "Ich arbeite sorgfältig und genau.", dim: "C" },
    { id: 19, text: "Ich lasse Dinge oft schleifen.", dim: "C", reverse: true },
    { id: 20, text: "Ich strebe nach Perfektion bei Aufgaben.", dim: "C" },
    { id: 21, text: "Ich interessiere mich für Kunst und Ideen.", dim: "O" },
    { id: 22, text: "Ich mag neue, ungewöhnliche Erfahrungen.", dim: "O" },
    { id: 23, text: "Ich finde theoretische Diskussionen langweilig.", dim: "O", reverse: true },
    { id: 24, text: "Ich habe eine lebhafte Fantasie.", dim: "O" },
  ],
};

// --- Schwartz-Werte (🟢) ----------------------------------------------------
const VALUES: LikertAssessment = {
  key: "VALUES",
  title: "Werte (Schwartz)",
  evidence: "EVIDENCE",
  intro: "Deine Wertehierarchie — Grundlage für „passt das langfristig zu mir?“. Wie wichtig ist dir das als Leitprinzip?",
  scale: ["unwichtig", "wenig", "mittel", "wichtig", "sehr wichtig"],
  dimensions: {
    SD: { name: "Selbstbestimmung", desc: "Freiheit, Eigenständigkeit" },
    ST: { name: "Stimulation", desc: "Abwechslung, Herausforderung" },
    HE: { name: "Hedonismus", desc: "Genuss, Lebensfreude" },
    AC: { name: "Leistung", desc: "Erfolg, Kompetenz" },
    PO: { name: "Macht", desc: "Einfluss, Status" },
    SE: { name: "Sicherheit", desc: "Stabilität, Ordnung" },
    CO: { name: "Konformität", desc: "Regeln, Rücksicht" },
    TR: { name: "Tradition", desc: "Respekt, Bewährtes" },
    BE: { name: "Wohlwollen", desc: "Fürsorge für Nahe" },
    UN: { name: "Universalismus", desc: "Gerechtigkeit, Natur" },
  },
  items: [
    { id: 1, text: "Eigene Entscheidungen frei treffen zu können.", dim: "SD" },
    { id: 2, text: "Kreativ und originell zu sein.", dim: "SD" },
    { id: 3, text: "Ein aufregendes, abwechslungsreiches Leben.", dim: "ST" },
    { id: 4, text: "Neues wagen und Risiken eingehen.", dim: "ST" },
    { id: 5, text: "Das Leben zu geniessen.", dim: "HE" },
    { id: 6, text: "Mir Freuden zu gönnen.", dim: "HE" },
    { id: 7, text: "Erfolgreich zu sein und etwas zu leisten.", dim: "AC" },
    { id: 8, text: "Kompetent und fähig zu wirken.", dim: "AC" },
    { id: 9, text: "Einfluss auf andere zu haben.", dim: "PO" },
    { id: 10, text: "Wohlstand und Status zu erreichen.", dim: "PO" },
    { id: 11, text: "In einer sicheren, stabilen Umgebung zu leben.", dim: "SE" },
    { id: 12, text: "Ordnung und Verlässlichkeit zu haben.", dim: "SE" },
    { id: 13, text: "Mich an Regeln und Erwartungen zu halten.", dim: "CO" },
    { id: 14, text: "Andere nicht zu stören oder zu verärgern.", dim: "CO" },
    { id: 15, text: "Traditionen und Bewährtes zu achten.", dim: "TR" },
    { id: 16, text: "Bescheiden und zurückhaltend zu sein.", dim: "TR" },
    { id: 17, text: "Für das Wohl meiner Nahestehenden zu sorgen.", dim: "BE" },
    { id: 18, text: "Loyal und hilfsbereit zu sein.", dim: "BE" },
    { id: 19, text: "Mich für Gerechtigkeit und Gleichheit einzusetzen.", dim: "UN" },
    { id: 20, text: "Natur und Umwelt zu schützen.", dim: "UN" },
  ],
  summarize: (s) => "Top-Werte: " + topDims(s, 3).map((d) => d).join(", "),
};

// --- VIA-Charakterstärken (🟢, kompakt nach 6 Tugenden) ---------------------
const VIA: LikertAssessment = {
  key: "VIA",
  title: "Charakterstärken (VIA)",
  evidence: "EVIDENCE",
  intro: "Deine Stärken-Sprache (offene CliftonStrengths-Alternative), gruppiert nach 6 Tugenden.",
  scale: FIVE,
  dimensions: {
    WIS: { name: "Weisheit & Wissen", desc: "Kreativität, Neugier, Urteil, Lernen" },
    COU: { name: "Mut", desc: "Tapferkeit, Ausdauer, Authentizität, Tatkraft" },
    HUM: { name: "Menschlichkeit", desc: "Liebe, Freundlichkeit, soziale Intelligenz" },
    JUS: { name: "Gerechtigkeit", desc: "Teamwork, Fairness, Führung" },
    TEM: { name: "Mässigung", desc: "Vergebung, Bescheidenheit, Vorsicht, Selbstregulation" },
    TRA: { name: "Transzendenz", desc: "Sinn für Schönheit, Dankbarkeit, Hoffnung, Humor" },
  },
  items: [
    { id: 1, text: "Ich finde gern neue Wege, Dinge zu tun.", dim: "WIS" },
    { id: 2, text: "Ich liebe es, Neues zu lernen.", dim: "WIS" },
    { id: 3, text: "Ich denke Dinge gründlich durch, bevor ich urteile.", dim: "WIS" },
    { id: 4, text: "Ich stehe für meine Überzeugungen ein, auch gegen Widerstand.", dim: "COU" },
    { id: 5, text: "Ich gebe nicht auf, bis ich eine Aufgabe beende.", dim: "COU" },
    { id: 6, text: "Ich bin echt und ehrlich zu mir selbst.", dim: "COU" },
    { id: 7, text: "Ich bin warmherzig und fürsorglich.", dim: "HUM" },
    { id: 8, text: "Ich spüre, was andere fühlen und brauchen.", dim: "HUM" },
    { id: 9, text: "Ich helfe gern, auch ohne Gegenleistung.", dim: "HUM" },
    { id: 10, text: "Ich arbeite gut im Team auf ein Ziel hin.", dim: "JUS" },
    { id: 11, text: "Ich behandle alle fair und gleich.", dim: "JUS" },
    { id: 12, text: "Ich übernehme gern Verantwortung in Gruppen.", dim: "JUS" },
    { id: 13, text: "Ich kann anderen verzeihen.", dim: "TEM" },
    { id: 14, text: "Ich überlege sorgfältig, bevor ich handle.", dim: "TEM" },
    { id: 15, text: "Ich kann meine Impulse gut steuern.", dim: "TEM" },
    { id: 16, text: "Ich bin dankbar für die guten Dinge in meinem Leben.", dim: "TRA" },
    { id: 17, text: "Ich blicke optimistisch in die Zukunft.", dim: "TRA" },
    { id: 18, text: "Ich finde Freude an Schönheit und bringe andere zum Lachen.", dim: "TRA" },
  ],
};

// --- Enneagramm (🟡) --------------------------------------------------------
const ENNEAGRAM: LikertAssessment = {
  key: "ENNEAGRAM",
  title: "Enneagramm",
  evidence: "HEURISTIC",
  intro: "Kernmotivation und Antrieb. Wie sehr beschreibt dich jede Aussage?",
  scale: FIVE,
  dimensions: {
    T1: { name: "Typ 1 – Perfektionist", desc: "korrekt, prinzipientreu" },
    T2: { name: "Typ 2 – Helfer", desc: "fürsorglich, beziehungsorientiert" },
    T3: { name: "Typ 3 – Macher", desc: "leistungs-, erfolgsorientiert" },
    T4: { name: "Typ 4 – Individualist", desc: "tief, authentisch, kreativ" },
    T5: { name: "Typ 5 – Beobachter", desc: "analytisch, autonom" },
    T6: { name: "Typ 6 – Loyale", desc: "sicherheitsbedacht, treu" },
    T7: { name: "Typ 7 – Enthusiast", desc: "optimistisch, vielseitig" },
    T8: { name: "Typ 8 – Herausforderer", desc: "stark, durchsetzungsfähig" },
    T9: { name: "Typ 9 – Friedliebende", desc: "harmoniebedürftig, ausgleichend" },
  },
  items: [
    { id: 1, text: "Ich strebe danach, Dinge richtig und korrekt zu machen.", dim: "T1" },
    { id: 2, text: "Fehler und Unordnung stören mich stark.", dim: "T1" },
    { id: 3, text: "Ich kümmere mich oft mehr um andere als um mich.", dim: "T2" },
    { id: 4, text: "Ich möchte gebraucht und gemocht werden.", dim: "T2" },
    { id: 5, text: "Erfolg und Anerkennung treiben mich an.", dim: "T3" },
    { id: 6, text: "Ich passe mein Auftreten an, um zu gewinnen.", dim: "T3" },
    { id: 7, text: "Ich fühle mich oft anders als die anderen.", dim: "T4" },
    { id: 8, text: "Tiefe Gefühle und Authentizität sind mir wichtig.", dim: "T4" },
    { id: 9, text: "Ich ziehe mich zurück, um nachzudenken und zu verstehen.", dim: "T5" },
    { id: 10, text: "Ich brauche viel Zeit und Raum für mich.", dim: "T5" },
    { id: 11, text: "Ich denke oft an mögliche Risiken und sichere mich ab.", dim: "T6" },
    { id: 12, text: "Loyalität und Verlässlichkeit bedeuten mir viel.", dim: "T6" },
    { id: 13, text: "Ich suche ständig neue Erlebnisse und Möglichkeiten.", dim: "T7" },
    { id: 14, text: "Langeweile und Einschränkung meide ich.", dim: "T7" },
    { id: 15, text: "Ich übernehme gern die Kontrolle und setze mich durch.", dim: "T8" },
    { id: 16, text: "Ich schütze mich und andere, zeige Stärke.", dim: "T8" },
    { id: 17, text: "Ich vermeide Konflikte und suche Harmonie.", dim: "T9" },
    { id: 18, text: "Ich kann mich gut in andere einfühlen und ausgleichen.", dim: "T9" },
  ],
  summarize: (s) => "Haupttyp: " + topDims(s, 1)[0],
};

// --- DISG (🟡) --------------------------------------------------------------
const DISC: LikertAssessment = {
  key: "DISC",
  title: "DISG-Verhaltensstil",
  evidence: "HEURISTIC",
  intro: "Verhaltensstil in Team und Verkauf.",
  scale: FIVE,
  dimensions: {
    D: { name: "Dominanz", desc: "direkt, ergebnisorientiert" },
    I: { name: "Initiative", desc: "begeisternd, kommunikativ" },
    S: { name: "Stetigkeit", desc: "geduldig, verlässlich" },
    G: { name: "Gewissenhaftigkeit", desc: "präzise, analytisch" },
  },
  items: [
    { id: 1, text: "Ich treffe schnelle Entscheidungen und gehe Probleme direkt an.", dim: "D" },
    { id: 2, text: "Ich übernehme gern die Führung.", dim: "D" },
    { id: 3, text: "Ich liebe Wettbewerb und klare Resultate.", dim: "D" },
    { id: 4, text: "Ich bin scheu und zurückhaltend.", dim: "I", reverse: true },
    { id: 5, text: "Ich begeistere und motiviere andere leicht.", dim: "I" },
    { id: 6, text: "Ich lerne gern neue Leute kennen.", dim: "I" },
    { id: 7, text: "Ich bin geduldig und ein guter Zuhörer.", dim: "S" },
    { id: 8, text: "Ich schätze Stabilität und ein ruhiges Tempo.", dim: "S" },
    { id: 9, text: "Ich unterstütze mein Team verlässlich.", dim: "S" },
    { id: 10, text: "Ich arbeite gern mit Daten, Regeln und Genauigkeit.", dim: "G" },
    { id: 11, text: "Ich prüfe Details sorgfältig, bevor ich handle.", dim: "G" },
    { id: 12, text: "Qualität ist mir wichtiger als Tempo.", dim: "G" },
  ],
  summarize: (s) => "Stil: " + topDims(s, 2).join(""),
};

// --- Grit (🟢) — Durchhaltevermögen, Prädiktor für Langzeit-Erfolg ----------
const GRIT: LikertAssessment = {
  key: "GRIT",
  title: "Grit (Durchhaltevermögen)",
  evidence: "EVIDENCE",
  intro: "Leidenschaft und Ausdauer für langfristige Ziele (Duckworth). Starker Prädiktor dafür, ob du Vorhaben wie den Vermögensaufbau durchziehst.",
  scale: FIVE,
  dimensions: {
    PE: { name: "Ausdauer (Anstrengung)", desc: "dranbleiben trotz Rückschlägen" },
    PA: { name: "Beständigkeit (Interesse)", desc: "Fokus über Jahre halten" },
  },
  items: [
    { id: 1, text: "Rückschläge entmutigen mich nicht — ich gebe nicht leicht auf.", dim: "PE" },
    { id: 2, text: "Ich bin fleissig und arbeite hart.", dim: "PE" },
    { id: 3, text: "Ich beende, was ich beginne.", dim: "PE" },
    { id: 4, text: "Ich habe Ziele über Jahre verfolgt und erreicht.", dim: "PE" },
    { id: 5, text: "Ich arbeite hart, auch wenn es lange dauert.", dim: "PE" },
    { id: 6, text: "Neue Ideen lenken mich manchmal von alten ab.", dim: "PA", reverse: true },
    { id: 7, text: "Ich verliere kurzfristig das Interesse an Projekten.", dim: "PA", reverse: true },
    { id: 8, text: "Ich war zeitweise besessen von einer Idee, verlor dann aber das Interesse.", dim: "PA", reverse: true },
    { id: 9, text: "Ich habe Mühe, meinen Fokus über längere Zeit zu halten.", dim: "PA", reverse: true },
    { id: 10, text: "Ich setze mir ein Ziel, wechsle es aber später oft.", dim: "PA", reverse: true },
  ],
  summarize: (s) => `Grit-Mittel: ${(((s.PE ?? 0) + (s.PA ?? 0)) / 2).toFixed(1)}/5`,
};

// --- Locus of Control (🟢) — interne vs. externe Kontrollüberzeugung --------
const LOC: LikertAssessment = {
  key: "LOC",
  title: "Kontrollüberzeugung (Locus of Control)",
  evidence: "EVIDENCE",
  intro: "Glaubst du, dein Leben selbst zu steuern (intern) oder von Umständen/Glück bestimmt (extern)? Interne Überzeugung korreliert mit Einkommen & unternehmerischem Erfolg.",
  scale: FIVE,
  dimensions: {
    INT: { name: "Intern", desc: "Ich gestalte meine Ergebnisse selbst" },
    EXT: { name: "Extern", desc: "Umstände/Glück bestimmen mich" },
  },
  items: [
    { id: 1, text: "Mein Erfolg hängt vor allem von meiner eigenen Anstrengung ab.", dim: "INT" },
    { id: 2, text: "Wenn ich Pläne mache, kann ich sie auch umsetzen.", dim: "INT" },
    { id: 3, text: "Was mit mir passiert, ist mein eigenes Werk.", dim: "INT" },
    { id: 4, text: "Ich kann mein Leben weitgehend selbst bestimmen.", dim: "INT" },
    { id: 5, text: "Probleme löse ich, indem ich aktiv handle.", dim: "INT" },
    { id: 6, text: "Vieles in meinem Leben ist Glückssache.", dim: "EXT", reverse: false },
    { id: 7, text: "Ohne die richtigen Beziehungen kommt man nicht weit.", dim: "EXT" },
    { id: 8, text: "Was ich erreiche, hängt stark von äusseren Umständen ab.", dim: "EXT" },
    { id: 9, text: "Es hat wenig Sinn zu planen — es kommt sowieso anders.", dim: "EXT" },
    { id: 10, text: "Andere Menschen haben mehr Einfluss auf mein Leben als ich.", dim: "EXT" },
  ],
  summarize: (s) => ((s.INT ?? 0) >= (s.EXT ?? 0) ? "überwiegend intern (gut)" : "überwiegend extern"),
};

// --- Finanzielle Risikotoleranz (🟢) ----------------------------------------
const RISK: LikertAssessment = {
  key: "RISK",
  title: "Finanzielle Risikotoleranz",
  evidence: "EVIDENCE",
  intro: "Wie viel Schwankung/Risiko verträgst du bei Geld? Bestimmt deine Anlagestrategie (P2P, Aktien, Cash-Quote) und passt sie an deine Lebenssituation an.",
  scale: FIVE,
  dimensions: {
    TOL: { name: "Risikotoleranz", desc: "Komfort mit Schwankung & Verlustrisiko" },
    HOR: { name: "Zeithorizont/Geduld", desc: "Bereitschaft, lange investiert zu bleiben" },
  },
  items: [
    { id: 1, text: "Für höhere Rendite nehme ich grössere Schwankungen in Kauf.", dim: "TOL" },
    { id: 2, text: "Ein Verlust von 20 % in einem Jahr würde mich nicht zum Verkauf treiben.", dim: "TOL" },
    { id: 3, text: "Ich investiere lieber offensiv als auf dem Sparkonto zu verlieren.", dim: "TOL" },
    { id: 4, text: "P2P-/Aktienrisiken finde ich vertretbar, wenn die Rendite stimmt.", dim: "TOL" },
    { id: 5, text: "Bei fallenden Märkten kaufe ich eher nach als zu verkaufen.", dim: "TOL" },
    { id: 6, text: "Ich kann Geld 10+ Jahre investiert lassen, ohne es zu brauchen.", dim: "HOR" },
    { id: 7, text: "Kurzfristige Kursverluste beunruhigen mich kaum.", dim: "HOR" },
    { id: 8, text: "Ich denke bei Geld in Jahrzehnten, nicht in Monaten.", dim: "HOR" },
    { id: 9, text: "Ich brauche keinen schnellen Zugriff auf meine Anlagen.", dim: "HOR" },
    { id: 10, text: "Geduld beim Investieren fällt mir leicht.", dim: "HOR" },
  ],
  summarize: (s) => {
    const m = ((s.TOL ?? 0) + (s.HOR ?? 0)) / 2;
    return m >= 4 ? "hoch (offensiv)" : m >= 2.6 ? "mittel (ausgewogen)" : "tief (defensiv)";
  },
};

// --- Selbstwirksamkeit (🟢, GSE-Skala Schwarzer/Jerusalem) ------------------
const GSE: LikertAssessment = {
  key: "GSE",
  title: "Selbstwirksamkeit",
  evidence: "EVIDENCE",
  intro: "Dein Vertrauen, schwierige Aufgaben aus eigener Kraft zu meistern. Hohe Selbstwirksamkeit sagt Zielerreichung und Resilienz voraus.",
  scale: FIVE,
  dimensions: { GSE: { name: "Allgemeine Selbstwirksamkeit", desc: "Vertrauen in die eigene Handlungsfähigkeit" } },
  items: [
    { id: 1, text: "Schwierige Probleme löse ich meist aus eigener Kraft.", dim: "GSE" },
    { id: 2, text: "Wenn mir jemand Widerstand leistet, finde ich Mittel, mich durchzusetzen.", dim: "GSE" },
    { id: 3, text: "Es fällt mir leicht, an meinen Absichten festzuhalten.", dim: "GSE" },
    { id: 4, text: "In unerwarteten Situationen weiss ich, wie ich mich verhalten soll.", dim: "GSE" },
    { id: 5, text: "Auch bei Überraschungen komme ich gut zurecht.", dim: "GSE" },
    { id: 6, text: "Schwierigkeiten sehe ich gelassen entgegen, weil ich mir vertraue.", dim: "GSE" },
    { id: 7, text: "Was auch kommt, ich werde damit klarkommen.", dim: "GSE" },
    { id: 8, text: "Für jedes Problem finde ich eine Lösung.", dim: "GSE" },
  ],
  summarize: (s) => `Selbstwirksamkeit: ${(s.GSE ?? 0).toFixed(1)}/5`,
};

export const ASSESSMENTS: Record<string, LikertAssessment> = {
  HEXACO,
  VALUES,
  VIA,
  ENNEAGRAM,
  DISC,
  GRIT,
  LOC,
  RISK,
  GSE,
};

export const ASSESSMENT_LIST = Object.values(ASSESSMENTS);

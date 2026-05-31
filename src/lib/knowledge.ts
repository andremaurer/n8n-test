// Curated knowledge base (RAG-lite). Keyword retrieval over expert snippets so
// the AI synthesis cites sources with evidence labels — no embeddings/key needed.
import type { EvidenceLevel } from "./evidence";

export interface Snippet {
  id: string;
  system: string;
  title: string;
  text: string;
  source: string;
  evidence: EvidenceLevel;
  tags: string[];
}

export const KNOWLEDGE: Snippet[] = [
  {
    id: "bigfive-conscientiousness",
    system: "Big Five",
    title: "Gewissenhaftigkeit sagt Erfolg voraus",
    text: "Gewissenhaftigkeit ist der konsistenteste Big-Five-Prädiktor für beruflichen Erfolg, Einkommen und Gesundheit. Wer hier niedrig liegt, profitiert am meisten von Systemen statt Willenskraft: feste Routinen, Deadlines, externe Accountability.",
    source: "Roberts et al., 2007; Barrick & Mount, 1991",
    evidence: "EVIDENCE",
    tags: ["gewissenhaftigkeit", "c", "erfolg", "disziplin", "umsetzung", "karriere", "geld"],
  },
  {
    id: "bigfive-openness",
    system: "Big Five",
    title: "Offenheit & Unternehmertum",
    text: "Hohe Offenheit korreliert mit Kreativität und unternehmerischer Ideenfindung, aber nicht automatisch mit Umsetzung. Kombiniere Offenheit (Ideen) mit Gewissenhaftigkeit (Lieferung) für Geschäftserfolg.",
    source: "Zhao & Seibert, 2006 (Meta-Analyse Entrepreneurship)",
    evidence: "EVIDENCE",
    tags: ["offenheit", "o", "kreativität", "innovation", "geschäft", "unternehmer"],
  },
  {
    id: "bigfive-neuroticism",
    system: "Big Five",
    title: "Neurotizismus & Entscheidungen",
    text: "Höhere emotionale Reaktivität erhöht das Risiko impulsiver Finanz-/Lebensentscheidungen. Wirksame Gegenmittel: Abkühlphasen (24–48h), feste Entscheidungsregeln, Reduktion von Stressquellen.",
    source: "Kuhnen & Knutson, 2011",
    evidence: "EVIDENCE",
    tags: ["neurotizismus", "n", "stress", "entscheidung", "emotion", "geld"],
  },
  {
    id: "fire-4percent",
    system: "Finanzen",
    title: "Die 4-%-Regel",
    text: "Die Trinity-Studie zeigt: Ein Portfolio überdauert mit hoher Wahrscheinlichkeit 30+ Jahre, wenn jährlich ~4 % des Startkapitals (inflationsangepasst) entnommen werden. Freiheits-Kapital ≈ 25× Jahresausgaben. Konservativer: 3,25–3,5 %.",
    source: "Cooley, Hubbard & Walz, 1998 (Trinity Study); Bengen, 1994",
    evidence: "EVIDENCE",
    tags: ["fire", "freiheit", "kapital", "entnahme", "rente", "passiv", "geld", "wohlstand"],
  },
  {
    id: "fire-savingsrate",
    system: "Finanzen",
    title: "Sparquote schlägt Rendite",
    text: "Die Zeit bis zur finanziellen Freiheit hängt primär von der Sparquote ab, nicht vom Einkommen. Bei 50 % Sparquote ~17 Jahre, bei 70 % ~9 Jahre. Der grösste Hebel ist die Lücke zwischen Einnahmen und Ausgaben.",
    source: "Mr. Money Mustache, 'The Shockingly Simple Math'",
    evidence: "EVIDENCE",
    tags: ["sparquote", "freiheit", "fire", "ausgaben", "einkommen", "geld", "wohlstand"],
  },
  {
    id: "behavioral-lossaversion",
    system: "Verhaltensökonomie",
    title: "Verlustaversion & Sunk Cost",
    text: "Verluste wiegen psychologisch ~2× so schwer wie gleich grosse Gewinne (Prospect Theory). Das führt zum Festhalten an Verlustbringern (Sunk-Cost-Falle). Bewerte Entscheidungen nach dem Zustand in 5 Jahren, nicht nach bereits Investiertem.",
    source: "Kahneman & Tversky, 1979 (Prospect Theory)",
    evidence: "EVIDENCE",
    tags: ["verlustaversion", "sunk", "entscheidung", "risiko", "bias", "geld"],
  },
  {
    id: "riasec-fit",
    system: "RIASEC",
    title: "Interessen-Passung & Zufriedenheit",
    text: "Holland's Theorie: Je besser Tätigkeit und Interessensprofil (RIASEC) übereinstimmen, desto höher Zufriedenheit und Durchhaltevermögen. Wähle Geschäftsfelder, die deinen Top-2/3 Codes entsprechen.",
    source: "Holland, 1997; Nye et al., 2012",
    evidence: "EVIDENCE",
    tags: ["riasec", "interessen", "beruf", "geschäft", "passung", "holland"],
  },
  {
    id: "ikigai-overlap",
    system: "Ikigai",
    title: "Ikigai als Schnittmenge",
    text: "Der Sweet Spot liegt dort, wo sich Lieben, Können, Bezahltwerden und Weltbedarf überschneiden. Praktisch: Starte bei der Überlappung von 'Können' und 'Bezahltwerden' (schnellstes Einkommen) und erweitere Richtung 'Lieben'.",
    source: "García & Miralles, 2016",
    evidence: "HEURISTIC",
    tags: ["ikigai", "sinn", "geschäft", "berufung", "freude", "geld"],
  },
  {
    id: "habits-keystone",
    system: "Praxis",
    title: "Schlüsselgewohnheiten & Manifestation",
    text: "Es gibt keinen Beleg, dass Gedanken Geld 'anziehen'. Wirksam sind die Mechanismen dahinter: klare Ziele (Zielsetzungstheorie), selektive Aufmerksamkeit für Chancen, Selbstwirksamkeit und konsequente kleine Gewohnheiten.",
    source: "Locke & Latham, 2002; Clear, 2018 (Atomic Habits)",
    evidence: "PRACTICE",
    tags: ["geldanziehung", "manifestation", "gewohnheit", "ziel", "priming", "freiheit", "mindset"],
  },
  {
    id: "hd-disclaimer",
    system: "Human Design",
    title: "Human Design einordnen",
    text: "Human Design ist ein Deutungssystem ohne wissenschaftliche Evidenz. Wert liegt in Reflexion und Sprache (z. B. Strategie/Autorität als Anlass, eigene Entscheidungswege zu beobachten), nicht in Vorhersagekraft.",
    source: "Keine peer-reviewte Evidenz; als Reflexionswerkzeug verwenden",
    evidence: "INTERPRETIVE",
    tags: ["human", "design", "typ", "autorität", "strategie", "deutung"],
  },
  {
    id: "astro-disclaimer",
    system: "Astrologie",
    title: "Astrologie einordnen",
    text: "Kontrollierte Studien finden keine über den Zufall hinausgehende Vorhersagekraft der Astrologie. Nutze Horoskop/Transite als Erzähl- und Reflexionsrahmen, nicht als Faktenbasis für grosse Entscheidungen.",
    source: "Carlson, 1985 (Nature, Doppelblindstudie)",
    evidence: "INTERPRETIVE",
    tags: ["astrologie", "horoskop", "transit", "deutung", "sterne"],
  },
  {
    id: "values-fit",
    system: "Werte",
    title: "Werte-Kongruenz",
    text: "Langfristige Zufriedenheit steigt, wenn Tätigkeit und Kernwerte übereinstimmen. Bei Geschäftsfeld-Wahl: prüfe explizit, ob die Top-Werte (z. B. Selbstbestimmung, Sicherheit, Leistung) bedient werden.",
    source: "Schwartz, 1992 (Theory of Basic Values)",
    evidence: "EVIDENCE",
    tags: ["werte", "schwartz", "kongruenz", "zufriedenheit", "entscheidung"],
  },
];

// Simple keyword retriever: score snippets by tag/term overlap with the query.
export function retrieve(query: string, n = 4): Snippet[] {
  const terms = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9äöü%]+/)
    .filter((t) => t.length > 2);
  const scored = KNOWLEDGE.map((s) => {
    const hay = (s.title + " " + s.text + " " + s.tags.join(" ") + " " + s.system).toLowerCase();
    let score = 0;
    for (const t of terms) {
      if (s.tags.includes(t)) score += 3;
      else if (hay.includes(t)) score += 1;
    }
    return { s, score };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .filter((x) => x.score > 0)
    .slice(0, n)
    .map((x) => x.s);
}

// AI synthesis layer ("Integrator"). Merges the per-system findings into concrete,
// testable next steps — and marks contradictions between systems. Uses Claude when
// ANTHROPIC_API_KEY is set (with prompt caching); otherwise a deterministic fallback
// so the app always works.

import type { BigFiveScores } from "./assessments";
import { retrieve, Snippet } from "./knowledge";

export interface SynthesisProfile {
  name: string;
  role: string;
  bigFive?: BigFiveScores | null;
  astro?: { sunSign: string; moonSign: string; ascendant?: string } | null;
  hd?: { type: string; authority: string; profile: string; strategy: string } | null;
  numerology?: { lifePath: number; personalYear: number } | null;
  fire?: {
    currency: string;
    freedomNumber: number;
    progress: number;
    yearsToFreedom: number | null;
    savingsRate: number;
  } | null;
  topGoals?: string[];
}

export interface SynthesisResult {
  source: "ai" | "fallback";
  summary: string;
  strengths: string[];
  watchouts: string[];
  businessDirections: string[];
  nextSteps: string[];
  contradictions: string[];
  sources: { title: string; source: string; system: string }[];
}

function profileQuery(p: SynthesisProfile): string {
  const parts: string[] = ["freiheit wohlstand geschäft entscheidung"];
  if (p.bigFive) {
    if (p.bigFive.C <= 2.5) parts.push("gewissenhaftigkeit disziplin umsetzung");
    if (p.bigFive.O >= 3.5) parts.push("offenheit kreativität innovation");
    if (p.bigFive.N >= 3.5) parts.push("neurotizismus stress entscheidung");
  }
  if (p.fire) parts.push("fire sparquote kapital entnahme passiv");
  if (p.hd) parts.push("human design typ autorität");
  if (p.astro) parts.push("astrologie transit");
  return parts.join(" ");
}

function snippetCitations(snips: Snippet[]) {
  return snips.map((s) => ({ title: s.title, source: s.source, system: s.system }));
}

const SYSTEM_PROMPT = `Du bist der „Integrator" einer persönlichen Lebens-Optimierungs-App.
Du vereinst die Sicht mehrerer Experten-Personas: Persönlichkeitspsychologe (Big Five/HEXACO, 🟢),
Finanzplaner (FIRE, 🟢), Verhaltensökonom (Biases, 🟢), Karriere-/Geschäftsfeld-Coach (RIASEC/Ikigai, 🟡)
und Reflexions-Begleiter für Deutungssysteme (🔵).
Du führst Befunde aus mehreren Systemen zusammen: Big Five (🟢 evidenzbasiert),
Astrologie & Human Design & Numerologie (🔵 Deutungssysteme), sowie Finanzkennzahlen (🟢).

Regeln:
- Behaupte NIE, ein Deutungssystem sei „wahr". Formuliere: „Aus Sicht von System X …".
- Gewichte evidenzbasierte Aussagen höher als Deutungssysteme.
- Markiere Widersprüche zwischen Systemen explizit.
- Liefere konkrete, überprüfbare nächste Schritte — keine vagen Sprüche.
- Bezug zum Oberziel: genug Wohlstand für Freiheit.
- Antworte als striktes JSON mit den Feldern: summary (string), strengths (string[]),
  watchouts (string[]), businessDirections (string[]), nextSteps (string[]),
  contradictions (string[]). Deutsch. Keine Markdown-Codefence.`;

function fallbackSynthesis(p: SynthesisProfile): SynthesisResult {
  const strengths: string[] = [];
  const watchouts: string[] = [];
  const businessDirections: string[] = [];
  const nextSteps: string[] = [];
  const contradictions: string[] = [];

  if (p.bigFive) {
    const b = p.bigFive;
    if (b.O >= 3.5) { strengths.push("Hohe Offenheit → ideenreich, gut für Innovation und neue Geschäftsfelder."); businessDirections.push("Felder mit Neuem/Kreativem: Produktentwicklung, Content, Beratung an der Spitze eines Trends."); }
    if (b.C >= 3.5) strengths.push("Hohe Gewissenhaftigkeit → verlässliche Umsetzung, starker Prädiktor für beruflichen & finanziellen Erfolg.");
    if (b.C <= 2.5) { watchouts.push("Niedrige Gewissenhaftigkeit → Umsetzung/Disziplin ist dein Hebel. Nutze Systeme statt Willenskraft (Routinen, Deadlines, Accountability)."); nextSteps.push("Eine einzige Schlüsselgewohnheit definieren und 30 Tage tracken."); }
    if (b.E >= 3.5) { strengths.push("Hohe Extraversion → Vertrieb, Netzwerk, Sichtbarkeit liegen dir."); businessDirections.push("Menschen-/vertriebsgetriebene Modelle: Coaching, Sales, Community, Personal Brand."); }
    if (b.E <= 2.5) businessDirections.push("Eher introvertiert → asynchrone/produktbasierte Modelle (Software, Schreiben, Investieren) statt Dauer-Präsenz.");
    if (b.A <= 2.5) strengths.push("Niedrige Verträglichkeit → verhandlungsstark und entscheidungsfreudig (im Business ein Vorteil).");
    if (b.N >= 3.5) { watchouts.push("Höhere emotionale Reaktivität → bei grossen Geld-/Lebensentscheidungen Abkühlphasen einbauen."); nextSteps.push("Entscheidungs-Regel: bei wichtigen Entscheidungen 24–48h Abstand vor dem Commit."); }
  } else {
    nextSteps.push("Big-Five-Test machen — das ist die belastbarste Datenquelle über dich.");
  }

  if (p.fire) {
    const f = p.fire;
    nextSteps.push(`Freiheits-Zahl: ${Math.round(f.freedomNumber).toLocaleString("de-CH")} ${f.currency}. Fortschritt: ${Math.round(f.progress * 100)}%.`);
    if (f.savingsRate < 0.2) watchouts.push("Sparquote < 20 % → grösster Hebel zur Freiheit ist aktuell die Lücke zwischen Einnahmen und Ausgaben.");
    if (f.savingsRate >= 0.4) strengths.push("Sparquote ≥ 40 % → du bist auf einem sehr schnellen Pfad zur Freiheit.");
    if (f.yearsToFreedom !== null) nextSteps.push(`Bei aktuellem Tempo ~${f.yearsToFreedom} Jahre bis zur finanziellen Freiheit. Teste, wie sich +10 % Einkommen oder −10 % Ausgaben auswirken.`);
  } else {
    nextSteps.push("Finanzprofil ausfüllen → Freiheits-Zahl und Zeit-bis-Freiheit berechnen.");
  }

  // Contradiction example between evidence and interpretive systems.
  if (p.bigFive && p.hd) {
    if (p.bigFive.E <= 2.5 && /Manifestor|Generator/.test(p.hd.type))
      contradictions.push(`Big Five zeigt eher Introversion, Human Design (${p.hd.type}) betont aktives Initiieren/Reagieren nach aussen. Evidenzbasiert zählt das Persönlichkeitsprofil stärker — nutze HD höchstens als Reflexionsanstoss.`);
    if (p.bigFive.C >= 3.5 && p.hd.type === "Projektor")
      contradictions.push("Hohe Gewissenhaftigkeit (umsetzungsstark) vs. HD-Projektor-Narrativ („auf Einladung warten“). Vertraue der gemessenen Umsetzungsstärke; das HD-Bild ist nur ein Deutungsangebot.");
  }

  if (p.hd) nextSteps.push(`HD-Reflexion (🔵): Strategie „${p.hd.strategy}" 1 Woche bewusst testen und im Journal festhalten, ob es sich stimmig anfühlt.`);

  if (businessDirections.length === 0) businessDirections.push("Geschäftsfeld-Ideen erfassen und mit dem Scoring gegen deine Stärken bewerten.");

  const summary = `${p.name}: Auswertung aus ${[p.bigFive && "Big Five", p.astro && "Astrologie", p.hd && "Human Design", p.numerology && "Numerologie", p.fire && "Finanzen"].filter(Boolean).join(", ") || "noch wenig Daten"}. Evidenzbasierte Befunde sind höher gewichtet als Deutungssysteme. Fokus: konkrete nächste Schritte Richtung Freiheit.`;

  const snips = retrieve(profileQuery(p), 5);
  return { source: "fallback", summary, strengths, watchouts, businessDirections, nextSteps, contradictions, sources: snippetCitations(snips) };
}

export async function synthesize(p: SynthesisProfile): Promise<SynthesisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fallbackSynthesis(p);

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });
    const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
    const snips = retrieve(profileQuery(p), 5);
    const knowledge = snips.map((s) => `- [${s.system} · ${s.evidence}] ${s.title}: ${s.text} (Quelle: ${s.source})`).join("\n");
    const msg = await client.messages.create({
      model,
      max_tokens: 1500,
      // cache_control enables prompt caching when supported by the SDK/model.
      system: [
        { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
      ] as any,
      messages: [
        { role: "user", content: `Experten-Wissensbasis (zitiere relevante Punkte):\n${knowledge}\n\nProfil als JSON:\n${JSON.stringify(p, null, 2)}\n\nGib NUR das JSON-Objekt zurück.` },
      ],
    });
    const text = msg.content.filter((c) => c.type === "text").map((c: any) => c.text).join("");
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    return {
      source: "ai",
      summary: parsed.summary ?? "",
      strengths: parsed.strengths ?? [],
      watchouts: parsed.watchouts ?? [],
      businessDirections: parsed.businessDirections ?? [],
      nextSteps: parsed.nextSteps ?? [],
      contradictions: parsed.contradictions ?? [],
      sources: snippetCitations(snips),
    };
  } catch (e) {
    const fb = fallbackSynthesis(p);
    fb.summary = `(KI nicht verfügbar — regelbasierte Auswertung) ${fb.summary}`;
    return fb;
  }
}

export { fallbackSynthesis };

// --- "Ask your profile" chat ------------------------------------------------
export interface AskResult {
  source: "ai" | "fallback";
  answer: string;
  sources: { title: string; source: string; system: string }[];
}

export async function askProfile(question: string, p: SynthesisProfile): Promise<AskResult> {
  const snips = retrieve(question + " " + profileQuery(p), 5);
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    const facts: string[] = [];
    if (p.bigFive) facts.push(`Big Five: O ${p.bigFive.O}, C ${p.bigFive.C}, E ${p.bigFive.E}, A ${p.bigFive.A}, N ${p.bigFive.N}`);
    if (p.fire) facts.push(`Finanzen: Sparquote ${Math.round(p.fire.savingsRate * 100)}%, Fortschritt ${Math.round(p.fire.progress * 100)}%, ~${p.fire.yearsToFreedom ?? "?"} Jahre`);
    if (p.hd) facts.push(`Human Design (🔵): ${p.hd.type}, ${p.hd.authority}`);
    const body = snips.length
      ? snips.map((s) => `• ${s.title} (${s.system}, ${s.evidence}): ${s.text}`).join("\n")
      : "Für diese Frage habe ich keine passende Wissensgrundlage gefunden.";
    return {
      source: "fallback",
      answer: `(Ohne KI-Key — regelbasierte Antwort)\n\nZu „${question}":\n\nRelevantes Expertenwissen:\n${body}\n\nDeine relevanten Daten:\n${facts.join("\n") || "— noch wenig erfasst —"}\n\nTipp: Setze ANTHROPIC_API_KEY für eine vollwertige, dialogische Antwort.`,
      sources: snippetCitations(snips),
    };
  }

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });
    const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
    const knowledge = snips.map((s) => `- [${s.system} · ${s.evidence}] ${s.title}: ${s.text} (Quelle: ${s.source})`).join("\n");
    const msg = await client.messages.create({
      model,
      max_tokens: 900,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }] as any,
      messages: [
        { role: "user", content: `Wissensbasis:\n${knowledge}\n\nNutzerprofil:\n${JSON.stringify(p)}\n\nFrage: ${question}\n\nAntworte konkret, ehrlich nach Evidenz gewichtet, auf Deutsch.` },
      ],
    });
    const text = msg.content.filter((c) => c.type === "text").map((c: any) => c.text).join("");
    return { source: "ai", answer: text, sources: snippetCitations(snips) };
  } catch {
    return { source: "fallback", answer: "KI aktuell nicht erreichbar. Bitte später erneut versuchen.", sources: snippetCitations(snips) };
  }
}

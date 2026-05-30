// Every result in the app carries an evidence label. This is the core honesty
// principle: inspiration from interpretive systems, reliability from science —
// clearly separated, never blended.

export type EvidenceLevel = "EVIDENCE" | "HEURISTIC" | "INTERPRETIVE" | "PRACTICE";

export const EVIDENCE: Record<
  EvidenceLevel,
  { label: string; emoji: string; color: string; note: string }
> = {
  EVIDENCE: {
    label: "Evidenzbasiert",
    emoji: "🟢",
    color: "#34d399",
    note: "Wissenschaftlich validiert, Vorhersagekraft belegt.",
  },
  HEURISTIC: {
    label: "Plausibel / Heuristik",
    emoji: "🟡",
    color: "#fbbf24",
    note: "Im Coaching bewährt, gemischte wissenschaftliche Evidenz.",
  },
  INTERPRETIVE: {
    label: "Deutungssystem",
    emoji: "🔵",
    color: "#60a5fa",
    note: "Keine wissenschaftliche Evidenz; Wert als Reflexions-/Narrativ-Werkzeug.",
  },
  PRACTICE: {
    label: "Mindset / Praxis",
    emoji: "⚪",
    color: "#cbd5e1",
    note: "Wirkung über Verhalten (Zielklarheit, Habits), nicht über „Energie“.",
  },
};

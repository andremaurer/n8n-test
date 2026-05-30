"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RIASEC_ITEMS, RIASEC_TYPES, scoreRiasec, hollandCode } from "@/lib/assessments";
import { saveRiasec } from "@/lib/actions";

const LABELS = ["gar nicht", "wenig", "neutral", "gern", "sehr gern"];

export default function RiasecTest({ params }: { params: { personId: string } }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [pending, start] = useTransition();
  const router = useRouter();

  const answered = Object.keys(answers).length;
  const allDone = answered === RIASEC_ITEMS.length;
  const code = answered >= 6 ? hollandCode(scoreRiasec(answers)) : null;

  function submit() {
    const scores = scoreRiasec(answers);
    start(async () => {
      await saveRiasec(params.personId, answers, scores);
      router.push(`/people/${params.personId}`);
    });
  }

  return (
    <div className="space-y-6">
      <header>
        <button onClick={() => router.back()} className="text-sm text-slate-400 hover:text-white">← zurück</button>
        <h1 className="text-3xl font-bold text-white">Interessen-Profil · RIASEC</h1>
        <p className="mt-1 text-slate-400">🟢 Evidenzbasiert (Holland). Wie gern würdest du das tun? Das speist die Geschäftsfeld-Findung.</p>
      </header>

      <div className="sticky top-[57px] z-10 rounded-xl border border-white/10 bg-ink/90 p-3 backdrop-blur">
        <div className="mb-1 flex justify-between text-xs text-slate-400"><span>{answered} / {RIASEC_ITEMS.length}</span>{code && <span>Tendenz: {code.join("")}</span>}</div>
        <div className="bar"><span style={{ width: `${(answered / RIASEC_ITEMS.length) * 100}%`, background: "#7c6cf6" }} /></div>
      </div>

      <ol className="space-y-3">
        {RIASEC_ITEMS.map((item, idx) => (
          <li key={item.id} className="card py-4">
            <div className="mb-3 flex gap-2"><span className="text-sm text-slate-500">{idx + 1}.</span><span className="text-sm font-medium text-white">{item.text}</span></div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((v) => {
                const active = answers[item.id] === v;
                return (
                  <button key={v} type="button" onClick={() => setAnswers((a) => ({ ...a, [item.id]: v }))}
                    className={`flex-1 rounded-lg border px-2 py-2 text-xs transition ${active ? "border-accent bg-accent/20 text-white" : "border-white/10 text-slate-300 hover:bg-white/5"}`} title={LABELS[v - 1]}>
                    <div className="text-base font-semibold">{v}</div>
                    <div className="mt-0.5 hidden sm:block">{LABELS[v - 1]}</div>
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      {code && (
        <div className="card text-sm text-slate-300">
          Dein Holland-Code (Top 3): <span className="font-semibold text-white">{code.join("")}</span> —{" "}
          {code.map((c) => RIASEC_TYPES[c].name).join(", ")}.
        </div>
      )}

      <div className="sticky bottom-4 flex items-center justify-between rounded-xl border border-white/10 bg-ink/90 p-3 backdrop-blur">
        <span className="text-sm text-slate-400">{allDone ? "Alle beantwortet ✓" : `Noch ${RIASEC_ITEMS.length - answered} offen`}</span>
        <button onClick={submit} disabled={pending || answered < 6} className="btn">{pending ? "Speichere…" : "Auswerten & speichern"}</button>
      </div>
    </div>
  );
}

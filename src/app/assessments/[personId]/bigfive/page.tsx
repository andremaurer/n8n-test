"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IPIP50, LIKERT_LABELS, scoreBigFive } from "@/lib/assessments";
import { saveBigFive } from "@/lib/actions";

export default function BigFiveTest({ params }: { params: { personId: string } }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [pending, start] = useTransition();
  const router = useRouter();

  const answered = Object.keys(answers).length;
  const progress = Math.round((answered / IPIP50.length) * 100);
  const allDone = answered === IPIP50.length;

  const preview = useMemo(() => (answered >= 10 ? scoreBigFive(answers) : null), [answers, answered]);

  function submit() {
    const scores = scoreBigFive(answers);
    start(async () => {
      await saveBigFive(params.personId, answers, scores);
      router.push(`/people/${params.personId}`);
    });
  }

  return (
    <div className="space-y-6">
      <header>
        <button onClick={() => router.back()} className="text-sm text-slate-400 hover:text-white">← zurück</button>
        <h1 className="text-3xl font-bold text-white">Big-Five-Persönlichkeitstest</h1>
        <p className="mt-1 text-slate-400">
          🟢 Evidenzbasiert · IPIP-50 (Public Domain). Antworte spontan und ehrlich. Wie sehr trifft jede Aussage auf dich zu?
        </p>
      </header>

      <div className="sticky top-[57px] z-10 rounded-xl border border-white/10 bg-ink/90 p-3 backdrop-blur">
        <div className="mb-1 flex justify-between text-xs text-slate-400">
          <span>{answered} / {IPIP50.length} beantwortet</span>
          <span>{progress}%</span>
        </div>
        <div className="bar"><span style={{ width: `${progress}%`, background: "#7c6cf6" }} /></div>
      </div>

      <ol className="space-y-3">
        {IPIP50.map((item, idx) => (
          <li key={item.id} className="card py-4">
            <div className="mb-3 flex gap-2">
              <span className="text-sm text-slate-500">{idx + 1}.</span>
              <span className="text-sm font-medium text-white">{item.text}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((v) => {
                const active = answers[item.id] === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAnswers((a) => ({ ...a, [item.id]: v }))}
                    className={`flex-1 rounded-lg border px-2 py-2 text-xs transition ${
                      active ? "border-accent bg-accent/20 text-white" : "border-white/10 text-slate-300 hover:bg-white/5"
                    }`}
                    title={LIKERT_LABELS[v - 1]}
                  >
                    <div className="text-base font-semibold">{v}</div>
                    <div className="mt-0.5 hidden sm:block">{LIKERT_LABELS[v - 1]}</div>
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      {preview && (
        <div className="card">
          <div className="mb-2 text-sm font-semibold text-white">Zwischenstand</div>
          <div className="grid gap-1 text-sm text-slate-300 sm:grid-cols-5">
            <div>Offenheit: {preview.O.toFixed(1)}</div>
            <div>Gewissenhaft.: {preview.C.toFixed(1)}</div>
            <div>Extraversion: {preview.E.toFixed(1)}</div>
            <div>Verträglichk.: {preview.A.toFixed(1)}</div>
            <div>Neurotizismus: {preview.N.toFixed(1)}</div>
          </div>
        </div>
      )}

      <div className="sticky bottom-4 flex items-center justify-between rounded-xl border border-white/10 bg-ink/90 p-3 backdrop-blur">
        <span className="text-sm text-slate-400">{allDone ? "Alle Fragen beantwortet ✓" : `Noch ${IPIP50.length - answered} offen`}</span>
        <button onClick={submit} disabled={pending || answered < 10} className="btn">
          {pending ? "Speichere…" : allDone ? "Auswerten & speichern" : "Mit Teilantworten speichern"}
        </button>
      </div>
    </div>
  );
}

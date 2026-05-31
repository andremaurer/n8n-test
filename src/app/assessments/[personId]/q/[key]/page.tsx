"use client";

import { useState, useTransition } from "react";
import { useRouter, notFound } from "next/navigation";
import { ASSESSMENTS, scoreLikert } from "@/lib/assess-registry";
import { saveAssessment } from "@/lib/actions";

export default function GenericTest({ params }: { params: { personId: string; key: string } }) {
  const a = ASSESSMENTS[params.key.toUpperCase()];
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [pending, start] = useTransition();
  const router = useRouter();
  if (!a) return notFound();

  const answered = Object.keys(answers).length;
  const allDone = answered === a.items.length;
  const minNeeded = Math.min(a.items.length, Math.max(6, Object.keys(a.dimensions).length));

  function submit() {
    const scores = scoreLikert(a, answers);
    start(async () => {
      await saveAssessment(params.personId, a.key, answers, scores);
      router.push(`/people/${params.personId}`);
    });
  }

  return (
    <div className="space-y-6">
      <header>
        <button onClick={() => router.back()} className="text-sm text-slate-400 hover:text-white">← zurück</button>
        <h1 className="text-3xl font-bold text-white">{a.title}</h1>
        <p className="mt-1 text-slate-400">{a.intro}</p>
      </header>

      <div className="sticky top-[57px] z-10 rounded-xl border border-white/10 bg-ink/90 p-3 backdrop-blur">
        <div className="mb-1 flex justify-between text-xs text-slate-400"><span>{answered} / {a.items.length}</span><span>{Math.round((answered / a.items.length) * 100)}%</span></div>
        <div className="bar"><span style={{ width: `${(answered / a.items.length) * 100}%`, background: "#7c6cf6" }} /></div>
      </div>

      <ol className="space-y-3">
        {a.items.map((item, idx) => (
          <li key={item.id} className="card py-4">
            <div className="mb-3 flex gap-2"><span className="text-sm text-slate-500">{idx + 1}.</span><span className="text-sm font-medium text-white">{item.text}</span></div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((v) => {
                const active = answers[item.id] === v;
                return (
                  <button key={v} type="button" onClick={() => setAnswers((s) => ({ ...s, [item.id]: v }))}
                    className={`flex-1 rounded-lg border px-2 py-2 text-xs transition ${active ? "border-accent bg-accent/20 text-white" : "border-white/10 text-slate-300 hover:bg-white/5"}`} title={a.scale[v - 1]}>
                    <div className="text-base font-semibold">{v}</div>
                    <div className="mt-0.5 hidden sm:block">{a.scale[v - 1]}</div>
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      <div className="sticky bottom-4 flex items-center justify-between rounded-xl border border-white/10 bg-ink/90 p-3 backdrop-blur">
        <span className="text-sm text-slate-400">{allDone ? "Alle beantwortet ✓" : `Noch ${a.items.length - answered} offen`}</span>
        <button onClick={submit} disabled={pending || answered < minNeeded} className="btn">{pending ? "Speichere…" : "Auswerten & speichern"}</button>
      </div>
    </div>
  );
}

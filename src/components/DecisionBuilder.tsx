"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveDecision } from "@/lib/actions";

interface Factor { name: string; weight: number; scoreA: number; scoreB: number }

export function DecisionBuilder({ personId }: { personId: string }) {
  const [title, setTitle] = useState("");
  const [optionA, setOptionA] = useState("Option A");
  const [optionB, setOptionB] = useState("Option B");
  const [factors, setFactors] = useState<Factor[]>([
    { name: "Passt zu meinen Werten", weight: 4, scoreA: 3, scoreB: 3 },
    { name: "Beitrag zur finanziellen Freiheit", weight: 5, scoreA: 3, scoreB: 3 },
    { name: "Energie/Freude", weight: 3, scoreA: 3, scoreB: 3 },
  ]);
  const [pending, start] = useTransition();
  const router = useRouter();

  const totals = useMemo(() => {
    let a = 0, b = 0, w = 0;
    for (const f of factors) { a += f.weight * f.scoreA; b += f.weight * f.scoreB; w += f.weight * 5; }
    return { a, b, w, pctA: w ? Math.round((a / w) * 100) : 0, pctB: w ? Math.round((b / w) * 100) : 0 };
  }, [factors]);

  const rec = totals.a === totals.b ? "Unentschieden" : totals.a > totals.b ? optionA : optionB;

  function upd(i: number, key: keyof Factor, val: string | number) {
    setFactors((fs) => fs.map((f, idx) => (idx === i ? { ...f, [key]: key === "name" ? val : Number(val) } : f)));
  }

  function save() {
    start(async () => {
      await saveDecision(personId, { title, optionA, optionB, factors, decision: rec });
      router.refresh();
      setTitle("");
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <input className="input" placeholder="Worum geht es?" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="input" value={optionA} onChange={(e) => setOptionA(e.target.value)} />
        <input className="input" value={optionB} onChange={(e) => setOptionB(e.target.value)} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-400">
            <tr><th className="py-1">Faktor</th><th>Gewicht</th><th>{optionA}</th><th>{optionB}</th><th></th></tr>
          </thead>
          <tbody>
            {factors.map((f, i) => (
              <tr key={i} className="border-t border-white/5">
                <td className="py-1 pr-2"><input className="input" value={f.name} onChange={(e) => upd(i, "name", e.target.value)} /></td>
                <td className="pr-2"><Sel v={f.weight} on={(v) => upd(i, "weight", v)} /></td>
                <td className="pr-2"><Sel v={f.scoreA} on={(v) => upd(i, "scoreA", v)} /></td>
                <td className="pr-2"><Sel v={f.scoreB} on={(v) => upd(i, "scoreB", v)} /></td>
                <td><button type="button" className="text-red-300" onClick={() => setFactors((fs) => fs.filter((_, idx) => idx !== i))}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="btn-ghost text-xs" onClick={() => setFactors((fs) => [...fs, { name: "Neuer Faktor", weight: 3, scoreA: 3, scoreB: 3 }])}>+ Faktor</button>

      <div className="rounded-xl border border-white/10 bg-ink-soft/50 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Score label={optionA} pct={totals.pctA} highlight={totals.a >= totals.b} />
          <Score label={optionB} pct={totals.pctB} highlight={totals.b > totals.a} />
        </div>
        <p className="mt-3 text-sm text-slate-200">Empfehlung (gewichtet): <span className="font-semibold text-accent-soft">{rec}</span></p>
        <p className="mt-1 text-xs text-slate-500">🟢 Verhaltensökonomie-Tipp: Achte auf Verlustaversion und Sunk-Cost — bewerte den Zustand in 5 Jahren, nicht den bereits investierten Aufwand.</p>
      </div>

      <button onClick={save} disabled={pending || !title} className="btn">{pending ? "Speichere…" : "Entscheidung speichern"}</button>
    </div>
  );
}

function Sel({ v, on }: { v: number; on: (v: number) => void }) {
  return (
    <select className="input" value={v} onChange={(e) => on(Number(e.target.value))}>
      {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
    </select>
  );
}

function Score({ label, pct, highlight }: { label: string; pct: number; highlight: boolean }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm"><span className={highlight ? "font-semibold text-white" : "text-slate-300"}>{label}</span><span className="text-slate-400">{pct}%</span></div>
      <div className="bar"><span style={{ width: `${pct}%`, background: highlight ? "#34d399" : "#7c6cf6" }} /></div>
    </div>
  );
}

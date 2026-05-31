"use client";

import { useState, useTransition } from "react";
import { askMyProfile } from "@/lib/actions";

interface Msg { role: "user" | "assistant"; text: string; sources?: { title: string; source: string; system: string }[] }

const SUGGESTIONS = [
  "Welches Geschäftsfeld passt am besten zu mir?",
  "Wie verkürze ich meinen Weg zur finanziellen Freiheit?",
  "Worauf sollte ich bei grossen Entscheidungen achten?",
  "Was sind meine grössten Stärken?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, start] = useTransition();

  function send(q: string) {
    if (!q.trim()) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    start(async () => {
      const res = await askMyProfile(q);
      setMessages((m) => [...m, { role: "assistant", text: res.answer, sources: res.sources }]);
    });
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white">Frag dein Profil ✨</h1>
        <p className="mt-1 text-slate-400">Stelle Fragen zu dir selbst — beantwortet aus deinen Daten + kuratiertem Expertenwissen, evidenzbasiert gewichtet.</p>
      </header>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)} className="btn-ghost text-sm">{s}</button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`card ${m.role === "user" ? "border-accent/30" : ""}`}>
            <div className="mb-1 text-xs uppercase text-slate-500">{m.role === "user" ? "Du" : "Integrator"}</div>
            <p className="whitespace-pre-wrap text-sm text-slate-100">{m.text}</p>
            {m.sources && m.sources.length > 0 && (
              <div className="mt-3 border-t border-white/5 pt-2 text-xs text-slate-400">
                Quellen: {m.sources.map((s, k) => <span key={k}>{k > 0 ? " · " : ""}{s.title} <span className="text-slate-500">({s.source})</span></span>)}
              </div>
            )}
          </div>
        ))}
        {pending && <div className="card text-sm text-slate-400">Denke nach …</div>}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="sticky bottom-4 flex gap-2 rounded-xl border border-white/10 bg-ink/90 p-3 backdrop-blur"
      >
        <input className="input flex-1" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Frage zu dir, deinen Stärken, Geld, Geschäftsfeldern …" />
        <button className="btn" disabled={pending || !input.trim()}>Senden</button>
      </form>
    </div>
  );
}

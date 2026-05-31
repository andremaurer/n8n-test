"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { runTodoReview } from "@/lib/actions";

export function TodoReviewButton() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  function run() {
    start(async () => {
      const r = await runTodoReview();
      setMsg(r.reviewed > 0 ? `${r.reviewed} Todos geprüft (${r.source === "ai" ? "KI" : "regelbasiert"})` : "Keine offenen Todos");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      {msg && <span className="text-xs text-slate-400">{msg}</span>}
      <button onClick={run} disabled={pending} className="btn">{pending ? "Prüfe…" : "🤖 KI-Rückcheck"}</button>
    </div>
  );
}

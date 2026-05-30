import Link from "next/link";
import { EVIDENCE, EvidenceLevel } from "@/lib/evidence";

export function EvidenceBadge({ level, withNote = false }: { level: EvidenceLevel; withNote?: boolean }) {
  const e = EVIDENCE[level];
  return (
    <span className="chip" style={{ borderColor: `${e.color}55`, color: e.color }} title={e.note}>
      <span>{e.emoji}</span>
      <span>{e.label}</span>
      {withNote && <span className="text-slate-400">· {e.note}</span>}
    </span>
  );
}

export function Card({
  title,
  level,
  action,
  children,
  className = "",
}: {
  title?: string;
  level?: EvidenceLevel;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {(title || level || action) && (
        <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            {title && <h2 className="text-lg font-semibold text-white">{title}</h2>}
            {level && <EvidenceBadge level={level} />}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-ink-soft/60 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

export function Bar({ value, color = "#7c6cf6" }: { value: number; color?: string }) {
  return (
    <div className="bar">
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
    </div>
  );
}

export function CardLink({ href, title, desc, emoji }: { href: string; title: string; desc: string; emoji: string }) {
  return (
    <Link href={href} className="card group transition hover:border-accent/50">
      <div className="text-2xl">{emoji}</div>
      <div className="mt-2 font-semibold text-white group-hover:text-accent-soft">{title}</div>
      <div className="mt-1 text-sm text-slate-400">{desc}</div>
    </Link>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-slate-400">{children}</div>;
}

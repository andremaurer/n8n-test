"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard", emoji: "🧭" },
  { href: "/people", label: "Profile", emoji: "👤" },
  { href: "/finance", label: "Freiheit & Geld", emoji: "💸" },
  { href: "/business", label: "Geschäftsfelder", emoji: "🚀" },
  { href: "/constellations", label: "Konstellationen", emoji: "🕸️" },
  { href: "/freedom", label: "Praxis & Journal", emoji: "🌱" },
  { href: "/synthesis", label: "KI-Synthese", emoji: "✨" },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="sticky top-0 z-20 border-b border-white/10 bg-ink/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-3">
        <Link href="/" className="mr-3 whitespace-nowrap font-semibold text-white">
          <span className="text-accent-soft">◆</span> Lebens-Optimierer
        </Link>
        {LINKS.map((l) => {
          const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition ${
                active ? "bg-accent/20 text-accent-soft" : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <span className="mr-1">{l.emoji}</span>
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

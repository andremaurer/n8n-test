import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { SWRegister } from "@/components/SWRegister";

export const metadata: Metadata = {
  title: "Lebens-Optimierer",
  description: "Selbstverständnis, Geschäftsfelder, Lebensausrichtung und finanzielle Freiheit.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0f1117",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <SWRegister />
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 pb-10 pt-6 text-xs text-slate-500">
          Kein Ersatz für medizinische, psychologische, steuerliche oder Anlageberatung. Deutungssysteme
          (Astrologie, Human Design, Numerologie) sind als Reflexionswerkzeuge gekennzeichnet, nicht als
          wissenschaftliche Fakten. Deine Daten bleiben lokal in dieser Anwendung.
        </footer>
      </body>
    </html>
  );
}

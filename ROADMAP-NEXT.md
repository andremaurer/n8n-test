# Ausbau-Analyse — was nach v1 noch reingehört

> Stand nach dem ersten Bau. Priorisiert nach **Wirkung auf dein Ziel (Freiheit)** × **Aufwand**.
> Evidenz-Labels wie in der App: 🟢 evidenzbasiert · 🟡 Heuristik · 🔵 Deutung · ⚪ Praxis.

## A) Quick Wins (kleiner Aufwand, sofort spürbar)

1. **Geburtsort-Autocomplete + automatische Zeitzone** 🟢
   Ortssuche (Open-Meteo/Nominatim Geocoding, kostenlos) → füllt Lat/Lng/Zeitzone automatisch.
   Schaltet Aszendent & Häuser ohne manuelle Koordinaten frei. *Aufwand: niedrig.*
2. **PDF-/Print-Export des Profils** 🟢 — „Mein Kompass“ als Dokument zum Mitnehmen. *niedrig.*
3. **Daten-Export/-Import (JSON) + Backup** 🟢 — Datenhoheit, Umzug zwischen Geräten. *niedrig.*
4. **Re-Assessment-Verlauf** 🟢 — Big Five über Zeit als Linien-Chart (Veränderung sichtbar). *niedrig.*
5. **Wheel of Life Check-in** 🟡 — 8 Lebensbereiche, wöchentlich, als Radar-Chart. *niedrig.*

## B) Mehr Selbst-Verständnis (Methoden-Breite)

6. **HEXACO** 🟢 — Big Five + „Ehrlichkeit-Bescheidenheit“; besserer Prädiktor für Integrität/Geld-Ethik.
7. **RIASEC (Holland-Codes)** 🟢 — Interessens-Profil → direkter Input fürs Geschäftsfeld-Matching.
8. **Schwartz-Werte-Test** 🟢 — explizite Wertehierarchie; Grundlage für „passt das langfristig?“.
9. **VIA-Charakterstärken** 🟢 — Stärken-Sprache als offene CliftonStrengths-Alternative.
10. **Enneagramm & DISG** 🟡 — Kernmotivation bzw. Verhaltensstil im Team/Verkauf.
11. **Ikigai-Modul** 🟡 — Schnittmenge Können/Lieben/Bezahltwerden/Weltbedarf als Geschäftsfeld-Kompass.

## C) Astrologie & Human Design vertiefen (🔵)

12. **Echter Mondknoten (True Node)** statt mittlerem — exakter für HD-Knoten-Tore.
13. **Aspekte & Aspekt-Tabelle** (Konjunktion/Trigon/Quadrat …) inkl. Orbis.
14. **Transit-Timeline** — kommende Schlüssel-Transite (Saturn/Jupiter über Geburtsplaneten) als Kalender.
15. **Synastrie** — Partner-/Team-Horoskop-Vergleich (Composite, Inter-Aspekte) für Konstellationen.
16. **Voll-BodyGraph-Grafik** — visuelles HD-Diagramm (SVG) mit Toren/Kanälen/Zentren.
17. **Gene Keys** 🔵 — Sphären/Sequenzen auf Basis der bereits berechneten Tore.

## D) Geschäftsfeld & Geld (näher am Ziel)

18. **Skill-Inventar → Monetarisierungs-Matrix** 🟢 — welche Stärken am schnellsten zu Cash.
19. **Markt-/Trend-Daten andocken** 🟡 — Branchen-Nachfrage/Keywords (z. B. Semrush) ins Scoring.
20. **Cashflow-Forecast & mehrere FIRE-Szenarien** 🟢 — Sparplan, Lean/Fat-FIRE, Coast-FIRE.
21. **Schweiz-spezifisch** 🟢 — Säule 3a, Pensionskasse, Vermögenssteuer in den Freiheits-Rechner.
22. **Banking-/Buchhaltungs-Import** 🟢 — Ist-Ausgaben automatisch (CSV; später Zoho Books / n8n).

## E) Ausrichtung über die Zeit

23. **Lebensphasen-Board** 🟡 — aktive Phase, Prioritäten, offene Entscheidungen (Modell ist schon da).
24. **Entscheidungs-Assistent** 🟢 — Pro/Contra mit Werte-Gewichtung + Verhaltensökonomie-Checks
    (Verlustaversion, Sunk Cost) vor grossen Geld-/Lebensentscheidungen.
25. **Ziel→Gewohnheit-Brücke** ⚪ — Ziele automatisch in trackbare Schlüsselgewohnheiten übersetzen.

## F) KI-Schicht ausbauen

26. **Kuratierte Wissensbasis (RAG)** 🟢 — pro System Referenztexte; KI zitiert mit Quelle + Label.
27. **Mehrere Experten-Personas** — Psychologe / Finanzplaner / HD-Analyst, dann Integrator-Synthese.
28. **Chat „Frag dein Profil“** — Fragen in natürlicher Sprache gegen deine eigenen Daten.
29. **Wöchentlicher KI-Report** — Zusammenfassung + 3 nächste Schritte (per n8n als Mail).

## G) Plattform & Vertrauen

30. **Verschlüsselung at rest** 🟢 — sensible Felder verschlüsseln; optional clientseitige Astro-Berechnung.
31. **Multi-Device-Sync** — optional Supabase-Backend (MCP vorhanden) statt nur lokaler SQLite.
32. **PWA / Mobile** — installierbar, offline-fähig, Push-Erinnerungen für Check-ins.
33. **n8n-Automationen** — Erinnerungen, Reports, Daten-Sync (Repo-Name passt — n8n-MCP vorhanden).
34. **Optional Auth** — falls Familienmitglieder später eigene Logins bekommen sollen (heute bewusst aus).

---

## Empfohlene nächste 3 Schritte

1. **#1 Geburtsort-Autocomplete** → schaltet Aszendent/Häuser für alle Profile frei (grösster Effekt/Aufwand).
2. **#7 RIASEC + #18 Skill-Matrix** → macht das Geschäftsfeld-Modul wirklich aussagekräftig (= dein Ziel).
3. **#26 RAG-Wissensbasis + ANTHROPIC_API_KEY** → hebt die KI-Synthese auf echtes Experten-Niveau.

> Hinweis zur Ehrlichkeit: Der Ausbau von Deutungssystemen (C) erhöht die *Tiefe der Reflexion*,
> nicht die *Vorhersagekraft*. Der grösste reale Hebel auf „Wohlstand = Freiheit“ liegt in
> Block **D** (Geschäftsfeld & Geld) und **E/F** (bessere Entscheidungen).

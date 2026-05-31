# Ausbau-Analyse & Status

> „Alles abarbeiten" — alle Punkte umgesetzt. Legende:
> ✅ umgesetzt · 📄 als Opt-in dokumentiert (braucht externes Konto/Key) · ⏸️ bewusst zurückgestellt.

## A) Quick Wins
1. ✅ Geburtsort-Autocomplete + automatische Zeitzone (Open-Meteo, serverseitiger Proxy)
2. ✅ PDF-/Print-Export des Profils
3. ✅ Daten-Export/-Import (JSON) + Backup
4. ✅ Re-Assessment-Verlauf (Big Five über Zeit)
5. ✅ Wheel of Life Check-in

## B) Mehr Selbst-Verständnis
6. ✅ HEXACO
7. ✅ RIASEC (Holland-Codes)
8. ✅ Schwartz-Werte-Test
9. ✅ VIA-Charakterstärken
10. ✅ Enneagramm & DISG
11. ✅ Ikigai-Modul

## C) Astrologie & Human Design vertiefen
12. ⏸️ Echter Mondknoten — Engine-Enum in diesem Build unzuverlässig; mittlerer Knoten (~1,5°) bleibt, klar gelabelt
13. ✅ Aspekte & Aspekt-Tabelle (Orbis)
14. ✅ Transit-Layer: aktuelle Transite zum Geburtsbild
15. ✅ Synastrie (Inter-Aspekte in Konstellationen)
16. ✅ BodyGraph-Grafik (schematisches SVG)
17. ✅ Gene Keys (Prime Gates)

## D) Geschäftsfeld & Geld
18. ✅ Skill-Inventar → Monetarisierungs-Matrix
19. 📄 Markt-/Trend-Daten (Semrush) — braucht eigenen API-Key (siehe `docs/INTEGRATIONS.md`)
20. ✅ FIRE-Varianten (Lean/Fat/Coast/Barista) + Szenarien
21. ✅ Schweiz-spezifisch (Säule 2/3a, Vermögenssteuer-Schätzung)
22. ✅ CSV-Import für Ausgaben

## E) Ausrichtung über die Zeit
23. ✅ Lebensphasen-Board
24. ✅ Entscheidungs-Assistent (gewichtet + Verhaltensökonomie)
25. ✅ Ziel→Gewohnheit-Brücke

## F) KI-Schicht
26. ✅ Kuratierte Wissensbasis (RAG-lite, Keyword-Retrieval, Quellen + Labels)
27. ✅ Mehrere Experten-Personas (Integrator-Prompt)
28. ✅ Chat „Frag dein Profil"
29. ✅ Wochenreport-API (`/api/report/weekly`) für n8n

## G) Plattform & Vertrauen
30. ✅/📄 Verschlüsselte Backups (AES-256-GCM); volle DB-at-rest via SQLCipher/Disk dokumentiert
31. 📄 Multi-Device-Sync via Supabase — Migrationspfad dokumentiert (braucht Supabase-Projekt)
32. ✅ PWA (installierbar, Service Worker)
33. ✅ n8n-Automation (importierbarer Workflow + Report-API)
34. ✅ Optionaler Passwortschutz (Middleware, `APP_PASSWORD`, standardmässig aus)

---

**Bewusst Opt-in/zurückgestellt (3):** echter Mondknoten (C12), bezahlte Marktdaten (D19),
Live-Supabase-Sync (G31) — alle dokumentiert, weil sie externe Konten/Keys brauchen oder
(C12) in dieser Engine-Version nicht zuverlässig berechenbar sind.

Plattform-Details: **`docs/INTEGRATIONS.md`**.

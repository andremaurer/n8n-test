"use client";

import { useEffect, useRef, useState } from "react";

interface Cand { label: string; lat: number; lng: number; timezone: string }

// Birth-place search. Fills hidden lat/lng/timezone fields in the surrounding
// form so the server action stores coordinates → ascendant & houses unlock.
export function PlaceAutocomplete({
  defaultPlace = "",
  defaultLat,
  defaultLng,
  defaultTimezone = "Europe/Zurich",
}: {
  defaultPlace?: string;
  defaultLat?: number | null;
  defaultLng?: number | null;
  defaultTimezone?: string;
}) {
  const [query, setQuery] = useState(defaultPlace);
  const [lat, setLat] = useState<number | null>(defaultLat ?? null);
  const [lng, setLng] = useState<number | null>(defaultLng ?? null);
  const [tz, setTz] = useState(defaultTimezone);
  const [cands, setCands] = useState<Cand[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<any>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (query.trim().length < 2 || query === defaultPlace) return;
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        const d = await r.json();
        setCands(d.results || []);
        setOpen(true);
      } catch {
        setCands([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => timer.current && clearTimeout(timer.current);
  }, [query, defaultPlace]);

  function pick(c: Cand) {
    setQuery(c.label);
    setLat(c.lat);
    setLng(c.lng);
    setTz(c.timezone);
    setOpen(false);
  }

  return (
    <div className="relative sm:col-span-3">
      <label className="label">Geburtsort (Suche)</label>
      <input
        name="birthPlace"
        className="input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => cands.length && setOpen(true)}
        placeholder="Stadt eingeben, z. B. Bern …"
        autoComplete="off"
      />
      <input type="hidden" name="birthLat" value={lat ?? ""} />
      <input type="hidden" name="birthLng" value={lng ?? ""} />
      <input type="hidden" name="timezone" value={tz} />
      <div className="mt-1 text-xs text-slate-500">
        {lat != null && lng != null ? `📍 ${lat.toFixed(3)}, ${lng.toFixed(3)} · ${tz}` : loading ? "suche …" : "Wähle einen Vorschlag, um Koordinaten & Zeitzone zu setzen."}
      </div>
      {open && cands.length > 0 && (
        <ul className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-white/10 bg-ink-card shadow-xl">
          {cands.map((c, i) => (
            <li key={i}>
              <button type="button" onClick={() => pick(c)} className="block w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/5">
                {c.label} <span className="text-slate-500">· {c.timezone}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

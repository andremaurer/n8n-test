import { NextResponse } from "next/server";

// Server-side proxy to Open-Meteo geocoding (free, no API key). Returns place
// candidates with coordinates and IANA timezone — unlocks ascendant/houses.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = (searchParams.get("q") || "").trim();
  if (name.length < 2) return NextResponse.json({ results: [] });
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=6&language=de&format=json`;
    const r = await fetch(url, { next: { revalidate: 86400 } });
    const data = await r.json();
    const results = (data.results || []).map((x: any) => ({
      label: [x.name, x.admin1, x.country].filter(Boolean).join(", "),
      lat: x.latitude,
      lng: x.longitude,
      timezone: x.timezone,
    }));
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [], error: "geocode_failed" }, { status: 200 });
  }
}

import * as A from "astronomy-engine";
import { localToUtc, hasBirthTime } from "./time";

// Tropical, geocentric, ecliptic-of-date positions via Swiss-grade ephemeris
// (astronomy-engine derives from VSOP87/NOVAS; sub-arcminute accuracy).

export const SIGNS = [
  "Widder",
  "Stier",
  "Zwillinge",
  "Krebs",
  "Löwe",
  "Jungfrau",
  "Waage",
  "Skorpion",
  "Schütze",
  "Steinbock",
  "Wassermann",
  "Fische",
] as const;

export const SIGN_GLYPHS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

const PLANETS: { name: string; body: A.Body; glyph: string }[] = [
  { name: "Sonne", body: A.Body.Sun, glyph: "☉" },
  { name: "Mond", body: A.Body.Moon, glyph: "☽" },
  { name: "Merkur", body: A.Body.Mercury, glyph: "☿" },
  { name: "Venus", body: A.Body.Venus, glyph: "♀" },
  { name: "Mars", body: A.Body.Mars, glyph: "♂" },
  { name: "Jupiter", body: A.Body.Jupiter, glyph: "♃" },
  { name: "Saturn", body: A.Body.Saturn, glyph: "♄" },
  { name: "Uranus", body: A.Body.Uranus, glyph: "♅" },
  { name: "Neptun", body: A.Body.Neptune, glyph: "♆" },
  { name: "Pluto", body: A.Body.Pluto, glyph: "♇" },
];

export interface PlanetPosition {
  name: string;
  glyph: string;
  longitude: number; // 0-360 ecliptic of date
  sign: string;
  signGlyph: string;
  degreeInSign: number; // 0-30
  retrograde: boolean;
}

export interface NatalChart {
  utc: string;
  hasTime: boolean;
  planets: PlanetPosition[];
  ascendant?: { longitude: number; sign: string; degreeInSign: number };
  midheaven?: { longitude: number; sign: string; degreeInSign: number };
  // Whole-sign houses: house N rises with the ascendant's sign.
  houses?: { house: number; sign: string }[];
  sunSign: string;
  moonSign: string;
}

function norm360(x: number): number {
  return ((x % 360) + 360) % 360;
}

export function signOf(longitude: number) {
  const l = norm360(longitude);
  const idx = Math.floor(l / 30);
  return { index: idx, sign: SIGNS[idx], glyph: SIGN_GLYPHS[idx], degreeInSign: l - idx * 30 };
}

// Geocentric ecliptic-of-date longitude for a planet.
function eclipticLongitude(body: A.Body, time: A.AstroTime): number {
  if (body === A.Body.Sun) return norm360(A.SunPosition(time).elon);
  if (body === A.Body.Moon) return norm360(A.EclipticGeoMoon(time).lon);
  const vec = A.GeoVector(body, time, true); // aberration-corrected, EQJ
  return norm360(A.Ecliptic(vec).elon); // -> true ecliptic of date
}

function isRetrograde(body: A.Body, time: A.AstroTime): boolean {
  if (body === A.Body.Sun || body === A.Body.Moon) return false;
  const before = eclipticLongitude(body, time.AddDays(-1));
  const after = eclipticLongitude(body, time.AddDays(1));
  let d = after - before;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d < 0;
}

// Mean obliquity of the ecliptic (Laskar), good to arcseconds for our era.
function meanObliquityDeg(time: A.AstroTime): number {
  const T = (time.tt) / 36525; // Julian centuries TT from J2000
  const seconds =
    84381.406 -
    46.836769 * T -
    0.0001831 * T * T +
    0.0020034 * T * T * T;
  return seconds / 3600;
}

export function computeNatalChart(
  birthDate: string,
  birthTime: string | null | undefined,
  timeZone: string | null | undefined,
  lat?: number | null,
  lng?: number | null
): NatalChart {
  const utc = localToUtc(birthDate, birthTime, timeZone || undefined);
  const time = A.MakeTime(utc);
  const withTime = hasBirthTime(birthTime);

  const planets: PlanetPosition[] = PLANETS.map((p) => {
    const lon = eclipticLongitude(p.body, time);
    const s = signOf(lon);
    return {
      name: p.name,
      glyph: p.glyph,
      longitude: lon,
      sign: s.sign,
      signGlyph: s.glyph,
      degreeInSign: s.degreeInSign,
      retrograde: isRetrograde(p.body, time),
    };
  });

  const chart: NatalChart = {
    utc: utc.toISOString(),
    hasTime: withTime,
    planets,
    sunSign: planets[0].sign,
    moonSign: planets[1].sign,
  };

  // Ascendant / MC / houses need exact time AND birth coordinates.
  if (withTime && typeof lat === "number" && typeof lng === "number") {
    const gstHours = A.SiderealTime(time); // Greenwich apparent sidereal time (hours)
    const lstDeg = norm360(gstHours * 15 + lng); // local sidereal time in degrees (RAMC)
    const ramc = (lstDeg * Math.PI) / 180;
    const eps = (meanObliquityDeg(time) * Math.PI) / 180;
    const phi = (lat * Math.PI) / 180;

    // Ascendant ecliptic longitude (standard spherical-astronomy formula).
    let asc =
      Math.atan2(
        Math.cos(ramc),
        -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps))
      ) *
      (180 / Math.PI);
    asc = norm360(asc);
    const ascS = signOf(asc);

    // Midheaven = ecliptic longitude where RA = RAMC.
    let mc = Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps)) * (180 / Math.PI);
    mc = norm360(mc);
    const mcS = signOf(mc);

    chart.ascendant = { longitude: asc, sign: ascS.sign, degreeInSign: ascS.degreeInSign };
    chart.midheaven = { longitude: mc, sign: mcS.sign, degreeInSign: mcS.degreeInSign };
    chart.houses = Array.from({ length: 12 }, (_, i) => ({
      house: i + 1,
      sign: SIGNS[(ascS.index + i) % 12],
    }));
  }

  return chart;
}

// Current transits (the "current, specific to me" layer).
export function currentTransits(date = new Date()): PlanetPosition[] {
  const time = A.MakeTime(date);
  return PLANETS.map((p) => {
    const lon = eclipticLongitude(p.body, time);
    const s = signOf(lon);
    return {
      name: p.name,
      glyph: p.glyph,
      longitude: lon,
      sign: s.sign,
      signGlyph: s.glyph,
      degreeInSign: s.degreeInSign,
      retrograde: isRetrograde(p.body, time),
    };
  });
}

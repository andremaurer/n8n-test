import * as A from "astronomy-engine";
import { localToUtc } from "./time";

// Human Design (🔵 interpretive). Gate wheel verified against two anchors:
//  - Gate 25 spans 28°15' Pisces → 3°52'30" Aries (start offset 358.25°)
//  - that offset independently yields Gate 41 at 2°00' Aquarius (canonical).
// Each gate = 5.625°, each of 6 lines = 0.9375°.

const GATE_START_OFFSET = 358.25; // ecliptic longitude where Gate 25 begins
const GATE_SIZE = 360 / 64; // 5.625
const LINE_SIZE = GATE_SIZE / 6; // 0.9375

// Zodiacal order of gates, beginning with the gate containing 0° Aries (Gate 25).
const GATE_ORDER = [
  25, 17, 21, 51, 42, 3, 27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53,
  62, 56, 31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50, 28, 44,
  1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60, 41, 19, 13, 49, 30, 55,
  37, 63, 22, 36,
];

type Center =
  | "Head"
  | "Ajna"
  | "Throat"
  | "G"
  | "Heart"
  | "Sacral"
  | "SolarPlexus"
  | "Spleen"
  | "Root";

export const CENTER_LABELS: Record<Center, string> = {
  Head: "Kopf",
  Ajna: "Ajna",
  Throat: "Kehle",
  G: "G / Identität",
  Heart: "Herz / Ego",
  Sacral: "Sakral",
  SolarPlexus: "Solarplexus",
  Spleen: "Milz",
  Root: "Wurzel",
};

const MOTORS: Center[] = ["Sacral", "SolarPlexus", "Heart", "Root"];

const GATE_TO_CENTER: Record<number, Center> = {};
const assign = (c: Center, gates: number[]) => gates.forEach((g) => (GATE_TO_CENTER[g] = c));
assign("Head", [61, 63, 64]);
assign("Ajna", [4, 11, 17, 24, 43, 47]);
assign("Throat", [8, 12, 16, 20, 23, 31, 33, 35, 45, 56, 62]);
assign("G", [1, 2, 7, 10, 13, 15, 25, 46]);
assign("Heart", [21, 26, 40, 51]);
assign("Sacral", [3, 5, 9, 14, 27, 29, 34, 42, 59]);
assign("SolarPlexus", [6, 22, 30, 36, 37, 49, 55]);
assign("Spleen", [18, 28, 32, 44, 48, 50, 57]);
assign("Root", [19, 38, 39, 41, 52, 53, 54, 58, 60]);

// The 36 channels (gate pairs).
const CHANNELS: [number, number][] = [
  [1, 8], [2, 14], [3, 60], [4, 63], [5, 15], [6, 59], [7, 31], [9, 52],
  [10, 20], [10, 34], [10, 57], [11, 56], [12, 22], [13, 33], [16, 48],
  [17, 62], [18, 58], [19, 49], [20, 34], [20, 57], [21, 45], [23, 43],
  [24, 61], [25, 51], [26, 44], [27, 50], [28, 38], [29, 46], [30, 41],
  [32, 54], [34, 57], [35, 36], [37, 40], [39, 55], [42, 53], [47, 64],
];

const PLANET_NAMES = [
  "Sonne", "Erde", "Mond", "Nordknoten", "Südknoten", "Merkur", "Venus",
  "Mars", "Jupiter", "Saturn", "Uranus", "Neptun", "Pluto",
];

export interface Activation {
  planet: string;
  gate: number;
  line: number;
  center: Center;
}

export interface HumanDesignChart {
  type: string;
  strategy: string;
  authority: string;
  profile: string;
  signature: string;
  notSelf: string;
  definedCenters: Center[];
  openCenters: Center[];
  definedChannels: string[];
  personality: Activation[]; // conscious
  design: Activation[]; // unconscious
  note: string;
}

function norm360(x: number): number {
  return ((x % 360) + 360) % 360;
}

function gateLineFromLongitude(lon: number): { gate: number; line: number } {
  const pos = norm360(lon - GATE_START_OFFSET);
  const idx = Math.floor(pos / GATE_SIZE) % 64;
  const within = pos - idx * GATE_SIZE;
  const line = Math.floor(within / LINE_SIZE) + 1;
  return { gate: GATE_ORDER[idx], line: Math.min(6, Math.max(1, line)) };
}

function eclLon(body: A.Body, time: A.AstroTime): number {
  if (body === A.Body.Sun) return norm360(A.SunPosition(time).elon);
  if (body === A.Body.Moon) return norm360(A.EclipticGeoMoon(time).lon);
  return norm360(A.Ecliptic(A.GeoVector(body, time, true)).elon);
}

// Mean lunar ascending node longitude (degrees) — true node would need osculating
// orbit; mean node is accurate to ~1.5° and clearly labelled.
function meanNodeLongitude(time: A.AstroTime): number {
  const T = time.tt / 36525;
  return norm360(
    125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + (T * T * T) / 467441
  );
}

function activationsAt(time: A.AstroTime): Activation[] {
  const sun = eclLon(A.Body.Sun, time);
  const node = meanNodeLongitude(time);
  const lons: number[] = [
    sun, // Sonne
    norm360(sun + 180), // Erde
    eclLon(A.Body.Moon, time), // Mond
    node, // Nordknoten
    norm360(node + 180), // Südknoten
    eclLon(A.Body.Mercury, time),
    eclLon(A.Body.Venus, time),
    eclLon(A.Body.Mars, time),
    eclLon(A.Body.Jupiter, time),
    eclLon(A.Body.Saturn, time),
    eclLon(A.Body.Uranus, time),
    eclLon(A.Body.Neptune, time),
    eclLon(A.Body.Pluto, time),
  ];
  return lons.map((lon, i) => {
    const gl = gateLineFromLongitude(lon);
    return { planet: PLANET_NAMES[i], gate: gl.gate, line: gl.line, center: GATE_TO_CENTER[gl.gate] };
  });
}

export function computeHumanDesign(
  birthDate: string,
  birthTime: string | null | undefined,
  timeZone: string | null | undefined
): HumanDesignChart {
  const utc = localToUtc(birthDate, birthTime, timeZone || undefined);
  const birth = A.MakeTime(utc);

  // Design = moment the Sun was 88° of arc earlier (~88.x days before birth).
  const birthSun = eclLon(A.Body.Sun, birth);
  const target = norm360(birthSun - 88);
  const searchStart = birth.AddDays(-95);
  const designTime = A.SearchSunLongitude(target, searchStart, 20) ?? birth.AddDays(-88);

  const personality = activationsAt(birth);
  const design = activationsAt(designTime);
  const all = [...personality, ...design];

  // Active gates → defined channels → defined centers.
  const activeGates = new Set(all.map((a) => a.gate));
  const definedChannels: string[] = [];
  const definedCenters = new Set<Center>();
  const adjacency = new Map<Center, Set<Center>>();
  for (const [a, b] of CHANNELS) {
    if (activeGates.has(a) && activeGates.has(b)) {
      definedChannels.push(`${a}-${b}`);
      const ca = GATE_TO_CENTER[a];
      const cb = GATE_TO_CENTER[b];
      definedCenters.add(ca);
      definedCenters.add(cb);
      if (!adjacency.has(ca)) adjacency.set(ca, new Set());
      if (!adjacency.has(cb)) adjacency.set(cb, new Set());
      adjacency.get(ca)!.add(cb);
      adjacency.get(cb)!.add(ca);
    }
  }

  const sacralDefined = definedCenters.has("Sacral");
  const throatDefined = definedCenters.has("Throat");

  // Is the Throat connected (through defined channels) to any motor center?
  function throatConnectedToMotor(): boolean {
    if (!throatDefined) return false;
    const seen = new Set<Center>(["Throat"]);
    const stack: Center[] = ["Throat"];
    while (stack.length) {
      const cur = stack.pop()!;
      if (MOTORS.includes(cur)) return true;
      for (const nb of adjacency.get(cur) ?? []) {
        if (!seen.has(nb)) {
          seen.add(nb);
          stack.push(nb);
        }
      }
    }
    return false;
  }

  let type: string;
  let strategy: string;
  let signature: string;
  let notSelf: string;

  if (definedCenters.size === 0) {
    type = "Reflektor";
    strategy = "Einen Mondzyklus (28 Tage) abwarten, bevor du grosse Entscheidungen triffst";
    signature = "Überraschung";
    notSelf = "Enttäuschung";
  } else if (sacralDefined) {
    const motorToThroat = throatConnectedToMotor();
    type = motorToThroat ? "Manifestierender Generator" : "Generator";
    strategy = "Auf etwas reagieren (warten, bis es da ist) und der sakralen Antwort folgen";
    signature = "Zufriedenheit";
    notSelf = "Frustration";
  } else if (throatDefined && throatConnectedToMotor()) {
    type = "Manifestor";
    strategy = "Informieren, bevor du handelst — dann initiieren";
    signature = "Frieden";
    notSelf = "Wut";
  } else {
    type = "Projektor";
    strategy = "Auf die Einladung warten (für Liebe, Arbeit, Beziehung)";
    signature = "Erfolg";
    notSelf = "Verbitterung";
  }

  // Inner authority (standard hierarchy).
  let authority: string;
  if (definedCenters.has("SolarPlexus")) authority = "Emotional (Solarplexus)";
  else if (definedCenters.has("Sacral")) authority = "Sakral";
  else if (definedCenters.has("Spleen")) authority = "Milz (Splenisch)";
  else if (definedCenters.has("Heart")) authority = "Ego / Herz";
  else if (definedCenters.has("G")) authority = "Selbst-projiziert (G)";
  else if (type === "Reflektor") authority = "Lunar (Mondzyklus)";
  else authority = "Mental / Umgebung (kein innerer Autoritäts-Center)";

  // Profile = personality Sun line / design Sun line.
  const persSunLine = personality[0].line;
  const desSunLine = design[0].line;
  const profile = `${persSunLine}/${desSunLine}`;

  const allCenters: Center[] = [
    "Head", "Ajna", "Throat", "G", "Heart", "Sacral", "SolarPlexus", "Spleen", "Root",
  ];

  return {
    type,
    strategy,
    authority,
    profile,
    signature,
    notSelf,
    definedCenters: allCenters.filter((c) => definedCenters.has(c)),
    openCenters: allCenters.filter((c) => !definedCenters.has(c)),
    definedChannels,
    personality,
    design,
    note: "Nordknoten/Südknoten über mittleren Mondknoten berechnet (~1,5° genau).",
  };
}

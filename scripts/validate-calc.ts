import { computeNatalChart, currentTransits } from "../src/lib/astrology";
import { computeHumanDesign } from "../src/lib/humandesign";
import { computeNumerology } from "../src/lib/numerology";
import { computeFire } from "../src/lib/fire";
import { scoreBigFive } from "../src/lib/assessments";

const date = "1989-06-01";
const time = "12:37";
const tz = "Europe/Zurich";

console.log("=== NATAL CHART (1989-06-01 12:37 Europe/Zurich) ===");
// Use Zurich coordinates as a stand-in birth place to exercise ascendant math.
const chart = computeNatalChart(date, time, tz, 47.3769, 8.5417);
console.log("UTC:", chart.utc);
for (const p of chart.planets) {
  console.log(
    `${p.glyph} ${p.name.padEnd(8)} ${p.sign.padEnd(11)} ${p.degreeInSign.toFixed(2)}°${p.retrograde ? " R" : ""}`
  );
}
console.log("Ascendant:", chart.ascendant);
console.log("MC:", chart.midheaven);

console.log("\n=== HUMAN DESIGN ===");
const hd = computeHumanDesign(date, time, tz);
console.log("Type:", hd.type, "| Authority:", hd.authority, "| Profile:", hd.profile);
console.log("Strategy:", hd.strategy);
console.log("Defined centers:", hd.definedCenters.join(", "));
console.log("Defined channels:", hd.definedChannels.join(", "));
console.log("Personality Sun:", hd.personality[0]);
console.log("Design Sun:", hd.design[0]);

console.log("\n=== NUMEROLOGY ===");
console.log(computeNumerology(date, "André Maurer"));

console.log("\n=== FIRE (example) ===");
console.log(
  computeFire({
    monthlyIncomeActive: 8000,
    monthlyIncomePassive: 500,
    monthlyExpenses: 5000,
    netWorth: 120000,
    withdrawalRate: 0.04,
    expectedReturn: 0.05,
    currency: "CHF",
  })
);

console.log("\n=== BIG FIVE (all neutral = 3) ===");
const neutral: Record<number, number> = {};
for (let i = 1; i <= 50; i++) neutral[i] = 3;
console.log(scoreBigFive(neutral));

console.log("\n=== CURRENT SUN TRANSIT ===");
const t = currentTransits();
console.log(`${t[0].glyph} Sonne ${t[0].sign} ${t[0].degreeInSign.toFixed(2)}°`);

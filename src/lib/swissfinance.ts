// Swiss household & income-strategy math. Drives the path from today's
// foto/video agency toward 15-20k CHF/month payout and 1-5M CHF net worth.
// All values CHF. Educational only — not tax/financial advice.

export interface AccountLike {
  kind: string;
  balance: number;
  expectedYield: number;
  liquid: boolean;
}

export interface NetWorthBreakdown {
  total: number;
  liquid: number;
  retirement: number; // pillar 2 + 3a (locked)
  p2p: number; // Debitum, Mintos
  debt: number;
  byKind: Record<string, number>;
  blendedYield: number; // weighted expected yield across yielding assets
}

export function summarizeAccounts(accounts: AccountLike[]): NetWorthBreakdown {
  const byKind: Record<string, number> = {};
  let total = 0;
  let liquid = 0;
  let retirement = 0;
  let p2p = 0;
  let debt = 0;
  let yieldBase = 0;
  let yieldSum = 0;

  for (const a of accounts) {
    const signed = a.kind === "DEBT" ? -Math.abs(a.balance) : a.balance;
    byKind[a.kind] = (byKind[a.kind] ?? 0) + signed;
    total += signed;
    if (a.kind === "DEBT") debt += Math.abs(a.balance);
    else if (a.liquid) liquid += a.balance;
    if (a.kind === "PILLAR2" || a.kind === "PILLAR3A") retirement += a.balance;
    if (a.kind === "P2P") p2p += a.balance;
    if (a.expectedYield > 0 && a.balance > 0) {
      yieldBase += a.balance;
      yieldSum += a.balance * a.expectedYield;
    }
  }
  return {
    total,
    liquid,
    retirement,
    p2p,
    debt,
    byKind,
    blendedYield: yieldBase > 0 ? yieldSum / yieldBase : 0,
  };
}

// "Income freedom" = covering target monthly payout from active+passive income,
// distinct from "capital freedom" (the FIRE number). You want the income target
// short-term (15-20k/month) AND the capital target long-term (1-5M).
export interface IncomeFreedom {
  targetMonthly: number;
  currentMonthly: number;
  gap: number; // how much more per month is needed
  pct: number; // 0-1 progress toward target
  passiveMonthly: number; // from account yields (annual/12)
  passivePctOfTarget: number;
}

export function computeIncomeFreedom(
  streams: { kind: string; monthlyNow: number }[],
  accounts: AccountLike[],
  targetMonthly: number
): IncomeFreedom {
  const currentMonthly = streams.reduce((s, x) => s + x.monthlyNow, 0);
  const passiveMonthly =
    accounts.reduce((s, a) => s + (a.balance > 0 ? a.balance * a.expectedYield : 0), 0) / 12;
  const totalNow = currentMonthly + passiveMonthly;
  return {
    targetMonthly,
    currentMonthly: totalNow,
    gap: Math.max(0, targetMonthly - totalNow),
    pct: targetMonthly > 0 ? Math.min(1, totalNow / targetMonthly) : 0,
    passiveMonthly,
    passivePctOfTarget: targetMonthly > 0 ? Math.min(1, passiveMonthly / targetMonthly) : 0,
  };
}

// --- Swiss owner-salary vs. dividend & partner-employment optimization ------
// Simplified GmbH/AG logic: salary is AHV/ALV-liable and builds pension+3a room
// but is income-taxed; dividends avoid AHV but are taxed at ~70% (privileged).
// Employing the partner splits income (progression) and builds her AHV/PK.

export const CH_2026 = {
  ahvEmployeeRate: 0.053, // ~5.3% employee share (AHV/IV/EO)
  ahvEmployerRate: 0.053,
  alvRate: 0.011, // up to ceiling
  pillar3aMaxWithPK: 7258, // CHF/year with pension fund
  pillar3aMaxNoPK: 36288, // 20% of income, cap
  dividendTaxablePortion: 0.7, // privileged dividend taxation (federal)
};

export interface SalaryStrategyInput {
  companyProfit: number; // distributable annual profit (CHF) before owner comp
  ownerSalary: number; // gross salary to owner
  partnerSalary: number; // gross salary to employed partner
  marginalTaxRate: number; // household marginal income tax (e.g. 0.25)
}

export interface SalaryStrategyResult {
  ownerAhv: number;
  partnerAhv: number;
  totalAhvCost: number; // employee+employer both sides
  dividendRoom: number; // profit left after salaries
  dividendTax: number;
  pillar3aRoomOwner: number;
  pillar3aRoomPartner: number;
  notes: string[];
}

export function computeSalaryStrategy(i: SalaryStrategyInput): SalaryStrategyResult {
  const ownerAhv = i.ownerSalary * (CH_2026.ahvEmployeeRate + CH_2026.ahvEmployerRate);
  const partnerAhv = i.partnerSalary * (CH_2026.ahvEmployeeRate + CH_2026.ahvEmployerRate);
  const dividendRoom = Math.max(0, i.companyProfit - i.ownerSalary - i.partnerSalary);
  const dividendTax = dividendRoom * CH_2026.dividendTaxablePortion * i.marginalTaxRate;

  const notes: string[] = [];
  if (i.partnerSalary === 0)
    notes.push("Partnerin anstellen: splittet Einkommen (Steuerprogression senken) und baut ihre AHV-Beitragsjahre + Pensionskasse auf — wichtig als Alleinverdiener.");
  if (i.ownerSalary < 60000)
    notes.push("Sehr tiefer Lohn kann von der AHV als verdeckte Dividende aufgerechnet werden. Markt-/branchenüblichen Lohn beziehen.");
  notes.push("Lohn vs. Dividende: Lohn baut PK/3a & Rente auf (AHV-pflichtig); Dividende ist AHV-frei, aber kein Vorsorgeaufbau. Mischung meist optimal.");
  notes.push("Säule 3a beider Partner maximal einzahlen (mit PK je 7'258 CHF/Jahr 2026) — direkter Steuerabzug.");

  return {
    ownerAhv,
    partnerAhv,
    totalAhvCost: ownerAhv + partnerAhv,
    dividendRoom,
    dividendTax,
    pillar3aRoomOwner: i.ownerSalary > 0 ? CH_2026.pillar3aMaxWithPK : 0,
    pillar3aRoomPartner: i.partnerSalary > 0 ? CH_2026.pillar3aMaxWithPK : 0,
    notes,
  };
}

// Project net worth forward given monthly surplus + blended yield (real).
export function projectNetWorth(
  startNetWorth: number,
  monthlySurplus: number,
  annualYield: number,
  targets: number[] // e.g. [1_000_000, 3_000_000, 5_000_000]
): { target: number; years: number | null }[] {
  const r = annualYield / 12;
  return targets.map((target) => {
    if (startNetWorth >= target) return { target, years: 0 };
    let bal = startNetWorth;
    let m = 0;
    const max = 80 * 12;
    while (bal < target && m < max) {
      bal = bal * (1 + r) + monthlySurplus;
      m++;
    }
    return { target, years: m >= max ? null : Math.round((m / 12) * 10) / 10 };
  });
}

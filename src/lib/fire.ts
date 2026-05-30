// Financial freedom math (🟢 evidence-based). FIRE = Financial Independence,
// Retire Early. "Wohlstand = Freiheit" expressed as a concrete number + timeline.

export interface FireInputs {
  monthlyIncomeActive: number;
  monthlyIncomePassive: number;
  monthlyExpenses: number;
  netWorth: number;
  withdrawalRate: number; // e.g. 0.04
  expectedReturn: number; // real annual return, e.g. 0.05
  targetMonthlySpend?: number; // desired spend in freedom; falls back to expenses
  currency?: string;
}

export interface FireResult {
  currency: string;
  monthlyIncome: number;
  monthlySurplus: number;
  savingsRate: number; // 0-1
  annualSpend: number;
  freedomNumber: number; // capital needed
  progress: number; // 0-1 toward freedom number
  coveredByPassive: number; // 0-1 of expenses already covered passively
  yearsToFreedom: number | null;
  runwayMonths: number | null; // how long netWorth covers expenses with no income
  alreadyFree: boolean;
}

export function computeFire(i: FireInputs): FireResult {
  const currency = i.currency || "CHF";
  const monthlyIncome = i.monthlyIncomeActive + i.monthlyIncomePassive;
  const monthlySurplus = monthlyIncome - i.monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? Math.max(0, monthlySurplus) / monthlyIncome : 0;

  const targetMonthly = i.targetMonthlySpend && i.targetMonthlySpend > 0 ? i.targetMonthlySpend : i.monthlyExpenses;
  const annualSpend = targetMonthly * 12;
  const freedomNumber = i.withdrawalRate > 0 ? annualSpend / i.withdrawalRate : Infinity;

  const progress = freedomNumber > 0 && isFinite(freedomNumber) ? Math.min(1, i.netWorth / freedomNumber) : 0;
  const coveredByPassive = i.monthlyExpenses > 0 ? Math.min(1, i.monthlyIncomePassive / i.monthlyExpenses) : 1;
  const runwayMonths = i.monthlyExpenses > 0 ? i.netWorth / i.monthlyExpenses : null;
  const alreadyFree = i.netWorth >= freedomNumber || coveredByPassive >= 1;

  // Years to reach freedomNumber, compounding monthly surplus at expectedReturn.
  let yearsToFreedom: number | null = null;
  if (alreadyFree) {
    yearsToFreedom = 0;
  } else if (monthlySurplus > 0 && isFinite(freedomNumber)) {
    const r = i.expectedReturn / 12; // monthly real return
    let balance = i.netWorth;
    let months = 0;
    const maxMonths = 100 * 12;
    while (balance < freedomNumber && months < maxMonths) {
      balance = balance * (1 + r) + monthlySurplus;
      months++;
    }
    yearsToFreedom = months >= maxMonths ? null : Math.round((months / 12) * 10) / 10;
  }

  return {
    currency,
    monthlyIncome,
    monthlySurplus,
    savingsRate,
    annualSpend,
    freedomNumber,
    progress,
    coveredByPassive,
    yearsToFreedom,
    runwayMonths: runwayMonths === null ? null : Math.round(runwayMonths),
    alreadyFree,
  };
}

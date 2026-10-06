import type { BudgetPlan, Category, Expense, MonthSummary } from "./api";

const CATEGORIES: Category[] = ["NEEDS", "FUTURE", "GOALS", "FUN"];

export const zeroTotals = (): Record<Category, number> => ({ NEEDS: 0, FUTURE: 0, GOALS: 0, FUN: 0 });

/** Miesiąc jako YYYY-MM (czas lokalny użytkownika). */
export const periodOf = (d: Date | string = new Date()): string => {
  if (typeof d === "string") return d.slice(0, 7);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const todayIso = (): string => {
  const d = new Date();
  return `${periodOf(d)}-${String(d.getDate()).padStart(2, "0")}`;
};

export const totalsFor = (items: Expense[], period: string): Record<Category, number> => {
  const totals = zeroTotals();
  for (const e of items) if (periodOf(e.spent_on) === period) totals[e.category] = round2(totals[e.category] + e.amount);
  return totals;
};

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** Ostatnie `count` miesięcy łącznie z bieżącym, rosnąco. */
export const lastPeriods = (count: number, from: Date = new Date()): string[] => {
  const out: string[] = [];
  let y = from.getFullYear();
  let m = from.getMonth() + 1;
  for (let i = 0; i < count; i++) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    if (m === 1) [y, m] = [y - 1, 12];
    else m -= 1;
  }
  return out.reverse();
};

export const summarize = (items: Expense[], periods: string[]): MonthSummary[] =>
  periods.map((month) => {
    const totals = totalsFor(items, month);
    return { month, totals, total: round2(CATEGORIES.reduce((s, c) => s + totals[c], 0)) };
  });

// --- rejestr anonimowego użytkownika w przeglądarce -------------------------------------------

const LEDGER_KEY = "wmt_ledger";

export function readLocalLedger(): Expense[] {
  try {
    const raw = window.localStorage.getItem(LEDGER_KEY);
    return raw ? (JSON.parse(raw) as Expense[]) : [];
  } catch {
    return [];
  }
}

export function writeLocalLedger(items: Expense[]) {
  try {
    window.localStorage.setItem(LEDGER_KEY, JSON.stringify(items));
  } catch {}
}

/**
 * Plan do wysłania w żądaniu bezstanowym: "wydane" = ręczna kwota z bieżącego miesiąca + suma rejestru.
 * Ręczna kwota wygasa po zmianie miesiąca (`spent_period`), tak jak na serwerze.
 */
export function effectivePlan(plan: BudgetPlan & { spent_period?: string }, ledger: Expense[], now = new Date()): BudgetPlan {
  const period = periodOf(now);
  const manualValid = !plan.spent_period || plan.spent_period === period;
  const fromLedger = totalsFor(ledger, period);
  const spent = zeroTotals();
  for (const c of CATEGORIES) spent[c] = round2((manualValid ? (plan.spent[c] ?? 0) : 0) + fromLedger[c]);
  return { percentages: plan.percentages, spent, loans: plan.loans ?? [] };
}
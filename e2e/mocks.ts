import type { Page, Route } from "@playwright/test";

export const PROFILE = {
  currency: "PLN",
  monthly_income: 7000,
  hourly_rate: null,
  hours_per_day: 8,
  days_per_week: 5,
  effective_hourly_rate: 40.38,
  hours_per_month: 173.33,
};

export const RESULT = {
  name: "iPhone 17 Pro",
  type: "SIMPLE",
  total_cost: 5299,
  breakdown: [{ name: "Purchase", amount: 5299 }],
  hourly_rate: 40.38,
  work: { hours: 131.2, hours_part: 131, minutes_part: 13, working_days: 16.4, working_weeks: 3.28, working_months: 0.76, working_years: 0.06, income_percent: 75.7 },
  life_cost: { years: 3, per_day: 4.84, per_week: 33.87, per_month: 147.19 },
};

export const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

/** Zapisane obliczenie zwracane przez mock backendu. */
export const SAVED = {
  id: "c1",
  public_id: null as string | null,
  name: "iPhone 17 Pro",
  type: "SIMPLE",
  currency: "PLN",
  created_at: "2026-10-05T10:00:00+00:00",
  input: { name: "iPhone 17 Pro", type: "SIMPLE", purchase_price: 5299, ownership_years: 3, resale_value: 0, costs: [] },
  result: RESULT,
};

/** Profil anonimowy w localStorage - pomija onboarding. */
export async function withLocalProfile(page: Page) {
  await page.addInitScript((p) => window.localStorage.setItem("wmt_profile", JSON.stringify(p)), PROFILE);
}

/** Analiza budżetowa jak z API: PlayStation 2 500 zł z kategorii FUN (budżet 1 000 zł) przy dochodzie 10 000 zł. */
export const BUDGET_EXCEEDED = {
  category: "FUN",
  priority: "P4",
  percentage: 10,
  category_budget: 1000,
  spent: 400,
  available: 600,
  usage_percent: 40,
  is_custom: true,
  fits_budget: false,
  upfront: {
    cost: 2500,
    projected_spent: 2900,
    projected_usage_percent: 290,
    purchase_share_percent: 250,
    coverage_ratio: 416.7,
    months_to_goal: 2.5,
    months_to_goal_full: 3,
    monthly_contribution: 1000,
    already_saved: 0,
    income_percent: 25,
  },
  obligations: null,
  monthly: null,
  warnings: [
    {
      code: "CATEGORY_BUDGET_EXCEEDED",
      level: "warning",
      params: { category: "FUN", overrun: 1900, projected_usage_percent: 290, available: 600 },
    },
    { code: "HIGHER_PRIORITY_AT_RISK", level: "warning", params: { category: "FUN", priority: "P4", shortfall: 1900 } },
  ],
};

export const BUDGET_PLAN = {
  percentages: { NEEDS: 50, FUTURE: 25, GOALS: 15, FUN: 10 },
  spent: { NEEDS: 0, FUTURE: 0, GOALS: 0, FUN: 0 },
  loans: [] as { name: string; installment_amount: number; installments_left: number; loan_amount?: number | null }[],
};

export async function withLocalBudget(page: Page) {
  await page.addInitScript((b) => window.localStorage.setItem("wmt_budget", JSON.stringify(b)), BUDGET_PLAN);
}
/** Wpisy w rejestrze wydatków anonimowego użytkownika (z datą dzisiejszą, więc liczą się do bieżącego miesiąca). */
export async function withLocalLedger(page: Page, entries: { category: string; amount: number; note?: string }[]) {
  await page.addInitScript((items) => {
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    window.localStorage.setItem(
      "wmt_ledger",
      JSON.stringify(items.map((e, i) => ({ id: `e${i}`, note: null, spent_on: today, ...e }))),
    );
  }, entries);
}
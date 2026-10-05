import type { Page, Route } from "@playwright/test";

export const PROFILE = {
  currency: "PLN",
  monthly_income: 7000,
  hourly_rate: null,
  hours_per_day: 8,
  days_per_week: 5,
  effective_hourly_rate: 41.67,
  hours_per_month: 168,
};

export const RESULT = {
  name: "iPhone 17 Pro",
  type: "SIMPLE",
  total_cost: 5299,
  breakdown: [{ name: "Purchase", amount: 5299 }],
  hourly_rate: 41.67,
  work: { hours: 127.2, hours_part: 127, minutes_part: 11, working_days: 15.9, working_weeks: 3.18, working_months: 0.76, working_years: 0.06, income_percent: 75.7 },
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

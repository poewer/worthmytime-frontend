import type { Profile } from "./api";

/** Godziny pracy w miesiącu: godziny dziennie * dni w tygodniu * 52 / 12 (Budget Model, sekcja 3). */
export const hoursPerMonth = (p: Pick<Profile, "hours_per_day" | "days_per_week">) => (p.hours_per_day * p.days_per_week * 52) / 12;

/** Miesięczny dochód netto (stawka podana wprost ma pierwszeństwo). */
export function netIncome(p: Profile): number | null {
  if (p.hourly_rate != null) return p.hourly_rate * hoursPerMonth(p);
  return p.monthly_income ?? null;
}

export function nominalRate(p: Profile): number | null {
  if (p.hourly_rate != null) return p.hourly_rate;
  return p.monthly_income != null ? p.monthly_income / hoursPerMonth(p) : null;
}

/** Realna stawka: (dochód - koszty pracy) / (godziny pracy + godziny dojazdu). */
export function realRate(p: Profile): number | null {
  const income = netIncome(p);
  if (income == null) return null;
  const commuteHours = ((p.commute_minutes_per_day ?? 0) / 60) * p.days_per_week * (52 / 12);
  return Math.max(income - (p.work_costs_monthly ?? 0), 0.01) / (hoursPerMonth(p) + commuteHours);
}

/** Stawka używana do przeliczeń według trybu z profilu. */
export const effectiveRate = (p: Profile): number | null => (p.rate_mode === "REAL" ? realRate(p) : nominalRate(p));
/** Dzienny limit i prognoza końca miesiąca dla kategorii budżetu (te same wzory co `GET /budget/forecast` w API). */

/** Do tylu pierwszych dni miesiąca tempo wydatków jest zbyt zaszumione, żeby z niego prognozować. */
export const MIN_DAYS_FOR_PACE = 3;

export type ForecastStatus = "OK" | "WARN" | "OVER";

export interface CategoryForecast {
  budget: number;
  spent: number;
  available: number;
  /** ile można wydawać dziennie do końca miesiąca (łącznie z dzisiejszym dniem) */
  dailyLimit: number;
  daysLeft: number;
  /** średnia dzienna zmiennych wydatków od początku miesiąca */
  pacePerDay: number;
  projectedTotal: number | null;
  projectedUsagePercent: number | null;
  /** ile dni (od dziś) starczy budżetu przy obecnym tempie; null, gdy starczy do końca miesiąca */
  runsOutInDays: number | null;
  runsOutOn: Date | null;
  status: ForecastStatus;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export const daysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

/**
 * budget         miesięczny budżet kategorii
 * variableSpent  wydane z rejestru w tym miesiącu (na tym liczymy tempo)
 * fixed          stałe zobowiązania w kategorii (raty w Potrzebach), już wliczone w "wydane"
 */
export function categoryForecast(budget: number, variableSpent: number, fixed: number, now: Date = new Date()): CategoryForecast {
  const dim = daysInMonth(now);
  const day = now.getDate();
  const daysLeft = dim - day + 1;
  const spent = round2(variableSpent + fixed);
  const available = round2(budget - spent);
  const dailyLimit = round2(Math.max(available, 0) / daysLeft);

  const pacePerDay = variableSpent > 0 ? round2(variableSpent / day) : 0;
  let projectedTotal: number | null = null;
  let projectedUsagePercent: number | null = null;
  let runsOutInDays: number | null = null;
  let runsOutOn: Date | null = null;
  if (day >= MIN_DAYS_FOR_PACE || variableSpent === 0) {
    projectedTotal = round2(fixed + pacePerDay * dim);
    projectedUsagePercent = budget > 0 ? Math.round((projectedTotal / budget) * 1000) / 10 : null;
    if (pacePerDay > 0 && available > 0) {
      const days = Math.floor(available / pacePerDay);
      if (days <= dim - day) {
        runsOutInDays = days;
        runsOutOn = new Date(now.getFullYear(), now.getMonth(), day + days);
      }
    }
  }

  const status: ForecastStatus = available <= 0 && spent > 0 ? "OVER" : projectedTotal != null && projectedTotal > budget ? "WARN" : "OK";
  return { budget: round2(budget), spent, available, dailyLimit, daysLeft, pacePerDay, projectedTotal, projectedUsagePercent, runsOutInDays, runsOutOn, status };
}

const plural = (n: number, one: string, few: string, many: string) =>
  n === 1 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? few : many;

export const daysLabel = (n: number) => `${n} ${plural(n, "dzień", "dni", "dni")}`;

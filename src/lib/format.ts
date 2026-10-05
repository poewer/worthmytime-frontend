const nf = (max = 2) => new Intl.NumberFormat("pl-PL", { maximumFractionDigits: max, useGrouping: "always" });

export const num = (n: number, max = 2) => nf(max).format(n);
export const money = (n: number, currency = "PLN") =>
  new Intl.NumberFormat("pl-PL", { style: "currency", currency, maximumFractionDigits: 2, useGrouping: "always" }).format(n);

export const hm = (h: number, m: number) => (h === 0 ? `${m} min` : `${h} h ${String(m).padStart(2, "0")} min`);

export const FREQ_LABEL: Record<string, string> = {
  ONE_TIME: "jednorazowo",
  DAILY: "dziennie",
  WEEKLY: "tygodniowo",
  MONTHLY: "miesięcznie",
  YEARLY: "rocznie",
};

export const HORIZON_LABEL: Record<string, string> = {
  "1 month": "1 miesiąc",
  "1 year": "1 rok",
  "5 years": "5 lat",
  "10 years": "10 lat",
};

/** Polska odmiana: 1 rok, 2-4 lata, 5+ lat (ułamki: "lat"). */
export const yearsLabel = (y: number) => {
  if (!Number.isInteger(y)) return `${num(y)} lat`;
  const last = y % 10;
  const teen = y % 100 >= 12 && y % 100 <= 14;
  const word = y === 1 ? "rok" : last >= 2 && last <= 4 && !teen ? "lata" : "lat";
  return `${y} ${word}`;
};
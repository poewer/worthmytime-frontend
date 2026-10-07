import type { Expense, RecurringExpense } from "./api";
import { isoDate, parseIso } from "./loans";

/** Stałe wydatki bez konta: szablony w przeglądarce, wpisy dopisywane do lokalnego rejestru (te same reguły co `app/recurring.py`). */

export const MAX_BACKFILL_MONTHS = 36;
const LOCAL_RECURRING_KEY = "wmt_recurring";

/** Termin w danym miesiącu; dzień 31 w krótszym miesiącu wypada w jego ostatnim dniu. */
export function dueDate(year: number, month0: number, dayOfMonth: number): Date {
  const last = new Date(year, month0 + 1, 0).getDate();
  return new Date(year, month0, Math.min(dayOfMonth, last), 12);
}

/** Terminy do dopisania: od `start`, po `generatedThrough`, nie później niż `today` (rosnąco, bez przyszłości). */
export function dueDates(dayOfMonth: number, start: string, generatedThrough: string | null | undefined, today: Date): string[] {
  const startDate = parseIso(start);
  const earliest = new Date(today.getFullYear() - MAX_BACKFILL_MONTHS / 12, today.getMonth(), 1, 12);
  const first = startDate > earliest ? startDate : earliest;
  const todayIsoStr = isoDate(today);
  const out: string[] = [];
  let y = first.getFullYear();
  let m = first.getMonth();
  while (y < today.getFullYear() || (y === today.getFullYear() && m <= today.getMonth())) {
    const iso = isoDate(dueDate(y, m, dayOfMonth));
    if (iso >= start && iso <= todayIsoStr && (!generatedThrough || iso > generatedThrough)) out.push(iso);
    m += 1;
    if (m > 11) [y, m] = [y + 1, 0];
  }
  return out;
}

/** Dopisuje brakujące wpisy ze szablonów do rejestru; zwraca nowy rejestr, szablony i liczbę dopisanych wpisów. */
export function materialize(
  templates: RecurringExpense[],
  ledger: Expense[],
  today: Date = new Date(),
): { ledger: Expense[]; templates: RecurringExpense[]; created: number } {
  const todayStr = isoDate(today);
  const added: Expense[] = [];
  // zabezpieczenie przed duplikatem, gdyby stan szablonu zginął (np. przywrócona kopia danych)
  const existing = new Set(ledger.filter((e) => e.source_type === "RECURRING").map((e) => `${e.source_id}|${e.spent_on}`));
  const next = templates.map((t) => {
    if (!t.active || t.generated_through === todayStr) return t;
    for (const due of dueDates(t.day_of_month, t.start_date, t.generated_through, today)) {
      if (existing.has(`${t.id}|${due}`)) continue;
      added.push({ id: crypto.randomUUID(), category: t.category, amount: t.amount, note: t.name, spent_on: due, source_type: "RECURRING", source_id: t.id });
    }
    return { ...t, generated_through: todayStr };
  });
  return { ledger: added.length ? [...added.reverse(), ...ledger] : ledger, templates: next, created: added.length };
}

export function readLocalRecurring(): RecurringExpense[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_RECURRING_KEY);
    return raw ? (JSON.parse(raw) as RecurringExpense[]) : [];
  } catch {
    return [];
  }
}

export function writeLocalRecurring(items: RecurringExpense[]) {
  try {
    window.localStorage.setItem(LOCAL_RECURRING_KEY, JSON.stringify(items));
  } catch {}
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useApp } from "@/components/AppProvider";
import { api, type BudgetState, type Category, type Expense, type MonthSummary } from "./api";
import { errorMessage } from "./forms";
import { lastPeriods, periodOf, round2, summarize, todayIso, totalsFor, zeroTotals } from "./ledger";

const MONTHS = 6;

export interface NewExpense {
  category: Category;
  amount: number;
  note?: string;
  spent_on?: string;
}

/** Rejestr wydatków: konto -> API, anonimowo -> localStorage. Zwraca bieżący miesiąc i trend ostatnich miesięcy. */
export function useLedger() {
  const { loggedIn, localLedger, setLocalLedger } = useApp();
  const [items, setItems] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<MonthSummary[]>([]);
  const [budget, setBudget] = useState<BudgetState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [version, setVersion] = useState(0); // zmiana odświeża dane z API po dopisaniu lub usunięciu wpisu

  useEffect(() => {
    if (!loggedIn) return;
    let cancelled = false;
    Promise.all([
      api<{ items: Expense[] }>("/expenses"),
      api<{ months: MonthSummary[] }>(`/expenses/summary?months=${MONTHS}`),
      api<BudgetState>("/budget"),
    ])
      .then(([month, sum, b]) => {
        if (cancelled) return;
        setItems(month.items);
        setSummary(sum.months);
        setBudget(b);
        setLoaded(true);
      })
      .catch((e) => {
        if (!cancelled) {
          toast.error(errorMessage(e, "Nie udało się pobrać wydatków"));
          setLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [loggedIn, version]);

  const loading = loggedIn && !loaded;
  const reload = useCallback(async () => setVersion((v) => v + 1), []);
  const add = useCallback(
    async (e: NewExpense) => {
      if (loggedIn) {
        await api("/expenses", { body: e });
        await reload();
      } else {
        const item: Expense = {
          id: crypto.randomUUID(),
          category: e.category,
          amount: e.amount,
          note: e.note || null,
          spent_on: e.spent_on || todayIso(),
        };
        setLocalLedger([item, ...localLedger]);
      }
    },
    [loggedIn, reload, localLedger, setLocalLedger],
  );

  const remove = useCallback(
    async (id: string) => {
      if (loggedIn) {
        await api(`/expenses/${id}`, { method: "DELETE" });
        await reload();
      } else {
        setLocalLedger(localLedger.filter((x) => x.id !== id));
      }
    },
    [loggedIn, reload, localLedger, setLocalLedger],
  );

  const period = periodOf();
  const periods = lastPeriods(MONTHS);
  const monthItems = loggedIn
    ? items
    : localLedger.filter((x) => periodOf(x.spent_on) === period).sort((a, b) => b.spent_on.localeCompare(a.spent_on));
  const monthTotals = loggedIn ? totalsFor(items, period) : totalsFor(localLedger, period);
  const trend = loggedIn ? summary : summarize(localLedger, periods);
  const total = round2(Object.values(monthTotals).reduce((s, v) => s + v, 0));

  return { loading, items: monthItems, totals: monthTotals ?? zeroTotals(), total, trend, serverBudget: budget, add, remove, period };
}
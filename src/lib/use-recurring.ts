"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useApp } from "@/components/AppProvider";
import { api, type RecurringExpense, type RecurringIn } from "./api";
import { errorMessage } from "./forms";
import { todayIso } from "./ledger";
import { materialize } from "./recurring";

/** Stałe wydatki: konto -> API, anonimowo -> localStorage (wpisy w rejestrze dopisują się na początku i przy zmianie szablonu). */
export function useRecurring(onChanged?: () => Promise<void> | void) {
  const { loggedIn, localLedger, setLocalLedger, localRecurring, setLocalRecurring } = useApp();
  const [remote, setRemote] = useState<RecurringExpense[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!loggedIn) return;
    let cancelled = false;
    api<{ items: RecurringExpense[] }>("/recurring-expenses")
      .then((r) => {
        if (!cancelled) setRemote(r.items);
      })
      .catch((e) => {
        if (!cancelled) toast.error(errorMessage(e, "Nie udało się pobrać stałych wydatków"));
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [loggedIn, version]);

  const reload = useCallback(async () => {
    setVersion((v) => v + 1);
    await onChanged?.();
  }, [onChanged]);

  /** Po zmianie szablonu lokalnie od razu dopisujemy zaległe wpisy do rejestru. */
  const commitLocal = useCallback(
    (templates: RecurringExpense[]) => {
      const merged = materialize(templates, localLedger);
      setLocalRecurring(merged.templates);
      if (merged.created) setLocalLedger(merged.ledger);
    },
    [localLedger, setLocalLedger, setLocalRecurring],
  );

  const items = loggedIn ? remote : localRecurring;
  const monthlyTotal = items.filter((t) => t.active).reduce((s, t) => s + t.amount, 0);

  const add = useCallback(
    async (t: RecurringIn) => {
      if (loggedIn) {
        await api("/recurring-expenses", { body: { ...t, start_date: todayIso() } });
        await reload();
      } else {
        commitLocal([...localRecurring, { ...t, id: crypto.randomUUID(), start_date: todayIso(), generated_through: null }]);
      }
    },
    [loggedIn, reload, commitLocal, localRecurring],
  );

  const update = useCallback(
    async (id: string, t: RecurringIn) => {
      if (loggedIn) {
        await api(`/recurring-expenses/${id}`, { method: "PUT", body: t });
        await reload();
      } else {
        // ponowne włączenie nie dopisuje okresu wyłączenia
        commitLocal(
          localRecurring.map((x) => (x.id === id ? { ...x, ...t, generated_through: t.active && !x.active ? todayIso() : x.generated_through } : x)),
        );
      }
    },
    [loggedIn, reload, commitLocal, localRecurring],
  );

  const remove = useCallback(
    async (id: string) => {
      if (loggedIn) {
        await api(`/recurring-expenses/${id}`, { method: "DELETE" });
        await reload();
      } else {
        setLocalRecurring(localRecurring.filter((x) => x.id !== id)); // dopisane już wpisy zostają
      }
    },
    [loggedIn, reload, setLocalRecurring, localRecurring],
  );

  return { items, monthlyTotal, loading: loggedIn && !loaded, add, update, remove };
}

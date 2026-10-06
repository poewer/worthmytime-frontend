"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { api } from "./api";
import { localAlerts, readDismissed, visibleAlerts, writeDismissed, type AppAlert } from "./alerts";

/** Alerty do dzwonka: konto -> `GET /alerts` (odświeżane przy zmianie strony), bez konta -> liczone lokalnie. */
export function useAlerts() {
  const { ready, loggedIn, monthlyIncome, budget, localLedger } = useApp();
  const path = usePathname();
  const [remote, setRemote] = useState<AppAlert[]>([]);
  const [dismissVersion, setDismissVersion] = useState(0);
  // odczyt z localStorage dopiero po hydratacji (ready), więc nie rozjeżdża się z renderem na serwerze
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const dismissed = useMemo(() => (ready ? readDismissed() : {}), [ready, dismissVersion]);

  useEffect(() => {
    if (!ready || !loggedIn) return;
    let cancelled = false;
    api<{ items: AppAlert[] }>("/alerts")
      .then((r) => {
        if (!cancelled) setRemote(r.items);
      })
      .catch(() => {
        if (!cancelled) setRemote([]);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, loggedIn, path]);

  const local = useMemo(
    () => (ready && !loggedIn ? localAlerts({ monthlyIncome, plan: budget, ledger: localLedger }) : []),
    [ready, loggedIn, monthlyIncome, budget, localLedger],
  );

  const items = loggedIn ? remote : visibleAlerts(local, dismissed);

  const dismiss = useCallback(
    async (alert: AppAlert) => {
      if (loggedIn) {
        setRemote((prev) => prev.filter((a) => a.key !== alert.key)); // od razu znika; serwer zapamięta ukrycie
        await api(`/alerts/${encodeURIComponent(alert.key)}/dismiss`, { method: "POST" });
      } else {
        writeDismissed({ ...readDismissed(), [alert.key]: alert.state });
        setDismissVersion((v) => v + 1);
      }
    },
    [loggedIn],
  );

  return { items, dismiss };
}

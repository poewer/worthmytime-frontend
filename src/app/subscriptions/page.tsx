"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useApp } from "@/components/AppProvider";
import LoginPrompt from "@/components/LoginPrompt";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type SavedCalculation } from "@/lib/api";
import { money, num } from "@/lib/format";
import { errorMessage } from "@/lib/forms";
import { cn } from "@/lib/utils";

export default function SubscriptionsPage() {
  const { ready, loggedIn } = useApp();
  const [items, setItems] = useState<SavedCalculation[] | null>(null);

  useEffect(() => {
    if (!loggedIn) return;
    api<{ items: SavedCalculation[] }>("/calculations")
      .then((r) => setItems(r.items))
      .catch((e) => toast.error(errorMessage(e, "Nie udało się pobrać subskrypcji")));
  }, [loggedIn]);

  const subs = useMemo(() => {
    const rows = (items ?? [])
      .filter((c) => c.type === "RECURRING")
      .map((c) => {
        const year = c.result.horizons?.find((h) => h.label === "1 year");
        return { id: c.id, name: c.name, currency: c.currency, yearly: year?.cost ?? 0, hours: year?.work.hours ?? 0, days: year?.work.working_days ?? 0 };
      })
      .sort((a, b) => b.yearly - a.yearly);
    const total = rows.reduce((s, r) => s + r.yearly, 0);
    return {
      rows,
      total,
      hours: rows.reduce((s, r) => s + r.hours, 0),
      days: rows.reduce((s, r) => s + r.days, 0),
    };
  }, [items]);

  if (!ready) return <Skeleton className="mx-auto h-64 max-w-2xl" />;
  if (!loggedIn) return <LoginPrompt what="Audyt subskrypcji" />;

  const currency = subs.rows[0]?.currency ?? "PLN";

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Subskrypcje i opłaty cykliczne</h1>
        <p className="text-sm text-muted-foreground">Wszystkie zapisane koszty cykliczne w jednym miejscu, od najdroższego.</p>
      </div>

      {items === null ? (
        <Skeleton className="h-40" />
      ) : subs.rows.length === 0 ? (
        <Card className="border-dashed bg-transparent shadow-none">
          <CardContent className="grid justify-items-center gap-3 py-12 text-center">
            <p className="font-medium">Nie masz zapisanych kosztów cyklicznych</p>
            <p className="text-sm text-muted-foreground">W kalkulatorze wybierz „Cykliczny”, wpisz opłatę i zapisz wynik w historii.</p>
            <Link href="/calculator" className={cn(buttonVariants(), "h-11 px-5")}>
              Dodaj subskrypcję
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="bg-gradient-to-br from-primary/15 via-card to-card" data-testid="subs-total">
            <CardContent className="grid gap-1 text-center">
              <p className="text-sm text-muted-foreground">Na subskrypcje wydajesz rocznie</p>
              <p className="text-3xl font-bold tabular-nums text-primary">{money(subs.total, currency)}</p>
              <p className="text-sm text-muted-foreground">
                czyli <b className="text-foreground">{num(subs.hours, 0)} h</b> pracy w roku (≈ {num(subs.days, 1)} dni roboczych), {money(subs.total / 12, currency)} miesięcznie
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <ul className="divide-y" data-testid="subs-list">
                {subs.rows.map((r) => (
                  <li key={r.id} className="grid gap-1.5 py-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <Link href={`/calculator?edit=${r.id}`} className="min-w-0 truncate font-medium hover:underline">
                        {r.name}
                      </Link>
                      <span className="shrink-0 tabular-nums">{money(r.yearly, r.currency)} / rok</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span className="tabular-nums">
                        {money(r.yearly / 12, r.currency)} / mies. · {num(r.hours, 1)} h pracy rocznie
                      </span>
                      <span className="tabular-nums">{num(subs.total ? (r.yearly / subs.total) * 100 : 0, 0)}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                      <div className="h-full rounded-full bg-primary" style={{ width: `${subs.total ? (r.yearly / subs.total) * 100 : 0}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
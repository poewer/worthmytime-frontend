"use client";

import { useEffect, useState } from "react";
import { api, type CalculationIn, type Profile, type Result } from "@/lib/api";
import { money, num } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Co jeśli zarabiasz więcej lub mniej? Przelicza wynik dla zmienionego dochodu, bez zmiany zapisanego profilu. */
export default function WhatIfCard({
  profile,
  calculation,
  base,
}: {
  profile: Profile;
  calculation: CalculationIn;
  base: Result;
}) {
  const [delta, setDelta] = useState(0);
  const [alt, setAlt] = useState<Result | null>(null);
  const currency = profile.currency;

  useEffect(() => {
    if (delta === 0) return;
    const factor = 1 + delta / 100;
    const hypothetical: Profile = {
      ...profile,
      monthly_income: profile.monthly_income != null ? profile.monthly_income * factor : null,
      hourly_rate: profile.hourly_rate != null ? profile.hourly_rate * factor : null,
    };
    let cancelled = false;
    const t = setTimeout(() => {
      api<Result>("/calculate", { body: { profile: hypothetical, calculation } })
        .then((r) => !cancelled && setAlt(r))
        .catch(() => !cancelled && setAlt(null));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [delta, profile, calculation]);

  const shown = delta === 0 ? base : alt;
  const hours = base.work.hours;
  const diff = shown ? shown.work.hours - hours : 0;

  return (
    <Card size="sm" data-testid="what-if">
      <CardHeader>
        <CardTitle className="text-base">Co jeśli zarabiasz więcej lub mniej?</CardTitle>
        <CardDescription>Symulacja - Twój zapisany profil się nie zmienia.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="grid gap-1.5">
          <div className="flex justify-between text-sm">
            <label htmlFor="what-if-range" className="text-muted-foreground">
              Zmiana dochodu
            </label>
            <b className="tabular-nums" data-testid="what-if-delta">
              {delta > 0 ? "+" : ""}
              {delta}%
            </b>
          </div>
          <input
            id="what-if-range"
            type="range"
            min={-30}
            max={30}
            step={5}
            value={delta}
            onChange={(e) => setDelta(Number(e.target.value))}
            className="h-6 w-full accent-[var(--primary)]"
          />
        </div>
        {delta !== 0 && shown && (
          <div className="grid grid-cols-2 gap-2 text-center text-sm" aria-live="polite" data-testid="what-if-result">
            <div className="rounded-xl bg-muted/60 px-1 py-2.5">
              <div className="font-semibold tabular-nums">{num(shown.work.hours, 1)} h</div>
              <div className="text-xs text-muted-foreground">
                {diff < 0 ? `${num(-diff, 1)} h mniej` : `${num(diff, 1)} h więcej`}
              </div>
            </div>
            <div className="rounded-xl bg-muted/60 px-1 py-2.5">
              <div className="font-semibold tabular-nums">
                {shown.work.income_percent != null ? `${num(shown.work.income_percent, 1)}%` : "-"}
              </div>
              <div className="text-xs text-muted-foreground">miesięcznej wypłaty</div>
            </div>
            <p className="col-span-2 text-xs text-muted-foreground">
              Godzina pracy: {money(shown.hourly_rate ?? 0, currency)} zamiast {money(base.hourly_rate ?? 0, currency)}.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
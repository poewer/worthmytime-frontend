"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { useApp } from "@/components/AppProvider";
import LoginPrompt from "@/components/LoginPrompt";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, type SavedCalculation } from "@/lib/api";
import { money, num } from "@/lib/format";
import { errorMessage } from "@/lib/forms";
import { cn } from "@/lib/utils";

type Period = "30" | "365" | "all";
const PERIOD_DAYS: Record<Period, number | null> = { "30": 30, "365": 365, all: null };

const yearly = (c: SavedCalculation) => c.result.horizons?.find((h) => h.label === "1 year");

export default function DashboardPage() {
  const { ready, loggedIn } = useApp();
  const [items, setItems] = useState<SavedCalculation[] | null>(null);
  const [period, setPeriod] = useState<Period>("all");
  const [now] = useState(() => Date.now());

  useEffect(() => {
    if (loggedIn)
      api<{ items: SavedCalculation[] }>("/calculations")
        .then((r) => setItems(r.items))
        .catch((e) => toast.error(errorMessage(e, "Nie udało się pobrać danych")));
  }, [loggedIn]);

  const stats = useMemo(() => {
    const days = PERIOD_DAYS[period];
    const since = days ? now - days * 86_400_000 : 0;
    const list = (items ?? []).filter((c) => new Date(c.created_at).getTime() >= since);
    const oneOff = list.filter((c) => c.type !== "RECURRING");
    const recurring = list.filter((c) => c.type === "RECURRING");

    const byMonth = new Map<string, number>();
    for (const c of [...list].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
      const key = c.created_at.slice(0, 7);
      byMonth.set(key, (byMonth.get(key) ?? 0) + c.result.work.hours);
    }
    let cumulative = 0;
    const trend = [...byMonth.entries()].map(([month, hours]) => {
      cumulative += hours;
      return { month, hours: Math.round(hours * 10) / 10, cumulative: Math.round(cumulative * 10) / 10 };
    });

    return {
      count: list.length,
      totalValue: oneOff.reduce((s, c) => s + c.result.total_cost, 0),
      totalHours: oneOff.reduce((s, c) => s + c.result.work.hours, 0),
      totalDays: oneOff.reduce((s, c) => s + c.result.work.working_days, 0),
      largest: [...oneOff].sort((a, b) => b.result.total_cost - a.result.total_cost)[0] ?? null,
      recurring,
      recurringYearly: recurring.reduce((s, c) => s + (yearly(c)?.cost ?? 0), 0),
      recurringYearlyHours: recurring.reduce((s, c) => s + (yearly(c)?.work.hours ?? 0), 0),
      trend,
    };
  }, [items, period, now]);

  if (!ready) return <Skeleton className="h-64 w-full" />;
  if (!loggedIn) return <LoginPrompt what="Dashboard" />;
  if (items === null)
    return (
      <div className="grid gap-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );

  const currency = items[0]?.currency ?? "PLN";
  const config = { cumulative: { label: "Godziny pracy (narastająco)", color: "var(--chart-1)" } } satisfies ChartConfig;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList className="h-10!">
            <TabsTrigger value="30">30 dni</TabsTrigger>
            <TabsTrigger value="365">Rok</TabsTrigger>
            <TabsTrigger value="all">Wszystko</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {stats.count === 0 ? (
        <Card className="border-dashed bg-transparent shadow-none">
          <CardContent className="grid justify-items-center gap-3 py-12 text-center">
            <p className="font-medium">Brak obliczeń w tym okresie</p>
            <Link href="/calculator" className={cn(buttonVariants(), "h-11 px-5")}>
              Policz zakup
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric label="Przeanalizowane zakupy" value={money(stats.totalValue, currency)} />
            <Metric label="Godziny pracy" value={`${num(stats.totalHours, 1)} h`} />
            <Metric label="Dni robocze" value={num(stats.totalDays, 1)} />
            <Metric
              label="Największy wydatek"
              value={stats.largest?.name ?? "-"}
              sub={stats.largest ? money(stats.largest.result.total_cost, currency) : undefined}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Czas pracy w czasie</CardTitle>
              <CardDescription>Suma godzin pracy zapisanych obliczeń, narastająco miesiąc po miesiącu</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={config} className="h-56 w-full">
                <AreaChart data={stats.trend} margin={{ left: 0, right: 12, top: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis width={40} tickLine={false} axisLine={false} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    dataKey="cumulative"
                    type="monotone"
                    stroke="var(--color-cumulative)"
                    fill="var(--color-cumulative)"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Wydatki cykliczne</CardTitle>
              {stats.recurring.length > 0 && (
                <CardDescription>
                  Razem rocznie: <b className="text-foreground">{money(stats.recurringYearly, currency)}</b> (
                  {num(stats.recurringYearlyHours, 1)} h pracy) · miesięcznie {money(stats.recurringYearly / 12, currency)}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {stats.recurring.length === 0 ? (
                <p className="text-sm text-muted-foreground">Brak zapisanych kosztów cyklicznych.</p>
              ) : (
                <ul className="divide-y text-sm">
                  {stats.recurring.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                      <Link href={`/calculator?edit=${c.id}`} className="min-w-0 truncate hover:underline">
                        {c.name}
                      </Link>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {money(yearly(c)?.cost ?? 0, c.currency)} / rok ·{" "}
                        <span className="font-medium text-foreground">{num(yearly(c)?.work.hours ?? 0, 1)} h</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card size="sm">
      <CardContent>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-lg font-semibold tabular-nums sm:text-xl">{value}</p>
        {sub && <p className="text-xs text-muted-foreground tabular-nums">{sub}</p>}
      </CardContent>
    </Card>
  );
}

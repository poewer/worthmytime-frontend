"use client";

import { Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { Result } from "@/lib/api";
import { FREQ_LABEL, HORIZON_LABEL, hm, money, num, yearsLabel } from "@/lib/format";

const LINE_LABEL: Record<string, string> = { Purchase: "Zakup", Resale: "Odsprzedaż" };
const lineName = (n: string) => LINE_LABEL[n] ?? n;

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export default function ResultView({ result, currency = "PLN" }: { result: Result; currency?: string }) {
  const w = result.work;
  const yearShare = Math.max(0, Math.min(100, w.working_years * 100));

  return (
    <div className="grid gap-4">
      <Card className="overflow-hidden bg-gradient-to-br from-primary/15 via-card to-card">
        <CardContent className="grid gap-5 text-center">
          <div>
            <p className="text-sm text-muted-foreground">{result.name}</p>
            <p className="text-lg font-semibold tabular-nums">{money(result.total_cost, currency)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">kosztuje Cię</p>
            <p className="text-6xl leading-none font-bold tracking-tight text-primary tabular-nums sm:text-7xl" data-testid="hours">
              {num(w.hours, 1)}
              <span className="ml-1 text-2xl font-semibold sm:text-3xl">h</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">pracy ({hm(w.hours_part, w.minutes_part)})</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <Stat value={num(w.working_days, 1)} label="dni roboczych" />
            <Stat value={num(w.working_weeks, 1)} label="tygodni roboczych" />
            <Stat value={num(w.working_years, 2)} label="lat roboczych" />
          </div>
          <div className="grid gap-1.5 text-left">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Udział w roku pracy</span>
              <span className="tabular-nums">{num(w.working_years * 100, 1)}%</span>
            </div>
            <div
              role="progressbar"
              aria-label="Udział w roku pracy"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(yearShare)}
              className="h-2 overflow-hidden rounded-full bg-muted"
            >
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${yearShare}%` }} />
            </div>
          </div>
          {result.hourly_rate != null && (
            <p className="text-xs text-muted-foreground">Efektywna stawka: {money(result.hourly_rate, currency)}/h</p>
          )}
        </CardContent>
      </Card>

      {result.summary && (
        <p className="text-center text-sm">
          {result.summary.years} lat tego wydatku to około <b>{num(result.summary.working_days, 1)}</b> dni roboczych.
        </p>
      )}

      {result.horizons && <HorizonsCard result={result} currency={currency} />}

      {result.type !== "RECURRING" && result.breakdown.length > 1 && <BreakdownCard result={result} currency={currency} />}

      {result.type === "RECURRING" && (
        <Card>
          <CardHeader>
            <CardTitle>Pozycje</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {result.breakdown.map((b, i) => (
                <li key={i} className="flex justify-between gap-3 py-2">
                  <span className="min-w-0 truncate">{b.name}</span>
                  <span className="shrink-0 tabular-nums">
                    {money(b.amount, currency)} <span className="text-muted-foreground">{b.frequency && FREQ_LABEL[b.frequency]}</span>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {result.life_cost && (
        <Card>
          <CardHeader>
            <CardTitle>Gdy używasz tego przez {yearsLabel(result.life_cost.years)}</CardTitle>
            <CardDescription>Koszt rozłożony w czasie</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2 text-center sm:gap-3">
            <Stat value={money(result.life_cost.per_day, currency)} label="dziennie" />
            <Stat value={money(result.life_cost.per_week, currency)} label="tygodniowo" />
            <Stat value={money(result.life_cost.per_month, currency)} label="miesięcznie" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function HorizonsCard({ result, currency }: { result: Result; currency: string }) {
  const data = (result.horizons ?? []).map((h) => ({
    label: HORIZON_LABEL[h.label] ?? h.label,
    hours: h.work.hours,
    cost: h.cost,
    time: hm(h.work.hours_part, h.work.minutes_part),
  }));
  const config = { hours: { label: "Godziny pracy", color: "var(--chart-1)" } } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Koszt w czasie</CardTitle>
        <CardDescription>Ile godzin pracy pochłonie ten wydatek</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <ChartContainer config={config} className="h-48 w-full">
          <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis width={36} tickLine={false} axisLine={false} fontSize={12} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="hours" fill="var(--color-hours)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
        <ul className="divide-y text-sm">
          {data.map((h) => (
            <li key={h.label} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 py-2">
              <span>{h.label}</span>
              <span className="text-right tabular-nums">{money(h.cost, currency)}</span>
              <span className="min-w-20 text-right font-medium tabular-nums">{h.time}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function BreakdownCard({ result, currency }: { result: Result; currency: string }) {
  const positive = result.breakdown.filter((b) => b.amount > 0);
  const data = positive.map((b, i) => ({ name: lineName(b.name), value: b.amount, fill: COLORS[i % COLORS.length] }));
  const config = Object.fromEntries(data.map((d) => [d.name, { label: d.name, color: d.fill }])) satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rozbicie kosztów</CardTitle>
      </CardHeader>
      <CardContent className="grid items-center gap-4 sm:grid-cols-[12rem_1fr]">
        <ChartContainer config={config} className="mx-auto aspect-square h-44 sm:h-48">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="name" />} />
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" strokeWidth={2} />
          </PieChart>
        </ChartContainer>
        <ul className="text-sm">
          {result.breakdown.map((b, i) => {
            const color = b.amount > 0 ? COLORS[positive.indexOf(b) % COLORS.length] : undefined;
            return (
              <li key={i} className="flex items-center justify-between gap-3 border-b py-2">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-sm bg-muted-foreground/40" style={color ? { background: color } : undefined} />
                  <span className="truncate">{lineName(b.name)}</span>
                </span>
                <span className="shrink-0 tabular-nums">{money(b.amount, currency)}</span>
              </li>
            );
          })}
          <li className="flex justify-between gap-3 pt-2 font-semibold">
            <span>Razem</span>
            <span className="tabular-nums">{money(result.total_cost, currency)}</span>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-muted/60 px-1 py-2.5">
      <div className="text-base font-semibold tabular-nums sm:text-lg">{value}</div>
      <div className="text-[11px] leading-tight text-muted-foreground sm:text-xs">{label}</div>
    </div>
  );
}

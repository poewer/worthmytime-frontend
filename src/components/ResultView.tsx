"use client";

import { Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { Result } from "@/lib/api";
import { FREQ_LABEL, HORIZON_LABEL, hm, money, monthsLabel, num, yearsLabel } from "@/lib/format";

const LINE_LABEL: Record<string, string> = { Purchase: "Zakup", Resale: "Odsprzedaż" };
const lineName = (n: string) => LINE_LABEL[n] ?? n;

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export default function ResultView({ result, currency = "PLN" }: { result: Result; currency?: string }) {
  // koszt cykliczny: nagłówek to zawsze JEDEN miesiąc (1 800 zł / mies.), a horyzonty niżej pokazują narastanie.
  // Bierzemy go z horyzontu "1 month", więc działa też ze starszym API, które w nagłówku dawało sumę z 10 lat.
  const recurring = result.type === "RECURRING";
  const month = recurring ? result.horizons?.find((h) => h.label === "1 month") : undefined;
  const w = month?.work ?? result.work;
  const headlineCost = month?.cost ?? result.total_cost;

  return (
    <div className="grid gap-4">
      <Card className="overflow-hidden bg-gradient-to-br from-primary/15 via-card to-card">
        <CardContent className="grid gap-5 text-center">
          <div>
            <p className="text-sm text-muted-foreground">{result.name}</p>
            <p className="text-lg font-semibold tabular-nums">
              {money(headlineCost, currency)}
              {recurring && <span className="text-sm font-normal text-muted-foreground"> / miesiąc</span>}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{recurring ? "kosztuje Cię miesięcznie" : "kosztuje Cię"}</p>
            <p className="text-6xl leading-none font-bold tracking-tight text-primary tabular-nums sm:text-7xl" data-testid="hours">
              {num(w.hours, 1)}
              <span className="ml-1 text-2xl font-semibold sm:text-3xl">h</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">pracy ({hm(w.hours_part, w.minutes_part)})</p>
          </div>

          {w.income_percent != null && <IncomeShare percent={w.income_percent} recurring={recurring} />}

          {w.working_months != null && (
          <section aria-labelledby="scale-month" className="grid gap-3 text-left">
            <h3 id="scale-month" className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              W skali miesiąca
            </h3>
            <p className="text-2xl font-semibold tabular-nums" data-testid="months">
              {w.working_months < 1 ? num(w.working_months, 2) : monthsLabel(Math.round(w.working_months * 10) / 10)}
              {w.working_months < 1 && <span className="text-base font-medium"> miesiąca pracy</span>}
              {w.working_months >= 1 && <span className="text-base font-medium"> pracy</span>}
            </p>
            <MonthStrip months={w.working_months} />
            <p className="-mt-1 text-xs text-muted-foreground">1 klocek = 1 miesiąc pracy</p>
            <div className="grid grid-cols-2 gap-2 text-center sm:gap-3">
              <Stat value={num(w.working_days, 1)} label="dni roboczych" />
              <Stat value={num(w.working_weeks, 1)} label="tygodni roboczych" />
            </div>
          </section>
          )}

          {!recurring && (
          <section aria-labelledby="scale-year" className="grid gap-2 text-left">
            <h3 id="scale-year" className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              W skali lat
            </h3>
            <p className="text-2xl font-semibold tabular-nums" data-testid="years">
              {w.working_years < 1 ? num(w.working_years, 2) : yearsLabel(Math.round(w.working_years * 100) / 100)}
              <span className="text-base font-medium">
                {w.working_years < 1 ? " roku pracy" : " pracy"}
              </span>
            </p>
            <ProgressBar value={w.working_years * 100} label="Udział w roku pracy" />
          </section>
          )}

          {result.hourly_rate != null && (
            <p className="text-xs text-muted-foreground">Efektywna stawka: {money(result.hourly_rate, currency)}/h</p>
          )}
        </CardContent>
      </Card>
      {result.horizons && <HorizonsCard result={result} currency={currency} />}

      {result.summary && (
        <p className="text-center text-sm">
          {result.summary.years} lat tego wydatku to około <b>{num(result.summary.working_days, 1)}</b> dni roboczych.
        </p>
      )}

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
    percent: h.work.income_percent,
  }));
  const config = { hours: { label: "Godziny pracy", color: "var(--chart-1)" } } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Jak to narasta w czasie</CardTitle>
        <CardDescription>Od jednego miesiąca po lata: ile pracy i miesięcznych wypłat pochłonie ta opłata</CardDescription>
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
              <span className="min-w-20 text-right tabular-nums">
                <span className="font-medium">{h.time}</span>
                {h.percent != null && <span className="block text-xs text-muted-foreground">{shareLabel(h.percent)}</span>}
              </span>
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

/** Procent miesięcznej wypłaty - uświadamia skalę wydatku. */
/** Procent poniżej 100, a od 100 wielokrotność wypłaty (27× czytelniejsze niż 2 700%). */
function shareLabel(percent: number) {
  return percent >= 100 ? `${num(percent / 100, 1)}× wypłaty` : `${num(percent, 1)}% wypłaty`;
}

function IncomeShare({ percent, recurring = false }: { percent: number; recurring?: boolean }) {
  if (percent <= 0) return null;
  const tone =
    percent >= 100
      ? "bg-destructive/10 text-destructive"
      : percent >= 25
        ? "bg-chart-3/20 text-foreground"
        : "bg-primary/10 text-foreground";
  return (
    <div className={`rounded-xl px-4 py-3 ${tone}`} data-testid="income-share">
      {percent >= 100 ? (
        <p className="text-lg font-semibold">
          To <span className="tabular-nums">{num(percent / 100, 1)}×</span> Twojej miesięcznej wypłaty
        </p>
      ) : (
        <p className="text-lg font-semibold">
          To <span className="tabular-nums">{num(percent, 1)}%</span> Twojej miesięcznej wypłaty
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        {recurring
          ? "Tyle z miesięcznej pracy pochłania ta opłata - co miesiąc."
          : percent >= 100
            ? "Tyle miesięcy pracy oddajesz za ten wydatek."
            : "Tyle z miesięcznej pracy pochłania ten wydatek."}
      </p>
    </div>
  );
}

/** 12 klocków = 12 miesięcy; wypełnienie pokazuje, ile miesięcy pracy kosztuje wydatek. */
function MonthStrip({ months }: { months: number }) {
  const shown = Math.min(12, Math.max(0, months));
  return (
    <div
      role="img"
      aria-label={`${months < 1 ? num(months, 2) + " miesiąca" : monthsLabel(Math.round(months * 10) / 10)} pracy`}
      className="grid grid-cols-12 gap-1"
    >
      {Array.from({ length: 12 }, (_, i) => {
        const fill = Math.max(0, Math.min(1, shown - i));
        return (
          <span key={i} className="h-3 overflow-hidden rounded-sm bg-muted">
            <span className="block h-full bg-primary" style={{ width: `${fill * 100}%` }} />
          </span>
        );
      })}
    </div>
  );
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className="h-2 overflow-hidden rounded-full bg-muted"
    >
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2Icon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { z } from "zod";
import { useApp } from "@/components/AppProvider";
import DailyLimit from "@/components/DailyLimit";
import { Field } from "@/components/FormField";
import OnboardingCard from "@/components/OnboardingCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Category } from "@/lib/api";
import { CATEGORY_INFO, money, num } from "@/lib/format";
import { BUDGET_CATEGORIES, errorMessage } from "@/lib/forms";
import { todayIso } from "@/lib/ledger";
import { dateLabel, nextInstallment } from "@/lib/loans";
import { useLedger } from "@/lib/use-ledger";
import { cn } from "@/lib/utils";

const schema = z.object({
  amount: z
    .string()
    .transform((s) => Number(s.replace(",", ".")))
    .refine((n) => Number.isFinite(n) && n > 0, "Podaj kwotę większą od zera"),
  note: z.string().trim().max(200),
  spent_on: z.string().min(1, "Podaj datę"),
});
type FormIn = z.input<typeof schema>;
type FormOut = z.output<typeof schema>;

const COLORS: Record<Category, string> = {
  NEEDS: "var(--chart-1)",
  FUTURE: "var(--chart-2)",
  GOALS: "var(--chart-3)",
  FUN: "var(--chart-5)",
};

const monthLabel = (m: string) => new Date(`${m}-01T12:00:00`).toLocaleDateString("pl-PL", { month: "short", year: "2-digit" });

export default function ExpensesPage() {
  const { ready, profile, monthlyIncome, budget, loggedIn } = useApp();
  const ledger = useLedger();
  const [category, setCategory] = useState<Category>("FUN");
  const form = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(schema),
    defaultValues: { amount: "", note: "", spent_on: todayIso() },
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  if (!ready || ledger.loading) return <Skeleton className="mx-auto h-96 max-w-2xl" />;
  if (!profile || monthlyIncome == null) return <OnboardingCard />;

  const currency = profile.currency;
  const loansTotal = (budget?.loans ?? []).reduce((s, l) => s + l.installment_amount, 0);
  const percentages = budget?.percentages ?? { NEEDS: 50, FUTURE: 25, GOALS: 15, FUN: 10 };
  // najbliższe raty kredytów (w ciągu 31 dni), od najwcześniejszej
  const upcoming = (budget?.loans ?? [])
    .map((l) => ({ loan: l, next: nextInstallment(l) }))
    .filter((x): x is { loan: (typeof x)["loan"]; next: NonNullable<(typeof x)["next"]> } => x.next != null && x.next.inDays <= 31)
    .sort((a, b) => a.next.date.getTime() - b.next.date.getTime())

  // budżet, wydane (ręcznie + rejestr + raty w Potrzebach) per kategoria
  const rows = BUDGET_CATEGORIES.map((c) => {
    const amount = ledger.serverBudget?.amounts?.[c] ?? (monthlyIncome * percentages[c]) / 100;
    const loans = c === "NEEDS" ? loansTotal : 0;
    const spent = ledger.totals[c] + loans;
    return { c, amount, spent, usage: amount > 0 ? (spent / amount) * 100 : null, fromLedger: ledger.totals[c], fixed: loans };
  });

  const selected = rows.find((r) => r.c === category);

  async function submit(v: FormOut) {
    try {
      await ledger.add({ category, amount: v.amount, note: v.note || undefined, spent_on: v.spent_on });
      toast.success("Wydatek dopisany");
      reset({ amount: "", note: "", spent_on: todayIso() });
    } catch (e) {
      toast.error(errorMessage(e, "Nie udało się dopisać wydatku"));
    }
  }

  const config = Object.fromEntries(BUDGET_CATEGORIES.map((c) => [c, { label: CATEGORY_INFO[c].label, color: COLORS[c] }])) satisfies ChartConfig;
  const chart = ledger.trend.map((m) => ({ month: monthLabel(m.month), ...m.totals }));

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Wydatki</h1>
        <p className="text-sm text-muted-foreground">
          Dopisuj wydatki na bieżąco - dostępny budżet kategorii w kalkulatorze uwzględni je automatycznie.
          {!loggedIn && " Bez konta zapisujemy je tylko w tej przeglądarce."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dopisz wydatek</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(submit)} noValidate className="grid gap-4">
            <div role="radiogroup" aria-label="Kategoria wydatku" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {BUDGET_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={category === c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    "min-h-11 rounded-lg border px-2 text-sm font-medium transition-colors",
                    category === c ? "border-primary bg-primary/10" : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {CATEGORY_INFO[c].label}
                </button>
              ))}
            </div>
            {selected && (
              <DailyLimit
                budget={selected.amount}
                variableSpent={selected.fromLedger}
                fixed={selected.fixed}
                currency={currency}
                testId="form-daily-limit"
                spentToday={ledger.items.filter((e) => e.category === category && e.spent_on === todayIso()).reduce((s, e) => s + e.amount, 0)}
              />
            )}
            <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
              <Field label="Kwota" error={errors.amount?.message}>
                {(p) => <Input {...p} inputMode="decimal" placeholder="49,90" className="h-11" {...register("amount")} />}
              </Field>
              <Field label="Data" error={errors.spent_on?.message}>
                {(p) => <Input {...p} type="date" className="h-11" {...register("spent_on")} />}
              </Field>
            </div>
            <Field label="Notatka (opcjonalnie)" error={errors.note?.message}>
              {(p) => <Input {...p} placeholder="np. kino" className="h-11" {...register("note")} />}
            </Field>
            <Button type="submit" size="lg" className="h-11 text-base" disabled={isSubmitting}>
              Dopisz wydatek
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ten miesiąc</CardTitle>
          <CardDescription>Wydane łącznie z rejestru: {money(ledger.total, currency)}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {rows.map((r) => (
            <div key={r.c} className="grid gap-1.5" data-testid={`usage-${r.c}`}>
              <div className="flex justify-between gap-2 text-sm">
                <span className="font-medium">{CATEGORY_INFO[r.c].label}</span>
                <span className={cn("tabular-nums text-muted-foreground", r.usage != null && r.usage > 100 && "text-destructive")}>
                  {money(r.spent, currency)} / {money(r.amount, currency)}
                  {r.usage != null && ` (${num(r.usage, 0)}%)`}
                </span>
              </div>
              <div
                role="progressbar"
                aria-label={`Wykorzystanie budżetu: ${CATEGORY_INFO[r.c].label}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.min(100, Math.round(r.usage ?? 0))}
                className="h-2 overflow-hidden rounded-full bg-muted"
              >
                <div
                  className={cn("h-full rounded-full", r.usage != null && r.usage > 100 ? "bg-destructive" : "bg-primary")}
                  style={{ width: `${Math.min(100, r.usage ?? 0)}%` }}
                />
              </div>
              <DailyLimit budget={r.amount} variableSpent={r.fromLedger} fixed={r.fixed} currency={currency} testId={`daily-${r.c}`} />
            </div>
          ))}
        </CardContent>
      </Card>

      {upcoming.length > 0 && (
        <Card size="sm" data-testid="upcoming-installments">
          <CardHeader>
            <CardTitle className="text-base">Zbliżające się raty</CardTitle>
            <CardDescription>Raty kredytów i pożyczek w najbliższych tygodniach (liczą się do Potrzeb)</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {upcoming.map(({ loan, next }, i) => (
                <li key={`${loan.name}-${i}`} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{loan.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {dateLabel(next.date)} · {next.inDays === 0 ? "dziś" : `za ${next.inDays} ${next.inDays === 1 ? "dzień" : "dni"}`}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums font-semibold">{money(loan.installment_amount, currency)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Wpisy z tego miesiąca</CardTitle>
        </CardHeader>
        <CardContent>
          {ledger.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nic jeszcze nie dopisano.</p>
          ) : (
            <ul className="divide-y" data-testid="expense-list">
              {ledger.items.map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {e.note || CATEGORY_INFO[e.category].label}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">{CATEGORY_INFO[e.category].label}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(`${e.spent_on}T12:00:00`).toLocaleDateString("pl-PL")}</p>
                  </div>
                  <span className="tabular-nums text-sm font-semibold">{money(e.amount, currency)}</span>
                  <Button
                    variant="ghost"
                    className="size-10"
                    aria-label={`Usuń wydatek ${e.note || CATEGORY_INFO[e.category].label}`}
                    onClick={() => ledger.remove(e.id).catch((err) => toast.error(errorMessage(err)))}
                  >
                    <Trash2Icon />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trend: ostatnie miesiące</CardTitle>
          <CardDescription>Wydatki z rejestru w podziale na kategorie</CardDescription>
        </CardHeader>
        <CardContent>
          {ledger.trend.every((m) => m.total === 0) ? (
            <p className="text-sm text-muted-foreground">Wykres pojawi się po dopisaniu pierwszych wydatków.</p>
          ) : (
            <ChartContainer config={config} className="h-56 w-full">
              <BarChart data={chart} margin={{ left: 0, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis width={44} tickLine={false} axisLine={false} fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                {BUDGET_CATEGORIES.map((c) => (
                  <Bar key={c} dataKey={c} stackId="a" fill={`var(--color-${c})`} radius={0} />
                ))}
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

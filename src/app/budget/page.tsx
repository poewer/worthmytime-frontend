"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useApp } from "@/components/AppProvider";
import { Field } from "@/components/FormField";
import OnboardingCard from "@/components/OnboardingCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Category } from "@/lib/api";
import { CATEGORY_INFO, money, num } from "@/lib/format";
import {
  applyServerErrors,
  BUDGET_CATEGORIES,
  budgetFromForm,
  budgetSchema,
  budgetToForm,
  errorMessage,
  type BudgetFormIn,
  type BudgetFormOut,
} from "@/lib/forms";

const toNumber = (s: string | undefined) => (s && s.trim() !== "" ? Number(s.replace(",", ".")) : 0) || 0;

export default function BudgetPage() {
  const { ready, profile, monthlyIncome, budget, saveBudget } = useApp();
  if (!ready) return <Skeleton className="mx-auto h-96 max-w-2xl" />;
  if (!profile || monthlyIncome == null) return <OnboardingCard />;
  return <BudgetForm key={JSON.stringify(budget)} income={monthlyIncome} currency={profile.currency} budget={budget} save={saveBudget} />;
}

function BudgetForm({
  income,
  currency,
  budget,
  save,
}: {
  income: number;
  currency: string;
  budget: ReturnType<typeof useApp>["budget"];
  save: ReturnType<typeof useApp>["saveBudget"];
}) {
  const form = useForm<BudgetFormIn, unknown, BudgetFormOut>({
    resolver: zodResolver(budgetSchema),
    defaultValues: budgetToForm(budget),
  });
  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = form;
  const w = useWatch({ control });

  const pct = (c: Category) => toNumber(w[`pct_${c}`]);
  const spent = (c: Category) => toNumber(w[`spent_${c}`]);
  const sum = BUDGET_CATEGORIES.reduce((s, c) => s + pct(c), 0);
  const totalSpent = BUDGET_CATEGORIES.reduce((s, c) => s + spent(c), 0);
  const sumOk = Math.abs(sum - 100) < 0.01;

  async function submit(values: BudgetFormOut) {
    try {
      await save(budgetFromForm(values));
      toast.success("Budżet zapisany");
    } catch (e) {
      if (!applyServerErrors(e, setError)) toast.error(errorMessage(e, "Nie udało się zapisać budżetu"));
    }
  }

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Plan budżetu</h1>
        <p className="text-sm text-muted-foreground">
          Podziel miesięczny dochód ({money(income, currency)}) na koszyki. Przy każdym zakupie sprawdzimy, czy mieści się w budżecie wybranej kategorii.
        </p>
      </div>

      <form onSubmit={handleSubmit(submit)} noValidate className="grid gap-4">
        {BUDGET_CATEGORIES.map((c) => {
          const info = CATEGORY_INFO[c];
          const amount = (income * pct(c)) / 100;
          const available = amount - spent(c);
          return (
            <Card key={c} data-testid={`budget-${c}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  {info.label}
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{info.priority}</span>
                </CardTitle>
                <CardDescription>{info.hint}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Udział w dochodzie (%)" error={errors[`pct_${c}`]?.message}>
                    {(p) => <Input {...p} inputMode="decimal" className="h-11" {...register(`pct_${c}`)} />}
                  </Field>
                  <Field label="Wydane w tym miesiącu" hint="Ile już poszło z tej kategorii" error={errors[`spent_${c}`]?.message}>
                    {(p) => <Input {...p} inputMode="decimal" placeholder="0" className="h-11" {...register(`spent_${c}`)} />}
                  </Field>
                </div>
                <p className="text-sm text-muted-foreground">
                  Budżet: <b className="text-foreground tabular-nums">{money(amount, currency)}</b> · dostępne:{" "}
                  <b className={available < 0 ? "text-destructive tabular-nums" : "text-foreground tabular-nums"}>{money(available, currency)}</b>
                </p>
              </CardContent>
            </Card>
          );
        })}

        <Card size="sm" className={sumOk ? "" : "ring-destructive/50"}>
          <CardContent className="grid gap-1 text-sm">
            <p aria-live="polite">
              Suma procentów:{" "}
              <b data-testid="pct-sum" className={sumOk ? "text-foreground" : "text-destructive"}>
                {num(sum, 2)}%
              </b>{" "}
              {!sumOk && <span className="text-destructive">- powinno być 100%</span>}
            </p>
            <p className="text-muted-foreground">
              Wydane łącznie: {money(totalSpent, currency)}
              {totalSpent > income && <span className="text-destructive"> - więcej niż dochód ({money(totalSpent - income, currency)} deficytu)</span>}
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="lg" className="h-11 px-6 text-base" disabled={isSubmitting}>
            {isSubmitting ? "Zapisuję…" : "Zapisz budżet"}
          </Button>
          <Button type="button" variant="outline" className="h-11" onClick={() => reset(budgetToForm(null))}>
            Przywróć 50/25/15/10
          </Button>
        </div>
      </form>

      <p className="text-xs text-muted-foreground">
        Podział 50/25/15/10 to tylko punkt startowy, a nie uniwersalna reguła finansowa - dostosuj go do własnej sytuacji. Wyniki wynikają z Twoich założeń i nie są poradą finansową.
      </p>
    </div>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
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

/** Data ostatniej raty, gdy pierwsza przypada w przyszłym miesiącu (zgrubnie: dziś + liczba rat). */
const payoffLabel = (installmentsLeft: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + installmentsLeft);
  return d.toLocaleDateString("pl-PL", { month: "long", year: "numeric" });
};

const toNumber = (s: string | undefined) => (s && s.trim() !== "" ? Number(s.replace(",", ".")) : 0) || 0;

export default function BudgetPage() {
  const { ready, profile, monthlyIncome, budget, saveBudget } = useApp();
  if (!ready) return <Skeleton className="mx-auto h-96 max-w-2xl" />;
  if (!profile || monthlyIncome == null) return <OnboardingCard />;
  const hoursPerMonth = (profile.hours_per_day * profile.days_per_week * 52) / 12;
  return (
    <BudgetForm
      key={JSON.stringify(budget)}
      income={monthlyIncome}
      hourlyRate={monthlyIncome / hoursPerMonth}
      currency={profile.currency}
      budget={budget}
      save={saveBudget}
    />
  );
}

function BudgetForm({
  income,
  hourlyRate,
  currency,
  budget,
  save,
}: {
  income: number;
  hourlyRate: number;
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
    getValues,
    control,
    formState: { errors, isSubmitting },
  } = form;
  const w = useWatch({ control });
  const { fields, append, remove } = useFieldArray({ control, name: "loans" });
  const loans = (w.loans ?? []).map((l) => ({
    installment: toNumber(l?.installment_amount),
    left: Math.floor(toNumber(l?.installments_left)),
  }));
  const monthlyLoans = loans.reduce((s, l) => s + l.installment, 0);

  const pct = (c: Category) => toNumber(w[`pct_${c}`]);
  const spent = (c: Category) => toNumber(w[`spent_${c}`]);
  const sum = BUDGET_CATEGORIES.reduce((s, c) => s + pct(c), 0);
  const totalSpent = BUDGET_CATEGORIES.reduce((s, c) => s + spent(c), 0) + monthlyLoans;
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
          const loansHere = c === "NEEDS" ? monthlyLoans : 0;
          const available = amount - spent(c) - loansHere;
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
                  <Field
                    label="Wydane w tym miesiącu"
                    hint={c === "NEEDS" ? "Bez rat kredytów - te dodajemy automatycznie z sekcji poniżej" : "Ile już poszło z tej kategorii"}
                    error={errors[`spent_${c}`]?.message}
                  >
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

        <Card data-testid="loans-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              Kredyty i pożyczki
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">P0 · zobowiązania</span>
            </CardTitle>
            <CardDescription>
              Podaj ratę, liczbę rat do spłacenia i (opcjonalnie) kwotę kredytu. Raty liczymy automatycznie do kategorii Potrzeby, bo to wymagalne zobowiązania - zmniejszają dostępny budżet.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {fields.length === 0 && <p className="text-sm text-muted-foreground">Brak kredytów i pożyczek.</p>}
            {fields.map((f, i) => {
              const l = loans[i] ?? { installment: 0, left: 0 };
              const remaining = l.installment * l.left;
              return (
                <div key={f.id} className="grid gap-3 rounded-xl border bg-muted/30 p-3" data-testid={`loan-${i}`}>
                  <div className="flex items-end gap-2">
                    <Field label="Nazwa" className="flex-1" error={errors.loans?.[i]?.name?.message}>
                      {(p) => <Input {...p} placeholder="np. Kredyt hipoteczny" className="h-11" {...register(`loans.${i}.name`)} />}
                    </Field>
                    <Button type="button" variant="ghost" className="size-11" aria-label={`Usuń kredyt ${i + 1}`} onClick={() => remove(i)}>
                      <Trash2Icon />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <Field label="Wysokość raty" error={errors.loans?.[i]?.installment_amount?.message}>
                      {(p) => <Input {...p} inputMode="decimal" placeholder="800" className="h-11" {...register(`loans.${i}.installment_amount`)} />}
                    </Field>
                    <Field label="Rat do spłacenia" error={errors.loans?.[i]?.installments_left?.message}>
                      {(p) => <Input {...p} inputMode="numeric" placeholder="36" className="h-11" {...register(`loans.${i}.installments_left`)} />}
                    </Field>
                    <Field label="Kwota kredytu" hint="Opcjonalnie" error={errors.loans?.[i]?.loan_amount?.message} className="col-span-2 sm:col-span-1">
                      {(p) => <Input {...p} inputMode="decimal" placeholder="40000" className="h-11" {...register(`loans.${i}.loan_amount`)} />}
                    </Field>
                  </div>
                  {remaining > 0 && (
                    <p className="text-sm text-muted-foreground" data-testid={`loan-summary-${i}`}>
                      Do spłaty zostało <b className="text-foreground tabular-nums">{money(remaining, currency)}</b> - to{" "}
                      <b className="text-foreground tabular-nums">{num(remaining / hourlyRate, 0)} h</b> Twojej pracy. Rata to{" "}
                      {num((l.installment / income) * 100, 1)}% dochodu, ostatnia za {l.left} mies. ({payoffLabel(l.left)}).
                    </p>
                  )}
                </div>
              );
            })}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={() => append({ name: "", installment_amount: "", installments_left: "", loan_amount: "" })}
              >
                <PlusIcon /> Dodaj kredyt lub pożyczkę
              </Button>
              {monthlyLoans > 0 && (
                <p className="text-sm" data-testid="loans-total">
                  Raty łącznie: <b className="tabular-nums">{money(monthlyLoans, currency)}</b> miesięcznie ({num((monthlyLoans / income) * 100, 1)}% dochodu)
                </p>
              )}
            </div>
          </CardContent>
        </Card>

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
          <Button type="button" variant="outline" className="h-11" onClick={() => reset({ ...budgetToForm(null), loans: getValues("loans") })}>
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

"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { Controller, useFieldArray, type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FREQ_LABEL } from "@/lib/format";
import { emptyCalcForm, FREQUENCIES, type CalcFormIn, type CalcFormOut } from "@/lib/forms";
import type { CalcType } from "@/lib/api";
import { Field } from "./FormField";

export type CalcForm = UseFormReturn<CalcFormIn, unknown, CalcFormOut>;

const TYPE_LABEL: Record<CalcType, string> = {
  SIMPLE: "Zakup",
  TCO: "Koszt posiadania",
  RECURRING: "Cykliczny",
};

const FREQ_ITEMS = FREQUENCIES.map((f) => ({ value: f, label: FREQ_LABEL[f] }));

const TYPE_HINT: Record<CalcType, string> = {
  SIMPLE: "Jednorazowy wydatek, np. telefon czy buty.",
  TCO: "Cena zakupu plus koszty utrzymania w czasie, np. samochód.",
  RECURRING: "Subskrypcje i opłaty, które powtarzają się co miesiąc lub rok.",
};

export default function CalculationFields({ form }: { form: CalcForm }) {
  const {
    register,
    control,
    watch,
    reset,
    getValues,
    formState: { errors },
  } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "costs" });
  const type = watch("type");
  const costsError = errors.costs?.root?.message ?? (errors.costs as { message?: string } | undefined)?.message;

  function changeType(next: CalcType) {
    if (next === type) return;
    reset(emptyCalcForm(next, getValues("name")));
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-1.5">
        <Tabs value={type} onValueChange={(v) => changeType(v as CalcType)}>
          <TabsList className="grid h-11! w-full grid-cols-3">
            {(Object.keys(TYPE_LABEL) as CalcType[]).map((t) => (
              <TabsTrigger key={t} value={t} className="text-xs sm:text-sm">
                {TYPE_LABEL[t]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <p className="text-xs text-muted-foreground">{TYPE_HINT[type]}</p>
      </div>

      <Field label="Co chcesz kupić?" error={errors.name?.message}>
        {(p) => <Input {...p} placeholder="np. iPhone 17 Pro" autoComplete="off" className="h-11" {...register("name")} />}
      </Field>

      {type !== "RECURRING" && (
        <div className="grid items-start gap-4 sm:grid-cols-2">
          <Field label="Cena" error={errors.purchase_price?.message}>
            {(p) => (
              <Input {...p} inputMode="decimal" placeholder="5299" className="h-11" {...register("purchase_price")} />
            )}
          </Field>
          <Field
            label="Okres użytkowania (lata)"
            hint={type === "SIMPLE" ? "Opcjonalnie - policzymy koszt na dzień i miesiąc" : undefined}
            error={errors.ownership_years?.message}
          >
            {(p) => (
              <Input {...p} inputMode="decimal" placeholder="3" className="h-11" {...register("ownership_years")} />
            )}
          </Field>
          {type === "TCO" && (
            <Field label="Wartość odsprzedaży" hint="Po okresie użytkowania" error={errors.resale_value?.message}>
              {(p) => (
                <Input {...p} inputMode="decimal" placeholder="0" className="h-11" {...register("resale_value")} />
              )}
            </Field>
          )}
        </div>
      )}

      {type !== "SIMPLE" && (
        <div className="grid gap-3">
          <p className="text-sm font-medium">{type === "RECURRING" ? "Opłaty" : "Koszty dodatkowe"}</p>
          {fields.map((f, i) => (
            <Card key={f.id} size="sm" className="bg-muted/40 shadow-none">
              <CardContent className="grid gap-3">
                <div className="flex items-end gap-2">
                  <Field label="Nazwa" className="flex-1" error={errors.costs?.[i]?.name?.message}>
                    {(p) => <Input {...p} placeholder="np. Paliwo" className="h-11" {...register(`costs.${i}.name`)} />}
                  </Field>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    className="size-11"
                    aria-label={`Usuń pozycję ${i + 1}`}
                    onClick={() => remove(i)}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Kwota" error={errors.costs?.[i]?.amount?.message}>
                    {(p) => <Input {...p} inputMode="decimal" placeholder="700" className="h-11" {...register(`costs.${i}.amount`)} />}
                  </Field>
                  <Field label="Jak często" error={errors.costs?.[i]?.frequency?.message}>
                    {(p) => (
                      <Controller
                        control={control}
                        name={`costs.${i}.frequency`}
                        render={({ field }) => (
                          <Select items={FREQ_ITEMS} value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger id={p.id} className="h-11 w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FREQ_ITEMS.map((x) => (
                                <SelectItem key={x.value} value={x.value}>
                                  {x.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    )}
                  </Field>
                </div>
              </CardContent>
            </Card>
          ))}
          {costsError && (
            <p role="alert" className="text-xs text-destructive">
              {costsError}
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            className="h-11"
            onClick={() => append({ name: "", amount: "", frequency: type === "RECURRING" ? "MONTHLY" : "YEARLY" })}
          >
            <PlusIcon /> Dodaj pozycję
          </Button>
        </div>
      )}
    </div>
  );
}

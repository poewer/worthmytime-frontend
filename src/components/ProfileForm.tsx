"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { money, num } from "@/lib/format";
import {
  applyServerErrors,
  errorMessage,
  profileFromForm,
  profileSchema,
  profileToForm,
  type ProfileFormIn,
  type ProfileFormOut,
} from "@/lib/forms";
import { useApp } from "./AppProvider";
import { Field } from "./FormField";

const toNumber = (s: string) => (s.trim() === "" ? null : Number(s.replace(",", ".")));

export default function ProfileForm({ onSaved, submitLabel = "Zapisz profil" }: { onSaved?: () => void; submitLabel?: string }) {
  const { profile, saveProfile } = useApp();
  const form = useForm<ProfileFormIn, unknown, ProfileFormOut>({
    resolver: zodResolver(profileSchema),
    defaultValues: profileToForm(profile),
  });
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = form;

  const w = useWatch({ control });
  const hoursPerDay = toNumber(w.hours_per_day ?? "") ?? 0;
  const daysPerWeek = toNumber(w.days_per_week ?? "") ?? 0;
  const hoursPerMonth = (hoursPerDay * daysPerWeek * 52) / 12;
  const rate = toNumber(w.hourly_rate ?? "") ?? ((toNumber(w.monthly_income ?? "") ?? 0) / hoursPerMonth || null);
  const currency = (w.currency ?? "PLN").toUpperCase();
  const validCurrency = /^[A-Z]{3}$/.test(currency);

  async function submit(values: ProfileFormOut) {
    try {
      await saveProfile(profileFromForm(values));
      toast.success("Profil zapisany");
      onSaved?.();
    } catch (e) {
      if (!applyServerErrors(e, setError)) toast.error(errorMessage(e, "Nie udało się zapisać profilu"));
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
        <Field label="Miesięczny dochód netto" error={errors.monthly_income?.message}>
          {(p) => <Input {...p} inputMode="decimal" placeholder="7000" className="h-11" {...register("monthly_income")} />}
        </Field>
        <Field label="Waluta" error={errors.currency?.message}>
          {(p) => <Input {...p} maxLength={3} className="h-11 uppercase" {...register("currency")} />}
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Godzin pracy dziennie" error={errors.hours_per_day?.message}>
          {(p) => <Input {...p} inputMode="decimal" className="h-11" {...register("hours_per_day")} />}
        </Field>
        <Field label="Dni pracy w tygodniu" error={errors.days_per_week?.message}>
          {(p) => <Input {...p} inputMode="decimal" className="h-11" {...register("days_per_week")} />}
        </Field>
      </div>

      <Field
        label="Stawka godzinowa (opcjonalnie)"
        hint="Jeśli ją podasz, ma pierwszeństwo przed dochodem miesięcznym."
        error={errors.hourly_rate?.message}
      >
        {(p) => <Input {...p} inputMode="decimal" placeholder="np. 42" className="h-11" {...register("hourly_rate")} />}
      </Field>

      {rate != null && Number.isFinite(rate) && rate > 0 && (
        <div className="rounded-lg bg-primary/10 px-4 py-3 text-sm" aria-live="polite">
          {hoursPerMonth > 0 && <span className="text-muted-foreground">≈ {num(hoursPerMonth, 0)} h / miesiąc · </span>}
          Twoja godzina pracy jest warta{" "}
          <b className="text-foreground">{money(rate, validCurrency ? currency : "PLN")}</b>
        </div>
      )}

      <Button type="submit" size="lg" className="h-11 text-base" disabled={isSubmitting}>
        {isSubmitting ? "Zapisuję…" : submitLabel}
      </Button>
    </form>
  );
}

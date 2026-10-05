"use client";

import { useState } from "react";
import type { Profile } from "@/lib/api";
import { money, num } from "@/lib/format";
import { DEFAULT_PROFILE, useApp } from "./AppProvider";
import { Button, ErrorBox, Field, Input, toNum } from "./ui";

export default function ProfileForm({ onSaved }: { onSaved?: () => void }) {
  const { profile, saveProfile } = useApp();
  const [p, setP] = useState<Profile>(profile ?? DEFAULT_PROFILE);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const hoursPerMonth = p.hours_per_day * p.days_per_week * 4.2;
  const effective = p.hourly_rate ?? (p.monthly_income ? p.monthly_income / hoursPerMonth : null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await saveProfile({ ...p, effective_hourly_rate: undefined, hours_per_month: undefined });
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zapisać profilu");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Waluta">
          <Input maxLength={3} value={p.currency} onChange={(e) => setP({ ...p, currency: e.target.value.toUpperCase() })} />
        </Field>
        <Field label="Miesięczny dochód netto">
          <Input type="number" min="0" step="0.01" value={p.monthly_income ?? ""} onChange={(e) => setP({ ...p, monthly_income: toNum(e.target.value) })} />
        </Field>
        <Field label="Godzin pracy dziennie">
          <Input type="number" min="0.5" max="24" step="0.5" value={p.hours_per_day} onChange={(e) => setP({ ...p, hours_per_day: toNum(e.target.value) ?? 8 })} />
        </Field>
        <Field label="Dni pracy w tygodniu">
          <Input type="number" min="1" max="7" step="0.5" value={p.days_per_week} onChange={(e) => setP({ ...p, days_per_week: toNum(e.target.value) ?? 5 })} />
        </Field>
      </div>
      <Field label="Stawka godzinowa (opcjonalnie)" hint="Jeśli ją podasz, ma pierwszeństwo przed dochodem miesięcznym.">
        <Input type="number" min="0" step="0.01" value={p.hourly_rate ?? ""} onChange={(e) => setP({ ...p, hourly_rate: toNum(e.target.value) })} />
      </Field>
      {effective != null && effective > 0 && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm dark:bg-emerald-950">
          ≈ {num(hoursPerMonth, 0)} h / miesiąc · efektywna stawka <b>{money(effective, p.currency || "PLN")}/h</b>
        </p>
      )}
      <ErrorBox message={error} />
      <Button type="submit" disabled={busy || !effective}>
        {busy ? "Zapisuję…" : "Zapisz profil"}
      </Button>
    </form>
  );
}

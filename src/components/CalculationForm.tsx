"use client";

import type { CalcType, CalculationIn, CostIn, Frequency } from "@/lib/api";
import { FREQ_LABEL } from "@/lib/format";
import { Button, Field, Input, Select, toNum } from "./ui";

export const emptyCalc = (type: CalcType = "SIMPLE"): CalculationIn => ({
  name: "",
  type,
  purchase_price: 0,
  ownership_years: type === "TCO" ? 5 : null,
  resale_value: 0,
  costs: type === "RECURRING" ? [{ name: "Subskrypcja", amount: 0, frequency: "MONTHLY" }] : [],
});

const TYPES: { value: CalcType; label: string }[] = [
  { value: "SIMPLE", label: "Zakup jednorazowy" },
  { value: "TCO", label: "Koszt posiadania" },
  { value: "RECURRING", label: "Koszt cykliczny" },
];

export default function CalculationForm({
  value,
  onChange,
  onSubmit,
  busy,
  submitLabel = "Oblicz",
}: {
  value: CalculationIn;
  onChange: (v: CalculationIn) => void;
  onSubmit?: () => void;
  busy?: boolean;
  submitLabel?: string;
}) {
  const set = (patch: Partial<CalculationIn>) => onChange({ ...value, ...patch });
  const setCost = (i: number, patch: Partial<CostIn>) =>
    set({ costs: value.costs.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  const t = value.type;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      <div className="flex gap-2">
        {TYPES.map((x) => (
          <button
            type="button"
            key={x.value}
            onClick={() => onChange({ ...emptyCalc(x.value), name: value.name })}
            className={`rounded-full px-3 py-1 text-sm ${
              t === x.value ? "bg-emerald-600 text-white" : "border border-zinc-300 dark:border-zinc-700"
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>

      <Field label="Co chcesz kupić?">
        <Input required value={value.name} onChange={(e) => set({ name: e.target.value })} placeholder="np. iPhone 17 Pro" />
      </Field>

      {t !== "RECURRING" && (
        <Field label="Cena">
          <Input
            type="number" min="0" step="0.01" inputMode="decimal"
            value={value.purchase_price || ""}
            onChange={(e) => set({ purchase_price: toNum(e.target.value) ?? 0 })}
          />
        </Field>
      )}

      {t !== "RECURRING" && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Okres użytkowania (lata)" hint={t === "SIMPLE" ? "Opcjonalnie - koszt na dzień/miesiąc" : undefined}>
            <Input
              type="number" min="0.1" step="0.1" required={t === "TCO"}
              value={value.ownership_years ?? ""}
              onChange={(e) => set({ ownership_years: toNum(e.target.value) })}
            />
          </Field>
          {t === "TCO" && (
            <Field label="Wartość odsprzedaży">
              <Input
                type="number" min="0" step="0.01"
                value={value.resale_value || ""}
                onChange={(e) => set({ resale_value: toNum(e.target.value) ?? 0 })}
              />
            </Field>
          )}
        </div>
      )}

      {t !== "SIMPLE" && (
        <div className="space-y-2">
          <p className="text-sm font-medium">{t === "RECURRING" ? "Opłaty" : "Koszty dodatkowe"}</p>
          {value.costs.map((c, i) => (
            <div key={i} className="grid grid-cols-[1fr_6rem_8rem_auto] gap-2">
              <Input placeholder="Nazwa" required value={c.name} onChange={(e) => setCost(i, { name: e.target.value })} />
              <Input
                type="number" min="0" step="0.01" placeholder="Kwota"
                value={c.amount || ""}
                onChange={(e) => setCost(i, { amount: toNum(e.target.value) ?? 0 })}
              />
              <Select value={c.frequency} onChange={(e) => setCost(i, { frequency: e.target.value as Frequency })}>
                {Object.entries(FREQ_LABEL).map(([k, l]) => (
                  <option key={k} value={k}>{l}</option>
                ))}
              </Select>
              <Button type="button" variant="ghost" aria-label="Usuń pozycję" onClick={() => set({ costs: value.costs.filter((_, j) => j !== i) })}>
                ✕
              </Button>
            </div>
          ))}
          <Button
            type="button" variant="ghost"
            onClick={() => set({ costs: [...value.costs, { name: "", amount: 0, frequency: t === "RECURRING" ? "MONTHLY" : "YEARLY" }] })}
          >
            + Dodaj pozycję
          </Button>
        </div>
      )}

      {onSubmit && (
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Liczę…" : submitLabel}
        </Button>
      )}
    </form>
  );
}

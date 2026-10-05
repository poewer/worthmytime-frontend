import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";
import { z } from "zod";
import { ApiError, type CalcType, type CalculationIn, type Frequency, type Profile } from "./api";

/** Pole liczbowe z inputu tekstowego: "" -> null, przecinek dziesiętny dozwolony. */
const optionalNumber = z
  .string()
  .transform((s) => (s.trim() === "" ? null : Number(s.replace(",", "."))))
  .refine((n) => n === null || Number.isFinite(n), "Podaj liczbę");

const requiredNumber = (label: string) =>
  z
    .string()
    .transform((s) => (s.trim() === "" ? NaN : Number(s.replace(",", "."))))
    .refine((n) => Number.isFinite(n), `${label}: podaj liczbę`);

export const FREQUENCIES = ["ONE_TIME", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const satisfies readonly Frequency[];
export const CALC_TYPES = ["SIMPLE", "TCO", "RECURRING"] as const satisfies readonly CalcType[];

export const profileSchema = z
  .object({
    currency: z.string().trim().length(3, "Kod waluty ma 3 litery"),
    monthly_income: optionalNumber.refine((n) => n === null || n > 0, "Musi być większe od zera"),
    hourly_rate: optionalNumber.refine((n) => n === null || n > 0, "Musi być większe od zera"),
    hours_per_day: requiredNumber("Godziny").refine((n) => n > 0 && n <= 24, "Od 0,5 do 24 godzin"),
    days_per_week: requiredNumber("Dni").refine((n) => n > 0 && n <= 7, "Od 1 do 7 dni"),
  })
  .superRefine((v, ctx) => {
    if (v.monthly_income === null && v.hourly_rate === null) {
      ctx.addIssue({ code: "custom", path: ["monthly_income"], message: "Podaj dochód albo stawkę godzinową" });
    }
  });

export type ProfileFormIn = z.input<typeof profileSchema>;
export type ProfileFormOut = z.output<typeof profileSchema>;

export const profileToForm = (p: Profile | null): ProfileFormIn => ({
  currency: p?.currency ?? "PLN",
  monthly_income: p?.monthly_income?.toString() ?? "",
  hourly_rate: p?.hourly_rate?.toString() ?? "",
  hours_per_day: String(p?.hours_per_day ?? 8),
  days_per_week: String(p?.days_per_week ?? 5),
});

export const profileFromForm = (v: ProfileFormOut): Profile => ({
  currency: v.currency.toUpperCase(),
  monthly_income: v.monthly_income,
  hourly_rate: v.hourly_rate,
  hours_per_day: v.hours_per_day,
  days_per_week: v.days_per_week,
});

export const calculationSchema = z
  .object({
    name: z.string().trim().min(1, "Podaj nazwę").max(200),
    type: z.enum(CALC_TYPES),
    purchase_price: optionalNumber.refine((n) => n === null || n >= 0, "Nie może być ujemna"),
    ownership_years: optionalNumber.refine((n) => n === null || (n > 0 && n <= 100), "Od 0,1 do 100 lat"),
    resale_value: optionalNumber.refine((n) => n === null || n >= 0, "Nie może być ujemna"),
    costs: z.array(
      z.object({
        name: z.string().trim().min(1, "Podaj nazwę").max(200),
        amount: requiredNumber("Kwota").refine((n) => n >= 0, "Nie może być ujemna"),
        frequency: z.enum(FREQUENCIES),
      }),
    ),
  })
  .superRefine((v, ctx) => {
    if (v.type !== "RECURRING" && !v.purchase_price) {
      ctx.addIssue({ code: "custom", path: ["purchase_price"], message: "Podaj cenę" });
    }
    if (v.type === "TCO" && v.ownership_years === null) {
      ctx.addIssue({ code: "custom", path: ["ownership_years"], message: "Podaj okres użytkowania" });
    }
    if (v.type === "RECURRING" && v.costs.length === 0) {
      ctx.addIssue({ code: "custom", path: ["costs"], message: "Dodaj co najmniej jedną opłatę" });
    }
  });

export type CalcFormIn = z.input<typeof calculationSchema>;
export type CalcFormOut = z.output<typeof calculationSchema>;

export const emptyCalcForm = (type: CalcType = "SIMPLE", name = ""): CalcFormIn => ({
  name,
  type,
  purchase_price: "",
  ownership_years: type === "TCO" ? "5" : "",
  resale_value: "",
  costs: type === "RECURRING" ? [{ name: "Subskrypcja", amount: "", frequency: "MONTHLY" }] : [],
});

export const calcToForm = (c: CalculationIn): CalcFormIn => ({
  name: c.name,
  type: c.type,
  purchase_price: c.purchase_price ? String(c.purchase_price) : "",
  ownership_years: c.ownership_years != null ? String(c.ownership_years) : "",
  resale_value: c.resale_value ? String(c.resale_value) : "",
  costs: c.costs.map((x) => ({ name: x.name, amount: String(x.amount), frequency: x.frequency })),
});

export const calcFromForm = (v: CalcFormOut): CalculationIn => ({
  name: v.name,
  type: v.type,
  purchase_price: v.purchase_price ?? 0,
  ownership_years: v.type === "RECURRING" ? null : v.ownership_years,
  resale_value: v.type === "TCO" ? (v.resale_value ?? 0) : 0,
  costs: v.type === "SIMPLE" ? [] : v.costs,
});

/**
 * Przenosi błędy walidacji z API (422) na pola formularza.
 * Zwraca true, jeśli wszystkie błędy udało się przypisać do pól.
 */
export function applyServerErrors<T extends FieldValues>(err: unknown, setError: UseFormSetError<T>): boolean {
  if (!(err instanceof ApiError) || err.status !== 422 || err.errors.length === 0) return false;
  let all = true;
  for (const e of err.errors) {
    const path = e.field.replace(/^(calculation|profile|a|b)\./, "");
    if (path) setError(path as FieldPath<T>, { type: "server", message: e.message });
    else all = false;
  }
  return all;
}

export const errorMessage = (e: unknown, fallback = "Coś poszło nie tak") =>
  e instanceof Error ? e.message : fallback;

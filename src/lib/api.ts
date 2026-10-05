export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

export type Frequency = "ONE_TIME" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
export type CalcType = "SIMPLE" | "RECURRING" | "TCO";
export type Category = "NEEDS" | "FUTURE" | "GOALS" | "FUN";

/** Plan budżetu: procenty kategorii (suma 100) i wydatki w bieżącym miesiącu. */
export interface BudgetPlan {
  percentages: Record<Category, number>;
  spent: Record<Category, number>;
}

export interface BudgetState extends BudgetPlan {
  amounts: Record<Category, number> | null;
  available: Record<Category, number> | null;
  monthly_income: number | null;
  total_spent: number;
  is_custom: boolean;
}

export type WarningLevel = "critical" | "warning" | "info";

export interface BudgetWarning {
  code:
    | "CATEGORY_BUDGET_EXCEEDED"
    | "MONTHLY_COST_EXCEEDS_AVAILABLE"
    | "CATEGORY_BUDGET_TIGHT"
    | "BUDGET_DEFICIT"
    | "HIGHER_PRIORITY_AT_RISK"
    | "NO_BUDGET_DATA";
  level: WarningLevel;
  params: Record<string, number | string | null>;
}

export interface BudgetAnalysis {
  category: Category;
  priority: string;
  percentage: number;
  category_budget: number;
  spent: number;
  available: number;
  usage_percent: number | null;
  is_custom: boolean;
  fits_budget: boolean;
  upfront: {
    cost: number;
    projected_spent: number;
    projected_usage_percent: number | null;
    purchase_share_percent: number | null;
    coverage_ratio: number | null;
    months_to_goal: number | null;
    months_to_goal_full: number | null;
    monthly_contribution: number;
    already_saved: number;
    income_percent: number | null;
  } | null;
  monthly: {
    cost: number;
    projected_spent: number;
    projected_usage_percent: number | null;
    share_percent: number | null;
    income_percent: number | null;
  } | null;
  warnings: BudgetWarning[];
}

export interface Profile {
  currency: string;
  monthly_income: number | null;
  hourly_rate: number | null;
  hours_per_day: number;
  days_per_week: number;
  effective_hourly_rate?: number | null;
  hours_per_month?: number;
}

export interface CostIn {
  name: string;
  amount: number;
  frequency: Frequency;
}

export interface CalculationIn {
  name: string;
  type: CalcType;
  purchase_price: number;
  ownership_years: number | null;
  resale_value: number;
  costs: CostIn[];
  category?: Category | null;
  already_saved?: number;
  monthly_contribution?: number | null;
}

export interface WorkTime {
  hours: number;
  hours_part: number;
  minutes_part: number;
  working_days: number;
  working_weeks: number;
  working_months: number;
  working_years: number;
  /** Jaka część miesięcznej wypłaty pochłania wydatek (100 = cała). Brak w widoku publicznym. */
  income_percent?: number;
}

export interface Result {
  name: string;
  type: CalcType;
  currency?: string;
  total_cost: number;
  breakdown: { name: string; amount: number; frequency?: Frequency }[];
  hourly_rate?: number;
  work: WorkTime;
  life_cost: { years: number; per_day: number; per_week: number; per_month: number } | null;
  horizons?: { label: string; years: number; cost: number; work: WorkTime }[];
  summary?: { years: number; working_days: number };
  /** Analiza planu budżetowego - tylko gdy wybrano kategorię. */
  budget?: BudgetAnalysis | null;
}

export interface Comparison {
  currency: string;
  a: Result;
  b: Result;
  difference: { cost: number; hours: number; working_days: number };
}

export interface SavedCalculation {
  id: string;
  public_id: string | null;
  name: string;
  type: CalcType;
  currency: string;
  created_at: string;
  input: CalculationIn;
  result: Result;
}

export interface Dashboard {
  currency: string;
  count: number;
  total_value: number;
  total_hours: number;
  total_working_days: number;
  largest_expense: { id: string; name: string; total_cost: number; hours: number } | null;
  recurring: { id: string; name: string; yearly_cost: number; yearly_hours: number }[];
  recurring_yearly_total: number;
  recent: SavedCalculation[];
}

export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors: FieldError[] = [],
  ) {
    super(message);
  }
}

const TOKEN_KEY = "wmt_token";

export const getToken = () =>
  typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) => {
  if (t) window.localStorage.setItem(TOKEN_KEY, t);
  else window.localStorage.removeItem(TOKEN_KEY);
};

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method: init.method ?? (init.body !== undefined ? "POST" : "GET"),
    headers: {
      ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? `Błąd ${res.status}`, res.status, data.errors ?? []);
  return data as T;
}

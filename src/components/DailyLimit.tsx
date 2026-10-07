import { AlertTriangleIcon } from "lucide-react";
import { categoryForecast, daysLabel } from "@/lib/forecast";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  /** miesięczny budżet kategorii */
  budget: number;
  /** wydane z rejestru w tym miesiącu (zmienne wydatki, na nich liczymy tempo) */
  variableSpent: number;
  /** stałe zobowiązania w kategorii (raty), już wliczone w wydane */
  fixed?: number;
  currency: string;
  testId: string;
  /** wydane dziś w tej kategorii: pokazuje pasek dziennego limitu */
  spentToday?: number;
  now?: Date;
}

/** "Zostało 800 zł na 24 dni = 33 zł dziennie" oraz ostrzeżenie, gdy przy obecnym tempie budżet się skończy. */
export default function DailyLimit({ budget, variableSpent, fixed = 0, currency, testId, spentToday, now }: Props) {
  const f = categoryForecast(budget, variableSpent, fixed, now);

  if (budget <= 0) return null;
  if (f.available <= 0) {
    return (
      <p className="text-sm text-destructive" data-testid={testId} data-status={f.status}>
        {f.spent > 0 ? `Budżet kategorii wyczerpany (przekroczony o ${money(-f.available, currency)}).` : "Brak środków w tej kategorii."}
      </p>
    );
  }

  const usedToday = spentToday ?? 0;
  const todayPercent = f.dailyLimit > 0 ? Math.min(100, (usedToday / f.dailyLimit) * 100) : 0;
  return (
    <div className="grid gap-1.5 text-sm" data-testid={testId} data-status={f.status}>
      <p>
        Zostało <b className="tabular-nums">{money(f.available, currency)}</b> na {daysLabel(f.daysLeft)} ={" "}
        <b className="tabular-nums" data-testid={`${testId}-daily`}>
          {money(f.dailyLimit, currency)}
        </b>{" "}
        dziennie
      </p>
      {spentToday != null && (
        <div className="grid gap-1">
          <div
            role="progressbar"
            aria-label="Dzisiejsze wydatki względem dziennego limitu"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(todayPercent)}
            className="h-2 overflow-hidden rounded-full bg-muted"
          >
            <div className={cn("h-full rounded-full", usedToday > f.dailyLimit ? "bg-destructive" : "bg-primary")} style={{ width: `${todayPercent}%` }} />
          </div>
          <p className={cn("text-xs text-muted-foreground", usedToday > f.dailyLimit && "text-destructive")}>
            Dziś w tej kategorii: {money(usedToday, currency)} z {money(f.dailyLimit, currency)}
          </p>
        </div>
      )}
      {f.runsOutInDays != null && f.runsOutOn && (
        <p className="flex items-start gap-1.5 text-amber-700 dark:text-amber-400" data-testid={`${testId}-warning`}>
          <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            Przy obecnym tempie ({money(f.pacePerDay, currency)} dziennie) skończysz za {daysLabel(f.runsOutInDays)} (
            {f.runsOutOn.toLocaleDateString("pl-PL", { day: "numeric", month: "long" })}).
          </span>
        </p>
      )}
      {f.runsOutInDays == null && f.status === "WARN" && f.projectedUsagePercent != null && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Przy obecnym tempie wydasz w tym miesiącu {f.projectedUsagePercent}% budżetu kategorii.
        </p>
      )}
    </div>
  );
}

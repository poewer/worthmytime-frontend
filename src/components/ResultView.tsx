import type { Result } from "@/lib/api";
import { FREQ_LABEL, HORIZON_LABEL, hm, money, num } from "@/lib/format";
import { Card } from "./ui";

export default function ResultView({ result, currency = "PLN" }: { result: Result; currency?: string }) {
  const w = result.work;
  return (
    <div className="space-y-4">
      <Card className="text-center">
        <p className="text-sm text-zinc-500">{result.name}</p>
        <p className="text-lg font-semibold">{money(result.total_cost, currency)}</p>
        <p className="mt-3 text-sm text-zinc-500">kosztuje Cię</p>
        <p className="text-5xl font-bold text-emerald-700 dark:text-emerald-400">{num(w.hours, 1)} h</p>
        <p className="text-sm text-zinc-500">pracy ({hm(w.hours_part, w.minutes_part)})</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
          <Stat value={num(w.working_days, 1)} label="dni roboczych" />
          <Stat value={num(w.working_weeks, 1)} label="tygodni roboczych" />
          <Stat value={num(w.working_years, 2)} label="lat roboczych" />
        </div>
        {result.hourly_rate != null && (
          <p className="mt-3 text-xs text-zinc-500">Efektywna stawka: {money(result.hourly_rate, currency)}/h</p>
        )}
      </Card>

      {result.summary && (
        <p className="text-center text-sm">
          {result.summary.years} lat tego wydatku to około <b>{num(result.summary.working_days, 1)}</b> dni roboczych.
        </p>
      )}

      {result.horizons && (
        <Card>
          <h3 className="mb-2 font-semibold">Koszt w czasie</h3>
          <table className="w-full text-sm">
            <tbody>
              {result.horizons.map((h) => (
                <tr key={h.label} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="py-1.5">{HORIZON_LABEL[h.label] ?? h.label}</td>
                  <td className="text-right">{money(h.cost, currency)}</td>
                  <td className="text-right font-medium">{hm(h.work.hours_part, h.work.minutes_part)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {result.type !== "RECURRING" && result.breakdown.length > 1 && (
        <Card>
          <h3 className="mb-2 font-semibold">Rozbicie kosztów</h3>
          <table className="w-full text-sm">
            <tbody>
              {result.breakdown.map((b, i) => (
                <tr key={i} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="py-1.5">{b.name}</td>
                  <td className="text-right">{money(b.amount, currency)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-zinc-300 font-semibold dark:border-zinc-700">
                <td className="py-1.5">Razem</td>
                <td className="text-right">{money(result.total_cost, currency)}</td>
              </tr>
            </tbody>
          </table>
        </Card>
      )}

      {result.type === "RECURRING" && (
        <Card>
          <h3 className="mb-2 font-semibold">Pozycje</h3>
          <ul className="text-sm">
            {result.breakdown.map((b, i) => (
              <li key={i}>
                {b.name}: {money(b.amount, currency)} {b.frequency && FREQ_LABEL[b.frequency]}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {result.life_cost && (
        <Card>
          <h3 className="mb-2 font-semibold">Gdy używasz tego przez {num(result.life_cost.years)} lat</h3>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <Stat value={money(result.life_cost.per_day, currency)} label="/ dzień" />
            <Stat value={money(result.life_cost.per_week, currency)} label="/ tydzień" />
            <Stat value={money(result.life_cost.per_month, currency)} label="/ miesiąc" />
          </div>
        </Card>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 p-2 dark:bg-zinc-900">
      <div className="font-semibold">{value}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
}

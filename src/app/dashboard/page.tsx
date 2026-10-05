"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApp } from "@/components/AppProvider";
import { Card, ErrorBox } from "@/components/ui";
import { api, type Dashboard } from "@/lib/api";
import { money, num } from "@/lib/format";

export default function DashboardPage() {
  const { ready, loggedIn } = useApp();
  const [d, setD] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loggedIn) api<Dashboard>("/dashboard").then(setD).catch((e) => setError(e.message));
  }, [loggedIn]);

  if (!ready) return null;
  if (!loggedIn)
    return (
      <p className="text-center text-sm">
        Dashboard jest dostępny po <Link href="/profile" className="underline">zalogowaniu</Link>.
      </p>
    );
  if (error) return <ErrorBox message={error} />;
  if (!d) return <p className="text-sm text-zinc-500">Ładowanie…</p>;

  const chart = d.recent.map((c) => ({ name: c.name.slice(0, 14), hours: c.result.work.hours })).reverse();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Przeanalizowane zakupy" value={money(d.total_value, d.currency)} />
        <Metric label="Godziny pracy" value={`${num(d.total_hours, 1)} h`} />
        <Metric label="Dni robocze" value={num(d.total_working_days, 1)} />
        <Metric
          label="Największy wydatek"
          value={d.largest_expense ? d.largest_expense.name : "-"}
          sub={d.largest_expense ? money(d.largest_expense.total_cost, d.currency) : undefined}
        />
      </div>

      {chart.length > 0 && (
        <Card>
          <h2 className="mb-2 font-semibold">Ostatnie obliczenia (godziny pracy)</h2>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="hours" name="Godziny" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <Card>
        <h2 className="mb-2 font-semibold">Wydatki cykliczne</h2>
        {d.recurring.length === 0 ? (
          <p className="text-sm text-zinc-500">Brak zapisanych kosztów cyklicznych.</p>
        ) : (
          <>
            <ul className="text-sm">
              {d.recurring.map((r) => (
                <li key={r.id} className="flex justify-between border-t border-zinc-100 py-1.5 dark:border-zinc-800">
                  <span>{r.name}</span>
                  <span>{money(r.yearly_cost, d.currency)} / rok · {num(r.yearly_hours, 1)} h</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm font-semibold">Razem rocznie: {money(d.recurring_yearly_total, d.currency)}</p>
          </>
        )}
      </Card>

      {d.count === 0 && (
        <p className="text-center text-sm text-zinc-500">
          Nie masz jeszcze zapisanych obliczeń. <Link href="/" className="underline">Policz pierwsze</Link>.
        </p>
      )}
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="truncate text-lg font-bold">{value}</p>
      {sub && <p className="text-xs text-zinc-500">{sub}</p>}
    </Card>
  );
}

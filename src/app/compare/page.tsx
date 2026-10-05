"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import CalculationForm, { emptyCalc } from "@/components/CalculationForm";
import { Button, Card, ErrorBox } from "@/components/ui";
import { api, type CalculationIn, type Comparison, type SavedCalculation } from "@/lib/api";
import { hm, money, num } from "@/lib/format";

export default function Page() {
  return (
    <Suspense>
      <Compare />
    </Suspense>
  );
}

function Compare() {
  const { ready, profile, profileForRequest, loggedIn } = useApp();
  const params = useSearchParams();
  const aId = params.get("a");
  const bId = params.get("b");

  const [a, setA] = useState<CalculationIn>({ ...emptyCalc("TCO"), name: "Nowy telefon", ownership_years: 3 });
  const [b, setB] = useState<CalculationIn>({ ...emptyCalc("TCO"), name: "Obecny telefon", ownership_years: 3 });
  const [cmp, setCmp] = useState<Comparison | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // porównanie zapisanych obliczeń z historii: wczytaj ich wejścia do formularzy
  useEffect(() => {
    if (!loggedIn || !aId || !bId) return;
    Promise.all([
      api<SavedCalculation>(`/calculations/${aId}`),
      api<SavedCalculation>(`/calculations/${bId}`),
    ])
      .then(([x, y]) => {
        setA(x.input);
        setB(y.input);
      })
      .catch((e) => setError(e.message));
  }, [loggedIn, aId, bId]);

  if (!ready) return null;
  if (!profile) return <p className="text-center text-sm">Najpierw uzupełnij profil na stronie głównej.</p>;

  async function run() {
    setBusy(true);
    setError(null);
    try {
      setCmp(await api<Comparison>("/compare", { body: { profile: profileForRequest, a, b } }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd porównania");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Porównaj dwa scenariusze</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card><h2 className="mb-3 font-semibold">Scenariusz A</h2><CalculationForm value={a} onChange={setA} /></Card>
        <Card><h2 className="mb-3 font-semibold">Scenariusz B</h2><CalculationForm value={b} onChange={setB} /></Card>
      </div>
      <ErrorBox message={error} />
      <Button onClick={run} disabled={busy} className="w-full">{busy ? "Liczę…" : "Porównaj"}</Button>

      {cmp && (
        <Card className="space-y-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500">
                <th />
                <th className="text-right">{cmp.a.name}</th>
                <th className="text-right">{cmp.b.name}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="py-1.5">Koszt łączny</td>
                <td className="text-right">{money(cmp.a.total_cost, cmp.currency)}</td>
                <td className="text-right">{money(cmp.b.total_cost, cmp.currency)}</td>
              </tr>
              <tr className="border-t border-zinc-100 font-semibold dark:border-zinc-800">
                <td className="py-1.5">Czas pracy</td>
                <td className="text-right">{hm(cmp.a.work.hours_part, cmp.a.work.minutes_part)}</td>
                <td className="text-right">{hm(cmp.b.work.hours_part, cmp.b.work.minutes_part)}</td>
              </tr>
            </tbody>
          </table>
          <p className="text-center text-lg">
            {cmp.difference.hours >= 0 ? (
              <>Scenariusz A kosztuje o <b className="text-emerald-700 dark:text-emerald-400">{num(cmp.difference.hours, 1)} h</b> pracy więcej
              (≈ {num(cmp.difference.working_days, 1)} dni roboczych).</>
            ) : (
              <>Scenariusz A kosztuje o <b className="text-emerald-700 dark:text-emerald-400">{num(-cmp.difference.hours, 1)} h</b> pracy mniej
              (≈ {num(-cmp.difference.working_days, 1)} dni roboczych).</>
            )}
          </p>
        </Card>
      )}
    </div>
  );
}

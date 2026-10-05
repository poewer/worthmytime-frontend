"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import CalculationForm, { emptyCalc } from "@/components/CalculationForm";
import ProfileForm from "@/components/ProfileForm";
import ResultView from "@/components/ResultView";
import { Button, Card, ErrorBox } from "@/components/ui";
import { api, type CalculationIn, type Result, type SavedCalculation } from "@/lib/api";

export default function Page() {
  return (
    <Suspense>
      <Calculator />
    </Suspense>
  );
}

function Calculator() {
  const { ready, profile, profileForRequest, loggedIn } = useApp();
  const router = useRouter();
  const editId = useSearchParams().get("edit");

  const [calc, setCalc] = useState<CalculationIn>(emptyCalc());
  const [result, setResult] = useState<(Result & { currency?: string }) | null>(null);
  const [saved, setSaved] = useState<SavedCalculation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editId || !loggedIn) return;
    api<SavedCalculation>(`/calculations/${editId}`)
      .then((s) => {
        setCalc(s.input);
        setSaved(s);
      })
      .catch((e) => setError(e.message));
  }, [editId, loggedIn]);

  if (!ready) return <p className="text-sm text-zinc-500">Ładowanie…</p>;

  if (!profile) {
    return (
      <Card className="mx-auto max-w-lg space-y-3">
        <h1 className="text-xl font-bold">Zacznij od swojego profilu</h1>
        <p className="text-sm text-zinc-500">
          Podaj dochód albo stawkę godzinową, żebyśmy przeliczyli ceny na Twój czas pracy.
        </p>
        <ProfileForm />
      </Card>
    );
  }

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const res = await api<Result>("/calculate", {
        body: { profile: profileForRequest, calculation: calc },
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd obliczeń");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const s = saved
        ? await api<SavedCalculation>(`/calculations/${saved.id}`, { method: "PUT", body: calc })
        : await api<SavedCalculation>("/calculations", { body: calc });
      setSaved(s);
      setResult({ ...s.result, currency: s.currency });
      if (!editId) router.replace(`/?edit=${s.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się zapisać");
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    if (!saved) return;
    try {
      const { public_id } = await api<{ public_id: string }>(`/calculations/${saved.id}/share`, { method: "POST", body: {} });
      setSaved({ ...saved, public_id });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się udostępnić");
    }
  }

  const shareUrl = saved?.public_id && typeof window !== "undefined" ? `${window.location.origin}/s/${saved.public_id}` : null;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <h1 className="mb-4 text-xl font-bold">{saved ? "Edytuj obliczenie" : "Ile to naprawdę kosztuje?"}</h1>
        <CalculationForm value={calc} onChange={setCalc} onSubmit={run} busy={busy} />
        <ErrorBox message={error} />
      </Card>

      <div className="space-y-3">
        {result ? (
          <>
            <ResultView result={result} currency={result.currency ?? profile.currency} />
            <Card className="space-y-2">
              {loggedIn ? (
                <div className="flex flex-wrap gap-2">
                  <Button onClick={save} disabled={busy}>{saved ? "Zapisz zmiany" : "Zapisz w historii"}</Button>
                  {saved && !saved.public_id && <Button variant="ghost" onClick={share}>Udostępnij</Button>}
                  <Button variant="ghost" onClick={() => router.push("/compare")}>Porównaj</Button>
                </div>
              ) : (
                <p className="text-sm text-zinc-500">
                  <Link href="/profile" className="font-medium text-emerald-700 underline dark:text-emerald-400">Zaloguj się</Link>, aby zapisać wynik i go udostępnić.
                </p>
              )}
              {shareUrl && (
                <p className="break-all text-sm">
                  Publiczny link:{" "}
                  <a href={shareUrl} className="text-emerald-700 underline dark:text-emerald-400">{shareUrl}</a>
                </p>
              )}
            </Card>
          </>
        ) : (
          <Card className="text-center text-sm text-zinc-500">Wynik pojawi się tutaj.</Card>
        )}
      </div>
    </div>
  );
}

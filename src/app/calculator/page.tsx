"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SaveIcon, Settings2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useApp } from "@/components/AppProvider";
import CalculationFields from "@/components/CalculationFields";
import OnboardingCard from "@/components/OnboardingCard";
import ResultView from "@/components/ResultView";
import ShareControl from "@/components/ShareControl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type Result, type SavedCalculation } from "@/lib/api";
import { money } from "@/lib/format";
import {
  applyServerErrors,
  calcFromForm,
  calcToForm,
  calculationSchema,
  emptyCalcForm,
  errorMessage,
  type CalcFormIn,
  type CalcFormOut,
} from "@/lib/forms";

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Calculator />
    </Suspense>
  );
}

function Calculator() {
  const { ready, profile, profileForRequest, budgetForRequest, loggedIn } = useApp();
  const router = useRouter();
  const editId = useSearchParams().get("edit");

  const form = useForm<CalcFormIn, unknown, CalcFormOut>({
    resolver: zodResolver(calculationSchema),
    defaultValues: emptyCalcForm(),
  });
  const [result, setResult] = useState<(Result & { currency?: string }) | null>(null);
  const [saved, setSaved] = useState<SavedCalculation | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editId || !loggedIn) return;
    api<SavedCalculation>(`/calculations/${editId}`)
      .then((s) => {
        form.reset(calcToForm(s.input));
        setSaved(s);
        setResult({ ...s.result, currency: s.currency });
      })
      .catch((e) => toast.error(errorMessage(e, "Nie udało się wczytać obliczenia")));
  }, [editId, loggedIn, form]);

  if (!ready) return <Skeleton className="h-96 w-full" />;
  if (!profile) return <OnboardingCard />;

  const currency = profile.currency;
  const rate =
    profile.effective_hourly_rate ??
    profile.hourly_rate ??
    (profile.monthly_income ? profile.monthly_income / ((profile.hours_per_day * profile.days_per_week * 52) / 12) : null);

  function showResult() {
    // na telefonie wynik jest pod formularzem - przewiń do niego
    requestAnimationFrame(() => {
      if (window.matchMedia("(max-width: 1023px)").matches) {
        document.getElementById("result")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  async function run(values: CalcFormOut) {
    setBusy(true);
    try {
      const res = await api<Result>("/calculate", {
        body: { profile: profileForRequest, budget: budgetForRequest, calculation: calcFromForm(values) },
      });
      setResult(res);
      showResult();
    } catch (e) {
      if (!applyServerErrors(e, form.setError)) toast.error(errorMessage(e, "Błąd obliczeń"));
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    const ok = await form.trigger();
    if (!ok) return;
    const body = calcFromForm(calculationSchema.parse(form.getValues()));
    setBusy(true);
    try {
      const s = saved
        ? await api<SavedCalculation>(`/calculations/${saved.id}`, { method: "PUT", body })
        : await api<SavedCalculation>("/calculations", { body });
      setSaved(s);
      setResult({ ...s.result, currency: s.currency });
      toast.success(saved ? "Zmiany zapisane" : "Zapisano w historii");
      if (!editId) router.replace(`/calculator?edit=${s.id}`);
    } catch (e) {
      if (!applyServerErrors(e, form.setError)) toast.error(errorMessage(e, "Nie udało się zapisać"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start">
      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-3 px-1 text-sm">
          <span className="text-muted-foreground">
            Twoja godzina pracy: <b className="text-foreground">{rate != null ? money(rate, currency) : "-"}</b>
          </span>
          <Link href="/profile" className="inline-flex items-center gap-1 text-primary hover:underline">
            <Settings2Icon className="size-3.5" /> Zmień
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{saved ? "Edytuj obliczenie" : "Ile to naprawdę kosztuje?"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(run)} noValidate className="grid gap-5">
              <CalculationFields form={form} />
              <Button type="submit" size="lg" className="h-12 text-base" disabled={busy}>
                {busy ? "Liczę…" : "Oblicz"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div id="result" className="grid scroll-mt-20 gap-3">
        {result ? (
          <>
            <ResultView result={result} currency={result.currency ?? currency} />
            <Card size="sm">
              <CardContent className="grid gap-3">
                {loggedIn ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <Button className="h-11" onClick={save} disabled={busy}>
                        <SaveIcon /> {saved ? "Zapisz zmiany" : "Zapisz w historii"}
                      </Button>
                      {saved && (
                        <ShareControl
                          calculationId={saved.id}
                          publicId={saved.public_id}
                          onChange={(public_id) => setSaved({ ...saved, public_id })}
                        />
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    <Link href="/profile" className="font-medium text-primary underline">
                      Zaloguj się
                    </Link>
                    , aby zapisać wynik w historii i udostępnić go innym.
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="hidden border-dashed bg-transparent shadow-none lg:block">
            <CardContent className="py-16 text-center text-sm text-muted-foreground">
              Tutaj pojawi się wynik: ile godzin pracy kosztuje ten zakup.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

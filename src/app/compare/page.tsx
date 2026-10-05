"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ScaleIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { useApp } from "@/components/AppProvider";
import CalculationFields, { type CalcForm } from "@/components/CalculationFields";
import { Field } from "@/components/FormField";
import OnboardingCard from "@/components/OnboardingCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, type CalculationIn, type Comparison, type SavedCalculation } from "@/lib/api";
import { hm, money, num } from "@/lib/format";
import {
  calcFromForm,
  calcToForm,
  calculationSchema,
  emptyCalcForm,
  errorMessage,
  type CalcFormIn,
  type CalcFormOut,
} from "@/lib/forms";
import { cn } from "@/lib/utils";

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Compare />
    </Suspense>
  );
}

function useScenarioForm(name: string) {
  return useForm<CalcFormIn, unknown, CalcFormOut>({
    resolver: zodResolver(calculationSchema),
    defaultValues: { ...emptyCalcForm("TCO", name), ownership_years: "3" },
  });
}

async function readForm(form: CalcForm): Promise<CalculationIn | null> {
  if (!(await form.trigger())) return null;
  return calcFromForm(calculationSchema.parse(form.getValues()));
}

function Compare() {
  const { ready, profile, profileForRequest, loggedIn } = useApp();
  const params = useSearchParams();
  const aId = params.get("a");
  const bId = params.get("b");

  const formA = useScenarioForm("Nowy telefon");
  const formB = useScenarioForm("Obecny telefon");
  const [side, setSide] = useState<"a" | "b">("a");
  const [history, setHistory] = useState<SavedCalculation[]>([]);
  const [cmp, setCmp] = useState<Comparison | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loggedIn) return;
    api<{ items: SavedCalculation[] }>("/calculations")
      .then((r) => {
        setHistory(r.items);
        const a = r.items.find((x) => x.id === aId);
        const b = r.items.find((x) => x.id === bId);
        if (a) formA.reset(calcToForm(a.input));
        if (b) formB.reset(calcToForm(b.input));
      })
      .catch((e) => toast.error(errorMessage(e, "Nie udało się pobrać historii")));
  }, [loggedIn, aId, bId, formA, formB]);

  if (!ready) return <Skeleton className="h-96 w-full" />;
  if (!profile) return <OnboardingCard />;

  async function run() {
    const [a, b] = [await readForm(formA), await readForm(formB)];
    if (!a || !b) {
      if (!a) setSide("a");
      else setSide("b");
      toast.error("Uzupełnij poprawnie oba scenariusze");
      return;
    }
    setBusy(true);
    try {
      setCmp(await api<Comparison>("/compare", { body: { profile: profileForRequest, a, b } }));
      requestAnimationFrame(() => document.getElementById("compare-result")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (e) {
      toast.error(errorMessage(e, "Błąd porównania"));
    } finally {
      setBusy(false);
    }
  }

  const scenario = (key: "a" | "b", title: string, form: CalcForm) => (
    <Card className={cn(side !== key && "hidden lg:block")}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {loggedIn && history.length > 0 && (
          <CardDescription>Możesz wczytać zapisane obliczenie z historii.</CardDescription>
        )}
      </CardHeader>
      <CardContent className="grid gap-5">
        {loggedIn && history.length > 0 && (
          <Field label="Wczytaj z historii">
            {(p) => (
              <Select
                items={history.map((h) => ({ value: h.id, label: h.name }))}
                onValueChange={(id) => {
                  const h = history.find((x) => x.id === id);
                  if (h) form.reset(calcToForm(h.input));
                }}
              >
                <SelectTrigger id={p.id} className="h-11 w-full">
                  <SelectValue placeholder="Wybierz obliczenie…" />
                </SelectTrigger>
                <SelectContent>
                  {history.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Field>
        )}
        <CalculationFields form={form} />
      </CardContent>
    </Card>
  );

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Porównaj dwa scenariusze</h1>
        <p className="text-sm text-muted-foreground">Np. nowy telefon kontra zostanie przy obecnym.</p>
      </div>

      <Tabs value={side} onValueChange={(v) => setSide(v as "a" | "b")} className="lg:hidden">
        <TabsList className="grid h-11! w-full grid-cols-2">
          <TabsTrigger value="a">Scenariusz A</TabsTrigger>
          <TabsTrigger value="b">Scenariusz B</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        {scenario("a", "Scenariusz A", formA)}
        {scenario("b", "Scenariusz B", formB)}
      </div>

      <Button size="lg" className="h-12 text-base" onClick={run} disabled={busy}>
        <ScaleIcon /> {busy ? "Liczę…" : "Porównaj"}
      </Button>

      <div id="compare-result" className="scroll-mt-20">
        {cmp && <ComparisonResult cmp={cmp} />}
      </div>

      {!loggedIn && (
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/profile" className="text-primary underline">
            Zaloguj się
          </Link>
          , żeby wczytywać scenariusze z historii.
        </p>
      )}
    </div>
  );
}

function ComparisonResult({ cmp }: { cmp: Comparison }) {
  const d = cmp.difference;
  const more = d.hours >= 0;
  const data = [
    { name: cmp.a.name, hours: cmp.a.work.hours, fill: "var(--chart-1)" },
    { name: cmp.b.name, hours: cmp.b.work.hours, fill: "var(--chart-2)" },
  ];
  const config = { hours: { label: "Godziny pracy" } } satisfies ChartConfig;

  return (
    <div className="grid gap-4" aria-live="polite">
      <Card className="bg-gradient-to-br from-primary/15 via-card to-card">
        <CardContent className="grid gap-1 text-center">
          <p className="text-sm text-muted-foreground">
            „{cmp.a.name}” kosztuje {more ? "więcej" : "mniej"} niż „{cmp.b.name}” o
          </p>
          <p className="text-5xl font-bold tracking-tight text-primary tabular-nums" data-testid="diff-hours">
            {num(Math.abs(d.hours), 1)}
            <span className="ml-1 text-2xl font-semibold">h</span>
          </p>
          <p className="text-sm text-muted-foreground">
            pracy, czyli około {num(Math.abs(d.working_days), 1)} dni roboczych ({more ? "+" : "-"}
            {money(Math.abs(d.cost), cmp.currency)})
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Czas pracy</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <ChartContainer config={config} className="h-44 w-full">
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid horizontal={false} />
              <YAxis dataKey="name" type="category" width={90} tickLine={false} axisLine={false} fontSize={12} />
              <XAxis type="number" hide />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="hours" radius={6} />
            </BarChart>
          </ChartContainer>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="py-1 font-normal" />
                  <th className="py-1 text-right font-medium">{cmp.a.name}</th>
                  <th className="py-1 text-right font-medium">{cmp.b.name}</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                <tr className="border-t">
                  <td className="py-2 text-muted-foreground">Koszt łączny</td>
                  <td className="text-right">{money(cmp.a.total_cost, cmp.currency)}</td>
                  <td className="text-right">{money(cmp.b.total_cost, cmp.currency)}</td>
                </tr>
                <tr className="border-t font-semibold">
                  <td className="py-2">Czas pracy</td>
                  <td className="text-right">{hm(cmp.a.work.hours_part, cmp.a.work.minutes_part)}</td>
                  <td className="text-right">{hm(cmp.b.work.hours_part, cmp.b.work.minutes_part)}</td>
                </tr>
                <tr className="border-t">
                  <td className="py-2 text-muted-foreground">Dni robocze</td>
                  <td className="text-right">{num(cmp.a.work.working_days, 1)}</td>
                  <td className="text-right">{num(cmp.b.work.working_days, 1)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

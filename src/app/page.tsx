import { ArrowRightIcon, CalculatorIcon, ScaleIcon, Share2Icon } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const steps = [
  {
    icon: CalculatorIcon,
    title: "Podaj swoją stawkę",
    text: "Dochód netto lub stawka godzinowa - przeliczymy ją na realną wartość Twojej godziny.",
  },
  {
    icon: ScaleIcon,
    title: "Wpisz zakup",
    text: "Jednorazowa cena, koszt posiadania (auto, sprzęt) albo subskrypcja liczona w latach.",
  },
  {
    icon: Share2Icon,
    title: "Zobacz cenę w czasie",
    text: "Godziny, dni i tygodnie pracy. Porównaj scenariusze i wyślij wynik znajomym.",
  },
];

export default function Home() {
  return (
    <div className="grid gap-12 md:gap-16">
      <section className="grid items-center gap-8 pt-2 md:grid-cols-[1.1fr_1fr] md:pt-8">
        <div className="grid gap-5">
          <h1 className="text-4xl leading-[1.1] font-bold tracking-tight text-balance sm:text-5xl">
            Ile <span className="text-primary">życia</span> wymieniasz na ten zakup?
          </h1>
          <p className="max-w-prose text-lg text-pretty text-muted-foreground">
            WorthMyTime zamienia cenę na godziny Twojej pracy. Bo 5 299 zł to liczba, a 127 godzin to już decyzja.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/calculator" className={cn(buttonVariants({ size: "lg" }), "h-12 px-6 text-base")}>
              Policz mój zakup <ArrowRightIcon />
            </Link>
            <Link href="/compare" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-12 px-6 text-base")}>
              Porównaj dwa scenariusze
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">Bez rejestracji. Konto potrzebne dopiero do zapisu historii.</p>
        </div>

        <Card className="overflow-hidden bg-gradient-to-br from-primary/15 via-card to-card" aria-label="Przykładowy wynik">
          <CardContent className="grid gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">iPhone 17 Pro</p>
              <p className="text-lg font-semibold tabular-nums">5 299 zł</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">kosztuje Cię</p>
              <p className="text-6xl leading-none font-bold tracking-tight text-primary tabular-nums">
                127<span className="ml-1 text-2xl font-semibold">h</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">pracy przy stawce 41,67 zł/h</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                ["15,9", "dni roboczych"],
                ["3,2", "tyg. roboczych"],
                ["147 zł", "miesięcznie / 3 lata"],
              ].map(([v, l]) => (
                <div key={l} className="rounded-xl bg-muted/60 px-1 py-2.5">
                  <div className="font-semibold tabular-nums">{v}</div>
                  <div className="text-[11px] leading-tight text-muted-foreground">{l}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="how" className="grid gap-5">
        <h2 id="how" className="text-2xl font-semibold tracking-tight">
          Jak to działa
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title}>
              <Card className="h-full">
                <CardContent className="grid gap-2">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">Krok {i + 1}</span>
                  </div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

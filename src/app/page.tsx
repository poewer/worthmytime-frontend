import { ArrowRightIcon, CalculatorIcon, CheckIcon, ClockIcon, Gamepad2Icon, ShoppingBagIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const steps = [
  {
    icon: CalculatorIcon,
    tint: "bg-accent text-primary",
    title: "Podaj swoją stawkę",
    text: "Dochód netto lub stawka godzinowa. Policzymy też realną stawkę z dojazdem i kosztami pracy.",
  },
  {
    icon: ShoppingBagIcon,
    tint: "bg-[#fcebf1] text-[#b4235a] dark:bg-[#3a1626] dark:text-[#f08ab0]",
    title: "Wpisz zakup i kategorię",
    text: "Jednorazowa cena, koszt posiadania albo subskrypcja. Wybierz kategorię budżetu, a sprawdzimy, czy się mieści.",
  },
  {
    icon: ClockIcon,
    tint: "bg-[#fdf1d6] text-[#9a6400] dark:bg-[#3a2c0e] dark:text-[#f0c060]",
    title: "Zobacz cenę w czasie",
    text: "Godziny, procent wypłaty, miesiące pracy i maksymalna miesięczna wpłata. Odczekaj na liście życzeń, zanim kupisz.",
  },
];

const tiles = [
  ["5,4", "dnia roboczego"],
  ["1,1", "tyg. roboczego"],
  ["0,25", "miesiąca pracy"],
];

const ctaPrimary =
  "inline-flex h-[54px] items-center gap-2.5 rounded-2xl bg-primary px-6 text-base font-semibold text-primary-foreground shadow-[0_10px_24px_-10px] shadow-primary transition-colors hover:bg-primary/90";
const ctaGhost =
  "inline-flex h-[54px] items-center rounded-2xl border border-input bg-card px-5 text-base font-semibold transition-colors hover:border-foreground";

export default function Home() {
  return (
    <div className="grid gap-12 md:gap-16">
      <section className="grid items-center gap-10 pt-2 md:grid-cols-[1.1fr_1fr] md:gap-14 md:pt-8">
        <div className="grid gap-6">
          <span className="inline-flex items-center gap-2 justify-self-start rounded-full border bg-card py-1.5 pr-3 pl-2 text-[13px] font-medium text-muted-foreground">
            <span className="grid size-[22px] place-items-center rounded-full bg-accent text-primary">
              <ClockIcon className="size-3" aria-hidden />
            </span>
            Cena w godzinach Twojej pracy
          </span>
          <h1 className="font-heading text-[2.6rem] leading-[1.03] font-extrabold tracking-[-0.035em] text-balance sm:text-6xl">
            Ile <span className="rounded-sm bg-lime/60 px-1 dark:bg-lime/25">życia</span> wymieniasz na ten zakup?
          </h1>
          <p className="max-w-prose text-lg leading-relaxed text-pretty text-muted-foreground">
            WorthMyTime zamienia cenę na godziny Twojej pracy. Bo 2 500 zł to liczba, a 43 godziny to już decyzja.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/calculator" className={ctaPrimary}>
              Policz mój zakup <ArrowRightIcon className="size-[18px]" />
            </Link>
            <Link href="/compare" className={ctaGhost}>
              Porównaj dwa scenariusze
            </Link>
          </div>
          <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <CheckIcon className="size-4 text-primary" aria-hidden />
            Bez rejestracji. Konto potrzebne dopiero do zapisu historii.
          </p>
        </div>

        <div
          aria-label="Przykładowy wynik"
          role="group"
          className="relative isolate grid max-w-[480px] gap-5 overflow-hidden rounded-[28px] bg-brand p-7 text-brand-foreground shadow-[0_30px_60px_-30px] shadow-brand md:justify-self-end"
        >
          <svg
            aria-hidden
            width="320"
            height="320"
            viewBox="0 0 320 320"
            fill="none"
            className="pointer-events-none absolute -top-[120px] -right-[120px] -z-10"
          >
            <circle cx="160" cy="160" r="150" stroke="#ffffff12" strokeWidth="2" />
            <circle cx="160" cy="160" r="110" stroke="#ffffff0d" strokeWidth="2" />
            <circle cx="160" cy="160" r="70" stroke="#ffffff0a" strokeWidth="2" />
          </svg>
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-[14px] bg-white/10">
              <Gamepad2Icon className="size-[22px] text-lime" aria-hidden />
            </span>
            <div>
              <div className="text-sm text-brand-muted">PlayStation 5</div>
              <div className="text-lg font-semibold tabular-nums">2 500,00 zł</div>
            </div>
          </div>
          <div>
            <div className="text-sm text-brand-muted">kosztuje Cię</div>
            <div className="font-heading text-[5.5rem] leading-[0.95] font-extrabold tracking-[-0.045em] text-lime tabular-nums sm:text-[6.5rem]">
              43,3<span className="ml-1.5 text-[2.5rem] font-bold tracking-normal">h</span>
            </div>
            <div className="mt-1.5 text-sm text-brand-muted">pracy przy stawce 57,69 zł/h</div>
          </div>
          <div className="flex items-center gap-4 rounded-[18px] bg-white/[0.07] px-4 py-3.5">
            <div className="relative size-16 flex-none">
              <svg width="64" height="64" viewBox="0 0 120 120" aria-hidden>
                <circle cx="60" cy="60" r="50" fill="none" stroke="#ffffff26" strokeWidth="14" />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#b8f26b"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray="78.5 314.2"
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <span className="absolute inset-0 grid place-items-center text-sm font-bold">25%</span>
            </div>
            <div>
              <div className="text-[17px] leading-snug font-semibold">To 25% Twojej miesięcznej wypłaty</div>
              <div className="mt-0.5 text-[13px] text-brand-muted">Tyle z miesięcznej pracy pochłania ten wydatek.</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {tiles.map(([v, l]) => (
              <div key={l} className="rounded-2xl border border-white/10 bg-white/[0.06] px-1 py-3">
                <div className="font-heading text-[22px] font-bold tabular-nums">{v}</div>
                <div className="text-xs text-brand-muted">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="how" className="grid gap-6">
        <h2 id="how" className="font-heading text-[2rem] font-bold tracking-[-0.03em]">
          Jak to działa
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map(({ icon: Icon, tint, title, text }, i) => (
            <li
              key={title}
              className="grid content-start gap-3 rounded-[22px] border bg-card p-6 shadow-[0_1px_2px_#10201a0a,0_16px_32px_-24px_#10201a40]"
            >
              <div className="flex items-center justify-between">
                <span className={cn("grid size-12 place-items-center rounded-[14px]", tint)}>
                  <Icon className="size-[22px]" aria-hidden />
                </span>
                <span aria-hidden className="font-heading text-[2.5rem] leading-none font-extrabold text-border">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="text-lg font-semibold">
                <span className="sr-only">Krok {i + 1}: </span>
                {title}
              </h3>
              <p className="text-[15px] leading-relaxed text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

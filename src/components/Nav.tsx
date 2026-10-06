"use client";

import {
  CalculatorIcon,
  EllipsisIcon,
  HeartIcon,
  HistoryIcon,
  HourglassIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  PiggyBankIcon,
  ReceiptIcon,
  RepeatIcon,
  ScaleIcon,
  TargetIcon,
  UserRoundIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useApp } from "./AppProvider";
import ThemeToggle from "./ThemeToggle";

interface Item {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Najczęstsze akcje: zawsze na wierzchu (pasek dolny na telefonie i w menu na komputerze). */
const primary: Item[] = [
  { href: "/calculator", label: "Kalkulator", icon: CalculatorIcon },
  { href: "/budget", label: "Budżet", icon: PiggyBankIcon },
  { href: "/expenses", label: "Wydatki", icon: ReceiptIcon },
  { href: "/wishlist", label: "Życzenia", icon: HeartIcon },
];

/** Reszta schowana pod "Więcej", żeby pasek nie puchł. */
const more: Item[] = [
  { href: "/goals", label: "Cele", icon: TargetIcon },
  { href: "/compare", label: "Porównaj", icon: ScaleIcon },
  { href: "/history", label: "Historia", icon: HistoryIcon },
  { href: "/subscriptions", label: "Subskrypcje", icon: RepeatIcon },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/profile", label: "Profil", icon: UserRoundIcon },
];

const isActive = (path: string, href: string) => path === href || path.startsWith(`${href}/`);

export default function Nav() {
  const path = usePathname();
  const { email, logout } = useApp();
  const [sheetOpen, setSheetOpen] = useState(false);
  const moreActive = more.some((m) => isActive(path, m.href));

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <HourglassIcon className="size-4" />
            </span>
            WorthMyTime
          </Link>

          <nav aria-label="Główna nawigacja" className="ml-4 hidden items-center gap-1 lg:flex">
            {primary.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(path, href) ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted",
                  isActive(path, href) ? "bg-muted text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </Link>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className={cn(
                      "flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted",
                      moreActive ? "bg-muted text-foreground" : "text-muted-foreground",
                    )}
                  />
                }
              >
                Więcej <EllipsisIcon className="size-4" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {more.map(({ href, label, icon: Icon }) => (
                  <DropdownMenuItem key={href} render={<Link href={href} />}>
                    <Icon /> {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="ml-auto flex items-center gap-1">
            {email ? (
              <Button variant="ghost" size="sm" onClick={logout} className="hidden sm:inline-flex" aria-label="Wyloguj">
                <span className="max-w-40 truncate text-muted-foreground">{email}</span>
                <LogOutIcon />
              </Button>
            ) : (
              <Link href="/profile" className="px-2 text-sm font-medium text-primary hover:underline">
                Zaloguj się
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Telefon i tablet: dolny pasek z kciukowymi celami dotyku */}
      <nav
        aria-label="Nawigacja mobilna"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <ul className="grid grid-cols-5">
          {primary.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(path, href) ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
                  isActive(path, href) ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-haspopup="dialog"
              className={cn(
                "flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
                moreActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <EllipsisIcon className="size-5" />
              Więcej
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="pb-[env(safe-area-inset-bottom)]">
          <SheetHeader>
            <SheetTitle>Więcej</SheetTitle>
          </SheetHeader>
          <ul className="grid grid-cols-3 gap-2 px-4 pb-4">
            {more.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setSheetOpen(false)}
                  aria-current={isActive(path, href) ? "page" : undefined}
                  className={cn(
                    "flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl border text-xs font-medium",
                    isActive(path, href) ? "border-primary bg-primary/10 text-primary" : "text-foreground",
                  )}
                >
                  <Icon className="size-5" />
                  {label}
                </Link>
              </li>
            ))}
            {email && (
              <li>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setSheetOpen(false);
                  }}
                  className="flex min-h-20 w-full flex-col items-center justify-center gap-1.5 rounded-xl border text-xs font-medium text-muted-foreground"
                >
                  <LogOutIcon className="size-5" />
                  Wyloguj
                </button>
              </li>
            )}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
}

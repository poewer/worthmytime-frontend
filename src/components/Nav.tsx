"use client";

import { CalculatorIcon, HistoryIcon, HourglassIcon, LayoutDashboardIcon, LogOutIcon, PiggyBankIcon, ScaleIcon, UserRoundIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useApp } from "./AppProvider";
import ThemeToggle from "./ThemeToggle";

const links = [
  { href: "/calculator", label: "Kalkulator", icon: CalculatorIcon },
  { href: "/compare", label: "Porównaj", icon: ScaleIcon },
  { href: "/budget", label: "Budżet", icon: PiggyBankIcon },
  { href: "/history", label: "Historia", icon: HistoryIcon },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/profile", label: "Profil", icon: UserRoundIcon },
];

const isActive = (path: string, href: string) => path === href || path.startsWith(`${href}/`);

export default function Nav() {
  const path = usePathname();
  const { email, logout } = useApp();

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

          <nav aria-label="Główna nawigacja" className="ml-4 hidden items-center gap-1 md:flex">
            {links.map(({ href, label }) => (
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

      {/* Mobile: dolny pasek z kciukowymi celami dotyku */}
      <nav
        aria-label="Nawigacja mobilna"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="grid grid-cols-6">
          {links.map(({ href, label, icon: Icon }) => (
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
        </ul>
      </nav>
    </>
  );
}

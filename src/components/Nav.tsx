"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "./AppProvider";

const links = [
  { href: "/", label: "Kalkulator" },
  { href: "/compare", label: "Porównaj" },
  { href: "/history", label: "Historia" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profil" },
];

export default function Nav() {
  const path = usePathname();
  const { email, logout } = useApp();
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
          WorthMyTime
        </Link>
        <nav className="flex flex-wrap gap-4 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={path === l.href ? "font-semibold" : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto text-sm">
          {email ? (
            <button onClick={logout} className="text-zinc-600 hover:underline dark:text-zinc-400">
              {email} · Wyloguj
            </button>
          ) : (
            <Link href="/profile" className="text-emerald-700 hover:underline dark:text-emerald-400">
              Zaloguj się
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

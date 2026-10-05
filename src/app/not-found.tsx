import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="mx-auto grid max-w-md justify-items-center gap-4 py-16 text-center">
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="text-xl font-semibold">Tej strony nie ma</h1>
      <p className="text-sm text-muted-foreground">
        Link mógł wygasnąć - właściciel wyniku mógł wyłączyć udostępnianie - albo adres jest błędny.
      </p>
      <Link href="/" className={cn(buttonVariants(), "h-11 px-5")}>
        Wróć na start
      </Link>
    </div>
  );
}

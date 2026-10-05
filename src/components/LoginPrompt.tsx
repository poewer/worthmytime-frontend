import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function LoginPrompt({ what }: { what: string }) {
  return (
    <Card className="mx-auto max-w-md text-center">
      <CardContent className="grid justify-items-center gap-3 py-6">
        <p className="text-sm text-muted-foreground">{what} jest dostępne po zalogowaniu.</p>
        <Link href="/profile" className={cn(buttonVariants(), "h-11 px-5")}>
          Zaloguj się lub załóż konto
        </Link>
      </CardContent>
    </Card>
  );
}

"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto grid max-w-md justify-items-center gap-4 py-16 text-center" role="alert">
      <h1 className="text-xl font-semibold">Coś poszło nie tak</h1>
      <p className="text-sm text-muted-foreground">Spróbuj ponownie. Jeśli problem wraca, odśwież stronę za chwilę.</p>
      <Button className="h-11 px-5" onClick={reset}>
        Spróbuj ponownie
      </Button>
    </div>
  );
}

import { useId } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Etykieta + kontrolka + podpowiedź/błąd. Dziecko dostaje id i aria-* przez render prop. */
export function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => React.ReactNode;
}) {
  const id = useId();
  const descId = `${id}-desc`;
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children({
        id,
        "aria-invalid": !!error,
        "aria-describedby": error || hint ? descId : undefined,
      })}
      {(error || hint) && (
        <p id={descId} role={error ? "alert" : undefined} className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

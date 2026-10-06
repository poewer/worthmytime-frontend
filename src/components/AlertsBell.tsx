"use client";

import { AlertTriangleIcon, BellIcon, CheckCircle2Icon, InfoIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { alertText, type AlertLevel } from "@/lib/alerts";
import { errorMessage } from "@/lib/forms";
import { useAlerts } from "@/lib/use-alerts";
import { cn } from "@/lib/utils";
import { useApp } from "./AppProvider";

const LEVEL_STYLE: Record<AlertLevel, { box: string; icon: typeof InfoIcon; label: string }> = {
  critical: { box: "border-destructive/30 bg-destructive/10", icon: AlertTriangleIcon, label: "Pilne" },
  warning: { box: "border-amber-500/40 bg-amber-500/10", icon: AlertTriangleIcon, label: "Uwaga" },
  info: { box: "border-primary/30 bg-primary/10", icon: InfoIcon, label: "Informacja" },
};

/** Dzwonek z licznikiem i panelem alertów (kategorie na granicy budżetu, raty, cele, życzenia). */
export default function AlertsBell() {
  const { profile } = useApp();
  const { items, dismiss } = useAlerts();
  const [open, setOpen] = useState(false);
  const currency = profile?.currency ?? "PLN";
  const urgent = items.some((a) => a.level === "critical");

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        aria-label={items.length ? `Alerty (${items.length})` : "Alerty"}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        data-testid="alerts-bell"
      >
        <BellIcon />
        {items.length > 0 && (
          <span
            data-testid="alerts-count"
            className={cn(
              "absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full px-1 text-[10px] leading-4 font-bold text-white",
              urgent ? "bg-destructive" : "bg-amber-600",
            )}
          >
            {items.length}
          </span>
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md" data-testid="alerts-panel">
          <SheetHeader>
            <SheetTitle>Alerty</SheetTitle>
            <SheetDescription>Rzeczy wymagające uwagi w Twoim budżecie. Liczymy je z Twoich danych, bez e-maili.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-3 px-4 pb-6">
            {items.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="alerts-empty">
                <CheckCircle2Icon className="size-4 text-primary" aria-hidden /> Wszystko w porządku, nic nie wymaga uwagi.
              </p>
            ) : (
              <ul className="grid gap-3" aria-label="Lista alertów">
                {items.map((a) => {
                  const style = LEVEL_STYLE[a.level];
                  const text = alertText(a, currency);
                  const Icon = style.icon;
                  return (
                    <li key={a.key} className={cn("grid gap-2 rounded-xl border p-3", style.box)} data-testid={`alert-${a.key}`} data-level={a.level}>
                      <div className="flex items-start gap-2.5">
                        <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">
                            <span className="sr-only">{style.label}: </span>
                            {text.title}
                          </p>
                          <p className="text-sm text-muted-foreground">{text.body}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="-mt-1 -mr-1 size-8"
                          aria-label={`Ukryj alert: ${text.title}`}
                          onClick={() => dismiss(a).catch((e) => toast.error(errorMessage(e, "Nie udało się ukryć alertu")))}
                        >
                          <XIcon />
                        </Button>
                      </div>
                      <Link href={a.link} onClick={() => setOpen(false)} className="justify-self-start text-sm font-medium text-primary underline">
                        Przejdź do ekranu
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

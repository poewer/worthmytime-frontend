"use client";

import { DownloadIcon, Share2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Pobranie karty wyniku jako obrazka (to samo PNG co podgląd w mediach) i systemowe udostępnianie. */
export default function ShareActions({ publicId, title }: { publicId: string; title: string }) {
  const imagePath = `/s/${encodeURIComponent(publicId)}/opengraph-image`;

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link skopiowany do schowka");
    } catch (e) {
      // anulowanie okna udostępniania nie jest błędem
      if (e instanceof DOMException && e.name === "AbortError") return;
      toast.error("Nie udało się udostępnić - skopiuj adres ze paska przeglądarki");
    }
  }

  return (
    <div className="flex flex-wrap justify-center gap-2" data-testid="share-actions">
      <a href={imagePath} download={`worthmytime-${publicId}.png`} className={cn(buttonVariants({ variant: "outline" }), "h-11")}>
        <DownloadIcon /> Pobierz obraz
      </a>
      <Button variant="outline" className="h-11" onClick={share}>
        <Share2Icon /> Udostępnij
      </Button>
    </div>
  );
}
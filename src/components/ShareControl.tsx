"use client";

import { CheckIcon, CopyIcon, Link2OffIcon, Share2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/forms";

export const shareUrl = (publicId: string) => `${window.location.origin}/s/${publicId}`;

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Włącza/wyłącza publiczny link obliczenia i pozwala go skopiować. */
export default function ShareControl({
  calculationId,
  publicId,
  onChange,
}: {
  calculationId: string;
  publicId: string | null;
  onChange: (publicId: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function enable() {
    setBusy(true);
    try {
      const res = await api<{ public_id: string }>(`/calculations/${calculationId}/share`, { method: "POST", body: {} });
      onChange(res.public_id);
      if (await copyToClipboard(shareUrl(res.public_id))) toast.success("Link skopiowany do schowka");
    } catch (e) {
      toast.error(errorMessage(e, "Nie udało się udostępnić"));
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      await api(`/calculations/${calculationId}/share`, { method: "DELETE" });
      onChange(null);
      toast.success("Link przestał działać");
    } catch (e) {
      toast.error(errorMessage(e, "Nie udało się wyłączyć udostępniania"));
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!publicId) return;
    const ok = await copyToClipboard(shareUrl(publicId));
    setCopied(ok);
    if (ok) setTimeout(() => setCopied(false), 2000);
    else toast.error("Nie udało się skopiować - zaznacz link ręcznie");
  }

  if (!publicId) {
    return (
      <Button variant="outline" className="h-11" onClick={enable} disabled={busy}>
        <Share2Icon /> Udostępnij
      </Button>
    );
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-1 pl-3">
        <a href={`/s/${publicId}`} className="min-w-0 flex-1 truncate text-sm text-primary hover:underline">
          /s/{publicId}
        </a>
        <Button variant="secondary" className="h-9" onClick={copy}>
          {copied ? <CheckIcon /> : <CopyIcon />} {copied ? "Skopiowano" : "Kopiuj"}
        </Button>
      </div>
      <Button variant="ghost" size="sm" className="justify-self-start text-muted-foreground" onClick={disable} disabled={busy}>
        <Link2OffIcon /> Wyłącz udostępnianie
      </Button>
    </div>
  );
}

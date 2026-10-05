"use client";

import { CopyIcon, Link2Icon, Link2OffIcon, MoreVerticalIcon, PencilIcon, ScaleIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useApp } from "@/components/AppProvider";
import LoginPrompt from "@/components/LoginPrompt";
import { copyToClipboard, shareUrl } from "@/components/ShareControl";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, type CalcType, type SavedCalculation } from "@/lib/api";
import { CATEGORY_INFO, hm, money, num } from "@/lib/format";
import { errorMessage } from "@/lib/forms";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<CalcType, string> = { SIMPLE: "Zakup", TCO: "Koszt posiadania", RECURRING: "Cykliczny" };

export default function HistoryPage() {
  const { ready, loggedIn } = useApp();
  const router = useRouter();
  const [items, setItems] = useState<SavedCalculation[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState<"ALL" | CalcType>("ALL");
  const [toDelete, setToDelete] = useState<SavedCalculation | null>(null);

  const load = useCallback(
    () =>
      api<{ items: SavedCalculation[] }>("/calculations")
        .then((r) => setItems(r.items))
        .catch((e) => toast.error(errorMessage(e, "Nie udało się pobrać historii"))),
    [],
  );

  useEffect(() => {
    if (loggedIn) load();
  }, [loggedIn, load]);

  const visible = useMemo(
    () =>
      (items ?? []).filter(
        (c) => (type === "ALL" || c.type === type) && c.name.toLowerCase().includes(q.trim().toLowerCase()),
      ),
    [items, q, type],
  );

  if (!ready) return <Skeleton className="h-64 w-full" />;
  if (!loggedIn) return <LoginPrompt what="Historia obliczeń" />;

  async function duplicate(c: SavedCalculation) {
    try {
      await api(`/calculations/${c.id}/duplicate`, { method: "POST", body: {} });
      toast.success("Utworzono kopię");
      await load();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  async function remove() {
    if (!toDelete) return;
    try {
      await api(`/calculations/${toDelete.id}`, { method: "DELETE" });
      setSelected((s) => s.filter((x) => x !== toDelete.id));
      toast.success("Usunięto");
      setToDelete(null);
      await load();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  async function setShared(c: SavedCalculation, on: boolean) {
    try {
      if (on) {
        const r = await api<{ public_id: string }>(`/calculations/${c.id}/share`, { method: "POST", body: {} });
        setItems((all) => all?.map((x) => (x.id === c.id ? { ...x, public_id: r.public_id } : x)) ?? null);
        toast.success((await copyToClipboard(shareUrl(r.public_id))) ? "Link skopiowany do schowka" : "Link włączony");
      } else {
        await api(`/calculations/${c.id}/share`, { method: "DELETE" });
        setItems((all) => all?.map((x) => (x.id === c.id ? { ...x, public_id: null } : x)) ?? null);
        toast.success("Link przestał działać");
      }
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id].slice(-2)));

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Moje obliczenia</h1>
        <Link href="/calculator" className={cn(buttonVariants(), "h-10")}>
          Nowe obliczenie
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Input
          type="search"
          placeholder="Szukaj po nazwie…"
          aria-label="Szukaj po nazwie"
          className="h-11"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Tabs value={type} onValueChange={(v) => setType(v as "ALL" | CalcType)}>
          <TabsList className="h-11! w-full sm:w-auto">
            <TabsTrigger value="ALL">Wszystkie</TabsTrigger>
            <TabsTrigger value="SIMPLE">Zakupy</TabsTrigger>
            <TabsTrigger value="TCO">TCO</TabsTrigger>
            <TabsTrigger value="RECURRING">Cykliczne</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {items === null ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="border-dashed bg-transparent shadow-none">
          <CardContent className="grid justify-items-center gap-3 py-12 text-center">
            <p className="font-medium">Nie masz jeszcze zapisanych obliczeń</p>
            <p className="text-sm text-muted-foreground">Policz pierwszy zakup i zapisz go, żeby wrócić do niego później.</p>
            <Link href="/calculator" className={cn(buttonVariants(), "h-11 px-5")}>
              Policz pierwszy zakup
            </Link>
          </CardContent>
        </Card>
      ) : visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Brak wyników dla tych filtrów.</p>
      ) : (
        <ul className="grid gap-3">
          {visible.map((c) => (
            <li key={c.id}>
              <Card size="sm" className={cn(selected.includes(c.id) && "ring-2 ring-primary")}>
                <CardContent className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="size-5 shrink-0 accent-[var(--primary)]"
                    checked={selected.includes(c.id)}
                    onChange={() => toggle(c.id)}
                    aria-label={`Zaznacz „${c.name}” do porównania`}
                  />
                  <Link href={`/calculator?edit=${c.id}`} className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium">{c.name}</span>
                      <Badge variant="secondary">{TYPE_LABEL[c.type]}</Badge>
                      {c.result.budget && (
                        <Badge variant="outline" data-testid="history-category">
                          {CATEGORY_INFO[c.result.budget.category].label}
                        </Badge>
                      )}
                      {c.result.budget && !c.result.budget.fits_budget && (
                        <Badge variant="destructive" data-testid="history-over-budget">
                          poza budżetem
                        </Badge>
                      )}
                      {c.public_id && (
                        <Badge variant="outline" className="gap-1">
                          <Link2Icon className="size-3" /> publiczne
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">
                      {money(c.result.total_cost, c.currency)}{c.type === "RECURRING" && " / mies."} ·{" "}
                      <span className="font-medium text-foreground">{num(c.result.work.hours, 1)} h</span>
                      <span className="hidden sm:inline"> ({hm(c.result.work.hours_part, c.result.work.minutes_part)})</span> ·{" "}
                      {new Date(c.created_at).toLocaleDateString("pl-PL")}
                    </p>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="ghost" size="icon-lg" className="size-11" aria-label={`Akcje dla „${c.name}”`} />}
                    >
                      <MoreVerticalIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={() => router.push(`/calculator?edit=${c.id}`)}>
                        <PencilIcon /> Otwórz / edytuj
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicate(c)}>
                        <CopyIcon /> Duplikuj
                      </DropdownMenuItem>
                      {c.public_id ? (
                        <>
                          <DropdownMenuItem
                            onClick={async () =>
                              (await copyToClipboard(shareUrl(c.public_id!))) ? toast.success("Link skopiowany") : toast.error("Nie udało się skopiować")
                            }
                          >
                            <Link2Icon /> Kopiuj publiczny link
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setShared(c, false)}>
                            <Link2OffIcon /> Wyłącz udostępnianie
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <DropdownMenuItem onClick={() => setShared(c, true)}>
                          <Link2Icon /> Udostępnij
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => setToDelete(c)}>
                        <Trash2Icon /> Usuń
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {selected.length > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 px-4 md:bottom-6">
          <div className="mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl border bg-popover p-2 pl-4 shadow-lg">
            <span className="text-sm">Zaznaczono {selected.length}/2</span>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setSelected([])}>
                Wyczyść
              </Button>
              <Button disabled={selected.length !== 2} onClick={() => router.push(`/compare?a=${selected[0]}&b=${selected[1]}`)}>
                <ScaleIcon /> Porównaj
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usunąć obliczenie?</DialogTitle>
            <DialogDescription>
              „{toDelete?.name}” zostanie trwale usunięte, a jego publiczny link przestanie działać.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)}>
              Anuluj
            </Button>
            <Button variant="destructive" onClick={remove}>
              Usuń
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

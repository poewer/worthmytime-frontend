"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { Button, Card, ErrorBox } from "@/components/ui";
import { api, type SavedCalculation } from "@/lib/api";
import { money, num } from "@/lib/format";

export default function HistoryPage() {
  const { ready, loggedIn } = useApp();
  const router = useRouter();
  const [items, setItems] = useState<SavedCalculation[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    () =>
      api<{ items: SavedCalculation[] }>("/calculations")
        .then((r) => setItems(r.items))
        .catch((e) => setError(e.message)),
    [],
  );

  useEffect(() => {
    if (loggedIn) load();
  }, [loggedIn, load]);

  if (!ready) return null;
  if (!loggedIn)
    return (
      <p className="text-center text-sm">
        Historia jest dostępna po <Link href="/profile" className="underline">zalogowaniu</Link>.
      </p>
    );

  async function act(id: string, kind: "duplicate" | "delete") {
    try {
      if (kind === "delete") {
        if (!confirm("Usunąć to obliczenie?")) return;
        await api(`/calculations/${id}`, { method: "DELETE" });
      } else {
        await api(`/calculations/${id}/duplicate`, { method: "POST", body: {} });
      }
      setSelected((s) => s.filter((x) => x !== id));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd");
    }
  }

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id].slice(-2)));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Moje obliczenia</h1>
        <Button disabled={selected.length !== 2} onClick={() => router.push(`/compare?a=${selected[0]}&b=${selected[1]}`)}>
          Porównaj zaznaczone ({selected.length}/2)
        </Button>
      </div>
      <ErrorBox message={error} />
      {items?.length === 0 && <p className="text-sm text-zinc-500">Brak zapisanych obliczeń.</p>}
      {items?.map((c) => (
        <Card key={c.id} className="flex flex-wrap items-center gap-3">
          <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} aria-label="Zaznacz do porównania" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{c.name}</p>
            <p className="text-sm text-zinc-500">
              {money(c.result.total_cost, c.currency)} · {num(c.result.work.hours, 1)} h pracy
              {c.public_id && <> · <Link href={`/s/${c.public_id}`} className="underline">publiczny</Link></>}
            </p>
          </div>
          <Button variant="ghost" onClick={() => router.push(`/?edit=${c.id}`)}>Otwórz / edytuj</Button>
          <Button variant="ghost" onClick={() => act(c.id, "duplicate")}>Duplikuj</Button>
          <Button variant="danger" onClick={() => act(c.id, "delete")}>Usuń</Button>
        </Card>
      ))}
    </div>
  );
}

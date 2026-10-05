"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ResultView from "@/components/ResultView";
import { ErrorBox } from "@/components/ui";
import { api, type Result } from "@/lib/api";

export default function SharedPage() {
  const { publicId } = useParams<{ publicId: string }>();
  const [data, setData] = useState<{ currency: string; result: Result } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ currency: string; result: Result }>(`/shared/${publicId}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [publicId]);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <ErrorBox message={error} />
      {data ? <ResultView result={data.result} currency={data.currency} /> : !error && <p className="text-sm text-zinc-500">Ładowanie…</p>}
      <p className="text-center text-sm">
        Sprawdź, ile Ty zapłacisz swoim czasem:{" "}
        <Link href="/" className="font-medium text-emerald-700 underline dark:text-emerald-400">WorthMyTime</Link>
      </p>
    </div>
  );
}

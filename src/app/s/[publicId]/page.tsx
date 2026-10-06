import { ArrowRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ResultView from "@/components/ResultView";
import ShareActions from "@/components/ShareActions";
import { buttonVariants } from "@/components/ui/button";
import type { Result } from "@/lib/api";
import { money, num } from "@/lib/format";
import { serverApi } from "@/lib/server-api";
import { cn } from "@/lib/utils";

type Shared = { name: string; currency: string; result: Result };

const load = (publicId: string) => serverApi<Shared>(`/shared/${encodeURIComponent(publicId)}`);

export async function generateMetadata({ params }: PageProps<"/s/[publicId]">): Promise<Metadata> {
  const { publicId } = await params;
  const data = await load(publicId);
  if (!data) return { title: "Nie znaleziono wyniku", robots: { index: false } };
  const { result } = data;
  const title = `${result.name}: ${num(result.work.hours, 1)} h pracy`;
  const description = `${money(result.total_cost, data.currency)} to około ${num(result.work.working_days, 1)} dni roboczych. Sprawdź, ile Ciebie kosztuje ten zakup.`;
  return { title, description, openGraph: { title, description, type: "website" }, twitter: { card: "summary_large_image", title, description } };
}

export default async function SharedPage({ params }: PageProps<"/s/[publicId]">) {
  const { publicId } = await params;
  const data = await load(publicId);
  if (!data) notFound();

  return (
    <div className="mx-auto grid max-w-lg gap-5">
      <p className="text-center text-sm text-muted-foreground">Ktoś udostępnił Ci wynik z WorthMyTime</p>
      <ResultView result={data.result} currency={data.currency} />
      <ShareActions publicId={publicId} title={`${data.result.name}: ${num(data.result.work.hours, 1)} h pracy`} />
      <div className="grid justify-items-center gap-2 text-center">
        <p className="text-sm text-muted-foreground">Sprawdź, ile Ciebie kosztuje Twój następny zakup.</p>
        <Link href="/calculator" className={cn(buttonVariants({ size: "lg" }), "h-12 px-6 text-base")}>
          Policz własny zakup <ArrowRightIcon />
        </Link>
      </div>
    </div>
  );
}

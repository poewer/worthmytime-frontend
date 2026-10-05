import { ImageResponse } from "next/og";
import { money, num } from "@/lib/format";
import { serverApi } from "@/lib/server-api";
import type { Result } from "@/lib/api";

export const alt = "Wynik WorthMyTime";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const data = await serverApi<{ currency: string; result: Result }>(`/shared/${encodeURIComponent(publicId)}`);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #ecfdf5 0%, #ffffff 60%)",
          color: "#0f172a",
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 700, color: "#059669" }}>WorthMyTime</div>
        {data ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 44, color: "#475569" }}>
              {data.result.name} - {money(data.result.total_cost, data.currency)}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", marginTop: 12 }}>
              <div style={{ fontSize: 190, fontWeight: 800, color: "#059669", lineHeight: 1 }}>
                {num(data.result.work.hours, 1)}
              </div>
              <div style={{ fontSize: 64, fontWeight: 700, color: "#059669", marginLeft: 16 }}>h pracy</div>
            </div>
            <div style={{ fontSize: 40, color: "#475569", marginTop: 8 }}>
              ok. {num(data.result.work.working_days, 1)} dni roboczych
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 64, fontWeight: 700 }}>Ile życia wymieniasz na ten zakup?</div>
        )}
        <div style={{ fontSize: 30, color: "#64748b" }}>Przelicz cenę na godziny swojej pracy</div>
      </div>
    ),
    size,
  );
}

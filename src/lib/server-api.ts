import "server-only";

/** Adres API dla zapytań z serwera Next.js (w Dockerze zwykle adres wewnętrzny, np. http://api:8000/api/v1). */
const SERVER_API_URL =
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

export async function serverApi<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${SERVER_API_URL}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

# WorthMyTime - frontend

Next.js (App Router) + TypeScript + Tailwind v4 + shadcn/ui (Base UI) + Recharts + react-hook-form/zod.

## Uruchomienie

```powershell
copy .env.example .env.local     # NEXT_PUBLIC_API_URL=http://localhost:8001/api/v1
npm install
npm run dev                      # http://localhost:3000
```

Backend: patrz `../worthmytime-backend/README.md` (domyślnie port 8001).

## Zmienne środowiskowe

| Zmienna | Opis |
|---|---|
| `NEXT_PUBLIC_API_URL` | adres API dla przeglądarki, wkompilowywany w czasie budowania (w Dockerze `build-arg`) |
| `API_URL` | opcjonalnie: adres API dla zapytań z serwera Next.js (strona `/s/...`), np. `http://api:8000/api/v1` w sieci docker |

## Struktura

- `/` landing, `/calculator` kalkulator i wynik, `/compare` porównanie, `/history`, `/dashboard`, `/profile` (profil + konto)
- `/s/[publicId]` publiczny wynik renderowany po stronie serwera (metadane OG + `opengraph-image`)
- `src/components/ui` komponenty shadcn/ui, `src/lib/forms.ts` schematy zod i mapowanie błędów 422 z API na pola

## Testy

```powershell
npm run lint
npm run test:e2e                 # Playwright, desktop + mobile (Pixel 7), API zamockowane
```

Testy e2e budują wersję produkcyjną i startują ją na porcie 3100 (`E2E_PORT`). Pierwszy raz: `npx playwright install chromium`.
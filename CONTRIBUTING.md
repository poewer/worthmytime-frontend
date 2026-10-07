# Jak pracujemy

Jedna zasada na całą pracę:

> **issue = branch = pull request = merge = zamknięcie zadania = usunięcie brancha**

Nic nie trafia do `dev`, `stage` ani `main` inaczej niż przez pull request. Bezpośredni push jest zablokowany.

## Cykl pracy

1. **Issue.** Każda zmiana ma issue (zadania są też na tablicy projektu). Weź zadanie ze statusem *Ready*, przypisz je sobie i przenieś do *In progress*. Brak issue? Najpierw je utwórz.
2. **Branch.** Z aktualnego `dev`, nazwa `<typ>/<numer-issue>-<opis>`:
   ```powershell
   git switch dev; git pull
   git switch -c feature/24-savings-rate
   ```
   Typy: `feature`, `fix`, `chore`, `docs`, `refactor`, `test`. Opis małymi literami, cyframi i myślnikami. Można też użyć przycisku *Create a branch* w issue.
3. **Commity.** Małe, z czytelnymi komunikatami. Historię i tak scalamy do jednego commita (squash), więc tytuł PR jest ważniejszy.
4. **Pull request.** Otwórz PR do `dev` (może być *Draft*). W opisie musi być `Closes #<numer>` z tym samym numerem co w nazwie brancha. Wypełnij szablon.
5. **Kontrole.** PR musi przejść: `test` (lint + testy e2e Playwright) i `pr-policy` (nazwa brancha i `Closes #...`). Dodatkowo właściciel dostaje prośbę o review automatycznie (CODEOWNERS).
6. **Merge do `dev`.** *Squash and merge*, gdy kontrole są zielone. Po merge GitHub automatycznie: zamyka issue (przez `Closes`), usuwa branch, a zadanie na tablicy przechodzi do *Done*. Dalej zmiana czeka na wydanie (patrz niżej). Obraz Docker buduje się z `main`.
7. **Sprzątanie lokalne:**
   ```powershell
   git switch dev; git pull; git fetch --prune
   git branch -d feature/24-savings-rate
   ```

## Gałęzie i wydania

| Gałąź | Rola | Kto scala |
|---|---|---|
| `main` | **produkcja** (z niej budujemy obraz i wdrażamy) | tylko właściciel (`poewer`) |
| `stage` | **testy przed produkcją**: tu sprawdzamy produkt przed wydaniem | tylko właściciel (`poewer`) |
| `dev` | **integracja**: tu deweloperzy scalają swoje zadania | każdy z uprawnieniem zapisu, po zielonych kontrolach |

Droga zmiany: `feature/...` -> `dev` -> `stage` -> `main`.

- Zadania scalamy do `dev` przyciskiem **Squash and merge** (jedna zmiana = jeden commit).
- Wydanie to osobne pull requesty **`dev` -> `stage`** i **`stage` -> `main`**, scalane przyciskiem **Create a merge commit** (nie squash, żeby gałęzie się nie rozjechały). Otwiera je i scala właściciel.
- Do `stage` wchodzi wyłącznie `dev`, do `main` wyłącznie `stage`. Pilna poprawka produkcji też idzie tą drogą (nazwij ją `fix/...`).
- Wszystkie trzy gałęzie są chronione: zmiany tylko przez PR, wymagane kontrole, bez force-pusha i bez usuwania.
- **`dev` i `stage` nigdy nie są w tyle za `main`** (mogą być przed). Po każdym wydaniu na `main` właściciel synchronizuje wstecz PR-ami `main` -> `stage` i `main` -> `dev` (merge commit), bo wydanie merge commitem dodaje commit tylko na `main`.

## Zasady

- Jeden PR = jedno zadanie. Za duże? Rozbij issue na mniejsze.
- Nie pushuj do `dev`, `stage` ani `main`, nie obchodź CI, nie scalaj z czerwonymi kontrolami. Do `stage` i `main` scala tylko właściciel.
- Zmiana działania aplikacji = test. Zmiana modeli = migracja Alembic.
- Pytania i decyzje zapisuj w komentarzu pod issue, żeby zostały w historii.

## Frontend: uruchomienie lokalnie

```powershell
copy .env.example .env.local               # NEXT_PUBLIC_API_URL=http://localhost:8001/api/v1
npm install
npm run dev                                # http://localhost:3000 (backend z repo worthmytime-backend na porcie 8001)
npm run lint                               # lint
npm run test:e2e                           # Playwright, desktop + telefon, API zamockowane
```

Testy e2e budują wersję produkcyjną do osobnego katalogu `.next-e2e`, więc nie psują działającego `npm run dev`. Pierwszy raz: `npx playwright install chromium`.

Wzorce w kodzie: formularze to react-hook-form + zod (`src/lib/forms.ts`), komponenty UI z shadcn/ui w `src/components/ui`, logika przeliczeń po stronie serwera - frontend tylko prezentuje wyniki z API. Każda nowa funkcja wymaga układu sprawdzonego na telefonie.
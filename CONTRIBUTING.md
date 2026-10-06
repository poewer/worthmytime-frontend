# Jak pracujemy

Jedna zasada na całą pracę:

> **issue = branch = pull request = merge = zamknięcie zadania = usunięcie brancha**

Nic nie trafia na `main` inaczej niż przez pull request. Bezpośredni push do `main` jest zablokowany.

## Cykl pracy

1. **Issue.** Każda zmiana ma issue (zadania są też na tablicy projektu). Weź zadanie ze statusem *Ready*, przypisz je sobie i przenieś do *In progress*. Brak issue? Najpierw je utwórz.
2. **Branch.** Z aktualnego `main`, nazwa `<typ>/<numer-issue>-<opis>`:
   ```powershell
   git switch main; git pull
   git switch -c feature/24-savings-rate
   ```
   Typy: `feature`, `fix`, `chore`, `docs`, `refactor`, `test`. Opis małymi literami, cyframi i myślnikami. Można też użyć przycisku *Create a branch* w issue.
3. **Commity.** Małe, z czytelnymi komunikatami. Historię i tak scalamy do jednego commita (squash), więc tytuł PR jest ważniejszy.
4. **Pull request.** Otwórz PR do `main` (może być *Draft*). W opisie musi być `Closes #<numer>` z tym samym numerem co w nazwie brancha. Wypełnij szablon.
5. **Kontrole.** PR musi przejść: `test` (lint + testy e2e Playwright) i `pr-policy` (nazwa brancha i `Closes #...`). Dodatkowo właściciel dostaje prośbę o review automatycznie (CODEOWNERS).
6. **Merge.** Tylko *Squash and merge*. Po merge GitHub automatycznie: zamyka issue (przez `Closes`), usuwa branch, a zadanie na tablicy przechodzi do *Done*. Obraz Docker buduje się z `main`.
7. **Sprzątanie lokalne:**
   ```powershell
   git switch main; git pull; git fetch --prune
   git branch -d feature/24-savings-rate
   ```

## Zasady

- Jeden PR = jedno zadanie. Za duże? Rozbij issue na mniejsze.
- Nie pushuj do `main`, nie obchodź CI, nie scalaj z czerwonymi kontrolami.
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
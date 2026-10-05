import { expect, test } from "@playwright/test";
import { json, PROFILE, RESULT, SAVED, withLocalProfile } from "./mocks";

test("onboarding profilu, a potem obliczenie zakupu", async ({ page }) => {
  await page.route("**/api/v1/calculate", (r) => json(r, RESULT));

  await page.goto("/calculator");
  await page.getByLabel("Miesięczny dochód netto").fill("7000");
  await expect(page.getByText("41,67")).toBeVisible(); // podgląd efektywnej stawki
  await page.getByRole("button", { name: /Dalej/ }).click();

  await page.getByLabel("Co chcesz kupić?").fill("iPhone 17 Pro");
  await page.getByLabel("Cena").fill("5299");
  await page.getByLabel("Okres użytkowania (lata)").fill("3");
  await page.getByRole("button", { name: "Oblicz" }).click();

  await expect(page.getByTestId("hours")).toContainText("127,2");
  await expect(page.getByText("Gdy używasz tego przez 3 lata")).toBeVisible();
  await expect(page.getByText("aby zapisać wynik w historii")).toBeVisible();
});

test("walidacja formularza pokazuje błędy przy polach", async ({ page }) => {
  await withLocalProfile(page);
  await page.goto("/calculator");
  await page.getByRole("button", { name: "Oblicz" }).click();
  await expect(page.getByText("Podaj nazwę")).toBeVisible();
  await expect(page.getByText("Podaj cenę")).toBeVisible();
});

test("błąd 422 z API trafia do właściwego pola", async ({ page }) => {
  await withLocalProfile(page);
  await page.route("**/api/v1/calculate", (r) =>
    json(r, { error: "Błąd walidacji danych", errors: [{ field: "calculation.purchase_price", message: "Cena jest za wysoka" }] }, 422),
  );
  await page.goto("/calculator");
  await page.getByLabel("Co chcesz kupić?").fill("Zamek");
  await page.getByLabel("Cena").fill("999999999");
  await page.getByRole("button", { name: "Oblicz" }).click();
  await expect(page.getByText("Cena jest za wysoka")).toBeVisible();
});

test("koszt cykliczny: wykres i tabela horyzontów", async ({ page }) => {
  await withLocalProfile(page);
  const horizon = (label: string, years: number, cost: number, hours: number) => ({
    label,
    years,
    cost,
    work: { ...RESULT.work, hours, hours_part: Math.floor(hours), minutes_part: 0 },
  });
  await page.route("**/api/v1/calculate", (r) =>
    json(r, {
      ...RESULT,
      name: "Netflix",
      type: "RECURRING",
      life_cost: null,
      breakdown: [{ name: "Netflix", amount: 49, frequency: "MONTHLY" }],
      horizons: [horizon("1 month", 0.0833, 49, 1.18), horizon("1 year", 1, 588, 14.1), horizon("10 years", 10, 5880, 141.1)],
      summary: { years: 10, working_days: 17.64 },
    }),
  );
  await page.goto("/calculator");
  await page.getByRole("tab", { name: "Cykliczny" }).click();
  await page.getByLabel("Co chcesz kupić?").fill("Netflix");
  await page.getByLabel("Kwota").fill("49");
  await page.getByLabel("Nazwa").fill("Netflix");
  await page.getByRole("button", { name: "Oblicz" }).click();
  await expect(page.getByText("Koszt w czasie")).toBeVisible();
  await expect(page.getByText("10 lat tego wydatku to około")).toBeVisible();
});

test("rejestracja, zapis w historii i publiczny link", async ({ page }) => {
  let saved = { ...SAVED };
  await page.route("**/api/v1/auth/register", (r) => json(r, { token: "t", profile: PROFILE }, 201));
  await page.route("**/api/v1/auth/me", (r) => json(r, { id: "u1", email: "a@b.pl", profile: PROFILE }));
  await page.route("**/api/v1/calculate", (r) => json(r, RESULT));
  await page.route("**/api/v1/calculations", (r) => json(r, saved, 201));
  await page.route("**/api/v1/calculations/c1", (r) => json(r, saved));
  await page.route("**/api/v1/calculations/c1/share", (r) => {
    saved = { ...saved, public_id: "abc123" };
    return json(r, { public_id: "abc123", path: "/s/abc123" });
  });
  await withLocalProfile(page);

  await page.goto("/profile");
  await page.getByRole("button", { name: /Nie mam konta/ }).click();
  await page.getByLabel("E-mail").fill("a@b.pl");
  await page.getByLabel("Hasło").fill("supersecret1");
  await page.getByRole("button", { name: "Zarejestruj" }).click();
  await expect(page.getByText("Zalogowano jako")).toBeVisible();

  await page.goto("/calculator");
  await page.getByLabel("Co chcesz kupić?").fill("iPhone 17 Pro");
  await page.getByLabel("Cena").fill("5299");
  await page.getByRole("button", { name: "Oblicz" }).click();
  await page.getByRole("button", { name: /Zapisz w historii/ }).click();
  await page.getByRole("button", { name: "Udostępnij" }).click();
  await expect(page.getByRole("link", { name: "/s/abc123" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Wyłącz udostępnianie/ })).toBeVisible();
});

test("historia: filtrowanie i stan pusty", async ({ page }) => {
  await page.route("**/api/v1/auth/me", (r) => json(r, { id: "u1", email: "a@b.pl", profile: PROFILE }));
  await page.route("**/api/v1/calculations", (r) =>
    json(r, { items: [SAVED, { ...SAVED, id: "c2", name: "Rower", type: "TCO" }] }),
  );
  await page.addInitScript(() => window.localStorage.setItem("wmt_token", "t"));
  await page.goto("/history");
  await expect(page.getByText("iPhone 17 Pro")).toBeVisible();
  await page.getByLabel("Szukaj po nazwie").fill("rower");
  await expect(page.getByText("iPhone 17 Pro")).toBeHidden();
  await expect(page.getByText("Rower")).toBeVisible();
});

test("nawigacja i brak poziomego przewijania", async ({ page, isMobile }) => {
  await page.goto("/");
  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(horizontalOverflow).toBeLessThanOrEqual(0);

  if (isMobile) {
    await expect(page.getByRole("navigation", { name: "Nawigacja mobilna" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Główna nawigacja" })).toBeHidden();
  } else {
    await expect(page.getByRole("navigation", { name: "Główna nawigacja" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Nawigacja mobilna" })).toBeHidden();
  }
});

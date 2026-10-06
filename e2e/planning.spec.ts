import { expect, test, type Page } from "@playwright/test";
import { json, PROFILE, RESULT, SAVED, withLocalLedger, withLocalProfile } from "./mocks";

/** Zalogowany użytkownik: token w localStorage + /auth/me i pusty /budget. */
async function asLoggedIn(page: Page) {
  await page.route("**/api/v1/auth/me", (r) => json(r, { id: "u1", email: "a@b.pl", profile: PROFILE }));
  await page.route("**/api/v1/budget", (r) =>
    json(r, {
      percentages: { NEEDS: 50, FUTURE: 25, GOALS: 15, FUN: 10 },
      spent: { NEEDS: 0, FUTURE: 0, GOALS: 0, FUN: 0 },
      ledger: { NEEDS: 0, FUTURE: 0, GOALS: 0, FUN: 0 },
      spent_total: { NEEDS: 0, FUTURE: 0, GOALS: 0, FUN: 0 },
      loans: [],
      monthly_loans: 0,
      loans_income_percent: null,
      last_installment_in_months: 0,
      amounts: { NEEDS: 3500, FUTURE: 1750, GOALS: 1050, FUN: 700 },
      available: { NEEDS: 3500, FUTURE: 1750, GOALS: 1050, FUN: 500 },
      monthly_income: 7000,
      total_spent: 0,
      is_custom: false,
    }),
  );
  await page.addInitScript(() => window.localStorage.setItem("wmt_token", "t"));
}

test("rejestr wydatków (bez konta): dopisanie, zużycie budżetu, usunięcie i plan w żądaniu", async ({ page }) => {
  await withLocalProfile(page);
  await page.goto("/expenses");

  await page.getByRole("radio", { name: "Przyjemności" }).click();
  await page.getByLabel("Kwota").fill("200");
  await page.getByLabel("Notatka (opcjonalnie)").fill("kino");
  await page.getByRole("button", { name: "Dopisz wydatek" }).click();

  await expect(page.getByTestId("expense-list")).toContainText("kino");
  // budżet FUN przy dochodzie 7 000 zł to 700 zł: 200 / 700 = 29%
  await expect(page.getByTestId("usage-FUN")).toContainText("29%");

  // kalkulator wysyła plan z wydanymi 200 zł (z rejestru) w kategorii FUN
  let sent: { budget?: { spent: Record<string, number> } } | undefined;
  await page.route("**/api/v1/calculate", (r) => {
    sent = r.request().postDataJSON();
    return json(r, RESULT);
  });
  await page.goto("/calculator");
  await page.getByLabel("Co chcesz kupić?").fill("Gra");
  await page.getByLabel("Cena").fill("100");
  await page.getByRole("radio", { name: "Przyjemności" }).click();
  await page.getByRole("button", { name: "Oblicz" }).click();
  await expect(page.getByTestId("hours")).toBeVisible();
  expect(sent?.budget?.spent.FUN).toBe(200);

  await page.goto("/expenses");
  await page.getByRole("button", { name: /Usuń wydatek kino/ }).click();
  await expect(page.getByText("Nic jeszcze nie dopisano.")).toBeVisible();
});

test("lista życzeń: ostygnięcie, odpuszczenie i statystyka oszczędności", async ({ page }) => {
  await asLoggedIn(page);
  const work = { ...RESULT.work, hours: 61.9 };
  let items = [
    { id: "w1", name: "PlayStation", price: 2500, category: "FUN", cooldown_days: 30, status: "WAITING", created_at: "2026-09-01T10:00:00Z", decided_at: null, ready_at: "2026-10-01T10:00:00Z", days_left: 0, ready: true, work },
    { id: "w2", name: "Rower", price: 3000, category: null, cooldown_days: 30, status: "WAITING", created_at: "2026-10-01T10:00:00Z", decided_at: null, ready_at: "2026-10-31T10:00:00Z", days_left: 25, ready: false, work },
  ];
  const stats = (dropped: number) => ({ dropped_count: dropped, dropped_total: dropped * 2500, dropped_hours: dropped * 61.9, waiting_count: 2 - dropped, waiting_total: 0, ready_count: 0 });
  await page.route("**/api/v1/wishlist", (r) => json(r, { items, stats: stats(items.filter((i) => i.status === "DROPPED").length), currency: "PLN" }));
  await page.route("**/api/v1/wishlist/w1/decision", (r) => {
    items = items.map((i) => (i.id === "w1" ? { ...i, status: "DROPPED", ready: false } : i));
    return json(r, items[0]);
  });

  await page.goto("/wishlist");
  const ready = page.getByTestId("wish-w1");
  await expect(ready).toHaveAttribute("data-ready", "true");
  await expect(ready.getByRole("button", { name: "Kupuję" })).toBeVisible();
  const waiting = page.getByTestId("wish-w2");
  await expect(waiting).toContainText("Jeszcze 25 dni ostygnięcia");
  await expect(waiting.getByRole("button", { name: "Kupuję" })).toHaveCount(0); // kupić można dopiero po ostygnięciu

  await ready.getByRole("button", { name: "Odpuszczam" }).click();
  await expect(page.getByTestId("wish-savings")).toContainText("2 500,00");
  await expect(page.getByTestId("wish-savings")).toContainText("61,9 h");
});

test("cele oszczędnościowe: postęp, data osiągnięcia i wpłata", async ({ page }) => {
  await asLoggedIn(page);
  let goal = {
    id: "g1", name: "Wakacje", target_amount: 5000, saved_amount: 500, monthly_contribution: 1000, target_date: "2027-03-01",
    remaining: 4500, percent: 10, completed: false, months_to_goal: 4.5, months_to_goal_full: 5, eta: "2027-02-15",
    required_monthly: 907, on_track: true, work_hours_remaining: 111.4,
  };
  await page.route("**/api/v1/goals", (r) => json(r, { items: [goal], currency: "PLN" }));
  await page.route("**/api/v1/goals/g1/deposit", (r) => {
    goal = { ...goal, saved_amount: 1500, remaining: 3500, percent: 30, months_to_goal: 3.5, eta: "2027-01-15" };
    return json(r, goal);
  });

  await page.goto("/goals");
  const card = page.getByTestId("goal-g1");
  await expect(card.getByTestId("goal-percent")).toHaveText("10%");
  await expect(card.getByTestId("goal-eta")).toContainText("luty 2027");
  await expect(card.getByTestId("goal-track")).toHaveText("zdążysz w terminie");

  await card.getByLabel("Kwota wpłaty: Wakacje").fill("1000");
  await card.getByRole("button", { name: "Wpłać" }).click();
  await expect(card.getByTestId("goal-percent")).toHaveText("30%");
});

test("realna stawka godzinowa: porównanie z nominalną i wybór trybu", async ({ page }) => {
  await page.goto("/profile");
  await page.getByLabel("Miesięczny dochód netto").fill("10000");
  await page.getByLabel(/Dojazd dziennie/).fill("90");
  await page.getByLabel("Koszty pracy miesięcznie").fill("600");
  await expect(page.getByTestId("nominal-rate")).toContainText("57,69");
  await expect(page.getByTestId("real-rate")).toContainText("45,67");

  await page.getByRole("radio", { name: "Licz realną" }).click();
  await page.getByRole("button", { name: "Zapisz profil" }).click();
  await expect(page.getByText("Profil zapisany")).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(window.localStorage.getItem("wmt_profile") ?? "null"));
  expect(saved).toMatchObject({ rate_mode: "REAL", commute_minutes_per_day: 90, work_costs_monthly: 600 });
});

test("koszt na użycie, odpowiedniki i tryb co jeśli", async ({ page }) => {
  await withLocalProfile(page);
  const bodies: { profile: { monthly_income: number } }[] = [];
  await page.route("**/api/v1/calculate", (r) => {
    bodies.push(r.request().postDataJSON());
    const hours = bodies.length === 1 ? 131.2 : 100.9;
    return json(r, {
      ...RESULT,
      per_use: { uses: 300, cost: 10, work_minutes: 14.9 },
      work: { ...RESULT.work, hours, income_percent: bodies.length === 1 ? 75.7 : 58.2 },
    });
  });

  await page.goto("/calculator");
  await page.getByLabel("Co chcesz kupić?").fill("Rower");
  await page.getByLabel("Cena").fill("3000");
  await page.getByLabel(/Ile razy tego użyjesz/).fill("300");
  await page.getByRole("button", { name: "Oblicz" }).click();

  await expect(page.getByTestId("per-use")).toContainText("10,00");
  await expect(page.getByTestId("per-use")).toContainText("14,9 min");
  await expect(page.getByTestId("equivalents")).toContainText("6,3%"); // 75,7% / 12 rocznego dochodu

  await page.getByLabel("Zmiana dochodu").fill("30");
  await expect(page.getByTestId("what-if-result")).toContainText("100,9 h");
  await expect(page.getByTestId("what-if-result")).toContainText("58,2%");
  expect(bodies[1].profile.monthly_income).toBeCloseTo(9100, 0); // 7 000 zł + 30%
});

test("audyt subskrypcji sumuje koszty roczne i godziny pracy", async ({ page }) => {
  await asLoggedIn(page);
  const sub = (id: string, name: string, yearly: number, hours: number) => ({
    ...SAVED,
    id,
    name,
    type: "RECURRING",
    result: { ...RESULT, name, type: "RECURRING", horizons: [{ label: "1 year", years: 1, cost: yearly, work: { ...RESULT.work, hours, working_days: hours / 8 } }] },
  });
  await page.route("**/api/v1/calculations", (r) => json(r, { items: [sub("s1", "Netflix", 588, 14.6), sub("s2", "Spotify", 240, 5.9), SAVED] }));
  await page.goto("/subscriptions");
  await expect(page.getByTestId("subs-total")).toContainText("828,00");
  await expect(page.getByTestId("subs-total")).toContainText("21 h");
  const rows = page.getByTestId("subs-list").locator("li");
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText("Netflix"); // od najdroższego
});

test("menu Więcej udostępnia pozostałe sekcje", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) {
    await page.getByRole("navigation", { name: "Nawigacja mobilna" }).getByRole("button", { name: "Więcej" }).click();
    await expect(page.getByRole("link", { name: "Cele" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Subskrypcje" })).toBeVisible();
  } else {
    await page.getByRole("navigation", { name: "Główna nawigacja" }).getByRole("button", { name: "Więcej" }).click();
    await expect(page.getByRole("menuitem", { name: "Cele" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Subskrypcje" })).toBeVisible();
  }
});

test("maksymalna miesięczna wpłata z kategorii: podpowiedź, szybkie wypełnienie i ostrzeżenie o przekroczeniu", async ({ page }) => {
  await withLocalProfile(page); // dochód 7 000 zł: budżet Przyjemności to 700 zł
  await withLocalLedger(page, [{ category: "FUN", amount: 200 }]); // zostaje 500 zł
  await page.goto("/calculator");
  await page.getByLabel("Co chcesz kupić?").fill("Konsola");
  await page.getByLabel("Cena").fill("2500");
  await page.getByRole("radio", { name: "Przyjemności" }).click();

  const hint = page.getByTestId("category-availability");
  await expect(hint).toContainText("500,00");
  await expect(hint).toContainText("Przyjemności");
  await expect(page.getByText("Zostaw puste, a przyjmiemy maksimum: 500,00")).toBeVisible();

  await hint.getByRole("button", { name: "Użyj maksimum" }).click();
  await expect(page.getByLabel("Miesięczna wpłata")).toHaveValue("500");

  await page.getByLabel("Miesięczna wpłata").fill("800");
  await expect(page.getByText("Więcej niż dostępne w kategorii (500,00")).toBeVisible();
});

test("karta budżetu: maksymalna wpłata z kategorii i ostrzeżenie o zbyt dużej wpłacie", async ({ page }) => {
  await withLocalProfile(page);
  await page.route("**/api/v1/calculate", (r) =>
    json(r, {
      ...RESULT,
      budget: {
        category: "FUN", priority: "P4", percentage: 10, category_budget: 1000, spent: 200, available: 800, usage_percent: 20,
        is_custom: true, fits_budget: false, obligations: null, monthly: null,
        upfront: {
          cost: 3200, projected_spent: 3400, projected_usage_percent: 340, purchase_share_percent: 320, coverage_ratio: 400,
          months_to_goal: 3.2, months_to_goal_full: 4, monthly_contribution: 1000, max_monthly_contribution: 800,
          contribution_source: "USER", already_saved: 0, income_percent: 32,
        },
        warnings: [{ code: "CONTRIBUTION_EXCEEDS_AVAILABLE", level: "warning", params: { category: "FUN", planned: 1000, max_monthly: 800, overrun: 200 } }],
      },
    }),
  );
  await page.goto("/calculator");
  await page.getByLabel("Co chcesz kupić?").fill("Konsola");
  await page.getByLabel("Cena").fill("3200");
  await page.getByRole("radio", { name: "Przyjemności" }).click();
  await page.getByLabel("Miesięczna wpłata").fill("1000");
  await page.getByRole("button", { name: "Oblicz" }).click();

  await expect(page.getByTestId("max-contribution")).toContainText("800,00");
  await expect(page.getByTestId("max-contribution")).toContainText("Planujesz więcej: 1 000,00");
  await expect(page.getByTestId("warning-CONTRIBUTION_EXCEEDS_AVAILABLE")).toContainText("brakuje 200,00");
});

test("cel z kategorii: maksymalna wpłata wynika z wolnych środków kategorii", async ({ page }) => {
  await asLoggedIn(page);
  const goal = {
    id: "g9", name: "Konsola", category: "FUN", target_amount: 3200, saved_amount: 0, monthly_contribution: null,
    effective_contribution: 800, max_monthly_contribution: 800, contribution_source: "CATEGORY_AVAILABLE", contribution_exceeds: false,
    target_date: null, remaining: 3200, percent: 0, completed: false, months_to_goal: 4, months_to_goal_full: 4, eta: "2027-02-06",
    required_monthly: null, on_track: null, work_hours_remaining: 79,
  };
  await page.route("**/api/v1/goals", (r) => json(r, { items: [goal, { ...goal, id: "g10", name: "Rower", monthly_contribution: 900, contribution_exceeds: true, effective_contribution: 900, contribution_source: "USER" }], currency: "PLN" }));

  await page.goto("/goals");
  const card = page.getByTestId("goal-g9");
  await expect(card.getByTestId("goal-max")).toContainText("800,00");
  await expect(card.getByTestId("goal-eta")).toContainText("luty 2027");
  await expect(card).toContainText("Przyjemności");
  await expect(page.getByTestId("goal-g10").getByTestId("goal-exceeds")).toBeVisible();

  await page.getByRole("radio", { name: "Przyjemności" }).click();
  await expect(page.getByTestId("goal-category-availability")).toContainText("Przyjemności");
});
"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken, type BudgetPlan, type BudgetState, type Profile } from "@/lib/api";

const LOCAL_PROFILE_KEY = "wmt_profile";
const LOCAL_BUDGET_KEY = "wmt_budget";

interface Ctx {
  ready: boolean;
  email: string | null;
  loggedIn: boolean;
  profile: Profile | null; // null = niewypełniony
  /** Ciało `profile` dla żądań bezstanowych; zalogowany używa profilu z serwera. */
  profileForRequest: Profile | undefined;
  /** Efektywny miesięczny dochód netto (z dochodu albo stawki godzinowej); null gdy profil niewypełniony. */
  monthlyIncome: number | null;
  /** Plan budżetu; null = nieustawiony (backend liczy wtedy z domyślnego 50/25/15/10). */
  budget: BudgetPlan | null;
  /** Budżet do wysłania w żądaniu bezstanowym; zalogowany używa budżetu z serwera. */
  budgetForRequest: BudgetPlan | undefined;
  saveBudget: (b: BudgetPlan) => Promise<void>;
  saveProfile: (p: Profile) => Promise<void>;
  login: (email: string, password: string, register?: boolean) => Promise<void>;
  logout: () => void;
}

const AppCtx = createContext<Ctx | null>(null);

export const useApp = () => {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp poza AppProvider");
  return c;
};

const hasRate = (p: Profile | null) => !!p && (p.monthly_income != null || p.hourly_rate != null);

function readLocalBudget(): BudgetPlan | null {
  try {
    const raw = window.localStorage.getItem(LOCAL_BUDGET_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const toPlan = (b: BudgetState): BudgetPlan | null => (b.is_custom ? { percentages: b.percentages, spent: b.spent } : null);

export function effectiveMonthlyIncome(p: Profile | null): number | null {
  if (!p) return null;
  const hoursPerMonth = (p.hours_per_day * p.days_per_week * 52) / 12;
  if (p.hourly_rate != null) return p.hourly_rate * hoursPerMonth;
  return p.monthly_income ?? null;
}

function readLocalProfile(): Profile | null {
  try {
    const raw = window.localStorage.getItem(LOCAL_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [budget, setBudget] = useState<BudgetPlan | null>(null);

  useEffect(() => {
    (async () => {
      if (getToken()) {
        try {
          const me = await api<{ email: string; profile: Profile }>("/auth/me");
          setEmail(me.email);
          setProfile(hasRate(me.profile) ? me.profile : null);
          setBudget(toPlan(await api<BudgetState>("/budget")));
          return;
        } catch {
          setToken(null);
        }
      }
      setProfile(readLocalProfile());
      setBudget(readLocalBudget());
    })().finally(() => setReady(true));
  }, []);

  const saveProfile = useCallback(
    async (p: Profile) => {
      if (email) {
        setProfile(await api<Profile>("/profile", { method: "PUT", body: p }));
      } else {
        window.localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(p));
        setProfile(p);
      }
    },
    [email],
  );

  const saveBudget = useCallback(
    async (b: BudgetPlan) => {
      if (email) {
        setBudget(toPlan(await api<BudgetState>("/budget", { method: "PUT", body: b })));
      } else {
        window.localStorage.setItem(LOCAL_BUDGET_KEY, JSON.stringify(b));
        setBudget(b);
      }
    },
    [email],
  );

  const login = useCallback(async (mail: string, password: string, register = false) => {
    const res = await api<{ token: string; profile: Profile }>(register ? "/auth/register" : "/auth/login", {
      body: { email: mail, password },
    });
    setToken(res.token);
    setEmail(mail.toLowerCase());
    // konto bez profilu: przenieś profil anonimowy na serwer
    let next: Profile | null = hasRate(res.profile) ? res.profile : null;
    if (!next) {
      const local = readLocalProfile();
      if (local) {
        try {
          next = await api<Profile>("/profile", { method: "PUT", body: local });
        } catch {}
      }
    }
    setProfile(next);
    try {
      let serverBudget = toPlan(await api<BudgetState>("/budget"));
      const local = readLocalBudget();
      // konto bez budżetu: przenieś budżet anonimowy na serwer
      if (!serverBudget && local) serverBudget = toPlan(await api<BudgetState>("/budget", { method: "PUT", body: local }));
      setBudget(serverBudget);
    } catch {}
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setEmail(null);
    setProfile(readLocalProfile());
    setBudget(readLocalBudget());
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      ready,
      email,
      loggedIn: !!email,
      profile,
      profileForRequest: email ? undefined : (profile ?? undefined),
      monthlyIncome: effectiveMonthlyIncome(profile),
      budget,
      budgetForRequest: email ? undefined : (budget ?? undefined),
      saveBudget,
      saveProfile,
      login,
      logout,
    }),
    [ready, email, profile, budget, saveProfile, saveBudget, login, logout],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

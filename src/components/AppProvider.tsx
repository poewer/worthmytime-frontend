"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken, type Profile } from "@/lib/api";

const LOCAL_PROFILE_KEY = "wmt_profile";

export const DEFAULT_PROFILE: Profile = {
  currency: "PLN",
  monthly_income: null,
  hourly_rate: null,
  hours_per_day: 8,
  days_per_week: 5,
};

interface Ctx {
  ready: boolean;
  email: string | null;
  loggedIn: boolean;
  profile: Profile | null; // null = niewypełniony
  /** Ciało `profile` dla żądań bezstanowych; zalogowany używa profilu z serwera. */
  profileForRequest: Profile | undefined;
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

export default function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    (async () => {
      if (getToken()) {
        try {
          const me = await api<{ email: string; profile: Profile }>("/auth/me");
          setEmail(me.email);
          setProfile(hasRate(me.profile) ? me.profile : null);
          return;
        } catch {
          setToken(null);
        }
      }
      try {
        const raw = window.localStorage.getItem(LOCAL_PROFILE_KEY);
        if (raw) setProfile(JSON.parse(raw));
      } catch {}
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

  const login = useCallback(async (mail: string, password: string, register = false) => {
    const res = await api<{ token: string; profile: Profile }>(register ? "/auth/register" : "/auth/login", {
      body: { email: mail, password },
    });
    setToken(res.token);
    setEmail(mail.toLowerCase());
    // nowe konto: przenieś profil anonimowy na serwer
    let next: Profile | null = hasRate(res.profile) ? res.profile : null;
    if (!next) {
      try {
        const raw = window.localStorage.getItem(LOCAL_PROFILE_KEY);
        if (raw) next = await api<Profile>("/profile", { method: "PUT", body: JSON.parse(raw) });
      } catch {}
    }
    setProfile(next);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setEmail(null);
    try {
      const raw = window.localStorage.getItem(LOCAL_PROFILE_KEY);
      setProfile(raw ? JSON.parse(raw) : null);
    } catch {
      setProfile(null);
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      ready,
      email,
      loggedIn: !!email,
      profile,
      profileForRequest: email ? undefined : (profile ?? undefined),
      saveProfile,
      login,
      logout,
    }),
    [ready, email, profile, saveProfile, login, logout],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

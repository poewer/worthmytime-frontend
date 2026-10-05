"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken, type Profile } from "@/lib/api";

const LOCAL_PROFILE_KEY = "wmt_profile";

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
      setProfile(readLocalProfile());
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
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setEmail(null);
    setProfile(readLocalProfile());
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

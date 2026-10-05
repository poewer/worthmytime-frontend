"use client";

import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import ProfileForm from "@/components/ProfileForm";
import { Button, Card, ErrorBox, Field, Input } from "@/components/ui";

export default function ProfilePage() {
  const { ready, loggedIn, email, login } = useApp();
  const [mail, setMail] = useState("");
  const [pass, setPass] = useState("");
  const [register, setRegister] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!ready) return <p className="text-sm text-zinc-500">Ładowanie…</p>;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(mail, pass, register);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd logowania");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Card className="space-y-3">
        <h1 className="text-xl font-bold">Profil finansowy</h1>
        <ProfileForm key={String(loggedIn)} onSaved={() => setSaved(true)} />
        {saved && <p className="text-sm text-emerald-700 dark:text-emerald-400">Zapisano.</p>}
      </Card>

      {!loggedIn && (
        <Card>
          <h2 className="mb-1 text-lg font-bold">{register ? "Załóż konto" : "Zaloguj się"}</h2>
          <p className="mb-3 text-sm text-zinc-500">Konto jest potrzebne tylko do zapisywania historii i udostępniania wyników.</p>
          <form onSubmit={submit} className="space-y-3">
            <Field label="E-mail">
              <Input type="email" required value={mail} onChange={(e) => setMail(e.target.value)} />
            </Field>
            <Field label="Hasło" hint={register ? "Minimum 8 znaków" : undefined}>
              <Input type="password" required minLength={8} value={pass} onChange={(e) => setPass(e.target.value)} />
            </Field>
            <ErrorBox message={error} />
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={busy}>{register ? "Zarejestruj" : "Zaloguj"}</Button>
              <button type="button" className="text-sm underline" onClick={() => setRegister(!register)}>
                {register ? "Mam już konto" : "Nie mam konta"}
              </button>
            </div>
          </form>
        </Card>
      )}
      {loggedIn && <p className="text-center text-sm text-zinc-500">Zalogowano jako {email}</p>}
    </div>
  );
}

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ProfileForm from "./ProfileForm";

/** Krok 1: profil finansowy - bez niego nie da się przeliczyć ceny na czas pracy. */
export default function OnboardingCard() {
  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <p className="text-xs font-medium tracking-wide text-primary uppercase">Krok 1 z 2</p>
        <CardTitle className="text-xl">Ile jest warta Twoja godzina?</CardTitle>
        <CardDescription>
          Podaj dochód netto albo stawkę godzinową. Dane zostają w Twojej przeglądarce, dopóki nie założysz konta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ProfileForm submitLabel="Dalej: policz zakup" />
      </CardContent>
    </Card>
  );
}

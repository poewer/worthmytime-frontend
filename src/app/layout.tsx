import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Nav from "@/components/Nav";
import Providers from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "WorthMyTime - ile godzin pracy kosztuje ten zakup?", template: "%s | WorthMyTime" },
  description: "Przelicz cenę zakupu na godziny swojej pracy. Zobacz, ile życia wymieniasz na to, co kupujesz.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafcfb" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pl" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>
          <a
            href="#content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
          >
            Przejdź do treści
          </a>
          <Nav />
          {/* pb: miejsce na dolny pasek nawigacji na telefonie */}
          <main id="content" className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-8">
            {children}
          </main>
          <footer className="mx-auto w-full max-w-5xl px-4 pb-24 text-center text-xs text-muted-foreground lg:pb-8">
            WorthMyTime pokazuje fakty i symulacje na Twoich założeniach. To nie jest porada finansowa ani inwestycyjna - decyzja zawsze należy do Ciebie.
          </footer>
        </Providers>
      </body>
    </html>
  );
}

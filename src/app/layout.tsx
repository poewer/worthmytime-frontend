import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppProvider from "@/components/AppProvider";
import Nav from "@/components/Nav";
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
  title: "WorthMyTime",
  description: "Ile godzin swojego życia musisz wymienić na ten zakup?",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppProvider>
          <Nav />
          <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">{children}</main>
        </AppProvider>
      </body>
    </html>
  );
}

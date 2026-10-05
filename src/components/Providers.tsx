"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppProvider from "./AppProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <AppProvider>{children}</AppProvider>
        <Toaster position="top-center" richColors />
      </TooltipProvider>
    </ThemeProvider>
  );
}

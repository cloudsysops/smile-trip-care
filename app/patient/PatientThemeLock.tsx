"use client";

import { useEffect, type ReactNode } from "react";

import { useTheme } from "@/app/components/ThemeProvider";

/** Patient area stays light; restore global theme when leaving the route. */
export function PatientThemeLock({ children }: Readonly<{ children: ReactNode }>) {
  const { theme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    return () => {
      if (theme === "dark") root.classList.add("dark");
    };
  }, [theme]);

  return <>{children}</>;
}

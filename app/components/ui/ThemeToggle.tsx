"use client";

import { useTheme } from "@/app/components/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex items-center justify-center rounded-full border border-zinc-700/60 bg-zinc-900/80 px-3 py-1 text-xs font-medium text-zinc-200 shadow-sm backdrop-blur transition-colors hover:border-cyan-400/70 hover:text-cyan-300 dark:border-zinc-600/70 dark:bg-zinc-900/80"
    >
      <span className="mr-1.5">
        {isDark ? (
          // Sun icon
          <svg
            className="h-4 w-4 text-amber-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2m10-10h-2M4 12H2m16.95 4.95-1.414-1.414M8.464 8.464 7.05 7.05m0 9.9 1.414-1.414M16.95 7.05l-1.414 1.414" />
          </svg>
        ) : (
          // Moon icon
          <svg
            className="h-4 w-4 text-sky-300"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 1 0 21 12.79Z" />
          </svg>
        )}
      </span>
      <span>{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}


"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

/**
 * ThemeToggle component provides a button to switch between light and dark modes.
 * It uses the next-themes hook to manage state and respects system preferences by default.
 */
export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Correctly handle hydration by only rendering icons after mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9" />;
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-all border border-slate-200 dark:border-white/5 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white"
      aria-label="Theme umschalten"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 animate-in zoom-in duration-300" />
      ) : (
        <Moon className="w-4 h-4 animate-in zoom-in duration-300" />
      )}
    </button>
  );
};

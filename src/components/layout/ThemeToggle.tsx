"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  variant?: 'sidebar' | 'bar';
}

export const ThemeToggle = ({ variant = 'sidebar' }: ThemeToggleProps) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const icon = !mounted ? null : resolvedTheme === 'dark' ? 'light_mode' : 'dark_mode';

  if (variant === 'bar') {
    return (
      <button
        type="button"
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-outline-variant/20 bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
        aria-label="Theme umschalten"
      >
        {icon ? <span className="material-symbols-outlined text-[20px]">{icon}</span> : <span className="h-5 w-5" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="flex h-10 w-10 items-center justify-center rounded-xl text-outline transition-all hover:bg-surface-variant/50 hover:text-on-surface"
      title="Toggle Theme"
      aria-label="Theme umschalten"
    >
      {icon ? <span className="material-symbols-outlined text-[22px]">{icon}</span> : <span className="h-6 w-6" />}
    </button>
  );
};

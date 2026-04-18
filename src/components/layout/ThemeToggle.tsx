"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="text-white hover:bg-white/10 p-3 rounded-lg cursor-pointer transition-colors w-12 h-12 flex justify-center items-center">
        <div className="w-6 h-6" /> {/* Placeholder */}
      </button>
    );
  }

  return (
    <button 
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
      className="text-white hover:bg-white/10 p-3 rounded-lg cursor-pointer transition-colors"
      title="Toggle Theme"
    >
      {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
    </button>
  );
};

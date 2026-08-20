"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  if (typeof document !== "undefined") {
    const isDark = document.documentElement.classList.contains("dark");
    if (dark !== isDark) setDark(isDark);
  }

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("noor-theme", next ? "dark" : "light");
    } catch {}
  };

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="rounded-xl p-2 text-ink/65 transition hover:bg-surface"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";

export default function ThemeToggle({ className = "", variant = "light" }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const base =
    variant === "light"
      ? "border-gold/40 bg-cream text-maroon hover:bg-gold/10"
      : "border-gold/40 bg-maroon-dark text-gold hover:bg-maroon-light";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${base} ${className}`}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
    </button>
  );
}

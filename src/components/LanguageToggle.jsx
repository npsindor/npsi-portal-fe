import React from "react";
import { useLang } from "@/lib/i18n";
import { Languages } from "lucide-react";

export default function LanguageToggle({ className = "", variant = "light" }) {
  const { lang, toggle } = useLang();
  const base =
    variant === "light"
      ? "border-gold/40 bg-cream text-maroon hover:bg-gold/10"
      : "border-gold/40 bg-maroon-dark text-gold hover:bg-maroon-light";
  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${base} ${className}`}
      title={lang === "en" ? "हिंदी में देखें" : "View in English"}
    >
      <Languages className="h-3.5 w-3.5" />
      {lang === "en" ? "हिंदी" : "EN"}
    </button>
  );
}
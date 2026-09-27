import React from "react";
import { Search } from "lucide-react";

export default function SearchBox({ value, onChange, placeholder, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-full border border-gold/40 bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:border-maroon"
      />
    </div>
  );
}

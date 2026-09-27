import React from "react";
import { CalendarRange, X } from "lucide-react";

// Drop next to any admin table's search bar: <DateRangeFilter from={dateFrom} to={dateTo} onFromChange={setDateFrom} onToChange={setDateTo} />
export default function DateRangeFilter({ from, to, onFromChange, onToChange, labels }) {
  const t = { from: labels?.from || "From", to: labels?.to || "To", clear: labels?.clear || "Clear dates" };
  const active = Boolean(from || to);

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-full border border-gold/40 bg-card px-3 py-2 text-xs">
      <CalendarRange className="h-3.5 w-3.5 text-muted-foreground" />
      <input
        type="date"
        value={from || ""}
        max={to || undefined}
        onChange={(e) => onFromChange(e.target.value)}
        aria-label={t.from}
        className="bg-transparent text-xs text-foreground outline-none"
      />
      <span className="text-muted-foreground">–</span>
      <input
        type="date"
        value={to || ""}
        min={from || undefined}
        onChange={(e) => onToChange(e.target.value)}
        aria-label={t.to}
        className="bg-transparent text-xs text-foreground outline-none"
      />
      {active && (
        <button
          type="button"
          onClick={() => { onFromChange(""); onToChange(""); }}
          className="ml-0.5 rounded-full p-0.5 text-muted-foreground hover:text-destructive"
          title={t.clear}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

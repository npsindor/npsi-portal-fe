import { Minus, Plus } from "lucide-react";
import { MAX_UNITS, useBloodCopy } from "@/lib/blood-help";

// Units required: a number with − / + buttons (1 to MAX_UNITS).
export default function UnitsStepper({ id, value, onChange }) {
  const { t } = useBloodCopy();
  const set = (next) => onChange(Math.min(MAX_UNITS, Math.max(1, Number.isFinite(next) ? next : 1)));
  const button = "flex h-11 w-11 items-center justify-center text-[#C8102E] transition hover:bg-[#C8102E]/10 disabled:opacity-40";
  return (
    <div className="flex h-11 w-full max-w-[11rem] items-stretch overflow-hidden rounded-lg border border-border bg-background">
      <button type="button" className={button} onClick={() => set(value - 1)} disabled={value <= 1} aria-label={t.less}>
        <Minus className="h-4 w-4" aria-hidden="true" />
      </button>
      <input id={id} type="number" inputMode="numeric" min={1} max={MAX_UNITS} required value={value} onChange={(event) => set(Number.parseInt(event.target.value, 10))} className="w-full min-w-0 border-x border-border bg-transparent text-center text-base font-semibold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
      <button type="button" className={button} onClick={() => set(value + 1)} disabled={value >= MAX_UNITS} aria-label={t.more}>
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

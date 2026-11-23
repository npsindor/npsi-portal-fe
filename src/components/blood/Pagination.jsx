import { ChevronLeft, ChevronRight } from "lucide-react";
import { useBloodCopy } from "@/lib/blood-help";

// Numbered pages (up to 5 around the current one) with previous / next.
export default function Pagination({ page, total, pageSize, onChange }) {
  const { t } = useBloodCopy();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const first = Math.max(1, Math.min(page - 2, pages - 4));
  const numbers = Array.from({ length: Math.min(5, pages) }, (_, i) => first + i);
  const box = "flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition";
  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2 py-4">
      <button type="button" className={`${box} border-border hover:bg-muted disabled:opacity-40`} onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label={t.prev}>
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>
      {numbers.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={t.page(n)}
          aria-current={n === page ? "page" : undefined}
          className={`${box} ${n === page ? "border-[#C8102E] bg-[#C8102E] text-white" : "border-border hover:bg-muted"}`}
        >
          {n}
        </button>
      ))}
      <button type="button" className={`${box} border-border hover:bg-muted disabled:opacity-40`} onClick={() => onChange(page + 1)} disabled={page >= pages} aria-label={t.next}>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  );
}

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "@/lib/i18n";

const L = {
  en: (start, end, total) => `Showing ${start}-${end} of ${total}`,
  hi: (start, end, total) => `${total} में से ${start}-${end} दिखाए जा रहे हैं`,
};

export default function TablePagination({ page, totalPages, totalItems, pageSize, onPageChange }) {
  const { lang } = useLang();
  if (totalItems === 0) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
      <div className="text-xs text-muted-foreground">{L[lang](start, end, totalItems)}</div>
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="rounded-full border border-border p-1.5 text-maroon hover:bg-muted disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 text-xs font-semibold text-muted-foreground">{page} / {totalPages}</span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="rounded-full border border-border p-1.5 text-maroon hover:bg-muted disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

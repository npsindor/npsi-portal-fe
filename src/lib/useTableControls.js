import { suggestValues } from "@/lib/search-suggestions";
import { useMemo, useState } from "react";
import { inDateRange } from "./dateRangeFilter";

// Shared search + date-range + pagination for admin tables: filters `items`
// by substring match across `searchFields` and (if `dateField` is given) by
// a from/to date range, then slices the result into pages. Any filter change
// jumps back to page 1 so results stay in view.
export function useTableControls(items, { searchFields = [], pageSize = 10, dateField = null } = {}) {
  // A "?q=" in the address (links from the global search) pre-fills the table search.
  const [search, setSearchRaw] = useState(() => (typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("q") || ""));
  const [rawPage, setRawPage] = useState(1);
  const [dateFrom, setDateFromRaw] = useState("");
  const [dateTo, setDateToRaw] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (q && !searchFields.some((field) => String(item?.[field] ?? "").toLowerCase().includes(q))) return false;
      if (dateField && (dateFrom || dateTo) && !inDateRange(item?.[dateField], dateFrom, dateTo)) return false;
      return true;
    });
  }, [items, search, searchFields.join("|"), dateField, dateFrom, dateTo]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(Math.max(1, rawPage), totalPages);
  const startIndex = (page - 1) * pageSize;
  const pageItems = filtered.slice(startIndex, startIndex + pageSize);

  const setSearch = (value) => { setSearchRaw(value); setRawPage(1); };
  const setPage = (value) => setRawPage(Math.min(Math.max(1, value), totalPages));
  const setDateFrom = (value) => { setDateFromRaw(value); setRawPage(1); };
  const setDateTo = (value) => { setDateToRaw(value); setRawPage(1); };

  // Auto-suggest for the search box: values of the searched fields in the loaded rows that contain the typed text.
  const suggestions = useMemo(() => suggestValues(items, searchFields, search), [items, search, searchFields.join("|")]);

  return { search, setSearch, page, setPage, totalPages, totalItems, startIndex, pageSize, pageItems, filtered, dateFrom, setDateFrom, dateTo, setDateTo, suggestions };
}

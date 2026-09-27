import { useMemo, useState } from "react";
import { inDateRange } from "./dateRangeFilter";

// Shared search + date-range + pagination for admin tables: filters `items`
// by substring match across `searchFields` and (if `dateField` is given) by
// a from/to date range, then slices the result into pages. Any filter change
// jumps back to page 1 so results stay in view.
export function useTableControls(items, { searchFields = [], pageSize = 10, dateField = null } = {}) {
  const [search, setSearchRaw] = useState("");
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

  return { search, setSearch, page, setPage, totalPages, totalItems, startIndex, pageSize, pageItems, filtered, dateFrom, setDateFrom, dateTo, setDateTo };
}

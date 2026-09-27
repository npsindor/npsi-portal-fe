// Shared date-range predicate for every admin table's date filter. Pure and
// read-only — it only ever narrows an already-authorized, already-fetched
// list on the client, so it can't expose or touch data the user couldn't
// already see.
export const inDateRange = (value, from, to) => {
  if (!from && !to) return true;
  if (!value) return false;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return false;
  if (from && time < new Date(`${from}T00:00:00`).getTime()) return false;
  if (to && time > new Date(`${to}T23:59:59.999`).getTime()) return false;
  return true;
};

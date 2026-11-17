// Calendar dates (YYYY-MM-DD) in India time, matching the server's rules.
export const indiaToday = (date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
// The latest date a birth date may be: yesterday (today and future dates are never valid).
export const latestBirthDate = (today = indiaToday()) => {
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
};
export const isPastBirthDate = (value, today = indiaToday()) => {
  const date = new Date(`${value}T00:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(value || '') && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value && value < today && value >= '1900-01-01';
};

// A date-only value from the API ("YYYY-MM-DD", e.g. an event's date) as local midnight of that day.
// `new Date("2026-11-29")` would be UTC midnight, which shows as 28 Nov anywhere behind UTC.
export const calendarDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? ''));
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(value);
};

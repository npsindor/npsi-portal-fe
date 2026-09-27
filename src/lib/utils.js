import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
} 


export const isIframe = window.self !== window.top;

// Picks the Hindi variant of an admin-entered field (event title/description,
// announcement title/body, etc.) when the site is in Hindi and a translation
// was actually entered — otherwise falls back to the English/default field,
// so nothing ever renders blank just because an admin hasn't translated it
// yet.
export const localizedText = (item, field, lang) => {
  if (lang === "hi") {
    const hi = item?.[`${field}_hi`];
    if (hi && String(hi).trim()) return hi;
  }
  return item?.[field] || "";
};

// Strips non-digits, drops any leading digit that isn't 6-9 (Indian mobile
// numbers never start with 0-5 — this also auto-corrects a leading 0 typed
// by habit), and caps at 10 digits.
export const sanitizeMobile = (value) => {
  let digits = String(value || "").replace(/\D/g, "");
  while (digits && !/[6-9]/.test(digits[0])) digits = digits.slice(1);
  return digits.slice(0, 10);
};

// Strips non-digits and caps at 6 digits, for Indian PIN codes.
export const sanitizePincode = (value) => String(value || "").replace(/\D/g, "").slice(0, 6);

// Finds the highest `<prefix><6-digit-number>` in use across existing records,
// instead of relying on record count (which collides once any record has been
// deleted or the list is capped by the API). Returns the next number to use.
export const nextSequentialNumber = (records, field, prefix) =>
  records.reduce((acc, record) => {
    const value = record?.[field];
    if (typeof value !== "string" || !value.startsWith(prefix)) return acc;
    const num = parseInt(value.slice(prefix.length), 10);
    return Number.isFinite(num) && num > acc ? num : acc;
  }, 0) + 1;

// Generates the next `<prefix><6-digit-number>` id (see nextSequentialNumber).
export const nextSequentialId = (records, field, prefix) =>
  `${prefix}${String(nextSequentialNumber(records, field, prefix)).padStart(6, "0")}`;

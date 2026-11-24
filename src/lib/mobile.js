// Indian mobile numbers are stored as exactly 10 digits starting with 6-9. A typed or pasted "+91 98765 43210",
// "91-9876543210" or "09876543210" becomes "9876543210"; other characters are dropped and typing stops at 10 digits.
export const sanitizeMobile = (value) => {
  let digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(2);
  while (digits && !/[6-9]/.test(digits[0])) digits = digits.slice(1);
  return digits.slice(0, 10);
};

export const isValidMobile = (value) => /^[6-9]\d{9}$/.test(String(value ?? ""));

// Form keys that hold a mobile number (checkbox keys such as showMobile hold booleans and are left alone).
const MOBILE_KEY = /(mobile|phone|whatsapp|contactNumber)$/i;
export const normalizeField = (key, value) => (typeof value === "string" && MOBILE_KEY.test(key) ? sanitizeMobile(value) : value);


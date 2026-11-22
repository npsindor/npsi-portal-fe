// Money the Sangathan has received, from payment records. A settled payment counts in full: SUCCESS (event and older
// registration payments) and VERIFIED (registration fees an admin checked), also while a refund is only requested,
// in process or rejected. A completed refund counts only what was kept (amount − refund amount). Pending and
// submitted payments are not revenue yet; they are "awaiting".
export const KEPT = ["SUCCESS", "VERIFIED", "REFUND_REQUESTED", "REFUND_PROCESSING", "REFUND_REJECTED"];
export const AWAITING = ["PENDING", "SUBMITTED"];

export const toAmount = (value) => {
  const numeric = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
};

export const revenueOf = (transactions = []) =>
  transactions.reduce((sum, tx) => {
    const status = String(tx?.paymentStatus || "").toUpperCase();
    if (KEPT.includes(status)) return sum + toAmount(tx.amount);
    if (status === "REFUNDED") return sum + Math.max(0, toAmount(tx.amount) - toAmount(tx.refundAmount));
    return sum;
  }, 0);

export const awaitingCount = (transactions = []) => transactions.filter((tx) => AWAITING.includes(String(tx?.paymentStatus || "").toUpperCase())).length;

// Registration fees (family ₹500, student ₹100): the payments Admin → Registration payments reviews. Its "Received"
// and Admin → Transactions' "Registration fees received" are this same figure, so the two pages tally.
export const REGISTRATION_TYPES = ["Family Registration", "Student Registration"];
export const isRegistrationFee = (tx) => REGISTRATION_TYPES.includes(tx?.type);
export const registrationFeesReceived = (transactions = []) => revenueOf(transactions.filter(isRegistrationFee));

import React from "react";
import { useLang } from "@/lib/i18n";

const statusStyles = {
  PENDING_VERIFICATION: "bg-amber-100 text-amber-800 border-amber-300",
  SUBMITTED: "bg-blue-100 text-blue-800 border-blue-300",
  CORRECTION_REQUIRED: "bg-orange-100 text-orange-800 border-orange-300",
  APPROVED: "bg-green-100 text-green-800 border-green-300",
  REJECTED: "bg-red-100 text-red-800 border-red-300",
  PENDING: "bg-amber-100 text-amber-800 border-amber-300",
  ACTIVE: "bg-green-100 text-green-800 border-green-300",
  SUSPENDED: "bg-orange-100 text-orange-800 border-orange-300",
  DEACTIVATED: "bg-red-100 text-red-800 border-red-300",
  SUCCESS: "bg-green-100 text-green-800 border-green-300",
  FAILED: "bg-red-100 text-red-800 border-red-300",
  REFUNDED: "bg-purple-100 text-purple-800 border-purple-300",
};

// Status codes as shown to people, per language (unknown codes fall back to the code with spaces).
const LABELS = {
  PENDING_VERIFICATION: ["Pending verification", "सत्यापन लंबित"], SUBMITTED: ["Submitted", "जमा किया गया"],
  CORRECTION_REQUIRED: ["Correction required", "सुधार आवश्यक"], APPROVED: ["Approved", "स्वीकृत"], REJECTED: ["Rejected", "अस्वीकृत"],
  PENDING: ["Pending", "लंबित"], ACTIVE: ["Active", "सक्रिय"], INACTIVE: ["Inactive", "निष्क्रिय"], SUSPENDED: ["Suspended", "निलंबित"],
  DEACTIVATED: ["Deactivated", "निष्क्रिय किया गया"], SUCCESS: ["Success", "सफल"], FAILED: ["Failed", "विफल"], REFUNDED: ["Refunded", "धनवापसी हो गई"],
  REFUND_PROCESSING: ["Refund processing", "धनवापसी प्रक्रिया में"], VERIFIED: ["Verified", "सत्यापित"], REGISTERED: ["Registered", "पंजीकृत"],
  CANCELLED: ["Cancelled", "रद्द"], PUBLISHED: ["Published", "प्रकाशित"], DRAFT: ["Draft", "ड्राफ्ट"], COMPLETED: ["Completed", "पूर्ण"],
  Submitted: ["Submitted", "जमा किया गया"], "In Review": ["In review", "समीक्षा में"], Resolved: ["Resolved", "समाधान हुआ"], Closed: ["Closed", "बंद"],
  Active: ["Active", "सक्रिय"], Inactive: ["Inactive", "निष्क्रिय"], Archived: ["Archived", "संग्रहित"],
  TRANSFERRED: ["Transferred", "स्थानांतरित"], REMOVED: ["Removed", "हटाया गया"], WITHDRAWN: ["Withdrawn", "वापस लिया गया"], INVITED: ["Invited", "आमंत्रित"],
};
export const statusLabel = (status, lang) => LABELS[status]?.[lang === "hi" ? 1 : 0] || String(status || "").replace(/_/g, " ");

export default function StatusBadge({ status, className = "" }) {
  const { lang } = useLang();
  const style = statusStyles[status] || "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide ${style} ${className}`}>
      {statusLabel(status, lang)}
    </span>
  );
}
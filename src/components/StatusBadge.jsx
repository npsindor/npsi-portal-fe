import React from "react";

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

export default function StatusBadge({ status, className = "" }) {
  const style = statusStyles[status] || "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide ${style} ${className}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
}
import { useBloodCopy } from "@/lib/blood-help";

// The two request states: In Progress (orange) and Completed (green), the same on every page.
const TONES = {
  IN_PROGRESS: "bg-amber-100 text-amber-800 ring-amber-300 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-800",
  COMPLETED: "bg-green-100 text-green-800 ring-green-300 dark:bg-green-950/50 dark:text-green-200 dark:ring-green-800",
};

export default function StatusBadge({ status }) {
  const { t } = useBloodCopy();
  return <span className={`inline-flex whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ${TONES[status] || TONES.IN_PROGRESS}`}>{t.status[status] || status}</span>;
}

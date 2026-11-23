// A figure with its icon and label (home page statistics).
export default function StatCard({ icon: Icon, value, label }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#C8102E]/10 text-[#C8102E]">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <div className="font-display text-3xl font-bold leading-none text-[#C8102E]">{value ?? "—"}</div>
        <div className="mt-1 text-sm text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

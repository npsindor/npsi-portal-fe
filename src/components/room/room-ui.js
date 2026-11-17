// Shared Tailwind classes for the Room Hunting screens.
export const field = 'mt-1.5 h-11 w-full min-w-0 rounded-xl border border-border bg-background px-3 text-sm font-normal outline-none focus:border-maroon focus:ring-2 focus:ring-ring/30 [&:is(textarea)]:h-auto [&:is(textarea)]:py-2';
export const label = 'block text-sm font-medium';
export const primary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-maroon px-5 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark disabled:opacity-50';
export const secondary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50';
export const badge = (status) =>
  ({ APPROVED: 'bg-emerald-100 text-emerald-800', AVAILABLE: 'bg-emerald-100 text-emerald-800', PENDING: 'bg-amber-100 text-amber-800', REJECTED: 'bg-red-100 text-red-800' })[status] ||
  'bg-muted text-muted-foreground';

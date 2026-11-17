import { useCallback, useEffect, useState } from 'react';
import { Loader2, UserPlus } from 'lucide-react';
import BecomeMemberButton from '@/components/event-members/BecomeMemberDialog';
import { eventMembersApi } from '@/api/eventMembersApi';
import { errorText, sectionLabel, useEventMemberCopy } from '@/lib/event-member-copy';

const TONE = { PENDING: 'bg-amber-100 text-amber-900', APPROVED: 'bg-emerald-100 text-emerald-900', REJECTED: 'bg-red-100 text-red-900', REMOVED: 'bg-muted text-muted-foreground', WITHDRAWN: 'bg-muted text-muted-foreground' };

// Dashboard card for family members and students: "Become an NPSI Event Member" (the common form, filled from their
// own records) and the status of their requests.
export default function MyEventMemberships() {
  const { t, lang } = useEventMemberCopy();
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const load = useCallback(() => eventMembersApi.candidates().then((data) => setRows(data.applications || [])).catch(() => setRows([])), []);
  useEffect(() => { load(); }, [load]);
  const withdraw = async (id) => {
    setBusy(id); setError('');
    try { await eventMembersApi.withdraw(id); await load(); } catch (cause) { setError(errorText(t, cause)); } finally { setBusy(''); }
  };
  return <section className="rounded-2xl border border-gold/30 bg-card p-5 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-display text-lg font-semibold text-maroon">{t.myTitle}</h2>
      <BecomeMemberButton label={t.becomeEvent} onSubmitted={load} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-maroon px-5 text-sm font-semibold text-cream"><UserPlus className="h-4 w-4" aria-hidden="true" /></BecomeMemberButton>
    </div>
    {rows === null ? <Loader2 className="mt-4 h-5 w-5 animate-spin text-maroon" />
      : rows.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">{t.myNone}</p>
        : <ul className="mt-4 divide-y divide-border text-sm">{rows.map((row) => <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
          <span className="min-w-0"><span className="font-semibold">{row.section ? sectionLabel(row.section, lang) : `${t.other}: ${row.customEventName}`}</span><span className="block text-xs text-muted-foreground">{row.name}{row.rejectionReason && ['REJECTED', 'REMOVED'].includes(row.status) ? ` · ${t.reason}: ${row.rejectionReason}` : ''}</span></span>
          <span className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[row.status] || ''}`}>{t.status[row.status] || row.status}</span>
            {row.status === 'PENDING' && <button type="button" disabled={busy === row.id} onClick={() => withdraw(row.id)} className="text-xs font-semibold text-maroon underline disabled:opacity-50">{t.withdraw}</button>}</span>
        </li>)}</ul>}
    {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
  </section>;
}

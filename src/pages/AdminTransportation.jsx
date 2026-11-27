import { useCallback, useEffect, useState } from 'react';
import { Loader2, Mail, Phone, Route } from 'lucide-react';
import { API } from '@/api/endpoints';
import { API_BASE_URL } from '@/api/apiBaseUrl';
import { useLang } from '@/lib/i18n';
import SearchBox from '@/components/admin/SearchBox';
import { suggestValues } from "@/lib/search-suggestions";
import { apiFetch } from '@/api/base44Client';

const STATUSES = ['OPEN', 'COMPLETED', 'CANCELLED', 'CLOSED', 'ARCHIVED'];
const call = async (path, options = {}) => {
  const response = await apiFetch(`${API_BASE_URL}${API.safar}${path}`, { credentials: 'include', ...options, headers: { 'Content-Type': 'application/json' } });
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || `HTTP ${response.status}`);

  return response.json();
};
const words = {
  en: { title: 'Travel & Assistance Requests', sub: 'Travel & Assistance requests and travel plans from members and students. Update a status with remarks; the member is notified in the portal.', all: 'All (except archived)', requests: 'Requests', offers: 'Offers', any: 'Requests & offers', search: 'Search name, mobile, route…', empty: 'No entries.', remarks: 'Remarks for the member (optional)', save: 'Update', matches: 'matches', saved: 'Updated.', status: { OPEN: 'Open', COMPLETED: 'Completed', CANCELLED: 'Cancelled', CLOSED: 'Closed', ARCHIVED: 'Archived' }, REQUEST: 'Request', OFFER: 'Offer', confirmArchive: 'Archive this entry? Its open matches are withdrawn.' },
  hi: { title: 'यात्रा एवं सहायता अनुरोध', sub: 'सदस्यों और विद्यार्थियों के यात्रा एवं सहायता अनुरोध और यात्रा प्रस्ताव। टिप्पणी के साथ स्थिति बदलें; सदस्य को पोर्टल में सूचना मिलती है।', all: 'सभी (संग्रहित छोड़कर)', requests: 'अनुरोध', offers: 'प्रस्ताव', any: 'अनुरोध व प्रस्ताव', search: 'नाम, मोबाइल, मार्ग खोजें…', empty: 'कोई प्रविष्टि नहीं।', remarks: 'सदस्य के लिए टिप्पणी (वैकल्पिक)', save: 'अपडेट करें', matches: 'मिलान', saved: 'अपडेट हुआ।', status: { OPEN: 'खुला', COMPLETED: 'पूर्ण', CANCELLED: 'रद्द', CLOSED: 'बंद', ARCHIVED: 'संग्रहित' }, REQUEST: 'अनुरोध', OFFER: 'प्रस्ताव', confirmArchive: 'यह प्रविष्टि संग्रहित करें? इसके खुले मिलान वापस ले लिए जाएँगे।' },
};

export default function AdminTransportation() {
  const { lang } = useLang();
  const t = words[lang] || words.en;
  const [status, setStatus] = useState('OPEN');
  const [kind, setKind] = useState('');
  const [q, setQ] = useState('');
  const [rows, setRows] = useState(null);
  const [draft, setDraft] = useState({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const load = useCallback(async () => {
    setRows(null); setError('');
    try { setRows(await call(`/admin/entries?${new URLSearchParams(Object.entries({ status, kind, q: q.trim() }).filter(([, value]) => value))}`)); }
    catch (cause) { setError(cause.message); setRows([]); }
  }, [status, kind, q]);
  useEffect(() => { const timer = setTimeout(load, 250); return () => clearTimeout(timer); }, [load]);
  const update = async (row) => {
    const next = draft[row.id] || {};
    const nextStatus = next.status || row.status;
    if (nextStatus === 'ARCHIVED' && !window.confirm(t.confirmArchive)) return;
    try { await call(`/admin/entries/${encodeURIComponent(row.id)}`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus, remarks: next.remarks ?? row.adminRemarks ?? '' }) }); setMessage(t.saved); setDraft((current) => ({ ...current, [row.id]: undefined })); await load(); }
    catch (cause) { setError(cause.message); }
  };
  const date = (value) => new Date(value).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return <div className="space-y-5">
    <div><h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-maroon"><Route className="h-6 w-6" />{t.title}</h1><p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t.sub}</p></div>
    <div className="flex flex-wrap items-center gap-2">
      {['', ...STATUSES].map((value) => <button key={value || 'all'} type="button" aria-pressed={status === value} onClick={() => setStatus(value)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${status === value ? 'border-maroon bg-maroon text-cream' : 'border-border hover:bg-muted'}`}>{value ? t.status[value] : t.all}</button>)}
      <select aria-label={t.any} value={kind} onChange={(event) => setKind(event.target.value)} className="h-8 rounded-full border border-border bg-card px-3 text-xs"><option value="">{t.any}</option><option value="REQUEST">{t.requests}</option><option value="OFFER">{t.offers}</option></select>
      <div className="min-w-[14rem] flex-1"><SearchBox value={q} onChange={setQ} suggestions={suggestValues(rows || [], ["name", "phone", "origin", "destination"], q)} placeholder={t.search} /></div>
    </div>
    {message && <p role="status" className="text-sm text-emerald-700">{message}</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {!rows ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div> : rows.length === 0 ? <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{t.empty}</p> : <div className="space-y-3">{rows.map((row) => <article key={row.id} className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t[row.kind]} · {row.requestType} · {date(row.createdAt)}</p>
          <h2 className="mt-1 font-semibold">{row.origin} → {row.destination} <span className="font-normal text-muted-foreground">· {row.travelDate} {row.preferredTime}</span></h2>
          {(row.itemDetails || row.instructions) && <p className="mt-1 text-sm text-muted-foreground">{[row.itemDetails, row.instructions].filter(Boolean).join(' · ')}</p>}
          <p className="mt-2 flex flex-wrap items-center gap-3 text-sm"><span className="font-medium">{row.name}</span><a href={`tel:+91${row.phone}`} className="flex items-center gap-1 text-maroon hover:underline"><Phone className="h-3.5 w-3.5" />{row.phone}</a>{row.email && <a href={`mailto:${row.email}`} className="flex items-center gap-1 text-maroon hover:underline"><Mail className="h-3.5 w-3.5" />{row.email}</a>}<span className="text-xs text-muted-foreground">{row.matchCount} {t.matches}</span></p>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold">{t.status[row.status] || row.status}</span>
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-border pt-3">
        <select aria-label="Status" value={draft[row.id]?.status || row.status} onChange={(event) => setDraft((current) => ({ ...current, [row.id]: { ...current[row.id], status: event.target.value } }))} className="h-9 rounded-xl border border-border bg-background px-3 text-sm">{STATUSES.map((value) => <option key={value} value={value}>{t.status[value]}</option>)}</select>
        <input aria-label={t.remarks} placeholder={t.remarks} maxLength={500} value={draft[row.id]?.remarks ?? row.adminRemarks ?? ''} onChange={(event) => setDraft((current) => ({ ...current, [row.id]: { ...current[row.id], remarks: event.target.value } }))} className="h-9 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm" />
        <button type="button" onClick={() => update(row)} className="h-9 rounded-full bg-maroon px-4 text-sm font-semibold text-cream hover:bg-maroon-dark">{t.save}</button>
      </div>
    </article>)}</div>}
  </div>;
}

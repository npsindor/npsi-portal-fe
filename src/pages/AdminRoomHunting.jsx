import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { House, Loader2, RefreshCw } from 'lucide-react';
import { roomApi } from '@/api/roomHuntingApi';
import { useLang } from '@/lib/i18n';
import { roomCopy, roomError, rupees } from '@/lib/room-copy';
import { badge } from '@/components/room/room-ui';
import SearchBox from '@/components/admin/SearchBox';
import ExportMenu from '@/components/ExportMenu';

const TABS = ['listings', 'requirements', 'matches', 'audit'];
const LISTING_FILTERS = ['', 'PENDING', 'APPROVED', 'REJECTED', 'RENTED', 'INACTIVE', 'EXPIRED', 'ARCHIVED'];
const REQUIREMENT_FILTERS = ['', 'PENDING', 'APPROVED', 'REJECTED', 'CLOSED', 'EXPIRED', 'ARCHIVED'];
const button = 'rounded-full border border-border px-2.5 py-1 text-xs font-semibold hover:bg-muted disabled:opacity-50';
const dateText = (value, lang) => (value ? new Date(value).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '');

const copy = {
  en: { title: 'Room Hunting Management', sub: 'Review rental listings and room requirements, see matches and the audit trail. Areas and property types are managed under Address options.', tabs: { listings: 'Rental Listings', requirements: 'Room Requirements', matches: 'Matching Records', audit: 'Audit Log' }, all: 'All (except deleted)', approve: 'Approve', reject: 'Reject', deactivate: 'Deactivate / Close', expire: 'Mark expired', archive: 'Archive', restore: 'Restore to pending', remarksPrompt: 'Remarks (required for rejection):', poster: 'Posted by', contact: 'Contact', rent: 'Rent', budget: 'Budget', counts: 'Matches / enquiries', notified: 'Owner notified', email: 'Email', action: 'Action', when: 'When', registered: 'Registered account', visitor: 'Visitor', manageOptions: 'Manage areas & property types', search: 'Search reference, name, mobile, area…', empty: 'No records.' },
  hi: { title: 'आवास सहयोग प्रबंधन', sub: 'किराए की लिस्टिंग और कमरे की आवश्यकताओं की समीक्षा करें, मिलान और ऑडिट लॉग देखें। क्षेत्र और संपत्ति प्रकार पता विकल्पों में प्रबंधित होते हैं।', tabs: { listings: 'किराए की लिस्टिंग', requirements: 'कमरे की आवश्यकताएँ', matches: 'मिलान रिकॉर्ड', audit: 'ऑडिट लॉग' }, all: 'सभी (हटाए गए छोड़कर)', approve: 'स्वीकृत करें', reject: 'अस्वीकार करें', deactivate: 'निष्क्रिय / बंद करें', expire: 'समाप्त करें', archive: 'संग्रहित करें', restore: 'लंबित पर लौटाएँ', remarksPrompt: 'टिप्पणी (अस्वीकृति के लिए आवश्यक):', poster: 'पोस्ट करने वाला', contact: 'संपर्क', rent: 'किराया', budget: 'बजट', counts: 'मिलान / पूछताछ', notified: 'मालिक को सूचित', email: 'ईमेल', action: 'कार्य', when: 'कब', registered: 'पंजीकृत खाता', visitor: 'आगंतुक', manageOptions: 'क्षेत्र और संपत्ति प्रकार प्रबंधित करें', search: 'संदर्भ, नाम, मोबाइल, क्षेत्र खोजें…', empty: 'कोई रिकॉर्ड नहीं।' },
};

export default function AdminRoomHunting() {
  const { lang } = useLang();
  const t = roomCopy[lang];
  const c = copy[lang];
  const [tab, setTab] = useState('listings');
  const [status, setStatus] = useState('PENDING');
  const [q, setQ] = useState('');
  const [rows, setRows] = useState(null);
  const [stats, setStats] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setRows(null); setError('');
    try {
      const filters = { status, q: q.trim() };
      const next = tab === 'listings' ? await roomApi.admin.listings(filters) : tab === 'requirements' ? await roomApi.admin.requirements(filters) : tab === 'matches' ? await roomApi.admin.matches() : await roomApi.admin.audit();
      setRows(next);
      setStats(await roomApi.admin.stats());
    } catch (cause) { setError(roomError(t, cause)); setRows([]); }
  }, [tab, status, q, t]);
  useEffect(() => { const timer = setTimeout(load, 250); return () => clearTimeout(timer); }, [load]);

  const review = async (kind, row, decision) => {
    let remarks;
    if (decision === 'REJECT') { remarks = window.prompt(c.remarksPrompt) || ''; if (!remarks.trim()) return; }
    else if (['ARCHIVE', 'EXPIRE', 'DEACTIVATE'].includes(decision) && !window.confirm(`${c[decision.toLowerCase()] || decision}?`)) return;
    setBusy(row.id); setError('');
    try { await (kind === 'listings' ? roomApi.admin.reviewListing(row.id, decision, remarks) : roomApi.admin.reviewRequirement(row.id, decision, remarks)); await load(); }
    catch (cause) { setError(roomError(t, cause)); }
    finally { setBusy(''); }
  };
  const actions = (kind, row) => {
    const list = row.status === 'PENDING' ? ['APPROVE', 'REJECT'] : ['APPROVED', 'AVAILABLE'].includes(row.status) ? ['DEACTIVATE', 'EXPIRE', 'REJECT'] : ['RESTORE'];
    return <div className="flex flex-wrap gap-1">{[...list, ...(row.status !== 'ARCHIVED' ? ['ARCHIVE'] : [])].map((decision) => <button key={decision} type="button" className={`${button} ${decision === 'APPROVE' ? 'border-emerald-600 text-emerald-700' : decision === 'REJECT' ? 'text-destructive' : ''}`} disabled={busy === row.id} onClick={() => review(kind, row, decision)}>{c[decision.toLowerCase()]}</button>)}</div>;
  };
  const filters = tab === 'listings' ? LISTING_FILTERS : REQUIREMENT_FILTERS;
  const pending = (key) => stats?.[key]?.PENDING || 0;
  const exportRows = (rows || []).map((row) => (tab === 'listings' ? { reference: row.reference, type: row.propertyType, area: row.area, rent: row.rentAmount, contact: row.contactName, mobile: row.contactMobile, status: row.status, created: row.createdAt } : tab === 'requirements' ? { reference: row.reference, name: row.name, mobile: row.mobile, type: row.propertyType, area: row.area, maxBudget: row.maxBudget, status: row.status, created: row.postedAt } : row));

  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-maroon"><House className="h-6 w-6" />{c.title}</h1><p className="mt-1 max-w-3xl text-sm text-muted-foreground">{c.sub}</p></div>
      <div className="flex flex-wrap gap-2"><Link to="/admin/address-options" className={button}>{c.manageOptions}</Link><button type="button" className={button} onClick={load} aria-label={lang === "hi" ? "रीफ़्रेश करें" : "Refresh"}><RefreshCw className="h-3.5 w-3.5" /></button></div>
    </div>
    <div role="tablist" className="flex flex-wrap gap-2 border-b border-border">{TABS.map((key) => <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => { setTab(key); setStatus(key === 'listings' || key === 'requirements' ? 'PENDING' : ''); }} className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold ${tab === key ? 'border-maroon text-maroon' : 'border-transparent text-muted-foreground'}`}>{c.tabs[key]}{key === 'listings' && pending('listings') ? ` (${pending('listings')})` : key === 'requirements' && pending('requirements') ? ` (${pending('requirements')})` : ''}</button>)}</div>
    {(tab === 'listings' || tab === 'requirements') && <div className="flex flex-wrap items-center gap-2">
      {filters.map((value) => <button key={value || 'all'} type="button" aria-pressed={status === value} onClick={() => setStatus(value)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${status === value ? 'border-maroon bg-maroon text-cream' : 'border-border hover:bg-muted'}`}>{value ? t.status[value] || value : c.all}{value && stats?.[tab]?.[value] ? ` · ${stats[tab][value]}` : ''}</button>)}
      <div className="ml-auto flex min-w-[16rem] flex-1 gap-2 sm:flex-none"><SearchBox value={q} onChange={setQ} placeholder={c.search} /><ExportMenu rows={exportRows} filename={`room-hunting-${tab}`} title={c.tabs[tab]} columns={Object.keys(exportRows[0] || {}).map((key) => ({ key, label: key }))} /></div>
    </div>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {!rows ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div> : rows.length === 0 ? <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{c.empty}</p> : <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full min-w-[56rem] text-left text-sm">
        {tab === 'listings' && <><thead className="bg-muted text-xs uppercase text-muted-foreground"><tr><th className="p-3">{t.reference}</th><th className="p-3">{t.type} / {t.area}</th><th className="p-3">{c.rent}</th><th className="p-3">{c.contact}</th><th className="p-3">{c.counts}</th><th className="p-3">{lang === "hi" ? "स्थिति" : "Status"}</th><th className="p-3">{c.action}</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.id} className="border-t border-border align-top"><td className="p-3 font-mono text-xs">{row.reference}<div className="text-muted-foreground">{dateText(row.createdAt, lang)}</div></td><td className="p-3"><div className="font-semibold">{row.propertyType}</div><div className="text-muted-foreground">{row.area}{row.address ? ` · ${row.address}` : ''}</div>{row.description && <div className="mt-1 line-clamp-2 text-xs">{row.description}</div>}{row.photoUrl && <a href={row.photoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-maroon underline">photo</a>}</td><td className="p-3">{rupees(row.rentAmount, lang)}<div className="text-xs text-muted-foreground">{t[row.availableFor]}</div></td><td className="p-3">{row.contactName}<div className="text-xs">{row.contactMobile}{row.showMobile ? ' 👁' : ''}</div>{row.contactEmail && <div className="text-xs">{row.contactEmail}{row.showEmail ? ' 👁' : ''}</div>}<div className="text-xs text-muted-foreground">{row.familyId || row.studentId || ''}</div></td><td className="p-3">{row.matchCount} / {row.enquiryCount}</td><td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge(row.status)}`}>{t.status[row.status] || row.status}</span>{row.adminRemarks && <div className="mt-1 text-xs text-muted-foreground">{row.adminRemarks}</div>}</td><td className="p-3">{actions('listings', row)}</td></tr>)}</tbody></>}
        {tab === 'requirements' && <><thead className="bg-muted text-xs uppercase text-muted-foreground"><tr><th className="p-3">{t.reference}</th><th className="p-3">{t.name}</th><th className="p-3">{t.type} / {t.area}</th><th className="p-3">{c.budget}</th><th className="p-3">{c.counts}</th><th className="p-3">{lang === "hi" ? "स्थिति" : "Status"}</th><th className="p-3">{c.action}</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.id} className="border-t border-border align-top"><td className="p-3 font-mono text-xs">{row.reference}<div className="text-muted-foreground">{dateText(row.postedAt, lang)}</div></td><td className="p-3">{row.name}<div className="text-xs">{row.mobile}{row.showMobile ? ' 👁' : ''}</div>{row.email && <div className="text-xs">{row.email}</div>}<div className="text-xs text-muted-foreground">{row.registered ? c.registered : c.visitor}</div></td><td className="p-3"><div className="font-semibold">{row.propertyType}</div><div className="text-muted-foreground">{row.area}</div>{row.note && <div className="mt-1 line-clamp-2 text-xs">{row.note}</div>}</td><td className="p-3">{row.minBudget ? `${rupees(row.minBudget, lang)} – ` : '≤ '}{rupees(row.maxBudget, lang)}</td><td className="p-3">{row.matchCount}</td><td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge(row.status)}`}>{t.status[row.status] || row.status}</span>{row.adminRemarks && <div className="mt-1 text-xs text-muted-foreground">{row.adminRemarks}</div>}</td><td className="p-3">{actions('requirements', row)}</td></tr>)}</tbody></>}
        {tab === 'matches' && <><thead className="bg-muted text-xs uppercase text-muted-foreground"><tr><th className="p-3">{c.when}</th><th className="p-3">{c.tabs.requirements}</th><th className="p-3">{c.tabs.listings}</th><th className="p-3">Score</th><th className="p-3">{c.notified}</th><th className="p-3">{c.email}</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.id} className="border-t border-border align-top"><td className="p-3 text-xs">{dateText(row.createdAt, lang)}</td><td className="p-3">{row.requirement.reference} · {row.requirement.name}<div className="text-xs text-muted-foreground">{row.requirement.propertyType} · {row.requirement.area} · ≤ {rupees(row.requirement.maxBudget, lang)}</div></td><td className="p-3">{row.listing.reference}<div className="text-xs text-muted-foreground">{row.listing.propertyType} · {row.listing.area} · {rupees(row.listing.rentAmount, lang)}</div></td><td className="p-3">{row.score}</td><td className="p-3 text-xs">{row.notifiedAt ? dateText(row.notifiedAt, lang) : '—'}</td><td className="p-3 text-xs">{row.emailStatus}</td></tr>)}</tbody></>}
        {tab === 'audit' && <><thead className="bg-muted text-xs uppercase text-muted-foreground"><tr><th className="p-3">{c.when}</th><th className="p-3">{c.action}</th><th className="p-3">Record</th><th className="p-3">{t.remarks}</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.id} className="border-t border-border"><td className="p-3 text-xs">{dateText(row.createdAt, lang)}</td><td className="p-3 font-mono text-xs">{row.action}</td><td className="p-3 text-xs">{row.entity} · {row.entityId.slice(0, 8)}</td><td className="p-3 text-xs">{row.remarks || ''}</td></tr>)}</tbody></>}
      </table>
    </div>}
  </div>;
}

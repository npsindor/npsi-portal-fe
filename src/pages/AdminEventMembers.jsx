import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, CheckCircle2, Eye, GripVertical, Loader2, Plus, Trash2, UserPlus, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { BecomeMemberDialog } from '@/components/event-members/BecomeMemberDialog';
import VillageCombobox from '@/components/VillageCombobox';
import RegisteredPersonInput from '@/components/admin/RegisteredPersonInput';
import { INDORE_AREAS, NATIVE_VILLAGES } from '@/lib/native-places';
import { eventMembersApi } from '@/api/eventMembersApi';
import { base44 } from '@/api/base44Client';
import { errorText, eventMemberCopy, sectionLabel } from '@/lib/event-member-copy';
import { useLang } from '@/lib/i18n';
import SuggestSearchInput from '@/components/SuggestSearchInput';
import { suggestValues } from '@/lib/search-suggestions';
import { normalizeField } from "@/lib/utils";

const PAGE = 25;
const OTHER = 'OTHER';
// The Hindi of a village / area from the portal's own lists (fills "Village in Hindi" when the admin picks one).
const LIST_HINDI = new Map([...NATIVE_VILLAGES, ...INDORE_AREAS].map((option) => [option.value.trim().toLowerCase(), option.hi]));
const listHindiOf = (value) => LIST_HINDI.get(String(value || '').trim().toLowerCase()) || '';
const field = 'mt-1 min-h-10 w-full rounded-lg border border-input bg-background px-3 text-sm';
const TONE = { PENDING: 'bg-amber-100 text-amber-900', APPROVED: 'bg-emerald-100 text-emerald-900', REJECTED: 'bg-red-100 text-red-900', REMOVED: 'bg-slate-200 text-slate-700', WITHDRAWN: 'bg-slate-200 text-slate-700' };
const A = {
  en: {
    title: 'Become a NPSI Event Member', sub: 'Every Become a Member request for the Core Team and the event teams. Approving shows the member in their team section automatically.',
    applications: 'Applications', sections: 'Team sections', search: 'Search name, mobile, village or event', all: 'All applications', allEvents: 'All teams', other: 'Other',
    cols: ['S. No.', 'Photo', 'Name', 'Mobile', 'Email', 'Village', 'Indore Area', 'Interested Event', 'Registration Date', 'Status', 'Action'],
    view: 'View', approve: 'Approve', reject: 'Reject', none: 'No applications match.', prev: 'Previous', next: 'Next', page: 'Page',
    approved: 'approved', pending: 'pending', addOnBehalf: 'Add for an existing member', find: 'Search members / students by name, mobile or ID', pick: 'Use',
    details: 'Application details', history: 'History', edit: 'Edit details', save: 'Save', cancel: 'Cancel', name: 'Name', designation: 'Designation (optional)', designationHi: 'Designation (Hindi)',
    village: 'Village', area: 'Indore area', photo: 'Photo', newPhoto: 'Replace photo', section: 'Team section', order: 'Display order', visible: 'Shown on the website', hidden: 'Hidden from the website',
    show: 'Show on website', hide: 'Hide from website', hideMobile: 'Hide mobile', hideEmail: 'Hide email', remove: 'Remove membership', reason: 'Reason', rejectReason: 'Rejection reason (sent to the history)',
    mobileConsent: 'Mobile public (member’s consent)', emailConsent: 'Email public (member’s consent)', yes: 'Yes', no: 'No', linked: 'Linked records (admin only)', source: 'Source', created: 'Submitted', mapTo: 'Map to section',
    confirmApprove: 'Approve this application? The member will appear in the team section.', confirmRemove: 'End this event membership? The person’s family / student record and login stay.',
    confirmHide: 'Change what the website shows for this member?', confirm: 'Confirm', newSection: 'Add section', label: 'Name in the form', labelHi: 'Name in the form (Hindi)', heading: 'Public heading', headingHi: 'Public heading (Hindi)',
    event: 'Event page', noEvent: 'Own team page (/teams/…)', accepting: 'Open for applications', active: 'Active', saved: 'Saved.', page_: 'Team page',
    addToTeam: 'Add to team', addToTeamSub: 'Lists a person on the team page straight away: name, village and photo. Mobile and email are optional and never shown publicly.',
    addMobile: 'Mobile (optional)', addEmail: 'Email (optional)', added: 'Added to the team.', uploading: 'Uploading photo…',
    linkedTo: 'Linked to registered record', unlink: 'Remove link',
    arrange: 'Arrange order', arrangeSub: 'Drag a member, use the arrows, or type a number to move them. The website shows the team in exactly this order (number 1 first). New members are added at the end.',
    team: 'Team', moveTo: 'Position', up: 'Move up', down: 'Move down', saveOrder: 'Save order', orderSaved: 'Order saved. The website now shows this order.', noMembers: 'No approved members in this team yet.', unsaved: 'Unsaved order',
    deleteEntry: 'Delete', deleteTitle: 'Delete this entry permanently?', deleteText: (name) => `The entry for “${name}” and its history will be deleted for good and it leaves the team page. The person’s family / student record and login stay. This cannot be undone.`, deleteYes: 'Yes, delete', deleted: 'Entry deleted.',
    nameHi: 'Name in Hindi', villageHi: 'Village in Hindi', hindiHint: 'Shown when the website is in Hindi. A village from the portal list fills in by itself.',
  },
  hi: {
    title: 'एनपीएसआई इवेंट सदस्य बनें', sub: 'कोर टीम और कार्यक्रम टीमों के सभी "सदस्य बनें" अनुरोध। स्वीकृत करते ही सदस्य अपनी टीम में अपने आप दिखता है।',
    applications: 'आवेदन', sections: 'टीम सेक्शन', search: 'नाम, मोबाइल, गाँव या कार्यक्रम खोजें', all: 'सभी आवेदन', allEvents: 'सभी टीमें', other: 'अन्य',
    cols: ['क्र.', 'फोटो', 'नाम', 'मोबाइल', 'ईमेल', 'गाँव', 'इंदौर क्षेत्र', 'रुचि का कार्यक्रम', 'आवेदन तिथि', 'स्थिति', 'कार्रवाई'],
    view: 'देखें', approve: 'स्वीकृत करें', reject: 'अस्वीकृत करें', none: 'कोई आवेदन नहीं मिला।', prev: 'पिछला', next: 'अगला', page: 'पेज',
    approved: 'स्वीकृत', pending: 'लंबित', addOnBehalf: 'मौजूदा सदस्य के लिए जोड़ें', find: 'नाम, मोबाइल या आईडी से सदस्य / विद्यार्थी खोजें', pick: 'चुनें',
    details: 'आवेदन विवरण', history: 'इतिहास', edit: 'विवरण बदलें', save: 'सहेजें', cancel: 'रद्द करें', name: 'नाम', designation: 'पद (वैकल्पिक)', designationHi: 'पद (हिंदी)',
    village: 'गाँव', area: 'इंदौर क्षेत्र', photo: 'फोटो', newPhoto: 'फोटो बदलें', section: 'टीम सेक्शन', order: 'क्रम', visible: 'वेबसाइट पर दिख रहा है', hidden: 'वेबसाइट से छिपा है',
    show: 'वेबसाइट पर दिखाएँ', hide: 'वेबसाइट से छिपाएँ', hideMobile: 'मोबाइल छिपाएँ', hideEmail: 'ईमेल छिपाएँ', remove: 'सदस्यता हटाएँ', reason: 'कारण', rejectReason: 'अस्वीकृति का कारण',
    mobileConsent: 'मोबाइल सार्वजनिक (सदस्य की सहमति)', emailConsent: 'ईमेल सार्वजनिक (सदस्य की सहमति)', yes: 'हाँ', no: 'नहीं', linked: 'जुड़े रिकॉर्ड (केवल एडमिन)', source: 'स्रोत', created: 'आवेदन', mapTo: 'सेक्शन से जोड़ें',
    confirmApprove: 'यह आवेदन स्वीकृत करें? सदस्य टीम सेक्शन में दिखेगा।', confirmRemove: 'यह इवेंट सदस्यता समाप्त करें? व्यक्ति का परिवार / विद्यार्थी रिकॉर्ड और लॉगिन बने रहेंगे।',
    confirmHide: 'इस सदस्य के लिए वेबसाइट पर दिखने वाली जानकारी बदलें?', confirm: 'पुष्टि करें', newSection: 'सेक्शन जोड़ें', label: 'फॉर्म में नाम', labelHi: 'फॉर्म में नाम (हिंदी)', heading: 'सार्वजनिक शीर्षक', headingHi: 'सार्वजनिक शीर्षक (हिंदी)',
    event: 'कार्यक्रम पेज', noEvent: 'अपना टीम पेज (/teams/…)', accepting: 'आवेदन के लिए खुला', active: 'सक्रिय', saved: 'सहेजा गया।', page_: 'टीम पेज',
    addToTeam: 'टीम में जोड़ें', addToTeamSub: 'व्यक्ति को तुरंत टीम पेज पर दिखाएँ: नाम, गाँव और फोटो। मोबाइल और ईमेल वैकल्पिक हैं और सार्वजनिक रूप से कभी नहीं दिखते।',
    addMobile: 'मोबाइल (वैकल्पिक)', addEmail: 'ईमेल (वैकल्पिक)', added: 'टीम में जोड़ा गया।', uploading: 'फोटो अपलोड हो रही है…',
    linkedTo: 'पंजीकृत रिकॉर्ड से जुड़ा', unlink: 'जोड़ हटाएँ',
    arrange: 'क्रम तय करें', arrangeSub: 'सदस्य को खींचकर (drag), तीर से, या नंबर लिखकर उसकी जगह बदलें। वेबसाइट पर टीम ठीक इसी क्रम में दिखेगी (नंबर 1 सबसे पहले)। नए सदस्य अंत में जुड़ते हैं।',
    team: 'टीम', moveTo: 'स्थान', up: 'ऊपर करें', down: 'नीचे करें', saveOrder: 'क्रम सहेजें', orderSaved: 'क्रम सहेजा गया। वेबसाइट पर अब यही क्रम दिखेगा।', noMembers: 'इस टीम में अभी कोई स्वीकृत सदस्य नहीं है।', unsaved: 'क्रम सहेजना बाकी',
    deleteEntry: 'हटाएँ (डिलीट)', deleteTitle: 'यह प्रविष्टि हमेशा के लिए हटाएँ?', deleteText: (name) => `“${name}” की प्रविष्टि और उसका इतिहास स्थायी रूप से हट जाएगा; टीम पेज से भी हट जाएगी। व्यक्ति का परिवार / विद्यार्थी रिकॉर्ड और लॉगिन बने रहेंगे। इसे वापस नहीं लाया जा सकता।`, deleteYes: 'हाँ, डिलीट करें', deleted: 'प्रविष्टि डिलीट हो गई।',
    nameHi: 'हिंदी में नाम', villageHi: 'हिंदी में गाँव', hindiHint: 'वेबसाइट हिंदी में होने पर दिखता है। पोर्टल सूची का गाँव अपने आप भर जाता है।',
  },
};
const fmtDate = (value, lang) => (value ? new Date(value).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

export default function AdminEventMembers() {
  const { lang } = useLang();
  const a = A[lang] || A.en;
  const t = eventMemberCopy[lang] || eventMemberCopy.en;
  const [params] = useSearchParams();
  const [tab, setTab] = useState('applications');
  const [rows, setRows] = useState(null);
  const [meta, setMeta] = useState({ sections: [], other: { pending: 0 } });
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [section, setSection] = useState(params.get('section') || '');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);
  const [flash, setFlash] = useState('');
  const [error, setError] = useState('');
  const [onBehalf, setOnBehalf] = useState(null);
  const [adding, setAdding] = useState(false);
  const [arranging, setArranging] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [list, sections] = await Promise.all([eventMembersApi.admin.list(), eventMembersApi.admin.sections()]);
      setRows(list); setMeta(sections);
    } catch (cause) { setError(errorText(t, cause)); setRows([]); }
  }, [t]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [q, status, section]);

  const eventName = useCallback((row) => (row.section ? sectionLabel(row.section, lang) : `${a.other}: ${row.customEventName || ''}`), [a, lang]);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const digits = needle.replace(/\D/g, '');
    return (rows || []).filter((row) =>
      (!status || row.status === status)
      && (!section || (section === OTHER ? !row.sectionId : row.section?.key === section))
      && (!needle || [row.name, row.village, row.area, row.email, eventName(row), row.customEventName].some((value) => String(value || '').toLowerCase().includes(needle)) || (digits.length >= 3 && String(row.mobileDigits || '').includes(digits))));
  }, [rows, q, status, section, eventName]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const visible = filtered.slice((page - 1) * PAGE, page * PAGE);
  const current = open ? (rows || []).find((row) => row.id === open) : null;
  const done = async (message = a.saved) => { setFlash(message); await load(); setTimeout(() => setFlash(''), 3000); };
  const confirmDelete = async () => {
    if (!deleting || deleteBusy) return;
    setDeleteBusy(true); setError('');
    try { await eventMembersApi.admin.delete(deleting.id); setDeleting(null); await done(a.deleted); }
    catch (cause) { setDeleting(null); setError(errorText(t, cause)); }
    finally { setDeleteBusy(false); }
  };

  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="font-display text-2xl font-semibold text-maroon">{a.title}</h1><p className="mt-1 max-w-3xl text-sm text-muted-foreground">{a.sub}</p></div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setArranging(true)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-maroon px-4 text-sm font-semibold text-maroon"><ArrowUpDown className="h-4 w-4" />{a.arrange}</button>
        <button type="button" onClick={() => setAdding(true)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-maroon px-4 text-sm font-semibold text-maroon"><UserPlus className="h-4 w-4" />{a.addToTeam}</button>
        <PeopleSearch a={a} onPick={setOnBehalf} />
      </div>
    </header>
    {arranging && <ArrangeOrderDialog a={a} t={t} lang={lang} sections={meta.sections} rows={rows || []} defaultSection={section && section !== OTHER ? section : 'CORE_TEAM'} onClose={() => setArranging(false)} onDone={() => done(a.orderSaved)} />}
    <AlertDialog open={Boolean(deleting)} onOpenChange={(value) => { if (!value && !deleteBusy) setDeleting(null); }}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{a.deleteTitle}</AlertDialogTitle><AlertDialogDescription>{deleting ? a.deleteText(deleting.name) : ''}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel disabled={deleteBusy}>{a.cancel}</AlertDialogCancel><AlertDialogAction disabled={deleteBusy} className="bg-red-700 text-white hover:bg-red-800" onClick={(e) => { e.preventDefault(); confirmDelete(); }}>{deleteBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{a.deleteYes}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
    {adding && <AddToTeamDialog a={a} t={t} lang={lang} sections={meta.sections} defaultSection={section && section !== OTHER ? section : 'CORE_TEAM'} onClose={() => setAdding(false)} onDone={() => done(a.added)} />}

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {meta.sections.map((item) => <button type="button" key={item.id} onClick={() => { setTab('applications'); setSection(item.key); }} className={`rounded-xl border p-3 text-left text-sm ${section === item.key ? 'border-maroon bg-maroon/5' : 'border-border bg-card'}`}>
        <span className="block font-semibold">{item.heading}</span><span className="text-muted-foreground">{item.approved} {a.approved} · {item.pending} {a.pending}</span></button>)}
      <button type="button" onClick={() => { setTab('applications'); setSection(OTHER); }} className={`rounded-xl border p-3 text-left text-sm ${section === OTHER ? 'border-maroon bg-maroon/5' : 'border-border bg-card'}`}>
        <span className="block font-semibold">{a.other}</span><span className="text-muted-foreground">{meta.other.pending} {a.pending}</span></button>
    </div>

    <div role="tablist" className="flex gap-2 border-b border-border">
      {[['applications', a.applications], ['sections', a.sections]].map(([key, label]) => <button key={key} role="tab" type="button" aria-selected={tab === key} onClick={() => setTab(key)} className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${tab === key ? 'border-maroon text-maroon' : 'border-transparent text-muted-foreground'}`}>{label}</button>)}
    </div>
    {flash && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{flash}</p>}
    {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

    {tab === 'sections' ? <SectionsTab a={a} meta={meta} onSaved={done} onError={(cause) => setError(errorText(t, cause))} /> : <>
      <div className="flex flex-wrap gap-2">
        <div className="min-w-[16rem] flex-1"><SuggestSearchInput value={q} onChange={setQ} placeholder={a.search} ariaLabel={a.search} suggestions={suggestValues(rows || [], ['name', 'village', 'area', 'email', 'customEventName'], q)} inputClassName="min-h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm" /></div>
        <select aria-label={a.cols[9]} value={status} onChange={(e) => setStatus(e.target.value)} className="min-h-10 rounded-lg border border-input bg-background px-3 text-sm">
          <option value="">{a.all}</option>{['PENDING', 'APPROVED', 'REJECTED', 'REMOVED', 'WITHDRAWN'].map((value) => <option key={value} value={value}>{t.status[value]}</option>)}
        </select>
        <select aria-label={a.cols[7]} value={section} onChange={(e) => setSection(e.target.value)} className="min-h-10 rounded-lg border border-input bg-background px-3 text-sm">
          <option value="">{a.allEvents}</option>{meta.sections.map((item) => <option key={item.key} value={item.key}>{sectionLabel(item, lang)}</option>)}<option value={OTHER}>{a.other}</option>
        </select>
      </div>
      {rows === null ? <Loader2 className="h-6 w-6 animate-spin text-maroon" /> : <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[72rem] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr>{a.cols.map((col) => <th key={col} className="whitespace-nowrap px-3 py-2 font-semibold">{col}</th>)}</tr></thead>
          <tbody className="divide-y divide-border">
            {visible.length === 0 && <tr><td colSpan={a.cols.length} className="px-3 py-8 text-center text-muted-foreground">{a.none}</td></tr>}
            {visible.map((row, index) => <tr key={row.id} className="align-middle">
              <td className="px-3 py-2">{(page - 1) * PAGE + index + 1}</td>
              <td className="px-3 py-2">{row.photoUrl ? <img src={row.photoUrl} alt="" className="h-12 w-10 rounded-md object-cover" /> : <span className="flex h-12 w-10 items-center justify-center rounded-md bg-muted text-xs">—</span>}</td>
              <td className="px-3 py-2 font-semibold">{row.name}{!row.showOnWebsite && row.status === 'APPROVED' && <span className="block text-xs font-normal text-muted-foreground">{a.hidden}</span>}</td>
              <td className="whitespace-nowrap px-3 py-2">{row.mobileDigits || '—'}</td>
              <td className="px-3 py-2 break-all">{row.email || '—'}</td>
              <td className="px-3 py-2">{row.village || '—'}</td>
              <td className="px-3 py-2">{row.area || '—'}</td>
              <td className="px-3 py-2">{eventName(row)}</td>
              <td className="px-3 py-2 whitespace-nowrap">{fmtDate(row.createdAt, lang)}</td>
              <td className="px-3 py-2"><span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[row.status] || ''}`}>{t.status[row.status] || row.status}</span></td>
              <td className="px-3 py-2"><div className="flex flex-wrap gap-1.5">
                <button type="button" onClick={() => setOpen(row.id)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-border px-2.5 text-xs font-semibold"><Eye className="h-3.5 w-3.5" />{a.view}</button>
                {row.status === 'PENDING' && <><button type="button" onClick={() => setOpen(`${row.id}#approve`)} className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-emerald-700 px-2.5 text-xs font-semibold text-white"><CheckCircle2 className="h-3.5 w-3.5" />{a.approve}</button>
                  <button type="button" onClick={() => setOpen(`${row.id}#reject`)} className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-red-700 px-2.5 text-xs font-semibold text-white"><XCircle className="h-3.5 w-3.5" />{a.reject}</button></>}
                <button type="button" title={a.deleteEntry} aria-label={`${a.deleteEntry}: ${row.name}`} onClick={() => setDeleting(row)} className="inline-flex min-h-9 items-center justify-center rounded-lg border border-red-300 px-2.5 text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div></td>
            </tr>)}
          </tbody>
        </table>
      </div>}
      {pages > 1 && <nav className="flex items-center justify-end gap-2 text-sm" aria-label={a.page}>
        <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)} className="min-h-9 rounded-lg border border-border px-3 disabled:opacity-40">{a.prev}</button>
        <span>{a.page} {page} / {pages}</span>
        <button type="button" disabled={page === pages} onClick={() => setPage(page + 1)} className="min-h-9 rounded-lg border border-border px-3 disabled:opacity-40">{a.next}</button>
      </nav>}
    </>}

    {open && (current || (rows || []).find((row) => open.startsWith(row.id))) && <ApplicationDialog key={open} a={a} t={t} lang={lang} row={current || rows.find((row) => open.startsWith(row.id))} start={open.split('#')[1] || ''} sections={meta.sections} eventName={eventName} onClose={() => setOpen(null)} onDone={done} />}
    <BecomeMemberDialog open={Boolean(onBehalf)} onOpenChange={(value) => { if (!value) setOnBehalf(null); }} presetPerson={onBehalf} onSubmitted={() => load()} />
  </div>;
}

function PeopleSearch({ a, onPick }) {
  const [openSearch, setOpenSearch] = useState(false);
  const [q, setQ] = useState('');
  const [found, setFound] = useState([]);
  useEffect(() => {
    if (q.trim().length < 2) { setFound([]); return undefined; }
    const timer = setTimeout(() => eventMembersApi.admin.people(q).then(setFound).catch(() => setFound([])), 300);
    return () => clearTimeout(timer);
  }, [q]);
  return <div className="relative">
    <button type="button" onClick={() => setOpenSearch(!openSearch)} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-maroon px-4 text-sm font-semibold text-cream"><UserPlus className="h-4 w-4" />{a.addOnBehalf}</button>
    {openSearch && <div className="absolute right-0 z-20 mt-2 w-[min(26rem,calc(100vw-2rem))] rounded-xl border border-border bg-card p-3 shadow-xl">
      <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={a.find} aria-label={a.find} className={field} />
      <ul className="mt-2 max-h-72 divide-y divide-border overflow-y-auto text-sm">{found.map((person) => <li key={`${person.kind}:${person.id}`} className="flex items-center justify-between gap-2 py-2">
        <span className="min-w-0"><span className="block font-semibold">{person.name}</span><span className="block text-xs text-muted-foreground">{[person.membershipId || person.studentId, person.village, person.mobile].filter(Boolean).join(' · ')}</span></span>
        <button type="button" onClick={() => { onPick(person); setOpenSearch(false); setQ(''); }} className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold">{a.pick}</button></li>)}</ul>
    </div>}
  </div>;
}

// Admin → Arrange order: the team's approved members in website order. Drag a row, use ↑ ↓, or type the position it
// should take (e.g. 3 or 6); Save sends the whole order (first = 1).
function ArrangeOrderDialog({ a, t, lang, sections, rows, defaultSection, onClose, onDone }) {
  const active = sections.filter((item) => item.status === 'ACTIVE');
  const [sectionKey, setSectionKey] = useState(active.some((item) => item.key === defaultSection) ? defaultSection : active[0]?.key || '');
  const current = active.find((item) => item.key === sectionKey);
  const initial = useMemo(() => rows
    .filter((row) => row.section?.key === sectionKey && row.status === 'APPROVED')
    .sort((x, y) => (x.sortOrder ?? 0) - (y.sortOrder ?? 0) || String(x.name).localeCompare(String(y.name)) || String(x.id).localeCompare(String(y.id))), [rows, sectionKey]);
  const [order, setOrder] = useState(initial);
  const [dragging, setDragging] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { setOrder(initial); }, [initial]);
  const changed = order.some((row, index) => row.id !== initial[index]?.id);
  const move = (from, to) => setOrder((list) => {
    const target = Math.max(0, Math.min(list.length - 1, to));
    if (from === target) return list;
    const next = [...list];
    const [row] = next.splice(from, 1);
    next.splice(target, 0, row);
    return next;
  });
  const save = async () => {
    if (!current) return;
    setBusy(true); setError('');
    try { await eventMembersApi.admin.reorder(current.id, order.map((row) => row.id)); await onDone(); onClose(); } catch (cause) { setError(errorText(t, cause)); } finally { setBusy(false); }
  };
  const name = (row) => (lang === 'hi' && row.nameHi) || row.name;
  return <Dialog open onOpenChange={(value) => { if (!value) onClose(); }}>
    <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto rounded-2xl">
      <DialogHeader className="text-left"><DialogTitle>{a.arrange}</DialogTitle><DialogDescription>{a.arrangeSub}</DialogDescription></DialogHeader>
      <label className="block text-sm font-semibold">{a.team}<select className={field} value={sectionKey} onChange={(e) => setSectionKey(e.target.value)}>{active.map((item) => <option key={item.key} value={item.key}>{sectionLabel(item, lang)}</option>)}</select></label>
      {order.length === 0 ? <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{a.noMembers}</p> : (
        <ol aria-label={a.arrange} className="space-y-1.5">
          {order.map((row, index) => (
            <li
              key={row.id}
              draggable
              onDragStart={(event) => { setDragging(index); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', String(index)); }}
              onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }}
              onDrop={(event) => { event.preventDefault(); const from = dragging ?? Number(event.dataTransfer.getData('text/plain')); move(from, index); setDragging(null); }}
              onDragEnd={() => setDragging(null)}
              data-testid="order-row"
              className={`flex items-center gap-2 rounded-xl border bg-card px-2 py-2 text-sm ${dragging === index ? 'border-maroon opacity-60' : 'border-border'}`}
            >
              <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" aria-hidden="true" />
              <span className="w-7 shrink-0 text-center font-display font-bold text-maroon">{index + 1}</span>
              {row.photoUrl ? <img src={row.photoUrl} alt="" className="h-10 w-8 shrink-0 rounded-md object-cover" /> : <span className="flex h-10 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-[0.6rem]">—</span>}
              <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{name(row)}</span><span className="block truncate text-xs text-muted-foreground">{row.village || ''}</span></span>
              <label className="flex items-center gap-1 text-xs text-muted-foreground">{a.moveTo}
                <input type="number" min="1" max={order.length} aria-label={`${a.moveTo}: ${name(row)}`} defaultValue={index + 1} key={`${row.id}-${index}`}
                  onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur(); } }}
                  onBlur={(event) => { const value = Number(event.target.value); if (Number.isInteger(value) && value >= 1) move(index, value - 1); }}
                  className="h-8 w-14 rounded-md border border-input bg-background px-1 text-center text-sm" />
              </label>
              <button type="button" aria-label={`${a.up}: ${name(row)}`} disabled={index === 0} onClick={() => move(index, index - 1)} className="rounded-md border border-border p-1.5 disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
              <button type="button" aria-label={`${a.down}: ${name(row)}`} disabled={index === order.length - 1} onClick={() => move(index, index + 1)} className="rounded-md border border-border p-1.5 disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
            </li>
          ))}
        </ol>
      )}
      {error && <p role="alert" className="rounded-lg bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={busy || !changed} onClick={save} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-maroon px-4 font-semibold text-cream disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{a.saveOrder}</button>
        <button type="button" onClick={onClose} className="min-h-10 rounded-lg border border-border px-4 font-semibold">{a.cancel}</button>
        {changed && <span role="status" className="text-xs font-semibold text-amber-700">{a.unsaved}</span>}
      </div>
    </DialogContent>
  </Dialog>;
}

// An admin lists someone on a team page directly (e.g. the Sangathan's Core Team list): name, village and photo; the
// server approves it at once and refuses the same name + village twice.
function AddToTeamDialog({ a, t, lang, sections, defaultSection, onClose, onDone }) {
  const [form, setForm] = useState({ sectionKey: defaultSection, name: '', nameHi: '', designation: '', designationHi: '', village: '', villageHi: '', mobile: '', email: '', photoUrl: '', person: null });
  // A person already registered on the portal: their details fill the form and the entry is linked to their record.
  const pickPerson = (person) => setForm((f) => ({
    ...f,
    person,
    name: person.name || f.name,
    village: person.village || f.village,
    villageHi: listHindiOf(person.village) || f.villageHi,
    mobile: person.mobile || f.mobile,
    email: person.email || f.email,
    photoUrl: person.photoUrl || f.photoUrl,
  }));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: normalizeField(key, e.target.value) }));
  const upload = async (file) => {
    if (!file) return;
    setUploading(true); setError('');
    try { const { fileUrl } = await base44.integrations.Core.UploadPublicFile({ file }); setForm((f) => ({ ...f, photoUrl: fileUrl })); } catch (cause) { setError(cause.message); } finally { setUploading(false); }
  };
  const submit = async (e) => {
    e.preventDefault();
    if (busy || uploading) return;
    if (form.name.trim().length < 2) { setError(t.errors.EM_NAME); return; }
    if (!form.village.trim()) { setError(t.errors.EM_VILLAGE); return; }
    setBusy(true); setError('');
    try {
      await eventMembersApi.apply({
        sectionKey: form.sectionKey, name: form.name.trim(), village: form.village.trim(), designation: form.designation.trim() || undefined,
        nameHi: form.nameHi.trim() || undefined, villageHi: form.villageHi.trim() || undefined, designationHi: form.designationHi.trim() || undefined,
        ...(form.person ? { personKind: form.person.kind, personId: form.person.id } : {}),
        mobile: form.mobile.trim() || undefined, email: form.email.trim() || undefined, photoUrl: form.photoUrl || undefined, consent: true, approveNow: true,
      });
      await onDone();
      onClose();
    } catch (cause) { setError(errorText(t, cause)); } finally { setBusy(false); }
  };
  return <Dialog open onOpenChange={(value) => { if (!value) onClose(); }}>
    <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] max-w-xl overflow-y-auto rounded-2xl">
      <DialogHeader className="text-left"><DialogTitle>{a.addToTeam}</DialogTitle><DialogDescription>{a.addToTeamSub}</DialogDescription></DialogHeader>
      <form onSubmit={submit} className="grid gap-3 text-sm sm:grid-cols-2">
        <label className="block font-semibold sm:col-span-2">{a.section} *<select className={field} value={form.sectionKey} onChange={set('sectionKey')}>{sections.filter((item) => item.status === 'ACTIVE').map((item) => <option key={item.key} value={item.key}>{sectionLabel(item, lang)}</option>)}</select></label>
        <div className="sm:col-span-2">
          <label htmlFor="em-add-name" className="block font-semibold">{a.name} *</label>
          <RegisteredPersonInput id="em-add-name" className={field} required maxLength={120} value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} onPick={pickPerson} />
          {form.person && <p className="mt-1 flex items-center gap-2 text-xs font-semibold text-emerald-700">{a.linkedTo}: {form.person.membershipId || form.person.studentId}<button type="button" onClick={() => setForm((f) => ({ ...f, person: null }))} className="font-normal text-muted-foreground underline">{a.unlink}</button></p>}
        </div>
        <label className="block font-semibold">{a.nameHi}<input className={field} lang="hi" maxLength={255} value={form.nameHi} onChange={set('nameHi')} /></label>
        <div><label htmlFor="em-add-village" className="block font-semibold">{a.village} *</label><VillageCombobox id="em-add-village" hideLabel label={a.village} value={form.village} onChange={(v) => setForm((f) => ({ ...f, village: v, villageHi: listHindiOf(v) || f.villageHi }))} lang={lang} inputClassName={field} /></div>
        <label className="block font-semibold">{a.villageHi}<input className={field} lang="hi" maxLength={255} value={form.villageHi} onChange={set('villageHi')} /></label>
        <p className="text-xs text-muted-foreground sm:col-span-2">{a.hindiHint}</p>
        <label className="block font-semibold">{a.designation}<input className={field} maxLength={150} value={form.designation} onChange={set('designation')} /></label>
        <label className="block font-semibold">{a.designationHi}<input className={field} lang="hi" maxLength={150} value={form.designationHi} onChange={set('designationHi')} /></label>
        <label className="block font-semibold">{a.addMobile}<input className={field} inputMode="numeric" maxLength={16} pattern="[6-9][0-9]{9}" value={form.mobile} onChange={set('mobile')} /></label>
        <label className="block font-semibold">{a.addEmail}<input type="email" className={field} maxLength={255} value={form.email} onChange={set('email')} /></label>
        <div className="flex items-center gap-3 sm:col-span-2">
          {form.photoUrl ? <img src={form.photoUrl} alt="" className="h-20 w-16 rounded-lg object-cover" /> : <span className="flex h-20 w-16 items-center justify-center rounded-lg bg-muted text-xs">—</span>}
          <label className="block font-semibold">{a.photo}<input type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block text-xs" onChange={(e) => upload(e.target.files?.[0])} /></label>
          {uploading && <span role="status" className="text-xs text-muted-foreground">{a.uploading}</span>}
        </div>
        {error && <p role="alert" className="rounded-lg bg-destructive/10 p-2 text-destructive sm:col-span-2">{error}</p>}
        <div className="flex gap-2 sm:col-span-2">
          <button type="submit" disabled={busy || uploading} className="min-h-10 rounded-lg bg-maroon px-4 font-semibold text-cream disabled:opacity-50">{a.addToTeam}</button>
          <button type="button" onClick={onClose} className="min-h-10 rounded-lg border border-border px-4 font-semibold">{a.cancel}</button>
        </div>
      </form>
    </DialogContent>
  </Dialog>;
}

function ApplicationDialog({ a, t, lang, row, start, sections, eventName, onClose, onDone }) {
  const [history, setHistory] = useState(null);
  const [mode, setMode] = useState(start); // '', 'approve', 'reject', 'edit', 'remove'
  const [reason, setReason] = useState('');
  const [mapTo, setMapTo] = useState(row.section?.key || '');
  const [form, setForm] = useState({ name: row.name, nameHi: row.nameHi || '', villageHi: row.villageHi || '', designation: row.designation || '', designationHi: row.designationHi || '', village: row.village || '', area: row.area || '', photoUrl: row.photoUrl || '', sectionKey: row.section?.key || '', sortOrder: row.sortOrder ?? 0 });
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { eventMembersApi.admin.history(row.id).then(setHistory).catch(() => setHistory([])); }, [row.id]);

  const run = async (work, message) => {
    if (busy) return;
    setBusy(true); setError('');
    try { await work(); await onDone(message); onClose(); } catch (cause) { setError(errorText(t, cause)); } finally { setBusy(false); setConfirm(null); }
  };
  const approve = () => run(() => eventMembersApi.admin.review(row.id, { decision: 'APPROVED', ...(mapTo && mapTo !== row.section?.key ? { sectionKey: mapTo } : {}) }));
  const reject = () => { if (!reason.trim()) { setError(t.errors.EM_REASON); return; } run(() => eventMembersApi.admin.review(row.id, { decision: 'REJECTED', reason })); };
  const remove = () => { if (!reason.trim()) { setError(t.errors.EM_REASON); return; } setConfirm({ text: a.confirmRemove, action: () => run(() => eventMembersApi.admin.remove(row.id, reason)) }); };
  const patch = (body) => setConfirm({ text: a.confirmHide, action: () => run(() => eventMembersApi.admin.update(row.id, body)) });
  const save = () => run(() => eventMembersApi.admin.update(row.id, { ...form, sortOrder: Number(form.sortOrder) || 0, sectionKey: form.sectionKey && form.sectionKey !== row.section?.key ? form.sectionKey : undefined }));
  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    try { const { fileUrl } = await base44.integrations.Core.UploadPublicFile({ file }); setForm((f) => ({ ...f, photoUrl: fileUrl })); } catch (cause) { setError(cause.message); } finally { setBusy(false); }
  };
  const detail = [[a.cols[3], row.mobileDigits], [a.cols[4], row.email], [a.village, row.village], [a.area, row.area], [a.cols[7], eventName(row)], [a.created, fmtDate(row.createdAt, lang)],
    [a.mobileConsent, row.mobilePublic ? a.yes : a.no], [a.emailConsent, row.emailPublic ? a.yes : a.no], [a.cols[9], t.status[row.status]], [a.source, row.source],
    [a.linked, [row.membershipId, row.familyId, row.studentId].filter(Boolean).join(' · ') || '—'], [a.reason, row.rejectionReason]].filter(([, value]) => value);

  return <Dialog open onOpenChange={(value) => { if (!value) onClose(); }}>
    <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto rounded-2xl">
      <DialogHeader className="text-left"><DialogTitle>{a.details}</DialogTitle><DialogDescription>{row.name}</DialogDescription></DialogHeader>
      <div className="flex gap-4">
        {row.photoUrl ? <img src={row.photoUrl} alt="" className="h-28 w-24 rounded-xl object-cover" /> : <span className="flex h-28 w-24 items-center justify-center rounded-xl bg-muted">—</span>}
        <dl className="grid flex-1 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">{detail.map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="break-words font-medium">{value}</dd></div>)}</dl>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border pt-3">
        {row.status !== 'APPROVED' && row.status !== 'WITHDRAWN' && <button type="button" onClick={() => setMode('approve')} className="min-h-9 rounded-lg bg-emerald-700 px-3 text-xs font-semibold text-white">{a.approve}</button>}
        {['PENDING', 'APPROVED'].includes(row.status) && <button type="button" onClick={() => setMode('reject')} className="min-h-9 rounded-lg bg-red-700 px-3 text-xs font-semibold text-white">{a.reject}</button>}
        <button type="button" onClick={() => setMode('edit')} className="min-h-9 rounded-lg border border-border px-3 text-xs font-semibold">{a.edit}</button>
        <button type="button" onClick={() => patch({ showOnWebsite: !row.showOnWebsite })} className="min-h-9 rounded-lg border border-border px-3 text-xs font-semibold">{row.showOnWebsite ? a.hide : a.show}</button>
        {row.mobilePublic && <button type="button" onClick={() => patch({ mobilePublic: false })} className="min-h-9 rounded-lg border border-border px-3 text-xs font-semibold">{a.hideMobile}</button>}
        {row.emailPublic && <button type="button" onClick={() => patch({ emailPublic: false })} className="min-h-9 rounded-lg border border-border px-3 text-xs font-semibold">{a.hideEmail}</button>}
        {row.status === 'APPROVED' && <button type="button" onClick={() => setMode('remove')} className="min-h-9 rounded-lg border border-red-300 px-3 text-xs font-semibold text-red-800">{a.remove}</button>}
      </div>

      {mode === 'approve' && <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-sm">
        <label className="block font-semibold">{row.section ? a.section : a.mapTo}<select className={field} value={mapTo} onChange={(e) => setMapTo(e.target.value)}><option value="">—</option>{sections.filter((s) => s.status === 'ACTIVE').map((s) => <option key={s.key} value={s.key}>{s.heading}</option>)}</select></label>
        <button type="button" disabled={busy || !mapTo} onClick={() => setConfirm({ text: a.confirmApprove, action: approve })} className="min-h-10 rounded-lg bg-emerald-700 px-4 font-semibold text-white disabled:opacity-50">{a.approve}</button>
      </div>}
      {(mode === 'reject' || mode === 'remove') && <div className="space-y-2 rounded-xl border border-red-200 bg-red-50/60 p-3 text-sm">
        <label className="block font-semibold">{mode === 'reject' ? a.rejectReason : a.reason} *<textarea className={`${field} min-h-20 py-2`} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} /></label>
        <button type="button" disabled={busy} onClick={mode === 'reject' ? reject : remove} className="min-h-10 rounded-lg bg-red-700 px-4 font-semibold text-white disabled:opacity-50">{mode === 'reject' ? a.reject : a.remove}</button>
      </div>}
      {mode === 'edit' && <div className="grid gap-3 rounded-xl border border-border p-3 text-sm sm:grid-cols-2">
        {[['name', a.name], ['nameHi', a.nameHi], ['designation', a.designation], ['designationHi', a.designationHi], ['villageHi', a.villageHi]].map(([key, label]) => <label key={key} className="block font-semibold">{label}<input className={field} value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} /></label>)}
        <div><label htmlFor="em-edit-village" className="block font-semibold">{a.village}</label><VillageCombobox id="em-edit-village" hideLabel label={a.village} value={form.village} onChange={(v) => setForm((f) => ({ ...f, village: v }))} inputClassName={field} /></div>
        <label className="block font-semibold">{a.area}<input className={field} value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))} /></label>
        <label className="block font-semibold">{a.section}<select className={field} value={form.sectionKey} onChange={(e) => setForm((f) => ({ ...f, sectionKey: e.target.value }))}><option value="">—</option>{sections.map((s) => <option key={s.key} value={s.key}>{s.heading}</option>)}</select></label>
        <label className="block font-semibold">{a.order}<input type="number" min="0" className={field} value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} /></label>
        <label className="block font-semibold">{a.newPhoto}<input type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block text-xs" onChange={(e) => upload(e.target.files?.[0])} /></label>
        <div className="sm:col-span-2"><button type="button" disabled={busy} onClick={save} className="min-h-10 rounded-lg bg-maroon px-4 font-semibold text-cream disabled:opacity-50">{a.save}</button></div>
      </div>}
      {error && <p role="alert" className="rounded-lg bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}

      <div className="border-t border-border pt-3"><h3 className="text-sm font-semibold">{a.history}</h3>
        {history === null ? <Loader2 className="mt-2 h-4 w-4 animate-spin" /> : <ol className="mt-2 space-y-1.5 text-xs">{history.map((entry) => <li key={entry.id} className="flex flex-wrap gap-x-2"><span className="font-semibold">{entry.action}</span><span className="text-muted-foreground">{new Date(entry.createdAt).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN')}</span>{entry.remarks && <span>— {entry.remarks}</span>}{entry.changes && <span className="break-all text-muted-foreground">{Object.keys(entry.changes).join(', ')}</span>}</li>)}</ol>}
      </div>
    </DialogContent>
    <AlertDialog open={Boolean(confirm)} onOpenChange={(value) => { if (!value) setConfirm(null); }}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{a.confirm}</AlertDialogTitle><AlertDialogDescription>{confirm?.text}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>{a.cancel}</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={(e) => { e.preventDefault(); confirm?.action(); }}>{a.confirm}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
  </Dialog>;
}

function SectionsTab({ a, meta, onSaved, onError }) {
  const [events, setEvents] = useState([]);
  const [draft, setDraft] = useState({ label: '', labelHi: '', heading: '', headingHi: '', eventId: '' });
  const [busy, setBusy] = useState(false);
  useEffect(() => { base44.entities.Event.listAll('-date').then(setEvents).catch(() => setEvents([])); }, []);
  const save = async (work) => { if (busy) return; setBusy(true); try { await work(); await onSaved(); } catch (cause) { onError(cause); } finally { setBusy(false); } };
  return <div className="space-y-4">
    <div className="overflow-x-auto rounded-xl border border-border bg-card"><table className="w-full min-w-[48rem] text-sm">
      <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground"><tr>{[a.heading, a.label, a.event, a.accepting, a.active, a.approved, a.page_].map((col) => <th key={col} className="px-3 py-2">{col}</th>)}</tr></thead>
      <tbody className="divide-y divide-border">{meta.sections.map((section) => <tr key={section.id}>
        <td className="px-3 py-2 font-semibold">{section.heading}<span className="block text-xs font-normal text-muted-foreground">{section.headingHi}</span></td>
        <td className="px-3 py-2">{section.label}</td>
        <td className="px-3 py-2">{section.isCoreTeam ? '—' : <select aria-label={`${a.event}: ${section.heading}`} className="min-h-9 max-w-[16rem] rounded-lg border border-input bg-background px-2 text-sm" value={section.eventId || ''} disabled={busy} onChange={(e) => save(() => eventMembersApi.admin.updateSection(section.id, { eventId: e.target.value || null }))}>
          <option value="">{a.noEvent}</option>{events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}</select>}</td>
        <td className="px-3 py-2"><input type="checkbox" aria-label={`${a.accepting}: ${section.heading}`} checked={section.accepting} disabled={busy} onChange={(e) => save(() => eventMembersApi.admin.updateSection(section.id, { accepting: e.target.checked }))} /></td>
        <td className="px-3 py-2"><input type="checkbox" aria-label={`${a.active}: ${section.heading}`} checked={section.status === 'ACTIVE'} disabled={busy} onChange={(e) => save(() => eventMembersApi.admin.updateSection(section.id, { status: e.target.checked ? 'ACTIVE' : 'INACTIVE' }))} /></td>
        <td className="px-3 py-2">{section.approved} / {section.pending} {a.pending}</td>
        <td className="px-3 py-2"><a className="text-maroon underline" href={section.isCoreTeam ? '/core-team' : section.event?.slug ? `/events/${section.event.slug}` : `/teams/${section.key.toLowerCase()}`} target="_blank" rel="noopener noreferrer">{a.page_}</a></td>
      </tr>)}</tbody></table></div>
    <form className="grid gap-3 rounded-xl border border-border bg-card p-4 text-sm sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save(async () => { await eventMembersApi.admin.createSection({ ...draft, eventId: draft.eventId || null }); setDraft({ label: '', labelHi: '', heading: '', headingHi: '', eventId: '' }); }); }}>
      <h2 className="font-semibold sm:col-span-2">{a.newSection}</h2>
      {[['label', a.label], ['labelHi', a.labelHi], ['heading', a.heading], ['headingHi', a.headingHi]].map(([key, label]) => <label key={key} className="block font-semibold">{label}{['label', 'heading'].includes(key) && ' *'}<input className={field} required={['label', 'heading'].includes(key)} maxLength={150} value={draft[key]} onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))} /></label>)}
      <label className="block font-semibold">{a.event}<select className={field} value={draft.eventId} onChange={(e) => setDraft((d) => ({ ...d, eventId: e.target.value }))}><option value="">{a.noEvent}</option>{events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}</select></label>
      <div className="flex items-end"><button type="submit" disabled={busy} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-maroon px-4 font-semibold text-cream disabled:opacity-50"><Plus className="h-4 w-4" />{a.newSection}</button></div>
    </form>
  </div>;
}

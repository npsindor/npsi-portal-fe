import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpenText, Check, Download, Eye, History, IdCard, Loader2, Printer, RefreshCw, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import SearchBox from '@/components/admin/SearchBox';
import PdfPages from '@/components/sagun-cards/PdfPages';
import { sagunApi } from '@/api/sagunApi';
import { printBlob, sagunCardsApi, saveBlob } from '@/api/sagunCardsApi';
import { useLang } from '@/lib/i18n';

const LIST_TABS = { all: {}, boys: { category: 'GROOM' }, girls: { category: 'BRIDE' }, pending: { state: 'PENDING' }, approved: { state: 'APPROVED' }, rejected: { state: 'REJECTED' } };
const button = 'inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-semibold hover:bg-muted disabled:opacity-50';
const primary = 'inline-flex min-h-10 items-center gap-2 rounded-full bg-maroon px-4 text-sm font-semibold text-cream hover:bg-maroon/90 disabled:opacity-50';
const field = 'mt-1 min-h-10 w-full rounded-lg border border-input bg-background px-3 text-sm';
const LARGE_BOOKLET = 50;

const copy = {
  en: {
    title: 'Shagun Digital Cards',
    sub: 'Every submitted Shagun Bandhan profile gets a digital card. Approve profiles, preview and print cards, and build the A4 marriage biodata booklet.',
    tabs: { overview: 'Overview', all: 'All profiles', boys: 'Boys', girls: 'Girls', pending: 'Pending approval', approved: 'Approved', rejected: 'Rejected', booklet: 'Printable booklet', history: 'Print history' },
    stats: { total: 'Profiles', grooms: 'Boys', brides: 'Girls', pending: 'Pending', approved: 'Approved', rejected: 'Rejected', selected: 'Selected for booklet', booklets: 'Booklets generated' },
    flow: ['A boy or girl submits the Shagun Bandhan form', 'The profile appears here as Pending', 'Approve it after review', 'Preview and print the digital card', 'Select approved cards and generate the A4 booklet'],
    state: { PENDING: 'Pending', APPROVED: 'Approved', REJECTED: 'Rejected', INACTIVE: 'Inactive' },
    selectedBadge: 'Selected for booklet', published: 'Published', boy: 'Boy', girl: 'Girl',
    reasons: { NOT_APPROVED: 'Not approved yet', PROFILES_HIDDEN: 'Profile display is switched off in Shagun settings', PRIVATE_PROFILE: 'Owner kept the profile private', NO_MEMBER: 'Not linked to a family member', OWNER_INACTIVE: "Owner's account is inactive", CONSENT_MISSING: 'A required consent is missing', NO_PHOTO: 'No photograph' },
    notForBooklet: 'Not for booklet', contactHidden: 'Father/mobile/DOB hidden (no consent)',
    preview: 'Preview card', print: 'Print', download: 'Download PDF', approve: 'Approve', reject: 'Reject', edit: 'Edit profile', select: 'Select for booklet',
    rejectPrompt: 'Reason for rejection (sent to the family):', search: 'Name or Shagun profile ID', place: 'Village / city', sortName: 'Sort: name (A–Z)', sortDate: 'Sort: newest first',
    selectedOnly: 'Selected only', none: 'No profiles here.', refresh: 'Refresh', selectShown: 'Select all shown', clearShown: 'Clear shown',
    bookletTitle: 'Booklet title', edition: 'Edition', contactLine: 'Extra contact line for the closing page (optional)', layout: 'Cards per A4 page',
    layouts: { 1: '1 – large', 2: '2 – recommended', 4: '4 – compact' }, grouping: 'Order', separate: 'Boys and girls in separate sections', together: 'Boys and girls together',
    include: 'Include', cover: 'Cover page', index: 'Index page', closing: 'Closing page', who: 'Profiles', whoAll: 'Boys and girls', whoBoys: 'Boys only', whoGirls: 'Girls only',
    sortBy: 'Sort cards', byName: 'By name (A–Z)', byDate: 'By registration date',
    inBooklet: (n) => `${n} selected profile${n === 1 ? '' : 's'} will be printed`, previewBooklet: 'Preview booklet', generate: 'Generate & save booklet',
    confirmLarge: (n, p) => `Generate a booklet of ${n} profiles (${p} pages)? This can take a little while.`, confirm: (n, p) => `Generate and save a booklet of ${n} profiles (${p} pages)?`,
    generated: 'Booklet generated and saved to Print history.', pages: 'pages', noneSelected: 'Select approved profiles for the booklet first (tick the boxes in the list).',
    historyCols: ['Generated', 'Title / edition', 'Profiles', 'Pages', 'Layout', 'By', ''], noHistory: 'No booklet generated yet.', perPage: 'per page',
    errors: { SAGUN_CARD_NOT_ELIGIBLE: 'One of the profiles can no longer be printed (not approved, private, consent or photo missing). Refresh and try again.', SAGUN_REMARKS_REQUIRED: 'A reason is required to reject.', SAGUN_STATE: 'This profile is not in a state that allows this action.', 'SAGUN_FIELD:photoFileId': 'The profile has no photograph, so it cannot be approved.' },
    error: 'Something went wrong. Please try again.',
  },
  hi: {
    title: 'शगुन डिजिटल कार्ड',
    sub: 'हर जमा किए गए शगुन बंधन परिचय का डिजिटल कार्ड बनता है। परिचय स्वीकृत करें, कार्ड देखें व प्रिंट करें और A4 वैवाहिक परिचय पुस्तिका बनाएँ।',
    tabs: { overview: 'सारांश', all: 'सभी परिचय', boys: 'युवक', girls: 'युवती', pending: 'स्वीकृति लंबित', approved: 'स्वीकृत', rejected: 'अस्वीकृत', booklet: 'प्रिंट पुस्तिका', history: 'प्रिंट इतिहास' },
    stats: { total: 'कुल परिचय', grooms: 'युवक', brides: 'युवती', pending: 'लंबित', approved: 'स्वीकृत', rejected: 'अस्वीकृत', selected: 'पुस्तिका हेतु चयनित', booklets: 'बनाई गई पुस्तिकाएँ' },
    flow: ['युवक/युवती शगुन बंधन फ़ॉर्म जमा करते हैं', 'परिचय यहाँ "लंबित" में दिखता है', 'जाँच के बाद स्वीकृत करें', 'डिजिटल कार्ड देखें और प्रिंट करें', 'स्वीकृत कार्ड चुनकर A4 पुस्तिका बनाएँ'],
    state: { PENDING: 'लंबित', APPROVED: 'स्वीकृत', REJECTED: 'अस्वीकृत', INACTIVE: 'निष्क्रिय' },
    selectedBadge: 'पुस्तिका हेतु चयनित', published: 'प्रकाशित', boy: 'युवक', girl: 'युवती',
    reasons: { NOT_APPROVED: 'अभी स्वीकृत नहीं', PROFILES_HIDDEN: 'शगुन सेटिंग में परिचय दिखाना बंद है', PRIVATE_PROFILE: 'परिचय निजी रखा गया है', NO_MEMBER: 'परिवार सदस्य से जुड़ा नहीं', OWNER_INACTIVE: 'खाता निष्क्रिय है', CONSENT_MISSING: 'आवश्यक सहमति नहीं है', NO_PHOTO: 'फोटो नहीं है' },
    notForBooklet: 'पुस्तिका हेतु नहीं', contactHidden: 'पिता/मोबाइल/जन्मतिथि छिपी (सहमति नहीं)',
    preview: 'कार्ड देखें', print: 'प्रिंट', download: 'PDF डाउनलोड', approve: 'स्वीकृत करें', reject: 'अस्वीकृत करें', edit: 'परिचय संपादित करें', select: 'पुस्तिका हेतु चुनें',
    rejectPrompt: 'अस्वीकृति का कारण (परिवार को भेजा जाएगा):', search: 'नाम या शगुन प्रोफ़ाइल आईडी', place: 'ग्राम / शहर', sortName: 'क्रम: नाम (अ–ज्ञ)', sortDate: 'क्रम: नवीनतम पहले',
    selectedOnly: 'केवल चयनित', none: 'यहाँ कोई परिचय नहीं।', refresh: 'ताज़ा करें', selectShown: 'दिख रहे सभी चुनें', clearShown: 'दिख रहे हटाएँ',
    bookletTitle: 'पुस्तिका का शीर्षक', edition: 'संस्करण', contactLine: 'अंतिम पृष्ठ हेतु अतिरिक्त संपर्क (वैकल्पिक)', layout: 'प्रति A4 पृष्ठ कार्ड',
    layouts: { 1: '1 – बड़ा', 2: '2 – अनुशंसित', 4: '4 – छोटा' }, grouping: 'क्रम', separate: 'युवक और युवती अलग खंड में', together: 'युवक और युवती साथ में',
    include: 'शामिल करें', cover: 'मुख पृष्ठ', index: 'अनुक्रमणिका', closing: 'अंतिम पृष्ठ', who: 'परिचय', whoAll: 'युवक और युवती', whoBoys: 'केवल युवक', whoGirls: 'केवल युवती',
    sortBy: 'कार्ड का क्रम', byName: 'नाम से (अ–ज्ञ)', byDate: 'पंजीकरण तिथि से',
    inBooklet: (n) => `${n} चयनित परिचय प्रिंट होंगे`, previewBooklet: 'पुस्तिका देखें', generate: 'पुस्तिका बनाएँ व सहेजें',
    confirmLarge: (n, p) => `${n} परिचयों (${p} पृष्ठ) की पुस्तिका बनाएँ? इसमें थोड़ा समय लग सकता है।`, confirm: (n, p) => `${n} परिचयों (${p} पृष्ठ) की पुस्तिका बनाकर सहेजें?`,
    generated: 'पुस्तिका बन गई और प्रिंट इतिहास में सहेजी गई।', pages: 'पृष्ठ', noneSelected: 'पहले सूची में बॉक्स टिक करके स्वीकृत परिचय पुस्तिका हेतु चुनें।',
    historyCols: ['तिथि', 'शीर्षक / संस्करण', 'परिचय', 'पृष्ठ', 'लेआउट', 'द्वारा', ''], noHistory: 'अभी कोई पुस्तिका नहीं बनी।', perPage: 'प्रति पृष्ठ',
    errors: { SAGUN_CARD_NOT_ELIGIBLE: 'कोई परिचय अब प्रिंट योग्य नहीं है (स्वीकृत नहीं, निजी, सहमति या फोटो नहीं)। ताज़ा करके फिर प्रयास करें।', SAGUN_REMARKS_REQUIRED: 'अस्वीकृत करने के लिए कारण आवश्यक है।', SAGUN_STATE: 'इस स्थिति में यह कार्य संभव नहीं है।', 'SAGUN_FIELD:photoFileId': 'परिचय में फोटो नहीं है, इसलिए स्वीकृत नहीं हो सकता।' },
    error: 'कुछ गलत हुआ। कृपया फिर प्रयास करें।',
  },
};
const dateText = (value, lang) => (value ? new Date(value).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
const stateTone = { PENDING: 'bg-amber-100 text-amber-900', APPROVED: 'bg-emerald-100 text-emerald-900', REJECTED: 'bg-rose-100 text-rose-900', INACTIVE: 'bg-slate-200 text-slate-700' };
const Badge = ({ className = '', children }) => <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ${className}`}>{children}</span>;

function Thumb({ id, alt }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!id) return undefined;
    let alive = true;
    let objectUrl = '';
    sagunApi.sagun.file(id).then((blob) => { objectUrl = URL.createObjectURL(blob); if (alive) setUrl(objectUrl); }).catch(() => {});
    return () => { alive = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [id]);
  return <span className="block h-16 w-12 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border">{url && <img src={url} alt={alt} className="h-full w-full object-cover" />}</span>;
}

export default function AdminSagunCards() {
  const { lang } = useLang();
  const t = copy[lang] || copy.en;
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [cards, setCards] = useState(null);
  const [filters, setFilters] = useState({ q: '', place: '', sort: 'date', selectedOnly: false });
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const errorText = useCallback((cause) => t.errors[cause?.message] || t.error, [t]);
  const reportError = useCallback((cause) => setError(errorText(cause)), [errorText]);
  const finished = useCallback((text) => { setMessage(text); }, []);

  const load = useCallback(async () => {
    setError('');
    try {
      const [nextStats, nextCards] = await Promise.all([sagunCardsApi.stats(), sagunCardsApi.list({ sort: 'date' })]);
      setStats(nextStats);
      setCards(Array.isArray(nextCards) ? nextCards : []);
    } catch (cause) { setError(errorText(cause)); setCards([]); }
  }, [errorText]);
  useEffect(() => { load(); }, [load]);

  const run = async (key, work, done) => {
    setBusy(key); setError(''); setMessage('');
    try { await work(); if (done) setMessage(done); await load(); } catch (cause) { setError(errorText(cause)); } finally { setBusy(''); }
  };
  const openCard = async (card) => {
    setPreview({ card, blob: null });
    try { const { blob } = await sagunCardsApi.cardPdf(card.profileId); setPreview({ card, blob }); } catch (cause) { setPreview(null); setError(errorText(cause)); }
  };
  const printCard = (card) => run(`print-${card.profileId}`, async () => printBlob((await sagunCardsApi.cardPdf(card.profileId)).blob));
  const approve = (card) => run(`approve-${card.profileId}`, () => sagunApi.sagun.review(card.profileId, 'APPROVED', ''));
  const reject = (card) => { const notes = window.prompt(t.rejectPrompt); if (notes?.trim()) run(`reject-${card.profileId}`, () => sagunApi.sagun.review(card.profileId, 'REJECTED', notes.trim())); };
  const toggle = (ids, selected) => run(`select-${ids.join(',')}`, () => sagunCardsApi.select(ids, selected));

  const shown = useMemo(() => {
    if (!cards) return [];
    const scope = LIST_TABS[tab] || (tab === 'booklet' ? { eligible: true } : {});
    const q = filters.q.trim().toLocaleLowerCase('hi');
    const place = filters.place.trim().toLocaleLowerCase('hi');
    const list = cards.filter((card) => (!scope.category || card.category === scope.category) && (!scope.state || card.state === scope.state) && (!scope.eligible || card.bookletEligible)
      && (!filters.selectedOnly || card.selected) && (!q || card.name.toLocaleLowerCase('hi').includes(q) || card.profileCode.toLowerCase().includes(q)) && (!place || card.place.toLocaleLowerCase('hi').includes(place)));
    return filters.sort === 'name' ? [...list].sort((a, b) => a.name.localeCompare(b.name, 'hi')) : list;
  }, [cards, tab, filters]);

  const filterBar = <div className="flex flex-wrap items-end gap-2">
    <div className="min-w-[14rem] flex-1"><SearchBox value={filters.q} onChange={(q) => setFilters((current) => ({ ...current, q }))} placeholder={t.search} /></div>
    <input aria-label={t.place} placeholder={t.place} className="min-h-10 w-40 rounded-lg border border-input bg-background px-3 text-sm" value={filters.place} onChange={(event) => setFilters((current) => ({ ...current, place: event.target.value }))} />
    <select aria-label={t.sortBy} className="min-h-10 rounded-lg border border-input bg-background px-3 text-sm" value={filters.sort} onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value }))}><option value="date">{t.sortDate}</option><option value="name">{t.sortName}</option></select>
    <label className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" checked={filters.selectedOnly} onChange={(event) => setFilters((current) => ({ ...current, selectedOnly: event.target.checked }))} />{t.selectedOnly}</label>
  </div>;

  const eligibleShown = shown.filter((card) => card.bookletEligible);
  const bulk = <div className="flex flex-wrap gap-2">
    <button type="button" className={button} disabled={!!busy || !eligibleShown.some((card) => !card.selected)} onClick={() => toggle(eligibleShown.filter((card) => !card.selected).map((card) => card.profileId), true)}><Check className="h-3.5 w-3.5" />{t.selectShown}</button>
    <button type="button" className={button} disabled={!!busy || !shown.some((card) => card.selected)} onClick={() => toggle(shown.filter((card) => card.selected).map((card) => card.profileId), false)}><X className="h-3.5 w-3.5" />{t.clearShown}</button>
  </div>;

  const list = <ul className="mt-4 space-y-3">
    {shown.map((card) => <li key={card.profileId} className="flex flex-wrap items-start gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-nowrap">
      <label className="mt-1 flex items-center" title={card.bookletEligible ? t.select : t.reasons[card.notEligibleReason]}>
        <input type="checkbox" aria-label={`${t.select}: ${card.name}`} className="h-5 w-5 accent-[#7a1022]" disabled={!!busy || (!card.bookletEligible && !card.selected)} checked={card.selected} onChange={(event) => toggle([card.profileId], event.target.checked)} />
      </label>
      <Thumb id={card.photoFileId} alt={card.name} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{card.name} <span className="text-xs font-normal text-muted-foreground">· {card.profileCode}</span></p>
        <p className="text-xs text-muted-foreground">{card.category === 'BRIDE' ? t.girl : t.boy}{card.place ? ` · ${card.place}` : ''}{card.submittedAt ? ` · ${dateText(card.submittedAt, lang)}` : ''}</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <Badge className={stateTone[card.state]}>{t.state[card.state]}</Badge>
          {card.selected && <Badge className="bg-maroon text-cream">{t.selectedBadge}</Badge>}
          {card.lastPublishedAt && <Badge className="bg-gold/25 text-gold-dark">{t.published}</Badge>}
          {card.state === 'APPROVED' && !card.bookletEligible && <Badge className="bg-muted text-muted-foreground">{t.notForBooklet}: {t.reasons[card.notEligibleReason] || card.notEligibleReason}</Badge>}
          {!card.contactConsent && <Badge className="bg-muted text-muted-foreground">{t.contactHidden}</Badge>}
        </div>
        {card.reviewNotes && <p className="mt-1 text-xs text-destructive">{card.reviewNotes}</p>}
      </div>
      <div className="flex w-full flex-wrap gap-1.5 sm:w-auto sm:max-w-[22rem] sm:justify-end">
        <button type="button" className={button} onClick={() => openCard(card)}><Eye className="h-3.5 w-3.5" />{t.preview}</button>
        <button type="button" className={button} disabled={!!busy} onClick={() => printCard(card)}><Printer className="h-3.5 w-3.5" />{t.print}</button>
        {['SUBMITTED', 'UNDER_REVIEW'].includes(card.profileStatus) && <button type="button" className={`${button} border-emerald-300 text-emerald-800`} disabled={!!busy} onClick={() => approve(card)}>{busy === `approve-${card.profileId}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}{t.approve}</button>}
        {['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(card.profileStatus) && <button type="button" className={`${button} text-destructive`} disabled={!!busy} onClick={() => reject(card)}><X className="h-3.5 w-3.5" />{t.reject}</button>}
        <Link to="/admin/sagun" className={button}>{t.edit}</Link>
      </div>
    </li>)}
    {cards && shown.length === 0 && <li className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{t.none}</li>}
  </ul>;

  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-maroon"><IdCard className="h-6 w-6" />{t.title}</h1><p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t.sub}</p></div>
      <button type="button" className={button} onClick={load}><RefreshCw className="h-3.5 w-3.5" />{t.refresh}</button>
    </header>
    <nav aria-label={t.title} className="-mx-1 flex gap-1 overflow-x-auto pb-1">
      {Object.entries(t.tabs).map(([key, label]) => <button key={key} type="button" aria-pressed={tab === key} onClick={() => setTab(key)} className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold ${tab === key ? 'bg-maroon text-cream' : 'text-muted-foreground hover:bg-muted'}`}>{label}</button>)}
    </nav>
    {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}
    {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
    {!cards && <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-maroon" /></div>}

    {cards && tab === 'overview' && <Overview t={t} stats={stats} onOpen={setTab} />}
    {cards && LIST_TABS[tab] && <section>{filterBar}<div className="mt-3">{bulk}</div>{list}</section>}
    {cards && tab === 'booklet' && <Booklet t={t} cards={cards} lang={lang} busy={busy} setBusy={setBusy} onError={reportError} onDone={(text) => { finished(text); load(); }}>{filterBar}<div className="mt-3">{bulk}</div>{list}</Booklet>}
    {cards && tab === 'history' && <PrintHistory t={t} lang={lang} onError={reportError} />}

    <Dialog open={Boolean(preview)} onOpenChange={(open) => { if (!open) setPreview(null); }}>
      <DialogContent className="max-h-[92dvh] max-w-4xl overflow-y-auto">
        <DialogTitle>{preview?.card.name} · {preview?.card.profileCode}</DialogTitle>
        <DialogDescription>{t.preview}</DialogDescription>
        {preview?.blob ? <PdfPages blob={preview.blob} label={preview.card.profileCode} /> : <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-maroon" /></div>}
        <div className="flex flex-wrap gap-2">
          <button type="button" className={primary} disabled={!preview?.blob} onClick={() => printBlob(preview.blob)}><Printer className="h-4 w-4" />{t.print}</button>
          <button type="button" className={button} disabled={!preview?.blob} onClick={() => saveBlob(preview.blob, `${preview.card.profileCode}.pdf`)}><Download className="h-3.5 w-3.5" />{t.download}</button>
        </div>
      </DialogContent>
    </Dialog>
  </div>;
}

function Overview({ t, stats, onOpen }) {
  const tiles = [['total', 'all'], ['grooms', 'boys'], ['brides', 'girls'], ['pending', 'pending'], ['approved', 'approved'], ['rejected', 'rejected'], ['selected', 'booklet'], ['booklets', 'history']];
  return <section className="space-y-6">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map(([key, target]) => <button key={key} type="button" onClick={() => onOpen(target)} className="rounded-2xl border border-border bg-card p-4 text-left hover:border-gold/60 hover:bg-muted/40">
        <span className="block font-display text-3xl font-bold text-maroon">{stats?.[key] ?? '—'}</span>
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.stats[key]}</span>
      </button>)}
    </div>
    <ol className="grid gap-3 md:grid-cols-5">
      {t.flow.map((step, index) => <li key={step} className="rounded-2xl border border-gold/30 bg-gold/5 p-4 text-sm"><span className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-maroon text-xs font-bold text-cream">{index + 1}</span>{step}</li>)}
    </ol>
  </section>;
}

function Booklet({ t, cards, lang, busy, setBusy, onError, onDone, children }) {
  const [options, setOptions] = useState({ title: 'शगुन बंधन – वैवाहिक परिचय पुस्तिका', edition: '', contactLine: '', layout: 2, grouping: 'SEPARATE', includeCover: true, includeIndex: true, includeClosing: true, sort: 'name', who: 'ALL' });
  const [pdf, setPdf] = useState(null);
  const [pageCount, setPageCount] = useState(null);
  const set = (key) => (event) => setOptions((current) => ({ ...current, [key]: event.target.type === 'checkbox' ? event.target.checked : key === 'layout' ? Number(event.target.value) : event.target.value }));
  const chosen = cards.filter((card) => card.selected && card.bookletEligible && (options.who === 'ALL' || card.category === options.who));
  const body = () => {
    const { who: _who, ...rest } = options;
    return { ...rest, profileIds: chosen.map((card) => card.profileId) };
  };
  const previewBooklet = async () => {
    setBusy('preview'); setPdf(null); setPageCount(null);
    try { const { blob, pages } = await sagunCardsApi.bookletPreview(body()); setPdf({ blob, pages, saved: false }); } catch (cause) { onError(cause); } finally { setBusy(''); }
  };
  const generate = async () => {
    setBusy('generate');
    try {
      const plan = await sagunCardsApi.bookletPlan(body());
      if (!window.confirm((plan.totalProfiles > LARGE_BOOKLET ? t.confirmLarge : t.confirm)(plan.totalProfiles, plan.totalPages))) return;
      const saved = await sagunCardsApi.generateBooklet(body());
      const { blob } = await sagunCardsApi.historyPdf(saved.id);
      setPdf({ blob, pages: saved.totalPages, saved: true, id: saved.id });
      onDone(t.generated);
    } catch (cause) { onError(cause); } finally { setBusy(''); }
  };
  return <section className="space-y-5">
    <div className="grid gap-4 rounded-2xl border border-gold/30 bg-card p-4 lg:grid-cols-3">
      <label className="text-sm font-semibold">{t.bookletTitle}<input className={field} maxLength={120} value={options.title} onChange={set('title')} /></label>
      <label className="text-sm font-semibold">{t.edition}<input className={field} maxLength={60} placeholder={lang === 'hi' ? 'जैसे: प्रथम संस्करण' : 'e.g. First edition'} value={options.edition} onChange={set('edition')} /></label>
      <label className="text-sm font-semibold">{t.contactLine}<input className={field} maxLength={200} value={options.contactLine} onChange={set('contactLine')} /></label>
      <fieldset className="text-sm"><legend className="font-semibold">{t.layout}</legend><div className="mt-1 flex flex-wrap gap-3">{[1, 2, 4].map((value) => <label key={value} className="flex items-center gap-1.5"><input type="radio" name="layout" value={value} checked={options.layout === value} onChange={set('layout')} />{t.layouts[value]}</label>)}</div></fieldset>
      <label className="text-sm font-semibold">{t.grouping}<select className={field} value={options.grouping} onChange={set('grouping')}><option value="SEPARATE">{t.separate}</option><option value="TOGETHER">{t.together}</option></select></label>
      <label className="text-sm font-semibold">{t.who}<select className={field} value={options.who} onChange={set('who')}><option value="ALL">{t.whoAll}</option><option value="GROOM">{t.whoBoys}</option><option value="BRIDE">{t.whoGirls}</option></select></label>
      <label className="text-sm font-semibold">{t.sortBy}<select className={field} value={options.sort} onChange={set('sort')}><option value="name">{t.byName}</option><option value="date">{t.byDate}</option></select></label>
      <fieldset className="text-sm lg:col-span-2"><legend className="font-semibold">{t.include}</legend><div className="mt-1 flex flex-wrap gap-4">{[['includeCover', t.cover], ['includeIndex', t.index], ['includeClosing', t.closing]].map(([key, label]) => <label key={key} className="flex items-center gap-1.5"><input type="checkbox" checked={options[key]} onChange={set(key)} />{label}</label>)}</div></fieldset>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-sm font-semibold text-maroon">{t.inBooklet(chosen.length)}</p>
      <button type="button" className={button} disabled={!chosen.length || !!busy} onClick={previewBooklet}>{busy === 'preview' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}{t.previewBooklet}</button>
      <button type="button" className={primary} disabled={!chosen.length || !!busy} onClick={generate}>{busy === 'generate' ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpenText className="h-4 w-4" />}{t.generate}</button>
      {pdf && <><button type="button" className={button} onClick={() => printBlob(pdf.blob)}><Printer className="h-3.5 w-3.5" />{t.print}</button><button type="button" className={button} onClick={() => saveBlob(pdf.blob, 'sagun-booklet.pdf')}><Download className="h-3.5 w-3.5" />{t.download}</button></>}
    </div>
    {!chosen.length && <p className="text-sm text-muted-foreground">{t.noneSelected}</p>}
    {pdf && <div className="rounded-2xl border border-border bg-muted/40 p-3 sm:p-5"><p className="mb-3 text-sm font-semibold">{pageCount ?? pdf.pages ?? '…'} {t.pages}</p><div className="mx-auto max-w-2xl"><PdfPages blob={pdf.blob} label={t.tabs.booklet} onPages={setPageCount} /></div></div>}
    {children}
  </section>;
}

function PrintHistory({ t, lang, onError }) {
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState('');
  useEffect(() => { sagunCardsApi.history().then((value) => setRows(Array.isArray(value) ? value : [])).catch((cause) => { setRows([]); onError(cause); }); }, [onError]);
  const fetchPdf = async (row, action) => {
    setBusy(row.id);
    try { const { blob } = await sagunCardsApi.historyPdf(row.id); if (action === 'print') printBlob(blob); else saveBlob(blob, `sagun-booklet-${row.generatedAt.slice(0, 10)}.pdf`); } catch (cause) { onError(cause); } finally { setBusy(''); }
  };
  if (!rows) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-maroon" /></div>;
  if (!rows.length) return <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground"><History className="mx-auto mb-2 h-6 w-6" />{t.noHistory}</p>;
  return <div className="overflow-x-auto rounded-2xl border border-border">
    <table className="w-full min-w-[44rem] text-sm">
      <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground"><tr>{t.historyCols.map((label, index) => <th key={index} className="px-3 py-2">{label}</th>)}</tr></thead>
      <tbody>{rows.map((row) => <tr key={row.id} className="border-t border-border">
        <td className="px-3 py-2">{dateText(row.generatedAt, lang)}</td>
        <td className="px-3 py-2"><span className="font-semibold">{row.title}</span>{row.edition ? <span className="block text-xs text-muted-foreground">{row.edition}</span> : null}</td>
        <td className="px-3 py-2">{row.totalProfiles}</td>
        <td className="px-3 py-2">{row.totalPages}</td>
        <td className="px-3 py-2">{row.cardLayout} {t.perPage}</td>
        <td className="px-3 py-2">{row.generatedByName || '—'}</td>
        <td className="px-3 py-2"><div className="flex gap-1.5">{row.hasPdf && <><button type="button" className={button} disabled={busy === row.id} onClick={() => fetchPdf(row, 'download')}><Download className="h-3.5 w-3.5" />PDF</button><button type="button" className={button} disabled={busy === row.id} onClick={() => fetchPdf(row, 'print')}><Printer className="h-3.5 w-3.5" />{t.print}</button></>}</div></td>
      </tr>)}</tbody>
    </table>
  </div>;
}

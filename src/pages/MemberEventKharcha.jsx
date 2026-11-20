import React from 'react';
import { base44 } from '@/api/base44Client';
import { ArrowLeft } from 'lucide-react';
import FinanceStatement from '@/components/finance/FinanceStatement';
import { useLang } from '@/lib/i18n';
import { localizedText } from '@/lib/utils';
import SuggestSearchInput from '@/components/SuggestSearchInput';
import { suggestValues } from '@/lib/search-suggestions';

const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(n || 0));
const dt = (value, lang) => value ? new Date(value).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN') : '—';

const COPY = {
  en: {
    title: 'Event Kharcha', sub: 'Transparent details of approved contributions and expenses', loadError: 'Could not load event finances.', loading: 'Loading…',
    search: 'Search events', event: 'Event', totalCollection: 'Total contributions', totalExpenses: 'Total expenses', balance: 'Balance', action: 'Action', view: 'View',
    noEvents: 'No published events found.', allEvents: 'All events', contributors: 'Contributors', villages: 'Villages',
    contributionsTab: 'Sahyog Rashi (contributions)', expensesTab: 'Event Kharcha (expenses)',
    name: 'Name', village: 'Village', mobile: 'Mobile', amount: 'Amount', mode: 'Payment', date: 'Date',
    category: 'Category', details: 'Details', vendor: 'Vendor', receipt: 'Receipt', viewReceipt: 'View receipt',
    noContributions: 'No approved contributions yet.', noExpenses: 'No approved expenses yet.',
    note: 'Contributions include approved entries only. Only authorised administrators can see the roster.',
  },
  hi: {
    title: 'कार्यक्रम खर्च', sub: 'स्वीकृत सहयोग राशि और खर्च की पारदर्शी जानकारी', loadError: 'कार्यक्रम वित्त लोड नहीं हो सका।', loading: 'लोड हो रहा है…',
    search: 'कार्यक्रम खोजें', event: 'कार्यक्रम', totalCollection: 'कुल सहयोग', totalExpenses: 'कुल खर्च', balance: 'शेष राशि', action: 'कार्रवाई', view: 'देखें',
    noEvents: 'कोई प्रकाशित कार्यक्रम नहीं मिला।', allEvents: 'सभी कार्यक्रम', contributors: 'सहयोगदाता', villages: 'गाँव',
    contributionsTab: 'सहयोग राशि', expensesTab: 'कार्यक्रम खर्च',
    name: 'नाम', village: 'गाँव', mobile: 'मोबाइल', amount: 'राशि', mode: 'भुगतान', date: 'तिथि',
    category: 'श्रेणी', details: 'विवरण', vendor: 'विक्रेता', receipt: 'रसीद', viewReceipt: 'रसीद देखें',
    noContributions: 'अभी स्वीकृत सहयोग प्रविष्टियाँ नहीं हैं।', noExpenses: 'अभी स्वीकृत खर्च प्रविष्टियाँ नहीं हैं।',
    note: 'सहयोग राशि में केवल स्वीकृत प्रविष्टियाँ शामिल हैं। रोस्टर केवल अधिकृत व्यवस्थापक देख सकते हैं।',
  },
};

export default function MemberEventKharcha() {
  const { lang } = useLang();
  const t = COPY[lang] || COPY.en;
  const [events, setEvents] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [detail, setDetail] = React.useState(null);
  const [query, setQuery] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const refresh = React.useCallback(async () => {
    setLoading(true); setError('');
    try { const rows = await base44.eventFinance.list(); setEvents(rows); if (selected) setDetail(await base44.eventFinance.detail(selected)); }
    catch (e) { setError(e.message || COPY[lang]?.loadError || COPY.en.loadError); }
    finally { setLoading(false); }
  }, [selected, lang]);
  React.useEffect(() => { refresh(); }, [refresh]);
  const open = async id => { setSelected(id); setLoading(true); setError(''); try { setDetail(await base44.eventFinance.detail(id)); } catch (e) { setError(e.message); } finally { setLoading(false); } };
  const shown = events.filter(e => `${e.title} ${e.titleHi || ''} ${e.venue || ''}`.toLowerCase().includes(query.toLowerCase()));
  if (loading && !events.length && !detail) return <div className="p-8 text-center">{t.loading}</div>;
  return <div className="space-y-5">
    <header><h1 className="font-display text-3xl font-semibold text-maroon">{t.title}</h1><p className="mt-1 text-sm text-muted-foreground">{t.sub}</p></header>
    {error && <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</div>}
    {!selected ? <>
      <SuggestSearchInput className="md:max-w-sm" value={query} onChange={setQuery} placeholder={t.search} ariaLabel={t.search} icon={false} inputClassName="w-full rounded-xl border bg-card px-4 py-3" suggestions={suggestValues(events, lang === 'hi' ? ['titleHi', 'title', 'venue'] : ['title', 'venue'], query)} />
      {loading ? <p>{t.loading}</p> : <div className="overflow-x-auto rounded-2xl border bg-card"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-muted/60"><tr>{[t.event, t.totalCollection, t.totalExpenses, t.balance, t.action].map(x => <th key={x} className="p-3">{x}</th>)}</tr></thead><tbody>{shown.map((e, i) => <tr className="border-t" key={e.id}><td className="p-3"><span className="mr-2 text-muted-foreground">{i + 1}.</span><b>{localizedText(e, 'title', lang)}</b><div className="text-xs text-muted-foreground">{dt(e.date, lang)} · {localizedText(e, 'venue', lang) || '—'}</div></td><td className="p-3">{money(e.totalCollection)}</td><td className="p-3">{money(e.totalExpenses)}</td><td className="p-3 font-semibold">{money(e.remainingBalance)}</td><td className="p-3"><button onClick={() => open(e.id)} className="rounded-lg bg-maroon px-4 py-2 text-white">{t.view}</button></td></tr>)}{!shown.length && <tr><td className="p-8 text-center text-muted-foreground" colSpan="5">{t.noEvents}</td></tr>}</tbody></table></div>}
    </> : <>
      <button onClick={() => { setSelected(null); setDetail(null); }} className="inline-flex items-center gap-2 text-sm font-medium text-maroon"><ArrowLeft size={16} /> {t.allEvents}</button>
      {detail && <>
        <div className="overflow-hidden rounded-2xl border bg-card">{detail.event.bannerUrl && <img src={detail.event.bannerUrl} alt="" className="h-44 w-full object-cover" />}<div className="p-5"><h2 className="font-display text-2xl font-semibold text-maroon">{localizedText(detail.event, 'title', lang)}</h2><p className="mt-1 text-sm text-muted-foreground">{dt(detail.event.date, lang)} · {localizedText(detail.event, 'venue', lang) || '—'}</p><p className="mt-3 text-sm">{localizedText(detail.event, 'description', lang)}</p></div></div>
        <FinanceStatement detail={detail} lang={lang} />
      </>}
    </>}
  </div>;
}

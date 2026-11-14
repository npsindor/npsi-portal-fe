import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useLang } from '@/lib/i18n';
import { usePublicCopy } from '@/lib/public-copy';
import { services, careers, transportation, medical } from '@/lib/community-content';
import { demoListings, demoText } from '@/lib/community-demo';

const inputClass = 'mt-2 min-h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base';
const buttonClass = 'inline-flex min-h-11 items-center justify-center rounded-lg bg-maroon px-4 py-2 text-sm font-semibold text-cream disabled:opacity-60';
const secondaryClass = 'inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium';
const categoryOptions = {
  transportation: transportation.map(([id, label]) => [id, label]),
  medical: medical.map(([id, label]) => [id, label]),
  services: services.map(([id, label]) => [id, label]),
  careers: careers.map(([id, label]) => [id, label]),
  sagun: [['bride', 'Bride Profiles'], ['groom', 'Groom Profiles']],
  events: [['garba', 'Maa Na Garba'], ['cultural', 'Cultural Programs']],
  news: [['notices', 'Important Notices'], ['community', 'Community News'], ['greetings', 'Festival Greetings']],
};

export function DemoNotice() {
  const c = usePublicCopy();
  return <aside className="mb-6 rounded-xl border border-gold/50 bg-gold/10 p-4 text-sm leading-relaxed"><strong className="block">{c('Demo workspace')}</strong><p className="mt-1">{c('Browse examples and try the forms. All sample listings are fictional. Demo submissions stay in this browser session and are not sent to the organization.')}</p></aside>;
}

// Session-only demo state is deliberately separate from all authenticated API data.
function useDemoSession(key) {
  const [entries, setEntries] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(key) || '[]');
      return Array.isArray(saved) ? saved.filter(item => item && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.description === 'string' && typeof item.category === 'string' && typeof item.location === 'string') : [];
    } catch { return []; }
  });
  const save = next => {
    try {
      sessionStorage.setItem(key, JSON.stringify(next));
      setEntries(next);
      return true;
    } catch { return false; }
  };
  return [entries, save];
}

export default function CommunityDemo({ group }) {
  // A key on the parent remounts this component when switching route groups.
  const c = usePublicCopy();
  const { lang } = useLang();
  const [params, setParams] = useSearchParams();
  const options = categoryOptions[group];
  const filter = options.some(([id]) => id === params.get('category')) ? params.get('category') : '';
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [entries, saveEntries] = useDemoSession(`nps-demo-${group}-v1`);
  const [interests, setInterests] = useState([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [draft, setDraft] = useState({ title: '', description: '', location: '', category: options[0][0], consent: false });
  const privateProfiles = group === 'sagun';
  const canCreate = ['services', 'careers', 'sagun', 'transportation', 'medical'].includes(group);
  const samples = useMemo(() => demoListings.filter(item => item.group === group), [group]);
  const rows = [...samples, ...(privateProfiles ? [] : entries)];
  const results = rows.filter(item => (!filter || item.category === filter) && [item.title, item.description, item.location, ...(options.find(([id]) => id === item.category) || []).map(c)].flat().join(' ').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const change = (key, value) => setDraft(current => ({ ...current, [key]: value }));
  const submit = event => {
    event.preventDefault();
    setError(''); setStatus('');
    if (![draft.title, draft.description, draft.location].every(value => value.trim()) || !draft.consent) { setError('Please complete all required fields.'); return; }
    const entry = { id: crypto.randomUUID(), title: draft.title.trim(), description: draft.description.trim(), location: draft.location.trim(), category: draft.category };
    if (!saveEntries([...entries, entry])) { setError('Could not save the demo. Browser storage may be full or disabled.'); return; }
    if (!privateProfiles) { setQuery(''); setParams({ category: draft.category }, { replace: true }); }
    setDraft({ title: '', description: '', location: '', category: draft.category, consent: false });
    setStatus(privateProfiles ? 'Private demo profile saved. It is visible only in this browser session.' : 'Saved in this browser session only. Nothing has been sent to the organization.');
  };
  const reset = () => {
    if (!saveEntries([])) { setError('Could not save the demo. Browser storage may be full or disabled.'); return; }
    setInterests([]); setStatus(''); setError(''); setQuery(''); setParams({}, { replace: true });
  };
  return <section aria-label={c('Demo workspace')} className="mt-10">
    <DemoNotice />
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="min-w-0 text-sm font-medium" htmlFor={`${group}-search`}><span className="inline-flex items-center gap-2"><Search className="h-4 w-4" />{c('Search listings')}</span><input id={`${group}-search`} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={c('Search by title, description, or location')} className={inputClass} /></label>
      <label className="min-w-0 text-sm font-medium" htmlFor={`${group}-filter`}>{c('Category')}<select id={`${group}-filter`} value={filter} onChange={event => { const next = new URLSearchParams(params); event.target.value ? next.set('category', event.target.value) : next.delete('category'); setParams(next, { replace: true }); }} className={inputClass}><option value="">{c('All categories')}</option>{options.map(([id, label]) => <option key={id} value={id}>{c(label)}</option>)}</select></label>
    </div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{results.map(item => <article key={item.id} className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-5"><span className="text-xs font-semibold text-muted-foreground">{c(Array.isArray(item.title) ? 'Sample content' : 'Demo submission')} · {c(options.find(([id]) => id === item.category)?.[1] || 'Other')}</span><h3 className="mt-3 break-words text-lg font-semibold">{demoText(item.title, lang)}</h3><p className="mt-2 line-clamp-3 break-words text-sm leading-relaxed text-muted-foreground">{demoText(item.description, lang)}</p><p className="mb-4 mt-3 inline-flex items-start gap-1 text-xs text-muted-foreground"><MapPin className="h-4 w-4 shrink-0" />{demoText(item.location, lang)}</p><button type="button" onClick={() => setSelected(item)} className={`${secondaryClass} mt-auto`}>{c('View Details')}</button></article>)}</div>
    {results.length === 0 && <div role="status" className="mt-6 rounded-lg border border-dashed border-border p-6 text-center"><p>{c('No results found. Try another search or category.')}</p><button type="button" onClick={() => { setQuery(''); setParams({}, { replace: true }); }} className={`${secondaryClass} mt-3`}>{c('Clear filters')}</button></div>}
    <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className="max-h-[85dvh] overflow-y-auto break-words"><DialogTitle>{selected ? demoText(selected.title, lang) : c('Details')}</DialogTitle><DialogDescription>{c('Sample content')}</DialogDescription>{selected && <><p className="whitespace-pre-wrap text-sm leading-relaxed">{demoText(selected.description, lang)}</p><p className="text-sm text-muted-foreground">{demoText(selected.location, lang)}</p><p className="text-sm">{c('Contact details are not shared in the demo.')}</p>{privateProfiles && <><button type="button" disabled={interests.includes(selected.id)} className={buttonClass} onClick={() => setInterests(current => [...current, selected.id])}>{c(interests.includes(selected.id) ? 'Demo interest saved' : 'Send Demo Interest')}</button>{interests.includes(selected.id) && <p role="status" className="text-sm">{c('Demo interest recorded locally. No person has been contacted.')}</p>}</>}<button type="button" className={secondaryClass} onClick={() => setSelected(null)}>{c('Close')}</button></>}</DialogContent></Dialog>
    {canCreate && <form id="demo-form" onSubmit={submit} className="mt-8 rounded-xl border border-border bg-card p-5 sm:p-6"><h2 className="text-xl font-semibold">{c(privateProfiles ? 'Create a Demo Profile' : 'Add a Demo Listing')}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">
      <label className="min-w-0 text-sm" htmlFor={`${group}-title`}>{c(privateProfiles ? 'Profile name' : 'Title')} *<input id={`${group}-title`} className={inputClass} value={draft.title} maxLength={120} required onChange={event => change('title', event.target.value)} /></label>
      <label className="min-w-0 text-sm" htmlFor={`${group}-category`}>{c('Category')} *<select id={`${group}-category`} className={inputClass} value={draft.category} onChange={event => change('category', event.target.value)}>{options.map(([id, label]) => <option key={id} value={id}>{c(label)}</option>)}</select></label>
      <label className="min-w-0 text-sm" htmlFor={`${group}-location`}>{c('Location')} *<input id={`${group}-location`} className={inputClass} maxLength={100} required value={draft.location} onChange={event => change('location', event.target.value)} /></label>
      <label className="min-w-0 text-sm sm:col-span-2" htmlFor={`${group}-description`}>{c(privateProfiles ? 'Education and profession' : 'Description')} *<textarea id={`${group}-description`} className={inputClass} rows={4} maxLength={1500} required value={draft.description} onChange={event => change('description', event.target.value)} /></label>
      <label className="flex items-start gap-3 text-sm leading-relaxed sm:col-span-2"><input type="checkbox" required checked={draft.consent} onChange={event => change('consent', event.target.checked)} className="mt-1 h-5 w-5 shrink-0" />{c('I understand this is a demo and will use fictional information only.')}</label>
    </div><div className="mt-5 flex flex-wrap gap-3"><button type="submit" className={buttonClass}>{c(privateProfiles ? 'Save Private Demo Profile' : 'Submit Demo')}</button><button type="button" className={secondaryClass} onClick={reset}>{c('Reset Demo')}</button></div></form>}
    {error && <p role="alert" className="mt-4 text-sm text-destructive">{c(error)}</p>}{status && <p role="status" className="mt-4 rounded-lg border border-gold/50 p-4 text-sm">{c(status)}</p>}
    {privateProfiles && entries.length > 0 && <section className="mt-6"><h2 className="text-xl font-semibold">{c('Your Private Demo Profiles')}</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">{entries.map(item => <article className="rounded-xl border border-border bg-card p-5" key={item.id}><h3 className="break-words font-semibold">{item.title}</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm">{item.description}</p><button className={`${secondaryClass} mt-4`} type="button" onClick={() => { if (!saveEntries(entries.filter(entry => entry.id !== item.id))) setError('Could not save the demo. Browser storage may be full or disabled.'); }}>{c('Remove')}</button></article>)}</div></section>}
  </section>;
}

export function DemoMessageForm({ kind }) {
  const c = usePublicCopy();
  const { lang } = useLang();
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('General');
  const [consent, setConsent] = useState(false);
  const submit = event => {
    event.preventDefault(); setError('');
    if (!message.trim() || !consent) { setError('Please complete all required fields.'); return; }
    const id = `DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    try { sessionStorage.setItem(`nps-demo-${kind}-latest`, JSON.stringify({ id, name: name.trim(), subject: subject.trim(), message: message.trim(), category, lang })); }
    catch { setError('Could not save the demo. Browser storage may be full or disabled.'); return; }
    setReference(id); setMessage(''); setName(''); setSubject(''); setConsent(false);
  };
  useEffect(() => { setReference(''); }, [kind]);
  return <section className="mt-10"><DemoNotice /><form className="rounded-xl border border-border bg-card p-5 sm:p-6" onSubmit={submit}><h2 className="text-xl font-semibold">{c(kind === 'contact' ? 'Demo Enquiry Form' : 'Demo Feedback Form')}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">
    <label className="text-sm" htmlFor={`${kind}-name`}>{c('Name (optional)')}<input id={`${kind}-name`} className={inputClass} value={name} maxLength={120} onChange={event => setName(event.target.value)} /></label>
    <label className="text-sm" htmlFor={`${kind}-type`}>{c(kind === 'contact' ? 'Enquiry type' : 'Category')}<select id={`${kind}-type`} className={inputClass} value={category} onChange={event => setCategory(event.target.value)}>{(kind === 'contact' ? ['General', 'Membership', 'Events & Programs', 'Community Services', 'Other'] : ['General', 'Suggestion', 'Website Feedback', 'Report a Problem', 'Other']).map(value => <option key={value} value={value}>{c(value)}</option>)}</select></label>
    <label className="text-sm sm:col-span-2" htmlFor={`${kind}-subject`}>{c('Subject (optional)')}<input id={`${kind}-subject`} className={inputClass} value={subject} maxLength={150} onChange={event => setSubject(event.target.value)} /></label>
    <label className="text-sm sm:col-span-2" htmlFor={`${kind}-message`}>{c('Message')} *<textarea id={`${kind}-message`} className={inputClass} rows={5} required value={message} maxLength={2000} onChange={event => setMessage(event.target.value)} /></label>
    <label className="flex items-start gap-3 text-sm leading-relaxed sm:col-span-2"><input type="checkbox" required checked={consent} onChange={event => setConsent(event.target.checked)} className="mt-1 h-5 w-5 shrink-0" />{c('I understand this is a demo and will use fictional information only.')}</label>
  </div><button type="submit" className={`${buttonClass} mt-5`}>{c('Submit Demo')}</button></form>{error && <p role="alert" className="mt-4 text-sm text-destructive">{c(error)}</p>}{reference && <div role="status" className="mt-4 rounded-lg border border-gold/50 p-4 text-sm"><p>{c('Saved in this browser session only. Nothing has been sent to the organization.')}</p><p className="mt-2">{c('Demo reference')}: <strong>{reference}</strong></p></div>}</section>;
}

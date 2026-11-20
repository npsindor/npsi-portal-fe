import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, ClipboardList, House, Loader2, Plus, Search } from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';
import { BlockLink, HeroBackdrop, useHeroText } from '@/components/PageContent';
import RoomHeroArt from '@/components/room/RoomHeroArt';
import '@/styles/room-hero.css';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import ListingCard from '@/components/room/ListingCard';
import RequirementCard from '@/components/room/RequirementCard';
import RequirementForm from '@/components/room/RequirementForm';
import ListingForm from '@/components/room/ListingForm';
import EnquiryDialog from '@/components/room/EnquiryDialog';
import { field, primary, secondary } from '@/components/room/room-ui';
import { roomApi } from '@/api/roomHuntingApi';
import { useAuth } from '@/lib/AuthContext';
import { useLang } from '@/lib/i18n';
import { roomCopy } from '@/lib/room-copy';
import SuggestSearchInput from '@/components/SuggestSearchInput';
import { suggestValues } from '@/lib/search-suggestions';

const EMPTY = { type: '', area: '', maxRent: '', q: '' };

// Public Room Hunting: approved listings and requirements from the API; posting a requirement is open to everyone,
// adding a property needs a registered family member or student account (checked again on the server).
export default function RoomHunting() {
  const { lang } = useLang();
  const t = roomCopy[lang];
  const hero = useHeroText('room-hunting', lang);
  const { user, isAuthenticated } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'requirements' ? 'requirements' : 'listings';
  const [draft, setDraft] = useState({ ...EMPTY, q: params.get('q') || '' });
  const [filters, setFilters] = useState({ ...EMPTY, q: params.get('q') || '' });
  const [options, setOptions] = useState(null);
  const [data, setData] = useState({ items: [], total: 0, page: 1, pageSize: 12 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [account, setAccount] = useState(null);
  const [adding, setAdding] = useState(false);
  const [enquiry, setEnquiry] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => { document.title = `${t.title} | ${lang === 'hi' ? 'निमाड़ पाटीदार संगठन, इंदौर' : 'Nimar Patidar Sangathan, Indore'}`; }, [t, lang]);
  useEffect(() => { roomApi.options().then((value) => setOptions({ propertyTypes: value?.propertyTypes || [], areas: value?.areas || [] })).catch(() => setOptions({ propertyTypes: [], areas: [] })); }, []);
  useEffect(() => {
    if (!isAuthenticated) { setAccount(null); return; }
    roomApi.mine().then((mine) => setAccount({ eligible: Boolean(mine?.eligible), kind: mine?.accountKind })).catch(() => setAccount({ eligible: false }));
  }, [isAuthenticated]);

  const load = useCallback(async (page = 1) => {
    setLoading(true); setError('');
    try {
      const query = { ...filters, page };
      const raw = tab === 'listings' ? await roomApi.listings(query) : await roomApi.requirements(query);
      const next = { items: [], total: 0, page, pageSize: 12, ...(raw && !Array.isArray(raw) ? raw : {}) };
      setData((current) => (page > 1 ? { ...next, items: [...current.items, ...next.items] } : next));
    } catch { setError(lang === 'hi' ? 'सूची लोड नहीं हो सकी। कृपया फिर प्रयास करें।' : 'Could not load the list. Please try again.'); }
    finally { setLoading(false); }
  }, [filters, tab, lang]);
  useEffect(() => { load(1); }, [load]);

  const search = (event) => { event.preventDefault(); setFilters(draft); };
  const clear = () => { setDraft(EMPTY); setFilters(EMPTY); if (params.get('q')) setParams((current) => { current.delete('q'); return current; }); };
  const switchTab = (next) => setParams((current) => { current.set('tab', next); return current; }, { replace: true });
  const canEnquire = Boolean(isAuthenticated && account?.eligible);
  const typeOptions = options?.propertyTypes || [];
  const areaOptions = options?.areas || [];
  const loginPath = `/login?returnTo=${encodeURIComponent('/room-hunting')}`;

  return <div className="min-h-screen bg-background"><PublicNav />
    <main>
    {/* Hero: the admin's banner photo (Admin → Page Content → Room Hunting) sits faded behind it. */}
    <section className="room-hero isolate text-cream"><HeroBackdrop block={hero.block} className="opacity-20" /><div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:py-16">
      <div className="min-w-0">
        <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-white/10 px-3 py-1 text-sm font-semibold text-gold"><House className="h-4 w-4" aria-hidden="true" />{t.title}</span>
        <p className="mt-3 text-sm text-cream/80">{hero.subtitle || t.heroTagline}</p>
        <h1 className="mt-4 max-w-3xl font-display text-3xl font-semibold leading-tight sm:text-5xl">{hero.title || t.heroHeadline}</h1>
        <p className="mt-5 max-w-2xl whitespace-pre-line text-base leading-relaxed text-cream/85">{hero.intro || t.intro}</p>
        <ul className="mt-5 flex flex-wrap gap-2">{t.heroChips.map((chip) => <li key={chip} className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-cream/90">{chip}</li>)}</ul>
        <BlockLink block={hero.block} lang={lang} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-5 text-sm font-bold text-maroon transition hover:bg-cream" />
        <p className="mt-7 text-sm font-semibold text-gold">{t.heroWays}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <a href="#room-listings" onClick={() => switchTab('listings')} className="group flex items-start gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 text-left backdrop-blur transition hover:border-gold hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold text-maroon"><Search className="h-5 w-5" aria-hidden="true" /></span><span className="min-w-0"><span className="block font-semibold text-cream">{t.heroFind}</span><span className="mt-1 block text-xs leading-relaxed text-cream/75">{t.heroFindNote}</span></span></a>
          <a href="#post-requirement" className="group flex items-start gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 text-left backdrop-blur transition hover:border-gold hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold text-maroon"><ClipboardList className="h-5 w-5" aria-hidden="true" /></span><span className="min-w-0"><span className="block font-semibold text-cream">{t.postRequirement}</span><span className="mt-1 block text-xs leading-relaxed text-cream/75">{t.heroPostNote}</span></span></a>
          <button type="button" aria-label={t.addProperty} onClick={() => setAdding(true)} className="group flex items-start gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 text-left backdrop-blur transition hover:border-gold hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold text-maroon"><Plus className="h-5 w-5" aria-hidden="true" /></span><span className="min-w-0"><span className="block font-semibold text-cream">{t.addProperty}</span><span className="mt-1 block text-xs leading-relaxed text-cream/75">{t.heroListNote}</span></span></button>
        </div>
        {isAuthenticated && <Link to="/portal/room-hunting" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-gold underline-offset-4 hover:underline">{t.myDashboard} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
      </div>
      <RoomHeroArt lang={lang} className="w-full" />
    </div></section>
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      {notice && <p role="status" className="mt-6 rounded-xl border border-gold/40 bg-gold/10 p-3 text-sm">{notice}</p>}

      <div id="room-listings" role="tablist" aria-label={t.title} className="flex scroll-mt-28 gap-2 border-b border-border">
        {[['listings', t.tabListings], ['requirements', t.tabRequirements]].map(([key, text]) => <button key={key} role="tab" type="button" aria-selected={tab === key} onClick={() => switchTab(key)} className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-semibold ${tab === key ? 'border-maroon text-maroon' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>{text}</button>)}
      </div>

      <form onSubmit={search} className="mt-5 grid gap-3 rounded-2xl bg-muted p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.8fr_1.2fr_auto]">
        <label className="text-xs font-semibold text-muted-foreground">{t.type}<select aria-label={t.type} className={field} value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}><option value="">{t.anyType}</option>{typeOptions.map((option) => <option key={option.value} value={option.value}>{lang === 'hi' ? option.hi : option.value}</option>)}</select></label>
        <label className="text-xs font-semibold text-muted-foreground">{t.area}<select aria-label={t.area} className={field} value={draft.area} onChange={(e) => setDraft({ ...draft, area: e.target.value })}><option value="">{t.anyArea}</option>{areaOptions.map((option) => <option key={option.value} value={option.value}>{lang === 'hi' ? option.hi : option.value}</option>)}</select></label>
        <label className="text-xs font-semibold text-muted-foreground">{t.maxRent}<input aria-label={t.maxRent} className={field} type="number" inputMode="numeric" min="0" value={draft.maxRent} onChange={(e) => setDraft({ ...draft, maxRent: e.target.value })} /></label>
        <div className="text-xs font-semibold text-muted-foreground"><label htmlFor="room-search">{t.search}</label><SuggestSearchInput id="room-search" ariaLabel={t.search} maxLength={100} icon={false} inputClassName={field} value={draft.q} onChange={(v) => setDraft((d) => ({ ...d, q: v }))} suggestions={suggestValues(data.items, ['area', 'propertyType'], draft.q)} /></div>
        <div className="flex items-end gap-2"><button type="submit" className={primary}><Search className="h-4 w-4" />{t.search}</button></div>
      </form>

      <section aria-live="polite" className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-muted-foreground">{data.total} {t.results}</p>{JSON.stringify(filters) !== JSON.stringify(EMPTY) && <button type="button" className="text-sm font-semibold text-maroon hover:underline" onClick={clear}>{t.clear}</button>}</div>
        {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        {!loading && !error && data.items.length === 0 && <p className="mt-4 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{tab === 'listings' ? t.noListings : t.noRequirements}</p>}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tab === 'listings'
            ? data.items.map((listing) => <ListingCard key={listing.id} listing={listing} t={t} lang={lang} onEnquire={canEnquire ? setEnquiry : undefined} />)
            : data.items.map((requirement) => <RequirementCard key={requirement.id} requirement={requirement} t={t} lang={lang} />)}
        </div>
        {loading && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-maroon" /></div>}
        {!loading && data.items.length < data.total && <div className="mt-6 flex justify-center"><button type="button" className={secondary} onClick={() => load(data.page + 1)}>{lang === 'hi' ? 'और दिखाएँ' : 'Show more'}</button></div>}
        {tab === 'listings' && !canEnquire && data.items.some((item) => item.contactHidden) && <p className="mt-4 text-xs text-muted-foreground">{t.loginToEnquire}</p>}
      </section>

      <section id="post-requirement" className="mt-12 scroll-mt-28 rounded-3xl border border-border bg-card p-5 sm:p-8">
        <h2 className="font-display text-2xl font-semibold">{t.postRequirement}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.postRequirementHint}</p>
        <div className="mt-6"><RequirementForm t={t} lang={lang} user={user} isAuthenticated={isAuthenticated} options={options} onPosted={() => { if (tab === 'requirements') load(1); }} /></div>
      </section>
    </div></main>

    <Dialog open={adding} onOpenChange={setAdding}>
      <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
        <DialogTitle>{t.addProperty}</DialogTitle>
        <DialogDescription>{t.addPropertyHint}</DialogDescription>
        {!isAuthenticated ? <div className="space-y-3 text-sm"><p>{t.membersOnly}</p><div className="flex flex-wrap gap-2"><Link to={loginPath} className={primary}>{t.login}</Link><Link to="/register" className={secondary}>{t.register}</Link></div></div>
          : !account ? <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
          : !account.eligible ? <div className="space-y-3 text-sm"><p role="alert">{t.membersOnly}</p><div className="flex flex-wrap gap-2"><Link to="/portal/registration" className={primary}>{lang === 'hi' ? 'परिवार पंजीकरण' : 'Family Registration'}</Link><Link to="/student-register" className={secondary}>{lang === 'hi' ? 'विद्यार्थी पंजीकरण' : 'Student Registration'}</Link></div></div>
          : <ListingForm t={t} lang={lang} user={user} options={options} onCancel={() => setAdding(false)} onSaved={(_saved, message) => { setAdding(false); setNotice(message); }} />}
      </DialogContent>
    </Dialog>
    {enquiry && <EnquiryDialog listing={enquiry} t={t} onClose={() => setEnquiry(null)} />}
    <PublicFooter /></div>;
}

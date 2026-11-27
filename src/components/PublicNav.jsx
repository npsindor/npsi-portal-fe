import { usePublicCopy } from '@/lib/public-copy';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, GraduationCap, LogIn, Menu, Search, Sparkles, X } from 'lucide-react';
import { studentLoginPath } from '@/lib/student-flow';
import { useAuth } from '@/lib/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageToggle from '@/components/LanguageToggle';
import { publicNavigation } from '@/lib/public-navigation';
import { useSiteVisibility } from '@/lib/site-visibility';
import logoImage from '@/images/logo.png';
import UserMenu from '@/components/UserMenu';
import GlobalSearch from '@/components/GlobalSearch';
import { useScrollReveal } from '@/lib/scroll-reveal';

// Phone: a light drawer list. Desktop (xl): a navy bar with a gold underline on the current page.
const linkClass = [
  'public-link relative flex w-full items-center justify-between gap-2 rounded-lg px-3 py-3 text-[0.95rem] font-medium text-foreground transition-colors hover:bg-muted',
  'xl:w-auto xl:whitespace-nowrap xl:rounded-none xl:px-2 xl:py-0 xl:min-h-14 xl:text-[0.95rem] xl:font-bold xl:tracking-wide xl:text-cream xl:hover:bg-transparent xl:hover:text-gold 2xl:px-3 2xl:text-base',
  'xl:after:absolute xl:after:inset-x-2 xl:after:bottom-0 xl:after:h-[3px] xl:after:origin-center xl:after:scale-x-0 xl:after:rounded-t-full xl:after:bg-gold xl:after:transition-transform xl:hover:after:scale-x-100',
  'aria-[current=page]:bg-maroon/5 aria-[current=page]:text-maroon xl:aria-[current=page]:bg-transparent xl:aria-[current=page]:text-gold xl:aria-[current=page]:after:scale-x-100',
].join(' ');

// Phone/tablet entry buttons (Member Login, Student Login, Join): same size, side by side.
const entryClass = 'tap-press flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-1.5 py-1.5 text-center text-xs font-semibold leading-tight transition-colors sm:min-h-11 sm:flex-row sm:gap-1.5 sm:rounded-full sm:px-2 sm:text-sm';

const isCurrent =(pathname, to) => (to === '/' ? pathname === '/' : pathname === to.split(/[?#]/)[0] || pathname.startsWith(`${to.split(/[?#]/)[0]}/`));

export default function PublicNav() {
  const c = usePublicCopy();
  useScrollReveal();
  const [open, setOpen] = useState(false);
  // Desktop: the search is a round icon; clicking it slides a full-width search bar over the menu.
  const [searching, setSearching] = useState(false);
  const searchButton = useRef(null);
  const searchingRef = useRef(false);
  searchingRef.current = searching;
  const location = useLocation();
  // Pages an admin switched off leave the menu; a dropdown with nothing left disappears too.
  const { isPageVisible } = useSiteVisibility();
  const navigation = publicNavigation
    .map((item) => (item.items ? { ...item, items: item.items.filter(([, to]) => isPageVisible(to)) } : item))
    .filter((item) => (item.items ? item.items.length > 0 : isPageVisible(item.to)));
  const header = useRef(null);
  const menuButton = useRef(null);
  const { isAuthenticated } = useAuth();
  const loginTo = `/login?returnTo=${encodeURIComponent(`${location.pathname}${location.search}${location.hash}`)}`;
  const closeDropdowns = (except) => header.current?.querySelectorAll('details[open]').forEach(item => { if (item !== except) item.removeAttribute('open'); });
  useEffect(() => {
    setOpen(false);
    setSearching(false);
    closeDropdowns();
  }, [location]);
  useEffect(() => {
    const close = event => {
      if (event.key === 'Escape') {
        const wasSearching = searchingRef.current;
        setOpen(false);
        setSearching(false);
        closeDropdowns();
        if (wasSearching) requestAnimationFrame(() => searchButton.current?.focus());
        else menuButton.current?.focus();
      }
    };
    // A click outside an open dropdown closes it.
    const outside = event => { if (!event.target.closest?.('details')) closeDropdowns(); };
    document.addEventListener('keydown', close);
    document.addEventListener('click', outside);
    return () => {
      document.removeEventListener('keydown', close);
      document.removeEventListener('click', outside);
    };
  }, []);
  return <header ref={header} className="sticky top-0 z-40 border-b border-border bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/85">
    <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-2.5 sm:px-6 sm:py-3">
      <Link to="/" className="flex min-w-0 flex-1 items-center gap-3 sm:flex-none">
        <img src={logoImage} alt="" className="h-10 w-10 shrink-0 rounded-xl shadow-sm ring-1 ring-gold/30 sm:h-12 sm:w-12" />
        <span className="min-w-0 leading-tight">
          <span className="block font-display text-xs font-bold tracking-wide text-maroon sm:text-[0.95rem]">{c("NIMAD PATIDAR SANGATHAN, INDORE")}</span>
          <span className="mt-1 hidden text-[0.7rem] font-medium uppercase tracking-[0.14em] text-gold-dark sm:block">{c("Unity • Cooperation • Respect • Transparency")}</span>
        </span>
      </Link>
      <div className="ml-auto hidden items-center gap-2 sm:flex">
        <ThemeToggle />
        <LanguageToggle />
        {/* Login links sit in the top bar on desktop; below xl they are in the row under the logo. */}
        {!isAuthenticated && (
          <div className="hidden items-center gap-1 xl:flex">
            <Link className="public-link gap-1.5 rounded-full px-3 text-sm font-semibold text-maroon transition-colors hover:bg-muted" to={loginTo}><LogIn className="h-4 w-4" aria-hidden="true" />{c('Member Login')}</Link>
            <Link className="public-link gap-1.5 rounded-full px-3 text-sm font-semibold text-maroon transition-colors hover:bg-muted" to={studentLoginPath()}><GraduationCap className="h-4 w-4" aria-hidden="true" />{c('Student Login')}</Link>
          </div>
        )}
      </div>
      <div className="sm:hidden"><LanguageToggle /></div>
      {isAuthenticated && <UserMenu />}
      <button ref={menuButton} type="button" className="tap-press flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card transition-colors hover:bg-muted xl:hidden" aria-label={c(open ? 'Close navigation menu' : 'Open navigation menu')} aria-expanded={open} aria-controls="public-navigation" onClick={() => setOpen(!open)}>{open ? <X key="x" className="animate-in spin-in-90 fade-in duration-200" /> : <Menu key="menu" className="animate-in fade-in duration-200" />}</button>
      {/* Phone and tablet: a visitor sees both logins and Join in one row, without opening the menu.
          Phone: small tiles with the icon above the label (fits Hindi too). Tablet: icon beside the label. */}
      {!isAuthenticated && <div className="grid w-full grid-cols-3 gap-2 xl:hidden" data-testid="mobile-entry">
        <Link className={`${entryClass} bg-maroon text-cream shadow-sm hover:bg-maroon-dark`} to={loginTo}><LogIn className="h-4 w-4 shrink-0" aria-hidden="true" />{c('Member Login')}</Link>
        <Link className={`${entryClass} border border-maroon bg-card text-maroon hover:bg-maroon/10`} to={studentLoginPath()}><GraduationCap className="h-4 w-4 shrink-0" aria-hidden="true" />{c('Student Login')}</Link>
        <Link to="/join" className={`join-cta ${entryClass} !gap-0.5 !rounded-2xl !px-1.5 !py-1.5 !text-xs sm:!gap-1.5 sm:!rounded-full sm:!text-sm`}><Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />{c("Join the Sangathan")}</Link>
      </div>}
      {!isAuthenticated && <div className="hidden xl:block"><Link to="/join" className="join-cta xl:w-auto"><Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />{c("Join the Sangathan")}</Link></div>}
    </div>
    <nav id="public-navigation" aria-label={c("Main navigation")} className={`${open ? 'block animate-in fade-in slide-in-from-top-2 duration-300 xl:animate-none' : 'hidden'} max-h-[70dvh] overflow-y-auto border-t border-border bg-background xl:block xl:max-h-none xl:overflow-visible xl:border-t-0 xl:bg-maroon`}>
      <div className="relative mx-auto flex max-w-7xl flex-col divide-y divide-border/60 px-4 py-2 sm:px-6 xl:flex-row xl:flex-nowrap xl:items-stretch xl:justify-between xl:divide-y-0 xl:py-0">
        <div className="py-3 xl:hidden"><GlobalSearch onNavigate={() => setOpen(false)} /></div>
        {navigation.map(item => item.items ? <details key={item.label} className="group relative" onToggle={event => { if (event.currentTarget.open) closeDropdowns(event.currentTarget); }}>
          <summary aria-current={item.items.some(([, to]) => isCurrent(location.pathname, to)) ? 'page' : undefined} className={`${linkClass} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
            {c(item.label)}<ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 opacity-70 transition-transform group-open:rotate-180" />
          </summary>
          <div className="mb-2 ml-3 border-l-2 border-gold/60 pl-2 animate-in fade-in slide-in-from-top-1 duration-200 xl:absolute xl:left-0 xl:top-full xl:z-50 xl:mb-0 xl:ml-0 xl:mt-0 xl:flex xl:w-64 xl:flex-col xl:rounded-xl xl:border xl:border-border xl:bg-card xl:p-2 xl:pl-2 xl:shadow-xl">
            {item.items.map(([label, to]) => <Link key={label} to={to} className="public-link flex w-full rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted hover:text-maroon">{c(label)}</Link>)}
          </div>
        </details> : <Link key={item.label} to={item.to} aria-current={isCurrent(location.pathname, item.to) ? 'page' : undefined} className={linkClass}>{c(item.label)}</Link>)}
        <button ref={searchButton} type="button" aria-label={c('Open search')} aria-expanded={searching} onClick={() => setSearching(true)} className={`${searching ? 'xl:invisible' : ''} hidden h-10 w-10 shrink-0 items-center justify-center self-center rounded-full border border-gold/60 bg-cream/10 text-cream transition-colors hover:bg-gold hover:text-maroon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold xl:flex`}><Search className="h-5 w-5" aria-hidden="true" /></button>
        {searching && <div className="absolute inset-0 z-50 hidden items-center gap-3 bg-maroon px-4 duration-200 animate-in fade-in slide-in-from-right-8 sm:px-6 xl:flex">
          <GlobalSearch autoFocus className="flex-1" onNavigate={() => setSearching(false)} />
          <button type="button" aria-label={c('Close search')} onClick={() => { setSearching(false); requestAnimationFrame(() => searchButton.current?.focus()); }} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/60 text-cream transition-colors hover:bg-gold hover:text-maroon"><X className="h-5 w-5" aria-hidden="true" /></button>
        </div>}
        <div className="flex items-center py-3 sm:hidden"><ThemeToggle /></div>
      </div>
    </nav>
  </header>;
}

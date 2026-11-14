import { usePublicCopy } from '@/lib/public-copy';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageToggle from '@/components/LanguageToggle';
import { publicNavigation } from '@/lib/public-navigation';
import logoImage from '@/images/logo.png';

export default function PublicNav() {
  const c = usePublicCopy();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const header = useRef(null);
  const menuButton = useRef(null);
  const { isAuthenticated, user } = useAuth();
  useEffect(() => {
    setOpen(false);
    header.current?.querySelectorAll('details[open]').forEach(item => item.removeAttribute('open'));
  }, [location]);
  useEffect(() => {
    const close = event => {
      if (event.key === 'Escape') {
        setOpen(false);
        header.current?.querySelectorAll('details[open]').forEach(item => item.removeAttribute('open'));
        menuButton.current?.focus();
      }
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, []);
  return <header ref={header} className="sticky top-0 z-40 border-b border-gold/30 bg-background shadow-sm">
    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
      <Link to="/" className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
        <img src={logoImage} alt="" className="h-10 w-10 shrink-0 rounded-xl sm:h-12 sm:w-12" />
        <span className="min-w-0 font-display text-xs font-semibold leading-snug text-maroon sm:text-base">{c("NIMAR PATIDAR SANGATHAN, INDORE")}<span className="mt-1 hidden text-xs font-normal text-muted-foreground sm:block">{c("Unity \u2022 Cooperation \u2022 Respect \u2022 Transparency")}</span></span>
      </Link>
      <div className="hidden items-center gap-2 sm:flex"><ThemeToggle /><LanguageToggle /><Link className="public-link" to={isAuthenticated ? (user?.role === 'admin' ? '/admin' : '/portal') : '/login'}>{c(isAuthenticated ? 'My Portal' : 'Member Login')}</Link></div>
      <div className="sm:hidden"><LanguageToggle /></div>
      <button ref={menuButton} type="button" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border xl:hidden" aria-label={c(open ? 'Close navigation menu' : 'Open navigation menu')} aria-expanded={open} aria-controls="public-navigation" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      <Link to="/register" className="flex min-h-11 w-full items-center justify-center rounded-lg bg-maroon px-4 py-2 text-center text-sm font-semibold text-cream sm:w-auto">{c("Join the Organization")}</Link>
    </div>
    <nav id="public-navigation" aria-label={c("Main navigation")} className={`${open ? 'block' : 'hidden'} max-h-[65dvh] overflow-y-auto border-t border-border xl:block xl:overflow-visible`}>
      <div className="mx-auto flex max-w-7xl flex-col px-4 py-2 xl:flex-row xl:flex-wrap xl:items-center xl:justify-between">
        {publicNavigation.map(item => item.items ? <details key={item.label} className="group relative" onToggle={event => { if(event.currentTarget.open) header.current?.querySelectorAll('details[open]').forEach(other => { if(other !== event.currentTarget) other.removeAttribute('open'); }); }}>
          <summary className="cursor-pointer rounded-lg px-2 py-3 text-sm font-medium text-foreground marker:text-gold hover:bg-muted">{c(item.label)}</summary>
          <div className="border-l-2 border-gold bg-card p-2 xl:absolute xl:left-0 xl:top-full xl:w-60 xl:rounded-lg xl:border xl:border-border xl:shadow-xl">
            {item.items.map(([label, to]) => <Link key={label} to={to} className="public-link block rounded-md px-3 py-3 text-sm hover:bg-muted">{c(label)}</Link>)}
          </div>
        </details> : <Link key={item.label} to={item.to} aria-current={location.pathname === item.to ? 'page' : undefined} className="public-link rounded-lg px-2 py-3 text-sm font-medium hover:bg-muted">{c(item.label)}</Link>)}
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2 sm:hidden"><ThemeToggle /><LanguageToggle /><Link className="public-link" to={isAuthenticated ? '/portal' : '/login'}>{c(isAuthenticated ? 'My Portal' : 'Member Login')}</Link></div>
      </div>
    </nav>
  </header>;
}

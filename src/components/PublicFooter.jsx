import { usePublicCopy } from '@/lib/public-copy';
import { Link } from 'react-router-dom';
import { flatNavigation } from '@/lib/public-navigation';
import { useSiteVisibility } from '@/lib/site-visibility';
import BecomeMemberButton from '@/components/event-members/BecomeMemberDialog';
import { ArrowUp } from 'lucide-react';

// Back to the top of the page (instantly for visitors who asked the system for less motion).
const toTop = () => {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
};
export default function PublicFooter() {
  const c = usePublicCopy();
  // Pages an admin switched off are left out of the footer too.
  const { isPageVisible } = useSiteVisibility();
  const show = (to) => isPageVisible(to);
  return <footer className="bg-maroon text-cream"><div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
    <div><h2 className="font-display text-lg font-semibold text-gold">{c("Nimad Patidar Sangathan, Indore")}</h2><p className="mt-3 text-sm">{c("Unity \u2022 Cooperation \u2022 Respect \u2022 Transparency")}</p><p className="mt-4 text-sm leading-relaxed text-cream/75">{c("A community platform promoting unity, cultural heritage, education, professional opportunities, and social welfare.")}</p></div>
    <div><h2 className="font-semibold text-gold">{c("Explore")}</h2><div className="mt-3 grid grid-cols-2 gap-3 text-sm">{flatNavigation.slice(1).filter(item => show(item.to)).map(item => <Link key={item.to} to={item.to} className="hover:underline">{c(item.label)}</Link>)}</div></div>
    <div><h2 className="font-semibold text-gold">{c("Get Involved")}</h2><div className="mt-3 flex flex-col items-start gap-3 text-sm"><BecomeMemberButton className="font-semibold text-gold underline-offset-4 hover:underline" />{show("/core-team") && <Link to="/core-team">{c("Core Team")}</Link>}{show("/register") && <Link to="/register">{c("Family Registration")}</Link>}{show("/application-status") && <Link to="/application-status">{c("Application Status")}</Link>}{show("/rules") && <Link to="/rules">{c("Community Rules")}</Link>}{show("/principles") && <Link to="/principles">{c("Guiding Principles")}</Link>}</div></div>
  </div><div className="mx-auto flex max-w-7xl items-start justify-between gap-4 border-t border-gold/30 px-4 py-6 text-xs leading-relaxed text-cream/75"><div>© {new Date().getFullYear()} {c("Nimad Patidar Sangathan, Indore")}. {c("All rights reserved.")}<p className="mt-2">{c("Community listings and submitted information may require verification.")}</p><p className="mt-3 flex flex-wrap gap-x-4 gap-y-2"><Link to="/terms" className="underline-offset-4 hover:text-gold hover:underline">{c("Terms & Conditions")}</Link><Link to="/privacy" className="underline-offset-4 hover:text-gold hover:underline">{c("Privacy Policy")}</Link></p></div><button type="button" onClick={toTop} aria-label={c("Back to top")} title={c("Back to top")} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/60 text-gold transition hover:bg-gold hover:text-maroon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"><ArrowUp className="h-5 w-5" aria-hidden="true" /></button></div></footer>;
}

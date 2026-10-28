import { usePublicCopy } from '@/lib/public-copy';
import { Link } from 'react-router-dom';
import { publicNavigation } from '@/lib/public-navigation';
export default function PublicFooter() {
  const c = usePublicCopy();
  return <footer className="bg-maroon text-cream"><div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
    <div><h2 className="font-display text-lg font-semibold text-gold">{c("Nimar Patidar Sangathan, Indore")}</h2><p className="mt-3 text-sm">{c("Unity \u2022 Cooperation \u2022 Respect \u2022 Transparency")}</p><p className="mt-4 text-sm leading-relaxed text-cream/75">{c("A community platform promoting unity, cultural heritage, education, professional opportunities, and social welfare.")}</p></div>
    <div><h2 className="font-semibold text-gold">{c("Explore")}</h2><div className="mt-3 grid grid-cols-2 gap-3 text-sm">{publicNavigation.slice(1).map(item => <Link key={item.to} to={item.to} className="hover:underline">{c(item.label)}</Link>)}</div></div>
    <div><h2 className="font-semibold text-gold">{c("Get Involved")}</h2><div className="mt-3 flex flex-col items-start gap-3 text-sm"><Link to="/register">{c("Join the Organization")}</Link><Link to="/register">{c("Family Registration")}</Link><Link to="/application-status">{c("Application Status")}</Link><Link to="/rules">{c("Community Rules")}</Link><Link to="/principles">{c("Guiding Principles")}</Link></div></div>
  </div><div className="mx-auto max-w-7xl border-t border-gold/30 px-4 py-6 text-xs leading-relaxed text-cream/75">© {new Date().getFullYear()} {c("Nimar Patidar Sangathan, Indore")}. {c("All rights reserved.")}<p className="mt-2">{c("Community listings and submitted information may require verification.")}</p></div></footer>;
}

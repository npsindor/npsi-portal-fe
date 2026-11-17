import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, Search } from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';
import GlobalSearch from '@/components/GlobalSearch';
import { SEARCH_GROUPS, searchPages, searchPortal } from '@/lib/global-search';
import { useLang } from '@/lib/i18n';

// Full results for a header search ("See all results" or Enter), grouped by category.
export default function SearchResults() {
  const { lang } = useLang();
  const hi = lang === 'hi';
  const [params] = useSearchParams();
  const q = (params.get('q') || '').trim();
  const [results, setResults] = useState(null);
  useEffect(() => { document.title = `${hi ? 'खोज' : 'Search'} | ${hi ? 'निमाड़ पाटीदार संगठन, इंदौर' : 'Nimar Patidar Sangathan, Indore'}`; }, [hi]);
  useEffect(() => {
    if (q.length < 2) { setResults({ groups: [] }); return undefined; }
    const controller = new AbortController();
    setResults(null);
    searchPortal(q, controller.signal).then(setResults).catch((error) => { if (error.name !== 'AbortError') setResults({ groups: [] }); });
    return () => controller.abort();
  }, [q]);
  const groups = useMemo(() => {
    const pages = searchPages(q, lang);
    return [...(pages.length ? [{ key: 'pages', items: pages }] : []), ...(results?.groups || [])];
  }, [q, results, lang]);
  return <div className="min-h-screen bg-background"><PublicNav />
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="flex items-center gap-2 font-display text-3xl font-semibold"><Search className="h-7 w-7 text-maroon" />{hi ? 'खोज परिणाम' : 'Search results'}</h1>
      <GlobalSearch className="mt-5 max-w-xl" />
      {q && <p className="mt-4 text-sm text-muted-foreground">{hi ? `"${q}" के परिणाम` : `Results for "${q}"`}</p>}
      {!results ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-maroon" /></div>
        : groups.length === 0 ? <p className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{q.length < 2 ? (hi ? 'कम से कम 2 अक्षर लिखें।' : 'Type at least 2 characters.') : hi ? 'कोई परिणाम नहीं मिला। दूसरे शब्द, क्षेत्र या फैमिली आईडी आज़माएँ।' : 'No results found. Try another word, an area or a Family ID.'}</p>
        : <div className="mt-6 space-y-6">{groups.map((group) => <section key={group.key} aria-labelledby={`group-${group.key}`}>
          <h2 id={`group-${group.key}`} className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{SEARCH_GROUPS[group.key]?.[hi ? 1 : 0] || group.key}</h2>
          <ul className="mt-2 divide-y divide-border rounded-2xl border border-border bg-card">{group.items.map((item) => <li key={item.id}><Link to={item.link} className="block px-4 py-3 hover:bg-muted"><span className="block font-medium">{(hi && item.titleHi) || item.title}</span>{item.subtitle && <span className="block text-xs text-muted-foreground">{item.subtitle}</span>}</Link></li>)}</ul>
        </section>)}</div>}
    </main>
  <PublicFooter /></div>;
}

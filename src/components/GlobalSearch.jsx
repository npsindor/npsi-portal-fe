import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search, X } from 'lucide-react';
import { searchPortal, SEARCH_GROUPS, searchPages } from '@/lib/global-search';
import { useSiteVisibility } from '@/lib/site-visibility';
import { useLang } from '@/lib/i18n';

// Header search across the portal: matching pages instantly, then results from the API (debounced), grouped by
// category. Arrow keys move through results, Enter opens one (or the full results page), Escape closes.
export default function GlobalSearch({ className = '', onNavigate, autoFocus = false }) {
  const { lang } = useLang();
  const navigate = useNavigate();
  const listId = useId();
  const box = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  // The API could not answer (offline, server error): say so instead of a misleading "no results".
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const hi = lang === 'hi';

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults(null); setLoading(false); setFailed(false); return undefined; }
    setLoading(true);
    setFailed(false);
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchPortal(q, controller.signal).then((data) => { setResults(data); setLoading(false); }).catch((error) => { if (error.name !== 'AbortError') { setResults({ groups: [] }); setFailed(true); setLoading(false); } });
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);
  useEffect(() => {
    const close = (event) => { if (!box.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const { isPageVisible, hidden } = useSiteVisibility();
  const groups = useMemo(() => {
    // Results on a page an admin switched off are left out.
    const groups = [{ key: 'pages', items: searchPages(query, lang) }, ...(results?.groups || [])];
    return groups.map((group) => ({ ...group, items: group.items.filter((item) => isPageVisible(item.link)) })).filter((group) => group.items.length);
  }, [query, results, lang, hidden]);
  const flat = groups.flatMap((group) => group.items);
  const go = (link) => { setOpen(false); setQuery(''); setActive(-1); onNavigate?.(); navigate(link); };
  const showAll = () => { const q = query.trim(); if (q.length >= 2) go(`/search?q=${encodeURIComponent(q)}`); };
  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!flat.length) return;
      setOpen(true);
      setActive((current) => (current + (event.key === 'ArrowDown' ? 1 : -1) + flat.length) % flat.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (active >= 0 && flat[active]) go(flat[active].link);
      else showAll();
    } else if (event.key === 'Escape') { setOpen(false); setActive(-1); }
  };
  const label = (item) => (hi && item.titleHi) || item.title;
  const q = query.trim();
  let index = -1;
  return <div ref={box} className={`relative ${className}`} role="search">
    <label htmlFor={`${listId}-input`} className="sr-only">{hi ? 'पोर्टल में खोजें' : 'Search the portal'}</label>
    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
    <input
      id={`${listId}-input`}
      type="text"
      inputMode="search"
      enterKeyHint="search"
      role="combobox"
      aria-expanded={open && q.length >= 2}
      aria-controls={listId}
      aria-autocomplete="list"
      aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
      autoComplete="off"
      autoFocus={autoFocus}
      maxLength={100}
      placeholder={hi ? 'नाम, समाचार, कार्यक्रम, कमरा खोजें…' : 'Search names, news, events, rooms…'}
      value={query}
      onChange={(event) => { setQuery(event.target.value); setOpen(true); setActive(-1); }}
      onFocus={() => setOpen(true)}
      onKeyDown={onKeyDown}
      className="h-10 w-full rounded-full border border-border bg-card pl-9 pr-9 text-sm outline-none focus:border-maroon focus:ring-2 focus:ring-ring/30"
    />
    {query && <button type="button" onClick={() => { setQuery(''); setActive(-1); }} aria-label={hi ? 'साफ़ करें' : 'Clear search'} className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}</button>}
    {open && q.length >= 2 && <div id={listId} role="listbox" aria-label={hi ? 'खोज परिणाम' : 'Search results'} className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70dvh] overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-xl sm:min-w-[24rem]">
      {groups.map((group) => <div key={group.key} role="group" aria-label={SEARCH_GROUPS[group.key]?.[hi ? 1 : 0] || group.key} className="py-1">
        <p className="px-3 pb-1 pt-2 text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">{SEARCH_GROUPS[group.key]?.[hi ? 1 : 0] || group.key}</p>
        {group.items.map((item) => { index += 1; const position = index; return <button key={`${group.key}-${item.id}`} id={`${listId}-${position}`} type="button" role="option" aria-selected={active === position} onMouseEnter={() => setActive(position)} onClick={() => go(item.link)} className={`block w-full rounded-xl px-3 py-2 text-left text-sm ${active === position ? 'bg-muted' : 'hover:bg-muted'}`}><span className="block truncate font-medium">{label(item)}</span>{item.subtitle && <span className="block truncate text-xs text-muted-foreground">{item.subtitle}</span>}</button>; })}
      </div>)}
      {!loading && failed && <p role="alert" className="px-3 py-3 text-sm text-destructive">{hi ? 'खोज अभी उपलब्ध नहीं है। थोड़ी देर बाद फिर कोशिश करें।' : 'Search is not available right now. Please try again in a moment.'}</p>}
      {!loading && !failed && results && groups.length === 0 && <p className="px-3 py-4 text-sm text-muted-foreground">{hi ? `"${q}" के लिए कोई परिणाम नहीं मिला। दूसरे शब्द आज़माएँ।` : `No results for "${q}". Try another word, an area or a Family ID.`}</p>}
      {loading && !groups.length && <p className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{hi ? 'खोज रहे हैं…' : 'Searching…'}</p>}
      {groups.length > 0 && <button type="button" onClick={showAll} className="mt-1 block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-maroon hover:bg-muted">{hi ? 'सभी परिणाम देखें →' : 'See all results →'}</button>}
    </div>}
  </div>;
}

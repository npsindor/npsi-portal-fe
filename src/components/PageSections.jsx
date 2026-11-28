import { useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowDown, ChevronRight, Inbox } from 'lucide-react';
import { BlockLink, BlockMedia } from '@/components/PageContent';
import { blockText } from '@/lib/page-content';
import '@/styles/page-heroes.css';

// Shared layout for the single-page menu pages. Every page uses the same 12-column container (max-w-7xl).
// `block` is the admin's INTRO override (Admin → Page Content): title, text and an image or video.

// `theme` ('career' | 'news' | 'health') gives the page its own colours (styles/page-heroes.css) and `art` its own scene
// beside the text. `tagline` is the small line above the heading; the admin's "small line" (subtitle) replaces it.
export function PageHero({ eyebrow, title, intro, icon: Icon, lang, block, overview = true, theme, art, tagline, children }) {
  const heading = blockText(block, 'title', lang) || title;
  const text = blockText(block, 'body', lang) || intro;
  const small = blockText(block, 'subtitle', lang) || tagline;
  const image = block?.mediaType === 'IMAGE' && block.mediaUrl;
  const video = block?.mediaType === 'VIDEO' && block.mediaUrl;
  return (
    <section className={`relative overflow-hidden text-cream ${theme ? `page-hero page-hero-${theme}` : 'hero-band'}`}>
      {image && <img src={block.mediaUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" aria-hidden="true" />}
      {image && !theme && <div className="absolute inset-0 bg-gradient-to-r from-maroon via-maroon/85 to-maroon/40" aria-hidden="true" />}
      {image && theme && <div className="absolute inset-0 bg-black/45" aria-hidden="true" />}
      <div className="absolute inset-0 shell-grid opacity-[0.05]" aria-hidden="true" />
      <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gold/10 blur-3xl" aria-hidden="true" />
      <div className={`relative mx-auto max-w-7xl px-4 pt-10 sm:px-6 sm:pt-14 ${overview ? 'pb-24 sm:pb-28' : 'pb-12 sm:pb-16'}`}>
        <nav aria-label={lang === 'hi' ? 'ब्रेडक्रंब' : 'Breadcrumb'} className="flex items-center gap-1.5 text-xs text-cream/60">
          <Link to="/" className="hover:text-gold">{lang === 'hi' ? 'मुख्य पृष्ठ' : 'Home'}</Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span aria-current="page" className="text-cream/90">{eyebrow}</span>
        </nav>
        <div className="mt-6 grid items-center gap-8 lg:grid-cols-12">
          <div className={`flex min-w-0 items-start gap-4 ${video ? 'lg:col-span-7' : art ? 'lg:col-span-6' : 'lg:col-span-10'}`}>
            {Icon && <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-gold sm:flex"><Icon className="h-7 w-7" aria-hidden="true" /></span>}
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{eyebrow}</p>
              {small && <p className="mt-2 text-sm text-cream/80">{small}</p>}
              <h1 className="mt-2 max-w-3xl font-display text-3xl font-semibold leading-tight text-cream sm:text-5xl">{heading}</h1>
              {text && <p className="mt-4 max-w-2xl whitespace-pre-line text-base leading-relaxed text-cream/75 sm:text-lg">{text}</p>}
              <BlockLink block={block} lang={lang} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-5 text-sm font-bold text-maroon transition hover:bg-cream" />
            </div>
          </div>
          {video && <div className="lg:col-span-5"><BlockMedia block={block} lang={lang} className="shadow-2xl ring-1 ring-cream/10" /></div>}
          {!video && art && <div className="min-w-0 lg:col-span-6">{art}</div>}
        </div>
        {children}
      </div>
    </section>
  );
}

// Overview tiles under the hero: one per section, with a count, jumping to it.
// Five or more tiles stack the icon above the text on large screens so titles keep the full width.
const COLUMNS = { 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4', 5: 'sm:grid-cols-2 lg:grid-cols-5' };
export function SectionOverview({ sections, lang }) {
  return (
    <div className="relative z-10 mx-auto -mt-16 max-w-7xl px-4 sm:-mt-20 sm:px-6">
      <nav aria-label={lang === 'hi' ? 'इस पेज पर' : 'On this page'} className={`grid gap-3 sm:gap-4 ${COLUMNS[sections.length] || 'sm:grid-cols-2 lg:grid-cols-3'}`}>
        {sections.map((section) => (
          <a key={section.id} href={`#${section.id}`} className={`group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-lg shadow-maroon/5 transition hover:-translate-y-0.5 hover:border-gold/60 hover:shadow-xl ${sections.length >= 5 ? 'lg:flex-col lg:gap-3' : ''}`}>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-md" style={{ background: `linear-gradient(145deg, ${section.colors[0]}, ${section.colors[1]})` }}>
              <section.icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground">{section.title}</span>
                {section.count !== undefined && <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">{section.count}</span>}
              </span>
              <span className="mt-1 block text-sm leading-snug text-muted-foreground">{section.summary}</span>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-maroon transition group-hover:text-gold-dark">
                {lang === 'hi' ? 'देखें' : 'View section'} <ArrowDown className="h-3.5 w-3.5 transition group-hover:translate-y-0.5" aria-hidden="true" />
              </span>
            </span>
          </a>
        ))}
      </nav>
    </div>
  );
}

// `compact`: less space above and below (pages with several short sections, e.g. Events).
export function SectionBlock({ id, icon: Icon, colors, eyebrow, title, intro, action, tone = 'plain', block, lang, compact = false, children }) {
  const heading = blockText(block, 'title', lang) || title;
  const text = blockText(block, 'body', lang) || intro;
  const media = block && block.mediaType !== 'NONE' && block.mediaUrl;
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`scroll-mt-32 border-b border-border xl:scroll-mt-40 ${tone === 'muted' ? 'bg-muted/40' : 'bg-background'}`}>
      <div className={`mx-auto max-w-7xl px-4 sm:px-6 ${compact ? 'py-10 sm:py-14' : 'py-14 sm:py-20'}`}>
        <div className={`${compact ? 'mb-6 sm:mb-8' : 'mb-8 sm:mb-10'} ${media ? 'grid items-center gap-8 lg:grid-cols-12' : 'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'}`}>
          <div className={`flex items-start gap-4 ${media ? 'lg:col-span-7' : ''}`}>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-md" style={{ background: `linear-gradient(145deg, ${colors[0]}, ${colors[1]})` }}>
              <Icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="eyebrow">{eyebrow}</p>
              <h2 id={`${id}-title`} className="mt-1.5 section-title">{heading}</h2>
              {text && <p className="mt-2 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-base">{text}</p>}
              <BlockLink block={block} lang={lang} className="mt-3 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-maroon transition hover:text-gold-dark" />
            </div>
          </div>
          {media ? <div className="lg:col-span-5"><BlockMedia block={block} lang={lang} className={block.mediaType === 'IMAGE' ? 'aspect-video shadow-lg' : 'shadow-lg'} /></div> : action}
        </div>
        {children}
      </div>
    </section>
  );
}

export function EmptyState({ children }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/60 px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"><Inbox className="h-6 w-6" aria-hidden="true" /></span>
      <p className="max-w-md text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

export function CardSkeleton({ count = 3 }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      {Array.from({ length: count }, (_, index) => <div key={index} className="h-56 animate-pulse rounded-2xl bg-muted" />)}
    </div>
  );
}

// Old links (/news?category=greetings, /community-services#blood-donation) land on the matching section once content is in.
export function useSectionLanding(aliases, ready) {
  const location = useLocation();
  const [params] = useSearchParams();
  useEffect(() => {
    if (!ready) return;
    const wanted = location.hash.slice(1) || params.get('category') || '';
    const id = aliases[wanted] || wanted;
    if (!id) return;
    const target = document.getElementById(id);
    if (target) window.requestAnimationFrame(() => target.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
  }, [ready, location.hash, location.search]);
}

export const formatDate = (value, lang, options = { day: 'numeric', month: 'short', year: 'numeric' }) => {
  if (!value) return '';
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', options);
};

// "Day / month" calendar tile used in lists.
export function DateTile({ value, lang, className = '' }) {
  const day = formatDate(value, lang, { day: '2-digit' });
  const month = formatDate(value, lang, { month: 'short' });
  if (!day) return null;
  return (
    <span className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-maroon ${className}`}>
      <span className="font-display text-2xl font-bold leading-none">{day}</span>
      <span className="mt-1 text-[0.65rem] font-semibold uppercase tracking-wider">{month}</span>
    </span>
  );
}

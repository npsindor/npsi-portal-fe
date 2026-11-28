import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { blockText, youtubeId } from '@/lib/page-content';

// Admin content for one page: { ready, intro(section), items(section) }. Built-in copy is used where nothing is set.
export function usePageContent(page) {
  const [blocks, setBlocks] = useState(null);
  useEffect(() => {
    let alive = true;
    base44.pageBlocks.list(page)
      .then((rows) => { if (alive) setBlocks(Array.isArray(rows) ? rows.filter((row) => row.page === page && row.active !== false) : []); })
      .catch(() => { if (alive) setBlocks([]); });
    return () => { alive = false; };
  }, [page]);
  const list = blocks || [];
  return {
    ready: blocks !== null,
    intro: (section) => list.find((row) => row.section === section && row.role === 'INTRO') || null,
    items: (section) => list.filter((row) => row.section === section && row.role === 'ITEM').sort((a, b) => a.sortOrder - b.sortOrder),
  };
}

// Banner title/text override for pages that keep their own hero design (Sagun, Travel & Assistance, Medical, Room Hunting).
export function useHeroText(page, lang) {
  const content = usePageContent(page);
  const block = content.intro('hero');
  return { title: blockText(block, 'title', lang), intro: blockText(block, 'body', lang), subtitle: blockText(block, 'subtitle', lang), block };
}

// The banner photo set in Admin → Page Content, faded behind a page's own (dark) hero. The hero needs
// `relative isolate overflow-hidden`: the photo then sits above the hero's background and below all its content.
export function HeroBackdrop({ block, className = 'opacity-25' }) {
  if (block?.mediaType !== 'IMAGE' || !block.mediaUrl) return null;
  return <img src={block.mediaUrl} alt="" aria-hidden="true" decoding="async" className={`pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover ${className}`} />;
}

// Section heading/intro with the admin's override when set.
export const introCopy = (block, lang, fallbackTitle, fallbackIntro) => ({
  title: blockText(block, 'title', lang) || fallbackTitle,
  intro: blockText(block, 'body', lang) || fallbackIntro,
});

// An admin image or video (YouTube / .mp4), sized by its container.
export function BlockMedia({ block, lang, className = '', rounded = 'rounded-2xl' }) {
  if (!block?.mediaUrl || block.mediaType === 'NONE') return null;
  const title = blockText(block, 'title', lang);
  if (block.mediaType === 'VIDEO') {
    const id = youtubeId(block.mediaUrl);
    return (
      <div className={`relative aspect-video w-full overflow-hidden bg-black ${rounded} ${className}`}>
        {id
          ? <iframe src={`https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`} title={title || 'Video'} loading="lazy" allow="encrypted-media; picture-in-picture" allowFullScreen className="absolute inset-0 h-full w-full border-0" />
          : <video src={block.mediaUrl} controls playsInline preload="metadata" className="absolute inset-0 h-full w-full object-contain" aria-label={title || 'Video'} />}
      </div>
    );
  }
  return <img src={block.mediaUrl} alt={title} loading="lazy" decoding="async" className={`w-full object-cover ${rounded} ${className}`} />;
}

// The block's button: site paths use the router, outside links open in a new tab.
export function BlockLink({ block, lang, className = 'inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-maroon transition hover:text-gold-dark' }) {
  if (!block?.linkUrl) return null;
  const label = blockText(block, 'ctaLabel', lang) || (lang === 'hi' ? 'और जानें' : 'Learn more');
  const inner = <>{label} <ArrowRight className="h-4 w-4" aria-hidden="true" /></>;
  return /^https?:\/\//i.test(block.linkUrl)
    ? <a href={block.linkUrl} target="_blank" rel="noopener noreferrer" className={className}>{inner}</a>
    : <Link to={block.linkUrl} className={className}>{inner}</Link>;
}

// A generic admin entry: optional media on top, title, small subtitle, text, button.
export function BlockCard({ block, lang, className = '' }) {
  const subtitle = blockText(block, 'subtitle', lang);
  const body = blockText(block, 'body', lang);
  return (
    <article className={`flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-lg ${className}`}>
      {block.mediaType !== 'NONE' && <BlockMedia block={block} lang={lang} rounded="rounded-none" className={block.mediaType === 'IMAGE' ? 'aspect-video' : ''} />}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {blockText(block, 'title', lang) && <h3 className="font-display text-lg font-semibold leading-snug text-foreground">{blockText(block, 'title', lang)}</h3>}
        {subtitle && <p className="mt-1 text-sm font-medium text-gold-dark">{subtitle}</p>}
        {body && <p className="mt-2 flex-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{body}</p>}
        <BlockLink block={block} lang={lang} className="mt-4 inline-flex min-h-10 items-center gap-1.5 self-start text-sm font-semibold text-maroon transition hover:text-gold-dark" />
      </div>
    </article>
  );
}

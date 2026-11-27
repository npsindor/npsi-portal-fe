import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, Images, Pause, Play } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { usePageContent } from '@/components/PageContent';
import { useLang } from '@/lib/i18n';
import { blockText } from '@/lib/page-content';

const DELAY = 5000;
// Shown until admins add photos (Admin → Page Content → Home → Photo Gallery): every Maa Na Garba photo in
// public/gallery (the 7 large ones first, then 1maanagarba.jpg … 58maanagarba.jpg). Add a new file's name here too.
const GARBA_PHOTO_COUNT = 58;
const DEFAULT_PHOTOS = [
  ...[1, 2, 3, 4, 5, 6, 7].map((n) => ({ id: `garba-${n}`, src: `/gallery/maa-na-garba-${n}.jpg` })),
  ...Array.from({ length: GARBA_PHOTO_COUNT }, (_, i) => ({ id: `maanagarba-${i + 1}`, src: `/gallery/${i + 1}maanagarba.jpg` })),
];
const copy = {
  en: { eyebrow: 'Photo Gallery', title: 'Moments from our community', intro: 'Celebrations, programmes and gatherings of the Nimad Patidar Sangathan, Indore.', default: 'Maa Na Garba — Nimad Patidar Sangathan, Indore', label: 'Photo gallery', prev: 'Previous photo', next: 'Next photo', pause: 'Pause slideshow', play: 'Play slideshow', open: 'View full size', of: 'of' },
  hi: { eyebrow: 'फोटो गैलरी', title: 'हमारे समाज के यादगार पल', intro: 'निमाड़ पाटीदार संगठन के उत्सव, कार्यक्रम और सम्मेलन।', default: 'माँ ना गरबा — निमाड़ पाटीदार संगठन, इंदौर', label: 'फोटो गैलरी', prev: 'पिछली फोटो', next: 'अगली फोटो', pause: 'स्लाइडशो रोकें', play: 'स्लाइडशो चलाएँ', open: 'बड़ा करके देखें', of: '/' },
};

export default function PhotoGallery() {
  const { lang } = useLang();
  const t = copy[lang] || copy.en;
  const content = usePageContent('home');
  const intro = content.intro('gallery');
  const managed = content.items('gallery').filter((block) => block.mediaType === 'IMAGE' && block.mediaUrl);
  const photos = managed.length
    ? managed.map((block) => ({ id: block.id, src: block.mediaUrl, caption: blockText(block, 'title', lang), detail: blockText(block, 'subtitle', lang) || blockText(block, 'body', lang) }))
    : DEFAULT_PHOTOS.map((photo) => ({ ...photo, caption: t.default }));
  const [api, setApi] = useState(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    if (!api) return undefined;
    const update = () => setIndex(api.selectedScrollSnap());
    update();
    api.on('select', update);
    api.on('reInit', update);
    return () => { api.off('select', update); api.off('reInit', update); };
  }, [api]);
  useEffect(() => {
    if (!api || paused || hover || open !== null || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const id = window.setInterval(() => { if (document.visibilityState === 'visible') api.scrollNext(); }, DELAY);
    return () => window.clearInterval(id);
  }, [api, paused, hover, open]);

  if (!content.ready) return <section aria-busy="true" className="mx-auto max-w-7xl px-4 py-12 sm:px-6"><div className="aspect-[16/7] animate-pulse rounded-3xl bg-muted" /></section>;
  const current = open !== null ? photos[open] : null;

  return (
    <section id="gallery" aria-labelledby="gallery-title" className="border-t border-border bg-background py-12 sm:py-16">
      <div className="mx-auto mb-8 flex max-w-7xl flex-col gap-4 px-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <span className="eyebrow"><Images className="h-3.5 w-3.5" aria-hidden="true" /> {t.eyebrow}</span>
          <h2 id="gallery-title" className="mt-3 section-title">{blockText(intro, 'title', lang) || t.title}</h2>
          <p className="mt-2 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{blockText(intro, 'body', lang) || t.intro}</p>
        </div>
        <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? t.play : t.pause} className="inline-flex min-h-10 items-center gap-2 self-start rounded-full border border-border bg-card px-4 text-sm font-semibold text-maroon transition hover:border-gold/60 sm:self-auto">
          {paused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}{paused ? t.play : t.pause}
        </button>
      </div>

      {/* Full-width slider: the current photo centred, neighbours peeking on wider screens. */}
      <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setHover(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setHover(false); }}>
        <Carousel setApi={setApi} opts={{ loop: true, align: 'center' }} aria-label={t.label} className="relative">
          <CarouselContent className="-ml-3 sm:-ml-5">
            {photos.map((photo, i) => (
              <CarouselItem key={photo.id} aria-roledescription="slide" aria-label={`${i + 1} ${t.of} ${photos.length}`} className="basis-[92%] pl-3 sm:basis-[80%] sm:pl-5 lg:basis-[68%]">
                <figure className={`group relative overflow-hidden rounded-2xl bg-maroon-dark shadow-xl transition-opacity duration-500 sm:rounded-3xl ${index === i ? 'opacity-100' : 'opacity-50'}`}>
                  <button type="button" onClick={() => (index === i ? setOpen(i) : api?.scrollTo(i))} tabIndex={index === i ? 0 : -1} aria-label={`${t.open}: ${photo.caption || `${i + 1}`}`} className="block w-full">
                    <img src={photo.src} alt={photo.caption || ''} loading={i < 2 ? 'eager' : 'lazy'} decoding="async" className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-[1.02] sm:aspect-[16/9]" />
                    <span className="absolute right-3 top-3 hidden h-9 w-9 items-center justify-center rounded-full bg-black/45 text-cream opacity-0 backdrop-blur transition group-hover:opacity-100 sm:flex"><Expand className="h-4 w-4" aria-hidden="true" /></span>
                  </button>
                  {(photo.caption || photo.detail) && (
                    <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-4 pt-12 sm:p-6 sm:pt-16">
                      {photo.caption && <p className="font-display text-base font-semibold text-cream sm:text-xl">{photo.caption}</p>}
                      {photo.detail && <p className="mt-1 line-clamp-2 text-xs text-cream/80 sm:text-sm">{photo.detail}</p>}
                    </figcaption>
                  )}
                </figure>
              </CarouselItem>
            ))}
          </CarouselContent>
          <button type="button" aria-label={t.prev} onClick={() => api?.scrollPrev()} className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-cream/30 bg-black/45 text-cream backdrop-blur transition hover:bg-black/65 sm:left-6"><ChevronLeft className="h-5 w-5" aria-hidden="true" /></button>
          <button type="button" aria-label={t.next} onClick={() => api?.scrollNext()} className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-cream/30 bg-black/45 text-cream backdrop-blur transition hover:bg-black/65 sm:right-6"><ChevronRight className="h-5 w-5" aria-hidden="true" /></button>
        </Carousel>

      </div>

      <Dialog open={current !== null} onOpenChange={(value) => { if (!value) setOpen(null); }}>
        <DialogContent className="max-w-5xl gap-3 border-none bg-black p-2 sm:p-3">
          {current && <>
            <DialogTitle className="sr-only">{current.caption || t.label}</DialogTitle>
            <DialogDescription className="sr-only">{current.detail || t.label}</DialogDescription>
            <img src={current.src} alt={current.caption || ''} className="max-h-[80dvh] w-full rounded-lg object-contain" />
            <div className="flex items-center justify-between gap-3 px-1 pb-1 text-cream">
              <p className="min-w-0 truncate text-sm">{current.caption}</p>
              <div className="flex shrink-0 gap-2">
                <button type="button" aria-label={t.prev} onClick={() => setOpen((open - 1 + photos.length) % photos.length)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"><ChevronLeft className="h-5 w-5" aria-hidden="true" /></button>
                <button type="button" aria-label={t.next} onClick={() => setOpen((open + 1) % photos.length)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"><ChevronRight className="h-5 w-5" aria-hidden="true" /></button>
              </div>
            </div>
          </>}
        </DialogContent>
      </Dialog>
    </section>
  );
}

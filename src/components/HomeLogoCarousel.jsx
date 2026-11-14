import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { usePageContent } from '@/components/PageContent';
import { usePublicCopy } from '@/lib/public-copy';
import { useLang } from '@/lib/i18n';
import { blockText } from '@/lib/page-content';
import logoVideo from '@/images/logo.mp4';

const DELAY = 5000;
// Same photos as the Photo Gallery: the admin's (Admin → Page Content → Home → Photo Gallery), else the Garba set.
const DEFAULT_PHOTOS = [1, 2, 3, 4, 5, 6, 7].map((n) => ({ id: `garba-${n}`, src: `/gallery/maa-na-garba-${n}.jpg` }));
const copy = {
  en: { label: 'Sangathan highlights', prev: 'Previous slide', next: 'Next slide', pause: 'Pause slides', play: 'Resume slides', go: (n) => `Go to slide ${n}`, photo: 'Maa Na Garba' },
  hi: { label: 'संगठन की झलक', prev: 'पिछली स्लाइड', next: 'अगली स्लाइड', pause: 'स्लाइड रोकें', play: 'स्लाइड चलाएँ', go: (n) => `स्लाइड ${n} पर जाएँ`, photo: 'माँ ना गरबा' },
};

// Keeps the logo video silent whatever the browser or an extension does.
const keepMuted = (event) => {
  const video = event.currentTarget;
  if (!video.muted) video.muted = true;
  if (video.volume !== 0) video.volume = 0;
};

// Home page, left of the services grid: the Sangathan logo video, then community photos.
export default function HomeLogoCarousel() {
  const { lang } = useLang();
  const c = usePublicCopy();
  const t = copy[lang] || copy.en;
  const content = usePageContent('home');
  const managed = content.items('gallery').filter((block) => block.mediaType === 'IMAGE' && block.mediaUrl);
  const photos = managed.length
    ? managed.map((block) => ({ id: block.id, src: block.mediaUrl, caption: blockText(block, 'title', lang) }))
    : DEFAULT_PHOTOS.map((photo) => ({ ...photo, caption: t.photo }));
  const slides = [{ id: 'logo', video: true, caption: c('Nimar Patidar Sangathan, Indore') }, ...photos];

  const [api, setApi] = useState(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (!api) return;
    const update = () => setIndex(api.selectedScrollSnap());
    update();
    api.on('select', update);
    api.on('reInit', update);
    return () => {
      api.off('select', update);
      api.off('reInit', update);
    };
  }, [api]);

  useEffect(() => {
    if (!api || paused || hover || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') api.scrollNext();
    }, DELAY);
    return () => window.clearInterval(timer);
  }, [api, paused, hover]);

  return (
    <Carousel
      setApi={setApi}
      opts={{ loop: true }}
      aria-label={t.label}
      className="group relative h-full overflow-hidden rounded-3xl [&>div:first-child]:h-full border border-gold/30 bg-maroon-dark shadow-xl"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHover(false);
      }}
    >
      <CarouselContent className="ml-0 h-full">
        {slides.map((slide, i) => (
          <CarouselItem key={slide.id} aria-label={`${i + 1} / ${slides.length}`} aria-hidden={index !== i} className="h-full pl-0">
            <figure className="relative aspect-square h-full w-full overflow-hidden sm:aspect-[4/3] lg:aspect-auto lg:min-h-[24rem]">
              {slide.video ? (
                <video
                  className="absolute inset-0 h-full w-full object-cover"
                  src={logoVideo}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  onLoadedMetadata={keepMuted}
                  onPlay={keepMuted}
                  onVolumeChange={keepMuted}
                  aria-label={slide.caption}
                />
              ) : (
                <img src={slide.src} alt={slide.caption || ''} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
              )}
              {slide.caption && (
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-maroon-dark/95 via-maroon-dark/50 to-transparent px-5 pb-14 pt-12 font-display text-base font-semibold text-cream sm:text-lg">
                  {slide.caption}
                </figcaption>
              )}
            </figure>
          </CarouselItem>
        ))}
      </CarouselContent>

      <div className="absolute inset-x-4 bottom-3 z-10 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              aria-label={t.go(i + 1)}
              aria-current={index === i ? 'true' : undefined}
              onClick={() => api?.scrollTo(i)}
              className={`h-2 rounded-full transition-all ${index === i ? 'w-6 bg-gold' : 'w-2 bg-cream/50 hover:bg-cream/80'}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          {[
            [paused ? t.play : t.pause, () => setPaused((p) => !p), paused ? Play : Pause],
            [t.prev, () => api?.scrollPrev(), ChevronLeft],
            [t.next, () => api?.scrollNext(), ChevronRight],
          ].map(([label, onClick, Icon]) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              onClick={onClick}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-cream/25 bg-maroon/40 text-cream transition hover:border-gold hover:text-gold"
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>
    </Carousel>
  );
}

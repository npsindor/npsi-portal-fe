import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { useLang } from '@/lib/i18n';

const DELAY = 5000;
// The home hero shows only these three logo videos, from public/slider. Each plays to its end, then the next one starts.
const SLIDES = [
  { id: 'npsi', video: '/slider/npsi-logo.mp4', en: 'Nimar Patidar Sangathan, Indore', hi: 'निमाड़ पाटीदार संगठन, इंदौर' },
  { id: 'garba', video: '/slider/maa-na-garba-logo.mp4', en: 'Maa Na Garba', hi: 'माँ ना गरबा' },
  { id: 'deepotsav', video: '/slider/deepoutsav-logo.mp4', en: 'Sneh Deepotsav', hi: 'स्नेह दीपोत्सव' },
];
const copy = {
  en: { label: 'Sangathan highlights', prev: 'Previous slide', next: 'Next slide', pause: 'Pause slides', play: 'Resume slides', go: (n) => `Go to slide ${n}` },
  hi: { label: 'संगठन की झलक', prev: 'पिछली स्लाइड', next: 'अगली स्लाइड', pause: 'स्लाइड रोकें', play: 'स्लाइड चलाएँ', go: (n) => `स्लाइड ${n} पर जाएँ` },
};

// Keeps the logo videos silent whatever the browser or an extension does.
const keepMuted = (event) => {
  const video = event.currentTarget;
  if (!video.muted) video.muted = true;
  if (video.volume !== 0) video.volume = 0;
};

// Home page, left of the services grid. A video slide plays once to the end and then moves on; the image slide
// stays for DELAY. Only the visible video plays.
export default function HomeLogoCarousel() {
  const { lang } = useLang();
  const t = copy[lang] || copy.en;
  const slides = SLIDES.map((slide) => ({ ...slide, caption: slide[lang] || slide.en }));
  const videos = useRef({});

  const [api, setApi] = useState(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const held = paused || hover;
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

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

  // Play the visible video from the start; stop the others.
  useEffect(() => {
    Object.entries(videos.current).forEach(([id, video]) => {
      if (!video) return;
      if (id === slides[index]?.id) {
        video.currentTime = 0;
        video.play().catch(() => {});
      } else video.pause();
    });
  }, [index]);

  // The image slide moves on after DELAY; video slides move on when they end (onEnded below).
  useEffect(() => {
    if (!api || held || reduced || slides[index]?.video) return;
    const timer = window.setTimeout(() => {
      if (document.visibilityState === 'visible') api.scrollNext();
    }, DELAY);
    return () => window.clearTimeout(timer);
  }, [api, held, reduced, index]);

  const ended = (event) => {
    if (api && !held && !reduced && document.visibilityState === 'visible') api.scrollNext();
    else event.currentTarget.play().catch(() => {}); // held: keep the logo moving in place
  };

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
              {/* Portrait logos: shown whole (contain) on the maroon background, never cropped; the name is in the logo itself. */}
              {slide.video ? (
                <video
                  ref={(node) => { videos.current[slide.id] = node; }}
                  className="absolute inset-0 h-full w-full object-contain"
                  src={slide.video}
                  autoPlay={i === 0}
                  muted
                  playsInline
                  preload={i === 0 ? 'auto' : 'metadata'}
                  onLoadedMetadata={keepMuted}
                  onPlay={keepMuted}
                  onVolumeChange={keepMuted}
                  onEnded={ended}
                  aria-label={slide.caption}
                />
              ) : (
                <img src={slide.image} alt={slide.caption} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-contain" />
              )}
              {slide.caption && (
                <figcaption className="sr-only">
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

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, GraduationCap, HeartHandshake, Megaphone, Pause, Play, Quote, Sparkles, Stethoscope, Volume2, VolumeX } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { localizedText } from '@/lib/utils';
import logoImage from '@/images/logo.png';
import ADVERTISING_IMAGES from 'virtual:advertising';
import { useAuth } from '@/lib/AuthContext';
import { isRegisteredMember } from '@/lib/membership';

// Garba highlights video (also used by GarbaVideoPopup). Replace or remove the slide below if the file is deleted.
const VIDEO_SRC = '/videos/maanagarba.mp4';
const TEXT_DELAY = 5000;
const MEDIA_DELAY = 6000;
const VIDEO_MAX = 30000;

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Selected slide index and count of an Embla carousel.
function useSlides(api) {
  const [state, setState] = useState({ index: 0, count: 0 });
  useEffect(() => {
    if (!api) return undefined;
    const update = () => setState({ index: api.selectedScrollSnap(), count: api.scrollSnapList().length });
    update();
    api.on('select', update);
    api.on('reInit', update);
    return () => {
      api.off('select', update);
      api.off('reInit', update);
    };
  }, [api]);
  return state;
}

// Advances the carousel every `delay` ms while the page is visible and nothing pauses it.
function useAutoplay(api, delay, paused) {
  useEffect(() => {
    if (!api || paused || reducedMotion()) return undefined;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') api.scrollNext();
    }, delay);
    return () => window.clearInterval(id);
  }, [api, delay, paused]);
}

const copy = {
  en: {
    eyebrow: 'Advertisements & sponsors',
    title: 'Featured on our website',
    mediaLabel: 'Advertisements',
    adAlt: 'Advertisement',
    textLabel: 'Community highlights',
    prev: 'Previous slide',
    next: 'Next slide',
    pause: 'Pause slides',
    play: 'Play slides',
    mute: 'Mute video',
    unmute: 'Unmute video',
    goTo: 'Go to slide',
    of: 'of',
    texts: [
      { icon: Quote, eyebrow: 'Our values', title: 'Unity, cooperation, respect and transparency', body: 'Together we preserve our Nimar heritage and build a stronger future for every family.', to: '/about', cta: 'About us' },
      { icon: GraduationCap, eyebrow: 'Education', title: 'Support for every student', body: 'Register students, find guidance and stay connected with education programmes of the samaj.', to: '/student-register', cta: 'Student registration' },
      { icon: HeartHandshake, eyebrow: 'Shagun Bandhan', title: 'Matrimonial registration is open', body: 'Verified families can register a private, consent-based Shagun Bandhan profile for a family member.', to: '/sagun', cta: 'Register now' },
      { icon: Stethoscope, eyebrow: 'Health Support', title: 'Health help, close to home', body: 'Medicine support and trusted health resources shared by community members.', to: '/medical', cta: 'Explore Health Support' },
    ],
    identityTitle: 'Nimar Patidar Sangathan, Indore',
    identityBody: 'Unity • Cooperation • Respect • Transparency',
    videoTitle: 'Maa Garba Mahotsav',
    videoBody: 'Celebrating our culture and traditions together.',
    eventEyebrow: 'Latest event',
    eventCta: 'View events',
    eventFallbackTitle: 'Events & programmes',
    eventFallbackBody: 'Cultural, social and educational programmes for every generation.',
    textSlideEyebrow: 'Join us',
    textSlideTitle: 'Be part of a growing community',
    textSlideBody: 'Register your family to access member services, events, education support and community programmes.',
    textSlideCta: 'Join the Sangathan',
    memberCta: 'Go to My Portal',
  },
  hi: {
    eyebrow: 'विज्ञापन और प्रायोजक',
    title: 'हमारी वेबसाइट पर विशेष',
    mediaLabel: 'विज्ञापन',
    adAlt: 'विज्ञापन',
    textLabel: 'समाज की मुख्य बातें',
    prev: 'पिछली स्लाइड',
    next: 'अगली स्लाइड',
    pause: 'स्लाइड रोकें',
    play: 'स्लाइड चलाएँ',
    mute: 'वीडियो की आवाज़ बंद करें',
    unmute: 'वीडियो की आवाज़ चालू करें',
    goTo: 'स्लाइड पर जाएँ',
    of: '/',
    texts: [
      { icon: Quote, eyebrow: 'हमारे मूल्य', title: 'एकता, सहयोग, सम्मान और पारदर्शिता', body: 'मिलकर हम अपनी निमाड़ विरासत को सँजोते हैं और हर परिवार के लिए बेहतर भविष्य बनाते हैं।', to: '/about', cta: 'हमारे बारे में' },
      { icon: GraduationCap, eyebrow: 'शिक्षा', title: 'हर विद्यार्थी के लिए सहयोग', body: 'विद्यार्थियों का पंजीकरण करें, मार्गदर्शन पाएँ और समाज के शिक्षा कार्यक्रमों से जुड़े रहें।', to: '/student-register', cta: 'विद्यार्थी पंजीकरण' },
      { icon: HeartHandshake, eyebrow: 'शगुन बंधन', title: 'वैवाहिक पंजीकरण शुरू', body: 'सत्यापित परिवार अपने सदस्य का निजी, सहमति-आधारित शगुन बंधन परिचय पंजीकृत कर सकते हैं।', to: '/sagun', cta: 'अभी पंजीकरण करें' },
      { icon: Stethoscope, eyebrow: 'स्वास्थ्य सहयोग', title: 'स्वास्थ्य सहायता, आपके पास', body: 'समाज के सदस्यों द्वारा साझा दवा सहायता और भरोसेमंद स्वास्थ्य संसाधन।', to: '/medical', cta: 'स्वास्थ्य सहयोग देखें' },
    ],
    identityTitle: 'निमाड़ पाटीदार संगठन, इंदौर',
    identityBody: 'एकता • सहयोग • सम्मान • पारदर्शिता',
    videoTitle: 'माँ गरबा महोत्सव',
    videoBody: 'अपनी संस्कृति और परंपराओं का साथ मिलकर उत्सव।',
    eventEyebrow: 'नवीनतम कार्यक्रम',
    eventCta: 'कार्यक्रम देखें',
    eventFallbackTitle: 'कार्यक्रम और आयोजन',
    eventFallbackBody: 'हर पीढ़ी के लिए सांस्कृतिक, सामाजिक और शैक्षिक कार्यक्रम।',
    textSlideEyebrow: 'हमसे जुड़ें',
    textSlideTitle: 'बढ़ते समाज का हिस्सा बनें',
    textSlideBody: 'सदस्य सेवाएँ, कार्यक्रम, शिक्षा सहयोग और सामुदायिक कार्यक्रमों के लिए अपने परिवार का पंजीकरण करें।',
    textSlideCta: 'संगठन से जुड़ें',
    memberCta: 'मेरे पोर्टल पर जाएँ',
  },
};

const youtubeId = (url) => String(url || '').match(/^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/i)?.[1] || null;
// Admin text in the current language, falling back to English.
const localized = (row, key, lang) => (lang === 'hi' && row[`${key}Hi`]) || row[key] || '';

// Admin-managed slide (GET /home-highlights) → the shape the sliders render.
const fromAdmin = (row, lang) => ({
  key: row.id,
  kind: row.slider === 'TEXT' ? 'text' : row.mediaType.toLowerCase(),
  src: row.mediaUrl,
  youtube: row.mediaType === 'VIDEO' ? youtubeId(row.mediaUrl) : null,
  icon: row.sponsored ? Megaphone : Sparkles,
  sponsored: row.sponsored,
  eyebrow: localized(row, 'eyebrow', lang),
  title: localized(row, 'title', lang),
  body: localized(row, 'body', lang),
  to: row.linkUrl || '',
  cta: localized(row, 'ctaLabel', lang) || (lang === 'hi' ? 'और जानें' : 'Learn more'),
});

// Site paths use the router; outside links open in a new tab (ads are marked rel="sponsored").
function SlideLink({ slide, className, tabIndex, children }) {
  if (/^https?:\/\//i.test(slide.to)) {
    return <a href={slide.to} target="_blank" rel={`noopener noreferrer${slide.sponsored ? ' sponsored' : ''}`} tabIndex={tabIndex} className={className}>{children}</a>;
  }
  return <Link to={slide.to} tabIndex={tabIndex} className={className}>{children}</Link>;
}

function AdBadge({ lang }) {
  return <span className="inline-flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-maroon">{lang === 'hi' ? 'विज्ञापन' : 'Ad'}</span>;
}

function Dots({ count, index, onSelect, label, tone = 'dark' }) {
  if (count < 2) return null;
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: count }, (_, dot) => (
        <button
          key={dot}
          type="button"
          aria-label={`${label} ${dot + 1}`}
          aria-current={dot === index ? 'true' : undefined}
          onClick={() => onSelect(dot)}
          className="flex h-6 items-center justify-center px-0.5"
        >
          <span className={`block h-2 rounded-full transition-all ${dot === index ? `w-6 ${tone === 'light' ? 'bg-gold' : 'bg-maroon'}` : `w-2 ${tone === 'light' ? 'bg-cream/50' : 'bg-maroon/25'}`}`} />
        </button>
      ))}
    </div>
  );
}

// "Explore community services" companion: a highlights text slider (3 cols) and a media slider (9 cols).
export default function HomeShowcase({ lang, events = [] }) {
  const c = copy[lang] || copy.en;
  const member = isRegisteredMember(useAuth().user);
  const [textApi, setTextApi] = useState(null);
  const [mediaApi, setMediaApi] = useState(null);
  const text = useSlides(textApi);
  const media = useSlides(mediaApi);
  const [textHover, setTextHover] = useState(false);
  const [mediaHover, setMediaHover] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRefs = useRef({});
  const [highlights, setHighlights] = useState(null); // null while loading

  useEffect(() => {
    let alive = true;
    base44.homeHighlights.list()
      .then((rows) => { if (alive) setHighlights(Array.isArray(rows) ? rows : []); })
      .catch(() => { if (alive) setHighlights([]); });
    return () => { alive = false; };
  }, []);
  const adminText = (highlights || []).filter((row) => row.slider === 'TEXT').map((row) => fromAdmin(row, lang));
  const adminMedia = (highlights || []).filter((row) => row.slider === 'MEDIA').map((row) => fromAdmin(row, lang));
  // Until an admin adds slides, each slider shows its built-in defaults.
  const textSlides = adminText.length ? adminText : c.texts.map((slide) => ({ ...slide, key: slide.title, kind: 'text' }));

  const latestEvent = events.find((event) => event.bannerUrl);
  const defaultMedia = [
    { kind: 'image', key: 'identity', src: logoImage, contain: true, eyebrow: 'NPS Indore', title: c.identityTitle, body: c.identityBody },
    { kind: 'video', key: 'video', src: VIDEO_SRC, poster: logoImage, eyebrow: lang === 'hi' ? 'वीडियो' : 'Video', title: c.videoTitle, body: c.videoBody },
    latestEvent
      ? { kind: 'image', key: 'event', src: latestEvent.bannerUrl, eyebrow: c.eventEyebrow, title: localizedText(latestEvent, 'title', lang), body: localizedText(latestEvent, 'venue', lang), to: '/events', cta: c.eventCta }
      : { kind: 'image', key: 'event', src: logoImage, contain: true, eyebrow: c.eventEyebrow, title: c.eventFallbackTitle, body: c.eventFallbackBody, to: '/events', cta: c.eventCta },
    { kind: 'text', key: 'join', eyebrow: c.textSlideEyebrow, title: c.textSlideTitle, body: c.textSlideBody, to: member ? '/portal' : '/join', cta: member ? c.memberCta : c.textSlideCta },
  ];
  // The ads in public/advertising always run; admin media slides (Admin → Community highlights → Media) join them.
  // An admin slide that uses a folder image replaces that image's plain slide (it adds its text and link).
  const adminSources = new Set(adminMedia.map((slide) => slide.src));
  const folderAds = ADVERTISING_IMAGES.filter((src) => !adminSources.has(src)).map((src, i) => ({
    kind: 'image', key: src, src, fit: true, sponsored: true, alt: `${c.adAlt} ${i + 1}`,
  }));
  const ads = [...adminMedia.map((slide) => (ADVERTISING_IMAGES.includes(slide.src) ? { ...slide, fit: true } : slide)), ...folderAds];
  const mediaSlides = ads.length ? ads : defaultMedia;
  // Ad banners are wide (about 1600×850): on phones the slider takes their shape instead of a tall box.
  const adsOnly = mediaSlides.every((slide) => slide.fit);
  const activeMedia = mediaSlides[media.index];
  const videoActive = activeMedia?.kind === 'video';

  useAutoplay(textApi, TEXT_DELAY, paused || textHover);
  // The video slide holds the media slider until the clip ends (or VIDEO_MAX), so it isn't cut off.
  useAutoplay(mediaApi, MEDIA_DELAY, paused || mediaHover || videoActive);

  // Only the visible <video> plays.
  useEffect(() => {
    for (const [index, video] of Object.entries(videoRefs.current)) {
      if (!video) continue;
      if (Number(index) === media.index && !paused) video.play().catch(() => {});
      else video.pause();
    }
  }, [media.index, paused, mediaSlides.length]);
  // A video slide moves on after VIDEO_MAX unless someone is hovering/focused on it (an .mp4 also moves on when it ends).
  useEffect(() => {
    if (!videoActive || paused || mediaHover || reducedMotion()) return undefined;
    const limit = window.setTimeout(() => mediaApi?.scrollNext(), VIDEO_MAX);
    return () => window.clearTimeout(limit);
  }, [videoActive, paused, mediaHover, mediaApi, media.index]);

  const pauseOnFocus = useCallback((setter) => ({
    onMouseEnter: () => setter(true),
    onMouseLeave: () => setter(false),
    onFocus: () => setter(true),
    onBlur: (event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setter(false);
    },
  }), []);

  return (
    <section id="showcase" aria-labelledby="showcase-title" className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="eyebrow"><Sparkles className="h-3.5 w-3.5" /> {c.eyebrow}</span>
            <h2 id="showcase-title" className="mt-3 section-title">{c.title}</h2>
          </div>
          <button
            type="button"
            onClick={() => setPaused((value) => !value)}
            aria-label={paused ? c.play : c.pause}
            className="inline-flex min-h-10 items-center gap-2 self-start rounded-full border border-border bg-card px-4 text-sm font-semibold text-maroon transition hover:border-gold/60 sm:self-auto"
          >
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {paused ? c.play : c.pause}
          </button>
        </div>

        {highlights === null ? (
          <div className="grid gap-5 md:grid-cols-12 lg:gap-6" aria-busy="true">
            <div className="h-72 animate-pulse rounded-2xl bg-muted md:col-span-4 md:h-[24rem] lg:col-span-3 lg:h-[28rem] xl:h-[30rem]" />
            <div className="aspect-[4/5] animate-pulse rounded-2xl bg-muted min-[480px]:aspect-[4/3] sm:aspect-video md:col-span-8 md:aspect-auto md:h-[24rem] lg:col-span-9 lg:h-[28rem] xl:h-[30rem]" />
          </div>
        ) : (
        <div className="grid gap-5 md:grid-cols-12 lg:gap-6">
          {/* Text highlights: 3 of 12 columns on desktop */}
          <div className="min-w-0 md:col-span-4 lg:col-span-3" {...pauseOnFocus(setTextHover)}>
            <Carousel setApi={setTextApi} opts={{ loop: true }} aria-label={c.textLabel} className="flex h-full flex-col overflow-hidden rounded-2xl border border-gold/25 bg-maroon text-cream shadow-lg [&>div:first-child]:flex-1">
              <CarouselContent className="ml-0 h-full" aria-live={paused ? 'polite' : 'off'}>
                {textSlides.map((slide, index) => (
                  <CarouselItem key={slide.key} aria-roledescription="slide" aria-label={`${index + 1} ${c.of} ${textSlides.length}`} aria-hidden={text.index !== index} className="pl-0">
                    <article className="flex h-full min-h-[16rem] flex-col p-6 sm:min-h-[18rem] lg:p-7">
                      <span className="flex items-center justify-between gap-2"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/15 text-gold"><slide.icon className="h-5 w-5" aria-hidden="true" /></span>{slide.sponsored && <AdBadge lang={lang} />}</span>
                      {slide.eyebrow && <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-gold">{slide.eyebrow}</p>}
                      <h3 className="mt-2 font-display text-xl font-semibold leading-snug text-cream">{slide.title}</h3>
                      {slide.body && <p className="mt-3 text-sm leading-relaxed text-cream/75">{slide.body}</p>}
                      {slide.to && (
                        <SlideLink slide={slide} tabIndex={text.index === index ? 0 : -1} className="mt-auto inline-flex min-h-10 items-center gap-2 self-start pt-5 text-sm font-semibold text-gold hover:text-cream">
                          {slide.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </SlideLink>
                      )}
                    </article>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex items-center justify-between gap-2 border-t border-cream/10 px-4 py-2">
                <Dots count={text.count} index={text.index} onSelect={(dot) => textApi?.scrollTo(dot)} label={c.goTo} tone="light" />
                <div className="flex gap-1">
                  <button type="button" aria-label={c.prev} onClick={() => textApi?.scrollPrev()} className="flex h-9 w-9 items-center justify-center rounded-full text-cream/80 hover:bg-cream/10 hover:text-gold"><ChevronLeft className="h-4 w-4" /></button>
                  <button type="button" aria-label={c.next} onClick={() => textApi?.scrollNext()} className="flex h-9 w-9 items-center justify-center rounded-full text-cream/80 hover:bg-cream/10 hover:text-gold"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
            </Carousel>
          </div>

          {/* Media: 9 of 12 columns on desktop */}
          <div className="min-w-0 md:col-span-8 lg:col-span-9" {...pauseOnFocus(setMediaHover)}>
            <Carousel setApi={setMediaApi} opts={{ loop: true }} aria-label={c.mediaLabel} className="relative overflow-hidden rounded-2xl border border-border bg-maroon-dark shadow-lg md:h-full md:[&>div:first-child]:h-full">
              <CarouselContent className="ml-0 md:h-full">
                {mediaSlides.map((slide, index) => {
                  const active = media.index === index;
                  return (
                    <CarouselItem key={slide.key} aria-roledescription="slide" aria-label={`${index + 1} ${c.of} ${mediaSlides.length}`} aria-hidden={!active} className="pl-0 md:h-full">
                      <div className={`relative w-full overflow-hidden ${adsOnly ? 'aspect-[32/17]' : 'aspect-[4/5] min-[480px]:aspect-[4/3] sm:aspect-video'} md:aspect-auto md:h-full md:min-h-[24rem] lg:min-h-[28rem] xl:min-h-[30rem]`}>
                        {slide.kind === 'image' && (
                          slide.fit
                            ? <img src={slide.src} alt={slide.title || slide.alt || ''} loading={index === 0 ? 'eager' : 'lazy'} decoding="async" className="absolute inset-0 h-full w-full object-contain" />
                            : slide.contain
                            ? <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgb(196_154_67/0.28),transparent_55%)] p-10 pb-32 sm:pb-28"><img src={slide.src} alt="" loading="lazy" decoding="async" className="max-h-full max-w-[60%] object-contain drop-shadow-2xl sm:max-w-[40%]" /></div>
                            : <img src={slide.src} alt={slide.title} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
                        )}
                        {slide.kind === 'video' && slide.youtube && (
                          active
                            ? <iframe src={`https://www.youtube-nocookie.com/embed/${slide.youtube}?autoplay=${paused || reducedMotion() ? 0 : 1}&mute=1&playsinline=1&rel=0&modestbranding=1`} title={slide.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="absolute inset-0 h-full w-full border-0 bg-black" />
                            : <img src={`https://i.ytimg.com/vi/${slide.youtube}/hqdefault.jpg`} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                        )}
                        {slide.kind === 'video' && !slide.youtube && (
                          <video ref={(node) => { videoRefs.current[index] = node; }} src={slide.src} muted={muted} playsInline preload="none" poster={slide.poster} onEnded={() => mediaApi?.scrollNext()} className="absolute inset-0 h-full w-full bg-black object-contain" aria-label={slide.title} />
                        )}
                        {slide.kind === 'text' && (
                          <div className="absolute inset-0 hero-band">
                            <div className="absolute inset-0 shell-grid opacity-[0.06]" />
                          </div>
                        )}
                        {/* A plain folder ad shows the image alone, with only the Ad label. */}
                        {!slide.title && !slide.body && !slide.to ? (
                          slide.sponsored && <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4"><AdBadge lang={lang} /></div>
                        ) : (
                        <div className={`absolute inset-x-0 bottom-0 p-5 sm:p-8 ${slide.kind === 'text' ? 'top-0 flex flex-col justify-center' : `bg-gradient-to-t from-black/85 via-black/45 to-transparent pt-16${slide.youtube && active ? ' pointer-events-none [&_a]:pointer-events-auto' : ''}`}`}>
                          {(slide.eyebrow || slide.sponsored) && <p className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gold">{slide.sponsored && <AdBadge lang={lang} />}{slide.eyebrow}</p>}
                          <h3 className={`mt-2 max-w-2xl font-display font-semibold leading-tight text-cream ${slide.kind === 'text' ? 'text-2xl sm:text-4xl' : 'text-xl sm:text-3xl'}`}>{slide.title}</h3>
                          {slide.body && <p className="mt-2 max-w-xl text-sm leading-relaxed text-cream/80 sm:text-base">{slide.body}</p>}
                          {slide.to && (
                            <SlideLink slide={slide} tabIndex={active ? 0 : -1} className="mt-4 inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-gold px-5 py-2.5 text-sm font-bold text-maroon transition hover:bg-cream">
                              {slide.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </SlideLink>
                          )}
                        </div>
                        )}
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <div className="absolute right-3 top-3 flex gap-2 sm:right-4 sm:top-4">
                {videoActive && !activeMedia?.youtube && (
                  <button type="button" aria-label={muted ? c.unmute : c.mute} onClick={() => setMuted((value) => !value)} className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/25 bg-black/40 text-cream backdrop-blur hover:text-gold">
                    {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                )}
                <button type="button" aria-label={c.prev} onClick={() => mediaApi?.scrollPrev()} className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/25 bg-black/40 text-cream backdrop-blur hover:text-gold"><ChevronLeft className="h-5 w-5" /></button>
                <button type="button" aria-label={c.next} onClick={() => mediaApi?.scrollNext()} className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/25 bg-black/40 text-cream backdrop-blur hover:text-gold"><ChevronRight className="h-5 w-5" /></button>
              </div>
              <div className="absolute left-3 top-3 rounded-full bg-black/40 px-2 backdrop-blur sm:left-4 sm:top-4">
                <Dots count={media.count} index={media.index} onSelect={(dot) => mediaApi?.scrollTo(dot)} label={c.goTo} tone="light" />
              </div>
            </Carousel>
          </div>
        </div>
        )}
      </div>
    </section>
  );
}

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Listing photographs: one photo is a plain image; several get previous / next buttons, dots, swipe and arrow keys.
export default function PhotoCarousel({ photos, t, alt = '' }) {
  const [index, setIndex] = useState(0);
  const touch = useRef(null);
  if (!photos?.length) return null;
  if (photos.length === 1) return <img src={photos[0]} alt={alt} loading="lazy" className="aspect-[16/9] w-full object-cover" />;
  const total = photos.length;
  const go = (step) => setIndex((current) => (current + step + total) % total);
  const arrow = 'absolute top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-1.5 text-white transition hover:bg-black/65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white';
  return <div
    className="relative aspect-[16/9] w-full overflow-hidden bg-muted"
    role="region"
    aria-roledescription="carousel"
    aria-label={alt || t.photo}
    tabIndex={0}
    onKeyDown={(event) => { if (event.key === 'ArrowLeft') go(-1); if (event.key === 'ArrowRight') go(1); }}
    onTouchStart={(event) => { touch.current = event.touches[0].clientX; }}
    onTouchEnd={(event) => { const start = touch.current; touch.current = null; if (start == null) return; const moved = event.changedTouches[0].clientX - start; if (Math.abs(moved) > 40) go(moved < 0 ? 1 : -1); }}
  >
    <div className="flex h-full transition-transform duration-300 ease-out" style={{ transform: `translateX(-${index * 100}%)` }}>
      {photos.map((url, n) => <img key={url} src={url} alt={t.photoOf(n + 1, total)} aria-hidden={n !== index} loading="lazy" className="h-full w-full shrink-0 object-cover" />)}
    </div>
    <button type="button" className={`${arrow} left-2`} aria-label={t.prevPhoto} onClick={() => go(-1)}><ChevronLeft className="h-5 w-5" /></button>
    <button type="button" className={`${arrow} right-2`} aria-label={t.nextPhoto} onClick={() => go(1)}><ChevronRight className="h-5 w-5" /></button>
    <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium text-white" aria-live="polite">{t.photoOf(index + 1, total)}</span>
    <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
      {photos.map((url, n) => <button key={url} type="button" aria-label={t.photoOf(n + 1, total)} aria-current={n === index} onClick={() => setIndex(n)} className={`h-2 rounded-full transition-all ${n === index ? 'w-5 bg-white' : 'w-2 bg-white/60'}`} />)}
    </div>
  </div>;
}

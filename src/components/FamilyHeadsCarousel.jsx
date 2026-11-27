import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { homeMembersApi } from "@/api/homeMembersApi";
import MemberAvatar from "@/components/MemberAvatar";
import { useLang } from "@/lib/i18n";

const COPY = {
  en: { eyebrow: "Our families", title: "NPS Family Heads", sub: "The heads of the families registered with Nimad Patidar Sangathan, Indore.", prev: "Previous family heads", next: "Next family heads" },
  hi: { eyebrow: "हमारे परिवार", title: "NPS परिवार मुखिया", sub: "निमाड़ पाटीदार संगठन, इंदौर में पंजीकृत परिवारों के मुखिया।", prev: "पिछले परिवार मुखिया", next: "अगले परिवार मुखिया" },
};
// A short list is repeated so the strip is always wider than the screen and loops without a gap.
const MIN_ITEMS = 14;
// Auto-scroll speed in pixels per second (one 112px card about every 1.9 s).
const SPEED = 60;
// How long the auto-scroll waits after an arrow click, a swipe or the pointer leaving.
const RESUME_AFTER = 1500;
// An arrow click glides this long (our own animation, so every browser moves the same distance).
const GLIDE_MS = 450;
const ease = (t) => 1 - (1 - t) ** 3;

// Home page: an endless carousel of 60×60 round photos of the family heads an administrator chose to show
// (Admin → Families → "On website"), A to Z by name as the API returns them. Hidden when nobody is shown.
// Moves on its own (two copies of the list; wraps by half the width), with ← → buttons that move a few cards.
// Pauses while hovered, focused or touched; people who asked for less motion get only the buttons and swipe.
export default function FamilyHeadsCarousel() {
  const { lang } = useLang();
  const t = COPY[lang] || COPY.en;
  const [heads, setHeads] = useState(null);
  const stripRef = useRef(null);
  const pos = useRef(0);
  const holdUntil = useRef(0);
  const hovering = useRef(false);
  const glide = useRef(null); // { from, to, start } while an arrow click is moving the strip
  const animating = useRef(false); // the frame loop runs (not for people who asked for less motion)
  useEffect(() => {
    homeMembersApi.familyHeads().then((rows) => setHeads(Array.isArray(rows) ? rows : [])).catch(() => setHeads([]));
  }, []);

  const hasHeads = Boolean(heads?.length);
  useEffect(() => {
    const strip = stripRef.current;
    if (!hasHeads || !strip || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    let frame;
    let last = performance.now();
    animating.current = true;
    const step = (now) => {
      const dt = Math.min(now - last, 100);
      last = now;
      const half = strip.scrollWidth / 2;
      if (glide.current) {
        const { from, to, start } = glide.current;
        const t = Math.min((now - start) / GLIDE_MS, 1);
        pos.current = from + (to - from) * ease(t);
        strip.scrollLeft = pos.current;
        if (t >= 1) {
          glide.current = null;
          holdUntil.current = now + RESUME_AFTER;
        }
      } else if (hovering.current || now < holdUntil.current || !half) {
        pos.current = strip.scrollLeft; // pick up where an arrow or swipe left it
      } else {
        pos.current += (SPEED * dt) / 1000;
        if (pos.current >= half) pos.current -= half;
        strip.scrollLeft = pos.current;
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => {
      animating.current = false;
      glide.current = null;
      cancelAnimationFrame(frame);
    };
  }, [hasHeads]);

  if (!hasHeads) return null;
  const loop = [];
  while (loop.length < MIN_ITEMS) loop.push(...heads);

  const hold = () => {
    holdUntil.current = performance.now() + RESUME_AFTER;
  };
  const move = (direction) => {
    const strip = stripRef.current;
    if (!strip) return;
    hold();
    const half = strip.scrollWidth / 2;
    const by = Math.max(112, Math.floor((strip.clientWidth * 0.6) / 112) * 112) * direction;
    // A click during a glide continues from where that glide is heading.
    const target = glide.current ? glide.current.to : strip.scrollLeft;
    // Shift by one copy first (looks the same) so the move never runs past either end.
    let shift = 0;
    if (direction < 0 && target + by < 0) shift = half;
    if (direction > 0 && target + by > half) shift = -half;
    if (!animating.current) {
      strip.scrollLeft = target + shift + by; // less motion: move at once
      return;
    }
    glide.current = { from: strip.scrollLeft + shift, to: target + shift + by, start: performance.now() };
  };

  const item = (head, key, hidden) => (
    <li key={key} aria-hidden={hidden || undefined} className="flex w-28 shrink-0 flex-col items-center gap-2 px-2 text-center">
      <MemberAvatar name={head.name} photoUrl={head.photoUrl} size={60} />
      <span className="line-clamp-2 text-xs font-semibold leading-snug text-foreground">{head.name}</span>
      {head.place && <span className="-mt-1.5 line-clamp-1 text-[0.7rem] text-muted-foreground">{head.place}</span>}
    </li>
  );
  const arrow = (direction, label, Icon, side) => (
    <button
      type="button"
      aria-label={label}
      onClick={() => move(direction)}
      className={`absolute top-[30px] z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/95 text-foreground shadow-md transition hover:border-primary hover:text-primary ${side}`}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
  return (
    <section aria-labelledby="family-heads-title" aria-roledescription="carousel" className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <span className="eyebrow">
          <Users className="h-3.5 w-3.5" aria-hidden="true" /> {t.eyebrow}
        </span>
        <h2 id="family-heads-title" className="mt-3 section-title">
          {t.title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{t.sub}</p>
        <div
          className="relative mt-6"
          onMouseEnter={() => { hovering.current = true; }}
          onMouseLeave={() => { hovering.current = false; hold(); }}
          onFocus={() => { hovering.current = true; }}
          onBlur={() => { hovering.current = false; hold(); }}
        >
          {arrow(-1, t.prev, ChevronLeft, "left-0")}
          <div
            ref={stripRef}
            onTouchStart={() => { glide.current = null; holdUntil.current = Infinity; }}
            onTouchEnd={hold}
            className="family-heads-strip overflow-x-auto [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
          >
            <div className="flex w-max">
              <ul className="flex" aria-label={t.title}>
                {loop.map((head, index) => item(head, `a-${head.id}-${index}`, index >= heads.length))}
              </ul>
              <ul className="flex" aria-hidden="true">
                {loop.map((head, index) => item(head, `b-${head.id}-${index}`, true))}
              </ul>
            </div>
          </div>
          {arrow(1, t.next, ChevronRight, "right-0")}
        </div>
      </div>
    </section>
  );
}

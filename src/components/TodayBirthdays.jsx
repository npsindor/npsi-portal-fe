import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Cake, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { homeMembersApi } from "@/api/homeMembersApi";
import MemberAvatar from "@/components/MemberAvatar";
import { useLang } from "@/lib/i18n";

const COPY = {
  en: {
    title: "Today Birthday",
    wish: "Happy Birthday",
    wishLine: "Warm wishes from the Nimad Patidar Sangathan family!",
    none: "No birthdays today. Check back tomorrow! 🎂",
    loading: "Loading…",
    count: (n) => `${n} birthdays today`,
    slides: "Today's birthday wishes",
    slide: (i, n) => `${i} of ${n}`,
    prev: "Previous birthday",
    next: "Next birthday",
    goTo: (name) => `Show ${name}`,
  },
  hi: {
    title: "आज जन्मदिन",
    wish: "जन्मदिन की हार्दिक शुभकामनाएँ",
    wishLine: "निमाड़ पाटीदार संगठन परिवार की ओर से ढेरों शुभकामनाएँ!",
    none: "आज किसी का जन्मदिन नहीं है। कल फिर देखें! 🎂",
    loading: "लोड हो रहा है…",
    count: (n) => `आज ${n} जन्मदिन`,
    slides: "आज की जन्मदिन शुभकामनाएँ",
    slide: (i, n) => `${n} में से ${i}`,
    prev: "पिछला जन्मदिन",
    next: "अगला जन्मदिन",
    goTo: (name) => `${name} दिखाएँ`,
  },
};

const AUTOPLAY_MS = 4000;
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// One greeting card: a festive frame with the photo and name in the middle.
function BirthdayCard({ person, t }) {
  return (
    <div className="bday-card relative flex h-full min-h-[19rem] flex-col items-center justify-center overflow-hidden rounded-2xl px-4 py-6 text-center text-cream">
      <span className="bday-float bday-float-1" aria-hidden="true">🎈</span>
      <span className="bday-float bday-float-2" aria-hidden="true">🎉</span>
      <span className="bday-float bday-float-3" aria-hidden="true">🎈</span>
      <span className="bday-float bday-float-4" aria-hidden="true">✨</span>
      <span className="bday-confetti" aria-hidden="true" />
      <p className="relative px-8 font-display text-lg font-bold tracking-wide text-gold sm:text-xl">🎂 {t.wish}</p>
      <div className="bday-photo relative mt-4 rounded-full p-1">
        <MemberAvatar name={person.name} photoUrl={person.photoUrl} size={112} className="!border-4 !border-gold" />
      </div>
      <p className="relative mt-4 max-w-full break-words font-display text-xl font-bold leading-tight text-white">{person.name}</p>
      {person.place && (
        <p className="relative mt-1 inline-flex max-w-full items-center gap-1 text-sm text-cream/80">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{person.place}</span>
        </p>
      )}
      <p className="relative mt-3 max-w-[16rem] text-xs leading-relaxed text-cream/75">{t.wishLine}</p>
    </div>
  );
}

// Home page "Today Birthday" column: a greeting card (photo + name in the middle) for each adult member of the families
// an administrator chose to show whose birthday is today (India time). No birth date or age is shown.
// More than one birthday: A to Z by name, in a slider that moves on by itself (pauses on hover, focus or touch).
export default function TodayBirthdays() {
  const { lang } = useLang();
  const t = COPY[lang] || COPY.en;
  const [rows, setRows] = useState(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef(null);
  useEffect(() => {
    homeMembersApi.birthdays().then((list) => setRows(Array.isArray(list) ? list : [])).catch(() => setRows([]));
  }, []);
  const people = useMemo(
    () => (rows ? [...rows].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), lang === "hi" ? "hi" : "en", { sensitivity: "base" })) : null),
    [rows, lang],
  );
  const count = people?.length || 0;
  const go = useCallback((next) => setIndex((count + next) % Math.max(count, 1)), [count]);
  useEffect(() => {
    if (count < 2 || paused || reducedMotion()) return undefined;
    const timer = setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % count);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [count, paused]);
  useEffect(() => {
    if (index >= count && count > 0) setIndex(0);
  }, [count, index]);

  return (
    <section aria-labelledby="today-birthday-title" className="premium-card flex h-full min-w-0 flex-col p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <h2 id="today-birthday-title" className="flex items-center gap-2 whitespace-nowrap font-display text-xl font-semibold text-maroon">
          <Cake className="h-5 w-5 text-gold-dark" aria-hidden="true" />
          {t.title}
        </h2>
        {count > 1 && <span className="whitespace-nowrap rounded-full bg-gold/15 px-2.5 py-1 text-xs font-semibold text-gold-dark">{t.count(count)}</span>}
      </div>
      <div className="mt-4 flex-1">
        {people === null ? (
          <div className="bday-card min-h-[19rem] animate-pulse rounded-2xl opacity-60" aria-label={t.loading} role="status" />
        ) : count === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">{t.none}</p>
        ) : count === 1 ? (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <BirthdayCard person={people[0]} t={t} />
          </div>
        ) : (
          <div
            role="region"
            aria-roledescription="carousel"
            aria-label={t.slides}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}
            onTouchStart={(event) => { setPaused(true); touchX.current = event.touches[0].clientX; }}
            onTouchEnd={(event) => {
              const start = touchX.current;
              touchX.current = null;
              setPaused(false);
              if (start == null) return;
              const dx = event.changedTouches[0].clientX - start;
              if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") go(index + 1);
              if (event.key === "ArrowLeft") go(index - 1);
            }}
          >
            <div className="relative overflow-hidden rounded-2xl">
              <div className="bday-track flex" style={{ transform: `translateX(-${index * 100}%)` }} aria-live={paused ? "polite" : "off"}>
                {people.map((person, i) => (
                  <div
                    key={person.id}
                    role="group"
                    aria-roledescription="slide"
                    aria-label={t.slide(i + 1, count)}
                    aria-hidden={i !== index}
                    inert={i !== index ? "" : undefined}
                    className={`w-full shrink-0 transition-[opacity,transform] duration-700 ${i === index ? "scale-100 opacity-100" : "scale-95 opacity-40"}`}
                  >
                    <BirthdayCard person={person} t={t} />
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => go(index - 1)} aria-label={t.prev} className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-black/50 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => go(index + 1)} aria-label={t.next} className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-black/50 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
              {people.map((person, i) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={t.goTo(person.name)}
                  aria-current={i === index ? "true" : undefined}
                  className="flex h-6 items-center justify-center px-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <span className={`block h-2 rounded-full transition-all duration-500 ${i === index ? "w-6 bg-gold" : "w-2 bg-border"}`} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {count === 0 && <p className="mt-4 text-xs text-muted-foreground">{t.wishLine}</p>}
    </section>
  );
}

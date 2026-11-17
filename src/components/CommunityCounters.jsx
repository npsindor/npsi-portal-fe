import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, HeartHandshake, House } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Live community counts at the top of the home page. They come from GET /stats, which counts only
// what an admin has approved (ACTIVE families and students, APPROVED Sagun Bandhan profiles), so a
// new registration shows up here once it is approved. Refreshed every minute and whenever the
// visitor comes back to the tab.
const REFRESH_MS = 60_000;

const copy = {
  en: {
    heading: "Registered members",
    note: "Approved registrations · updated live",
    families: "Families",
    students: "Students",
    sagun: "Shagun Bandhan",
    familiesCta: "Register your family",
    studentsCta: "Student registration",
    sagunCta: "Explore Shagun Bandhan",
  },
  hi: {
    heading: "पंजीकृत सदस्य",
    note: "स्वीकृत पंजीकरण · लाइव अपडेट",
    families: "परिवार",
    students: "विद्यार्थी",
    sagun: "शगुन बंधन",
    familiesCta: "परिवार पंजीकरण करें",
    studentsCta: "विद्यार्थी पंजीकरण",
    sagunCta: "शगुन बंधन देखें",
  },
};

const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Counts up from the previous value to the new one (instantly when reduced motion is preferred).
function useCountUp(target) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (typeof target !== "number") return undefined;
    const start = from.current;
    if (prefersReducedMotion() || start === target) {
      from.current = target;
      setShown(target);
      return undefined;
    }
    const duration = 1200;
    const began = performance.now();
    let frame = 0;
    const tick = (now) => {
      const progress = Math.min(1, (now - began) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setShown(Math.round(start + (target - start) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else from.current = target;
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      from.current = target;
    };
  }, [target]);
  return shown;
}

function Counter({ icon: Icon, value, label, cta, to, accent, locale }) {
  const shown = useCountUp(value);
  const loading = typeof value !== "number";
  return (
    <Link
      to={to}
      title={cta}
      className="group flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-0.5 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold sm:flex-row sm:gap-2.5 sm:px-3 sm:py-1"
    >
      <span className="flex items-center gap-1.5 sm:gap-2.5">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white ring-1 ring-white/20 sm:h-8 sm:w-8 sm:rounded-lg"
          style={{ background: `linear-gradient(135deg, ${accent[0]}, ${accent[1]})` }}
          aria-hidden="true"
        >
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </span>
        <span className="font-display text-lg font-bold leading-none text-gold tabular-nums sm:text-2xl" aria-live="polite">
          {loading ? <span className="inline-block h-4 w-8 animate-pulse rounded bg-white/20 align-middle sm:h-5 sm:w-10" aria-label="…" /> : shown.toLocaleString(locale)}
        </span>
      </span>
      <span className="truncate text-[0.65rem] font-medium leading-tight text-cream/85 group-hover:text-cream sm:text-sm">{label}</span>
    </Link>
  );
}

export default function CommunityCounters({ lang }) {
  const t = copy[lang] || copy.en;
  const locale = lang === "hi" ? "hi-IN" : "en-IN";
  const [stats, setStats] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = () =>
      base44
        .stats()
        .then((data) => {
          if (!alive) return;
          setStats(data);
          setFailed(false);
        })
        .catch(() => {
          if (alive) setFailed(true);
        });
    load();
    const timer = setInterval(load, REFRESH_MS);
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Without numbers (API unreachable) the strip is left out rather than showing zeros.
  if (failed && !stats) return null;

  const items = [
    { key: "families", icon: House, value: stats?.families, label: t.families, cta: t.familiesCta, to: "/register", accent: ["#fbbf24", "#c2410c"] },
    { key: "students", icon: GraduationCap, value: stats?.students, label: t.students, cta: t.studentsCta, to: "/student-register", accent: ["#818cf8", "#3730a3"] },
    { key: "sagun", icon: HeartHandshake, value: stats?.sagunProfiles, label: t.sagun, cta: t.sagunCta, to: "/sagun", accent: ["#fb7185", "#9f1239"] },
  ];

  return (
    <section aria-labelledby="community-counters-heading" className="border-b border-white/10 bg-gradient-to-r from-maroon via-maroon to-maroon-dark text-cream">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-2 py-1.5 sm:px-6">
        <h2 id="community-counters-heading" className="sr-only">
          {t.heading}
        </h2>
        <p className="hidden shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cream/70 lg:inline-flex" title={t.note}>
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          {t.heading}
        </p>
        <div className="flex min-w-0 flex-1 items-stretch divide-x divide-white/15 lg:justify-end">
          {items.map(({ key, ...item }) => (
            <Counter key={key} {...item} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  );
}

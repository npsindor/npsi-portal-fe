import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUp, CalendarDays, MapPin, Bell, Users, ShieldCheck, Heart, BookOpen, ChevronRight, UserPlus, GraduationCap, ClipboardCheck, Info, ScrollText, HelpCircle } from "lucide-react";
import PublicNav from "@/components/PublicNav";
import { base44 } from "@/api/base44Client";
import { useT, useLang } from "@/lib/i18n";
import { localizedText } from "@/lib/utils";
import logoVideo from "@/images/logo.mp4";

export default function Home() {
  const t = useT();
  const { lang } = useLang();
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState({ families: 0, members: 0, events: 0 });
  const videoRef = useRef(null);
  const [needsSoundTap, setNeedsSoundTap] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = false;
    el.play().catch(() => {
      // Browser blocked unmuted autoplay; fall back to muted and ask the user to tap for sound.
      el.muted = true;
      setNeedsSoundTap(true);
      el.play().catch(() => {});
    });
  }, []);

  const enableSound = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = false;
    el.play().catch(() => {});
    setNeedsSoundTap(false);
  };

  useEffect(() => {
    (async () => {
      try {
        const evs = await base44.entities.Event.list("-date", 3);
        setEvents(evs.filter((e) => e.status === "PUBLISHED"));
      } catch (e) {}
      try {
        const anns = await base44.entities.Announcement.list("-date", 3);
        setAnnouncements(anns.filter((a) => a.status === "Active"));
      } catch (e) {}
      try {
        const { families, members } = await base44.stats();
        setStats((s) => ({ ...s, families, members }));
      } catch (e) {}
    })();
  }, []);

  const pillars = [
    { icon: Users, title: t("home.p1t"), desc: t("home.p1d") },
    { icon: CalendarDays, title: t("home.p2t"), desc: t("home.p2d") },
    { icon: BookOpen, title: t("home.p3t"), desc: t("home.p3d") },
    { icon: Heart, title: t("home.p4t"), desc: t("home.p4d") },
  ];

  const importantServices = [
    { icon: UserPlus, title: t("home.service1t"), desc: t("home.service1d"), cta: t("home.serviceCta"), to: "/register" },
    { icon: GraduationCap, title: t("home.service2t"), desc: t("home.service2d"), cta: t("home.serviceCta"), to: "/student-register" },
    { icon: CalendarDays, title: t("home.service3t"), desc: t("home.service3d"), cta: t("home.serviceCta"), to: "/events" },
    { icon: ClipboardCheck, title: t("home.service4t"), desc: t("home.service4d"), cta: t("home.serviceCta"), to: "/application-status" },
    { icon: Info, title: t("home.service5t"), desc: t("home.service5d"), cta: t("home.serviceCta"), to: "/about" },
    { icon: ScrollText, title: t("home.service6t"), desc: t("home.service6d"), cta: t("home.serviceCta"), to: "/rules" },
    { icon: HelpCircle, title: t("home.service7t"), desc: t("home.service7d"), cta: t("home.serviceCta"), to: "/help" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      {/* Hero band */}
      <section className="relative overflow-hidden hero-band text-cream">
        <div className="absolute inset-0 shell-grid opacity-[0.06]" />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-gold/10" />
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full border border-gold/10" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:gap-10 sm:px-6 sm:py-14 lg:grid-cols-12 lg:py-24">
          <div className="min-w-0 lg:col-span-7">
            <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-left text-[0.7rem] font-semibold leading-tight tracking-wide text-gold sm:text-xs">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t("home.badge")}
            </span>
            <h1 className="mt-5 break-words font-display text-3xl font-semibold leading-[1.1] text-cream sm:mt-6 sm:text-5xl lg:text-[3.4rem]">
              {t("home.title")}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-cream/75 sm:mt-5 sm:text-base">
              {t("home.subtitle")}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
              <Link
                to="/register"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-semibold text-maroon shadow-lg transition hover:bg-gold-light sm:w-auto sm:px-6"
              >
                {t("home.registerCta")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/application-status"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-cream/30 px-5 py-3 text-sm font-semibold text-cream transition hover:bg-cream/10 sm:w-auto sm:px-6"
              >
                {t("home.statusCta")}
              </Link>
              <Link
                to="/student-register"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-5 py-3 text-sm font-semibold text-gold transition hover:bg-gold/20 sm:w-auto sm:px-6"
              >
                <GraduationCap className="h-4 w-4" />
                {t("nav.students")}
              </Link>
            </div>
            <div className="mt-9 grid grid-cols-3 gap-3 sm:mt-10 sm:flex sm:items-center sm:gap-8">
              <div>
                <div className="font-display text-2xl font-bold text-gold sm:text-3xl">{stats.families}+</div>
                <div className="text-[0.6rem] uppercase leading-tight tracking-[0.1em] text-cream/60 sm:text-xs sm:tracking-[0.18em]">{t("home.families")}</div>
              </div>
              <div className="hidden h-10 w-px bg-cream/15 sm:block" />
              <div>
                <div className="font-display text-2xl font-bold text-gold sm:text-3xl">{stats.members}+</div>
                <div className="text-[0.6rem] uppercase leading-tight tracking-[0.1em] text-cream/60 sm:text-xs sm:tracking-[0.18em]">{t("home.members")}</div>
              </div>
              <div className="hidden h-10 w-px bg-cream/15 sm:block" />
              <div>
                <div className="font-display text-2xl font-bold text-gold sm:text-3xl">{events.length}</div>
                <div className="text-[0.6rem] uppercase leading-tight tracking-[0.1em] text-cream/60 sm:text-xs sm:tracking-[0.18em]">{t("home.upcomingEvents")}</div>
              </div>
            </div>
          </div>

          <div className="min-w-0 lg:col-span-5">
            <div className="rounded-2xl border border-gold/30 bg-maroon-dark/40 p-3 shadow-2xl backdrop-blur sm:p-6">
              <div className="relative">
                <video
                  ref={videoRef}
                  className="aspect-video w-full rounded-xl border border-gold/20 object-cover"
                  src={logoVideo}
                  autoPlay
                  loop
                  playsInline
                  controls
                  preload="auto"
                  aria-label="Patidar Samaj Sangathan logo"
                />
                {needsSoundTap && (
                  <button
                    type="button"
                    onClick={enableSound}
                    className="absolute bottom-3 right-3 rounded-full bg-maroon-dark/80 px-3 py-1.5 text-xs font-semibold text-cream shadow-lg backdrop-blur hover:bg-maroon-dark"
                  >
                    {t("home.tapForSound") || "🔊 Tap for sound"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community message marquee */}
      <div className="overflow-hidden border-b border-gold/20 bg-gold py-2.5 text-maroon" aria-label="Community message">
        <div className="marquee-track flex w-max whitespace-nowrap">
          <span className="px-4 text-sm font-semibold tracking-wide">
            एकता हमारी शक्ति • संगठन हमारी पहचान • सहयोग हमारा संस्कार • पारदर्शिता हमारा विश्वास • प्रगति, उन्नति एवं कल्याण हमारा संकल्प।
          </span>
          <span className="px-4 text-sm font-semibold tracking-wide" aria-hidden="true">
            एकता हमारी शक्ति • संगठन हमारी पहचान • सहयोग हमारा संस्कार • पारदर्शिता हमारा विश्वास • प्रगति, उन्नति एवं कल्याण हमारा संकल्प।
          </span>
        </div>
      </div>

      {/* Official announcements */}
      <section className="border-b border-gold/20 bg-maroon text-cream">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="flex items-center gap-2 border-b border-gold/20 pb-3">
            <Bell className="h-4 w-4 text-gold" />
            <Link to="/news" className="group inline-flex items-center gap-1.5 font-display text-sm font-semibold tracking-wide text-gold hover:text-gold-light">
              {t("home.announcements")} <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {announcements.length === 0 && (
              <p className="text-sm text-cream/60">{t("home.noAnnouncements")}</p>
            )}
            {announcements.map((a) => (
              <div key={a.id} className="rounded-xl border border-gold/15 bg-cream/5 p-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[0.6rem] font-semibold text-gold">{a.type}</span>
                  <span className="text-[0.65rem] text-cream/50">
                    {a.date ? new Date(a.date).toLocaleDateString("en-IN") : ""}
                  </span>
                </div>
                <div className="mt-1.5 text-sm font-semibold text-cream">{localizedText(a, "title", lang)}</div>
                <p className="mt-1 text-xs leading-relaxed text-cream/70 line-clamp-2">{localizedText(a, "body", lang)}</p>
              </div>
            ))}
          </div>
          <Link to="/news" className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-gold hover:text-gold-light">
            {t("news.viewAll")} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <div className="mx-auto h-1 w-12 rounded-full bg-gold/60" />
          <h2 className="mt-4 section-title">{t("home.pillarsTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("home.pillarsSub")}</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p) => (
            <div key={p.title} className="premium-card group p-6 transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-maroon/10 ring-1 ring-gold/20 transition group-hover:bg-maroon">
                <p.icon className="h-5 w-5 text-maroon transition group-hover:text-gold" />
              </div>
              <h3 className="mt-5 font-display text-base font-semibold text-maroon">{p.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Important services */}
      <section className="border-y border-gold/20 bg-card">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="h-1 w-12 rounded-full bg-gold/60" />
              <h2 className="mt-4 section-title">{t("home.servicesTitle")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t("home.servicesSub")}</p>
            </div>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {importantServices.map((service) => (
              <Link
                key={service.to}
                to={service.to}
                className="group premium-card flex min-h-52 flex-col p-6 transition hover:-translate-y-1 hover:border-gold hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-maroon text-gold shadow-sm transition group-hover:bg-gold group-hover:text-maroon">
                  <service.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-base font-semibold text-maroon">{service.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{service.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-maroon">
                  {service.cta} <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming events */}
      <section className="border-y border-gold/20 bg-cream/60">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="flex items-end justify-between">
            <div>
              <div className="h-1 w-12 rounded-full bg-gold/60" />
              <h2 className="mt-4 section-title">{t("home.upcomingTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("home.upcomingSub")}</p>
            </div>
            <Link to="/events" className="hidden items-center gap-1 text-sm font-semibold text-maroon hover:gap-2 sm:inline-flex">
              {t("home.viewAll")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {events.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
                {t("home.noEvents")}
              </div>
            )}
            {events.map((ev) => (
              <div key={ev.id} className="premium-card group overflow-hidden">
                <div className="relative h-40 bg-gradient-to-br from-maroon to-maroon-dark">
                  {ev.banner_url && <img src={ev.banner_url} alt={localizedText(ev, "title", lang)} loading="lazy" decoding="async" className="h-full w-full object-cover" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-maroon/60 to-transparent" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5 text-gold" />
                    {ev.date ? new Date(ev.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    <span className="text-border">·</span>
                    <MapPin className="h-3.5 w-3.5 text-gold" />
                    {ev.venue}
                  </div>
                  <h3 className="mt-2 font-display text-base font-semibold text-maroon">{localizedText(ev, "title", lang)}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">{localizedText(ev, "description", lang)}</p>
                  <Link to="/events" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-maroon hover:gap-2">
                    {t("home.viewEvent")} <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-maroon text-cream">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/50">
                  <span className="font-display text-lg font-semibold text-gold">P</span>
                </div>
                <div>
                  <div className="font-display text-sm font-semibold text-gold">PATIDAR SAMAJ SANGATHAN</div>
                  <div className="text-[0.6rem] uppercase tracking-[0.18em] text-cream/70">Indore (Nimar)</div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-cream/70">{t("footer.tagline")}</p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold">
                <Users className="h-3.5 w-3.5" />
                {t("nav.membersHint", { n: stats.members })}
              </div>
            </div>
            <div>
              <h4 className="font-display text-sm font-semibold text-gold">{t("footer.quickLinks")}</h4>
              <ul className="mt-3 space-y-2 text-sm text-cream/70">
                <li><Link to="/about" className="hover:text-gold">{t("footer.about")}</Link></li>
                <li><Link to="/events" className="hover:text-gold">{t("footer.events")}</Link></li>
                <li><Link to="/register" className="hover:text-gold">{t("footer.registration")}</Link></li>
                <li><Link to="/application-status" className="hover:text-gold">{t("footer.appStatus")}</Link></li>
                <li><Link to="/rules" className="hover:text-gold">{t("nav.rules")}</Link></li>
                <li><Link to="/principles" className="hover:text-gold">{t("nav.principles")}</Link></li>
                <li><Link to="/news" className="hover:text-gold">{t("nav.news")}</Link></li>
                <li><Link to="/help" className="hover:text-gold">{t("footer.help")}</Link></li>
                <li><Link to="/admin" className="hover:text-gold">{t("footer.adminAccess")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display text-sm font-semibold text-gold">{t("footer.contact")}</h4>
              <ul className="mt-3 space-y-2 text-sm text-cream/70">
                <li><Link to="/portal" className="hover:text-gold">{t("footer.memberPortal")}</Link></li>
                <li>Nimar, Indore, Madhya Pradesh</li>
                <li><a href="mailto:info@npsindore.org" className="hover:text-gold">info@npsindore.org</a></li>
                <li><a href="tel:9179856878" className="hover:text-gold">9179856878</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-gold/20 pt-5 text-center text-xs text-cream/60 sm:flex-row">
            <span>© {new Date().getFullYear()} Nimar Patidar Sangathan – Indore. {t("footer.rights")}</span>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, left: 0, behavior: "smooth" })}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 text-gold transition hover:bg-gold hover:text-maroon"
              title="Back to top"
              aria-label="Back to top"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
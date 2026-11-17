import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, MapPin, Bell, Users, UsersRound, Heart, BookOpen, UserPlus, GraduationCap, ClipboardCheck, Info, ScrollText, HelpCircle, Briefcase, Bus, Stethoscope, House, MessageSquare, Phone, Newspaper, HeartHandshake, Landmark, Sparkles } from "lucide-react";
import { usePublicCopy } from '@/lib/public-copy';
import PublicFooter from '@/components/PublicFooter';
import CommunityHighlights, { ParticipationSection } from '@/components/CommunityHighlights';
import HomeShowcase from '@/components/HomeShowcase';
import CommunityCounters from '@/components/CommunityCounters';
import HomeLogoCarousel from '@/components/HomeLogoCarousel';
import PublicNav from "@/components/PublicNav";
import { introCopy, usePageContent } from "@/components/PageContent";
import { base44 } from "@/api/base44Client";
import { useT, useLang } from "@/lib/i18n";
import { localizedText } from "@/lib/utils";

// Announcement `type` values (Admin → Sandesh) → [English, Hindi] badge text.
const ANNOUNCEMENT_TYPES = { Notice: ["Notice", "सूचना"], Urgent: ["Urgent", "अत्यावश्यक"], News: ["News", "समाचार"], Festival: ["Festival", "त्योहार"], General: ["General", "सामान्य"], Event: ["Event", "कार्यक्रम"] };
import { flatNavigation } from "@/lib/public-navigation";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { calendarDate } from "@/lib/dates";

// Icon and 3D-tile colours (light, deep) for each service card.
const serviceIcons = {
  "About Us": [Landmark, "#3b82c4", "#123a63"],
  "Events & Programs": [CalendarDays, "#fbbf24", "#c2410c"],
  "Community Services": [HeartHandshake, "#f472b6", "#be185d"],
  "Career & Business": [Briefcase, "#818cf8", "#3730a3"],
  Sandesh: [Newspaper, "#38bdf8", "#0369a1"],
  "Shagun Bandhan": [UsersRound, "#fb7185", "#9f1239"],
  Transportation: [Bus, "#facc15", "#b45309"],
  "Health Support": [Stethoscope, "#34d399", "#047857"],
  "Room Hunting": [House, "#a78bfa", "#6d28d9"],
  Feedback: [MessageSquare, "#2dd4bf", "#0f766e"],
  "Contact Us": [Phone, "#e6c86e", "#9a6f12"],
};

// Published events for the homepage: upcoming ones first (soonest first), then completed ones (most recent first).
const homeEvents = (rows) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const published = rows.filter((e) => e.status === "PUBLISHED").map((e) => ({ ...e, completed: Boolean(e.date) && calendarDate(e.date) < today }));
  const time = (e) => (e.date ? calendarDate(e.date).getTime() : Infinity);
  const upcoming = published.filter((e) => !e.completed).sort((a, b) => time(a) - time(b));
  const completed = published.filter((e) => e.completed).sort((a, b) => time(b) - time(a));
  return [...upcoming, ...completed].slice(0, 9);
};

export default function Home() {
  const t = useT();
  const c = usePublicCopy();
  const { lang } = useLang();
  const [events, setEvents] = useState([]);
  const [eventCarouselApi, setEventCarouselApi] = useState(null);
  const [activeEventSlide, setActiveEventSlide] = useState(0);
  const [eventSlideCount, setEventSlideCount] = useState(0);
  const [announcements, setAnnouncements] = useState([]);
  // Section heading and text from Admin → Page Content → Home → Events; built-in copy otherwise.
  const pageContent = usePageContent("home");
  const eventsCopy = introCopy(pageContent.intro("events"), lang, t("home.upcomingTitle"), t("home.upcomingSub"));

  useEffect(() => {
    (async () => {
      try {
        const evs = await base44.entities.Event.list("-date", 50);
        setEvents(homeEvents(evs));
      } catch {}
      try {
        const anns = await base44.entities.Announcement.list("-date", 3);
        setAnnouncements(anns.filter((a) => a.status === "Active"));
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (!eventCarouselApi) return;
    const updateCarouselState = () => {
      setActiveEventSlide(eventCarouselApi.selectedScrollSnap());
      setEventSlideCount(eventCarouselApi.scrollSnapList().length);
    };
    updateCarouselState();
    eventCarouselApi.on("select", updateCarouselState);
    eventCarouselApi.on("reInit", updateCarouselState);
    return () => {
      eventCarouselApi.off("select", updateCarouselState);
      eventCarouselApi.off("reInit", updateCarouselState);
    };
  }, [eventCarouselApi]);

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
  const menuServices = flatNavigation
    .filter((item) => item.label !== "Home" && serviceIcons[item.label])
    .map((item) => ({ ...item, icon: serviceIcons[item.label][0], colors: serviceIcons[item.label].slice(1), title: c(item.label) }));
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      <main>
        <CommunityCounters lang={lang} />
        <section id="services" className="border-b border-border bg-card">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-12 lg:gap-10">
            <div className="min-w-0 lg:col-span-4">
              <HomeLogoCarousel />
            </div>
            <div className="min-w-0 lg:col-span-8">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <span className="eyebrow">{lang === "hi" ? "एक ही जगह पर" : "One trusted place"}</span>
                <h1 className="mt-3 section-title">{lang === "hi" ? "समुदाय की सेवाएँ" : "Explore community services"}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{lang === "hi" ? "सदस्यता, शिक्षा, कार्यक्रम और सामुदायिक सहयोग के लिए जरूरी सेवाओं तक जल्दी पहुँचें।" : "Quick access to membership, education, events and practical community support."}</p>
              </div>
              <Link to="/help" className="inline-flex min-h-10 items-center gap-2 self-start text-sm font-semibold text-maroon hover:text-gold-dark sm:self-auto">
                {lang === "hi" ? "पोर्टल गाइड" : "Portal guide"} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
              {menuServices.map((service) => (
                <Link key={service.label} to={service.to} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition hover:-translate-y-1 hover:border-gold/60 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                  <span className="service-thumb" style={{ "--c1": service.colors[0], "--c2": service.colors[1], borderRadius: 0 }} aria-hidden="true">
                    <span className="service-icon-3d">
                      <service.icon />
                    </span>
                  </span>
                  <span className="flex items-center justify-between gap-2 px-3 py-3 text-sm font-semibold leading-snug text-foreground">
                    <span className="min-w-0">{service.title}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-gold transition group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
            </div>
          </div>
        </section>

        <section className="border-y border-gold/20 bg-background">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="eyebrow"><Sparkles className="h-3.5 w-3.5" /> {lang === "hi" ? "शुरुआत करें" : "Get started"}</span>
                <h2 className="mt-3 section-title">{t("home.servicesTitle")}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{t("home.servicesSub")}</p>
              </div>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {importantServices.slice(0, 4).map((service) => (
                <Link key={service.to} to={service.to} className="group premium-card flex min-h-48 flex-col p-5 transition hover:-translate-y-1 hover:border-gold/60 hover:shadow-lg sm:p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-maroon text-gold transition group-hover:bg-gold group-hover:text-maroon"><service.icon className="h-5 w-5" /></span>
                  <h3 className="mt-4 font-display text-base font-semibold text-foreground">{service.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{service.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-maroon">{service.cta} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <ParticipationSection />

        <section id="updates" className="border-y border-border bg-background">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="eyebrow"><Bell className="h-3.5 w-3.5" /> {lang === "hi" ? "आधिकारिक जानकारी" : "From the Sangathan"}</span>
                <h2 className="mt-3 section-title">{t("home.announcements")}</h2>
              </div>
              <Link to="/news" className="hidden items-center gap-2 text-sm font-semibold text-maroon hover:text-gold-dark sm:inline-flex">{t("news.viewAll")} <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {announcements.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">{t("home.noAnnouncements")}</div>}
              {announcements.map((announcement) => (
                <article key={announcement.id} className="premium-card p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-gold/15 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-amber-800">{ANNOUNCEMENT_TYPES[announcement.type]?.[lang === "hi" ? 1 : 0] || announcement.type}</span>
                    <time className="text-xs text-muted-foreground">{announcement.date ? new Date(announcement.date).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN") : ""}</time>
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold text-foreground">{localizedText(announcement, "title", lang)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-3">{localizedText(announcement, "body", lang)}</p>
                </article>
              ))}
            </div>
            <Link to="/news" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-maroon sm:hidden">{t("news.viewAll")} <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>

        <section className="bg-card">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
            <div className="max-w-2xl">
              <span className="eyebrow">{lang === "hi" ? "हमारी प्रतिबद्धता" : "What brings us together"}</span>
              <h2 className="mt-3 section-title">{t("home.pillarsTitle")}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("home.pillarsSub")}</p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {pillars.map((pillar, index) => (
                <article key={pillar.title} className="rounded-2xl border border-border bg-background p-5 sm:p-6">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${index % 2 ? "bg-gold/15 text-amber-700" : "bg-maroon/10 text-maroon"}`}><pillar.icon className="h-5 w-5" /></span>
                  <h3 className="mt-5 font-display text-base font-semibold text-foreground">{pillar.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pillar.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="events" className="bg-card">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
            <div className="flex items-end justify-between gap-4">
              <div>
                <span className="eyebrow"><CalendarDays className="h-3.5 w-3.5" /> {lang === "hi" ? "समाज कैलेंडर" : "Community calendar"}</span>
                <h2 className="mt-3 section-title">{eventsCopy.title}</h2>
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{eventsCopy.intro}</p>
              </div>
              <Link to="/events" className="hidden items-center gap-2 text-sm font-semibold text-maroon hover:text-gold-dark sm:inline-flex">{t("home.viewAll")} <ArrowRight className="h-4 w-4" /></Link>
            </div>
            {events.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{t("home.noEvents")}</div>
            ) : (
              <>
                <Carousel
                  setApi={setEventCarouselApi}
                  opts={{ align: "start", loop: events.length > 1 }}
                  aria-label={lang === "hi" ? "आगामी कार्यक्रम कैरोसेल" : "Upcoming events carousel"}
                  className="mt-8 px-1 sm:px-12"
                >
                  <CarouselContent className="-ml-4">
                    {events.map((event) => (
                      <CarouselItem key={event.id} className="pl-4 md:basis-1/2 xl:basis-1/3">
                        <article className="premium-card group h-full overflow-hidden transition hover:-translate-y-1 hover:shadow-lg">
                          <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-maroon to-maroon-dark">
                            {event.bannerUrl && <img src={event.bannerUrl} alt={localizedText(event, "title", lang)} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
                            {!event.bannerUrl && <CalendarDays className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 text-gold/70" />}
                            {event.completed && <span className="absolute left-3 top-3 rounded-full bg-maroon-dark/85 px-3 py-1 text-xs font-semibold text-cream backdrop-blur">{lang === "hi" ? "संपन्न" : "Completed"}</span>}
                          </div>
                          <div className="p-5">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <CalendarDays className="h-3.5 w-3.5 text-gold" />
                              {event.date ? calendarDate(event.date).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                              {localizedText(event, "venue", lang) && <><span className="text-border">·</span><MapPin className="h-3.5 w-3.5 text-gold" /><span className="line-clamp-1">{localizedText(event, "venue", lang)}</span></>}
                            </div>
                            <h3 className="mt-3 font-display text-lg font-semibold text-foreground">{localizedText(event, "title", lang)}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-3">{localizedText(event, "description", lang)}</p>
                            <Link to="/events" className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-maroon">{t("home.viewEvent")} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></Link>
                          </div>
                        </article>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {eventSlideCount > 1 && <>
                    <CarouselPrevious aria-label={lang === "hi" ? "पिछला कार्यक्रम" : "Previous event"} className="left-0 border-border bg-background text-foreground shadow-md hover:bg-muted" />
                    <CarouselNext aria-label={lang === "hi" ? "अगला कार्यक्रम" : "Next event"} className="right-0 border-border bg-background text-foreground shadow-md hover:bg-muted" />
                  </>}
                </Carousel>
                {eventSlideCount > 1 && (
                  <div className="mt-5 flex justify-center gap-2" role="group" aria-label={lang === "hi" ? "कार्यक्रम स्लाइड चुनें" : "Choose event slide"}>
                    {Array.from({ length: eventSlideCount }, (_, index) => (
                      <button
                        key={index}
                        type="button"
                        aria-label={`${lang === "hi" ? "कार्यक्रम" : "Event"} ${index + 1}`}
                        aria-current={activeEventSlide === index ? "true" : undefined}
                        onClick={() => eventCarouselApi?.scrollTo(index)}
                        className={`h-2.5 rounded-full transition-all ${activeEventSlide === index ? "w-7 bg-maroon" : "w-2.5 bg-border hover:bg-gold"}`}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
            <Link to="/events" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-maroon sm:hidden">{t("home.viewAll")} <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>

        <CommunityHighlights afterServices={<HomeShowcase lang={lang} events={events} />} />
      </main>
      <PublicFooter />
    </div>
  );
}

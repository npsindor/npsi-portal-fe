import React, { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Clock, Drama, IndianRupee, MapPin, Music2, Sparkles, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import PublicFooter from "@/components/PublicFooter";
import PublicNav from "@/components/PublicNav";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { usePageContent } from "@/components/PageContent";
import { CardSkeleton, DateTile, EmptyState, PageHero, SectionBlock, SectionOverview, formatDate, useSectionLanding } from "@/components/PageSections";
import { base44 } from "@/api/base44Client";
import { useLang } from "@/lib/i18n";
import { localizedText } from "@/lib/utils";

const copy = {
  en: {
    eyebrow: "Events & Programs", title: "Celebrations that bring our samaj together", intro: "From Maa Na Garba to cultural evenings and community gatherings — every programme of the Sangathan in one place.",
    garba: "Maa Na Garba", garbaSummary: "Our signature Navratri celebration of devotion and dance.", garbaIntro: "Nine nights of devotion, music and togetherness — the Sangathan's biggest celebration of the year.",
    cultural: "Cultural Programs", culturalSummary: "Music, traditions and family programmes through the year.", culturalIntro: "Programmes that keep our Nimar traditions, music and values alive for every generation.",
    calendar: "Event Calendar", calendarSummary: "Every upcoming programme, month by month.", calendarIntro: "All upcoming programmes of the Sangathan, month by month.",
    noGarba: "Maa Na Garba details will be announced soon.", noCultural: "No cultural programmes are published right now.", noUpcoming: "No upcoming events are scheduled yet.",
    past: "Past events", details: "View details", register: "Register in member portal", free: "Free", fee: "Fee", time: "Time", venue: "Venue", organizer: "Organizer", featured: "Featured",
    GARBA: "Maa Na Garba", CULTURAL: "Cultural", GENERAL: "Community", upcoming: "upcoming",
  },
  hi: {
    eyebrow: "कार्यक्रम एवं आयोजन", title: "समाज को एक साथ लाने वाले उत्सव", intro: "माँ ना गरबा से लेकर सांस्कृतिक संध्याओं और सामाजिक मिलन तक — संगठन के सभी कार्यक्रम एक ही जगह।",
    garba: "माँ ना गरबा", garbaSummary: "भक्ति और नृत्य का हमारा प्रमुख नवरात्रि उत्सव।", garbaIntro: "भक्ति, संगीत और एकता की नौ रातें — संगठन का वर्ष का सबसे बड़ा उत्सव।",
    cultural: "सांस्कृतिक कार्यक्रम", culturalSummary: "पूरे वर्ष संगीत, परंपरा और पारिवारिक कार्यक्रम।", culturalIntro: "ऐसे कार्यक्रम जो हर पीढ़ी के लिए हमारी निमाड़ी परंपराओं, संगीत और मूल्यों को जीवित रखते हैं।",
    calendar: "कार्यक्रम कैलेंडर", calendarSummary: "सभी आगामी कार्यक्रम, महीनेवार।", calendarIntro: "संगठन के सभी आगामी कार्यक्रम, महीनेवार।",
    noGarba: "माँ ना गरबा की जानकारी जल्द घोषित की जाएगी।", noCultural: "अभी कोई सांस्कृतिक कार्यक्रम प्रकाशित नहीं है।", noUpcoming: "अभी कोई आगामी कार्यक्रम निर्धारित नहीं है।",
    past: "पिछले कार्यक्रम", details: "विवरण देखें", register: "सदस्य पोर्टल में पंजीकरण करें", free: "निःशुल्क", fee: "शुल्क", time: "समय", venue: "स्थान", organizer: "आयोजक", featured: "मुख्य",
    GARBA: "माँ ना गरबा", CULTURAL: "सांस्कृतिक", GENERAL: "सामाजिक", upcoming: "आगामी",
  },
};

const SECTIONS = {
  garba: { icon: Music2, colors: ["#fb7185", "#9f1239"] },
  cultural: { icon: Drama, colors: ["#a78bfa", "#6d28d9"] },
  calendar: { icon: CalendarDays, colors: ["#fbbf24", "#c2410c"] },
};
const today = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
const dayOf = (value) => String(value || "").slice(0, 10);
const byDate = (a, b) => dayOf(a.date).localeCompare(dayOf(b.date));

export default function Events() {
  const { lang } = useLang();
  const t = copy[lang] || copy.en;
  const content = usePageContent("events");
  const [events, setEvents] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    document.title = `${t.eyebrow} | ${lang === "hi" ? "निमाड़ पाटीदार संगठन, इंदौर" : "Nimar Patidar Sangathan, Indore"}`;
  }, [t, lang]);
  useEffect(() => {
    base44.entities.Event.list("-date", 200)
      .then((rows) => setEvents(rows.filter((event) => event.status === "PUBLISHED")))
      .catch(() => setEvents([]));
  }, []);
  useSectionLanding({}, events !== null);

  const now = today();
  const all = events || [];
  const isUpcoming = (event) => dayOf(event.date) >= now;
  // Upcoming first (soonest first), then past (most recent first).
  const ordered = (list) => [...list.filter(isUpcoming).sort(byDate), ...list.filter((event) => !isUpcoming(event)).sort((a, b) => byDate(b, a))];
  const garba = ordered(all.filter((event) => event.category === "GARBA"));
  const cultural = ordered(all.filter((event) => event.category === "CULTURAL"));
  const upcoming = all.filter(isUpcoming).sort(byDate);
  const past = all.filter((event) => !isUpcoming(event)).sort((a, b) => byDate(b, a)).slice(0, 12);
  const months = upcoming.reduce((groups, event) => {
    const key = dayOf(event.date).slice(0, 7);
    (groups[key] ||= []).push(event);
    return groups;
  }, {});
  const title = (event) => localizedText(event, "title", lang);
  const fee = (event) => (Number(event.fee) > 0 ? `₹${Number(event.fee).toLocaleString("en-IN")}` : t.free);

  const EventCard = ({ event, large = false }) => (
    <article className={`group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-lg ${large ? "lg:flex-row" : ""}`}>
      <div className={`relative shrink-0 overflow-hidden bg-gradient-to-br from-maroon to-maroon-dark ${large ? "aspect-video lg:aspect-auto lg:w-1/2" : "aspect-video"}`}>
        {event.bannerUrl
          ? <img src={event.bannerUrl} alt={title(event)} loading="lazy" decoding="async" className="h-full w-full object-contain transition duration-500 group-hover:scale-105" />
          : <CalendarDays className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 text-gold/60" aria-hidden="true" />}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-maroon shadow">{formatDate(event.date, lang)}</span>
        <span className="absolute right-3 top-3 rounded-full bg-gold px-2.5 py-1 text-xs font-bold text-maroon shadow">{fee(event)}</span>
      </div>
      <div className={`flex flex-1 flex-col p-5 ${large ? "lg:p-8" : ""}`}>
        {large && <span className="mb-2 inline-flex items-center gap-1.5 self-start rounded-full bg-gold/15 px-2.5 py-0.5 text-xs font-semibold text-gold-dark"><Sparkles className="h-3.5 w-3.5" aria-hidden="true" />{t.featured}</span>}
        <h3 className={`font-display font-semibold leading-snug text-foreground ${large ? "text-2xl lg:text-3xl" : "text-lg"}`}>{title(event)}</h3>
        <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          {event.startTime && <li className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0 text-gold-dark" aria-hidden="true" />{event.startTime}{event.endTime ? ` – ${event.endTime}` : ""}</li>}
          {event.venue && <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" aria-hidden="true" />{localizedText(event, "venue", lang)}</li>}
        </ul>
        <p className={`mt-3 flex-1 text-sm leading-relaxed text-muted-foreground ${large ? "line-clamp-4" : "line-clamp-2"}`}>{localizedText(event, "description", lang)}</p>
        <button type="button" onClick={() => setSelected(event)} className="mt-4 inline-flex min-h-10 items-center gap-1.5 self-start text-sm font-semibold text-maroon transition hover:text-gold-dark">
          {t.details}<span className="sr-only">: {title(event)}</span> <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
  const CalendarRow = ({ event }) => (
    <li className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
      <DateTile value={event.date} lang={lang} />
      <div className="min-w-0 flex-1">
        <span className="rounded-full bg-muted px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">{t[event.category] || t.GENERAL}</span>
        <h3 className="mt-1.5 font-semibold text-foreground">{title(event)}</h3>
        {event.description && <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{localizedText(event, "description", lang)}</p>}
        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {event.startTime && <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{event.startTime}</span>}
          {event.venue && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{localizedText(event, "venue", lang)}</span>}
          <span className="inline-flex items-center gap-1.5"><IndianRupee className="h-3.5 w-3.5" aria-hidden="true" />{fee(event)}</span>
        </p>
      </div>
      <button type="button" onClick={() => setSelected(event)} className="inline-flex min-h-10 items-center justify-center gap-1.5 self-start rounded-full border border-border px-4 text-sm font-semibold text-maroon transition hover:border-gold/60 sm:self-center">
        {t.details}<span className="sr-only">: {title(event)}</span>
      </button>
    </li>
  );

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main id="main-content">
        <PageHero block={content.intro("hero")} eyebrow={t.eyebrow} title={t.title} intro={t.intro} icon={Ticket} lang={lang} />
        <SectionOverview
          lang={lang}
          sections={[
            { id: "garba", title: t.garba, summary: t.garbaSummary, count: events ? garba.length : undefined, ...SECTIONS.garba },
            { id: "cultural", title: t.cultural, summary: t.culturalSummary, count: events ? cultural.length : undefined, ...SECTIONS.cultural },
            { id: "calendar", title: t.calendar, summary: t.calendarSummary, count: events ? upcoming.length : undefined, ...SECTIONS.calendar },
          ]}
        />

        <SectionBlock id="garba" block={content.intro("garba")} lang={lang} eyebrow="01" title={t.garba} intro={t.garbaIntro} {...SECTIONS.garba}>
          {events === null ? <CardSkeleton count={2} /> : garba.length === 0 ? <EmptyState>{t.noGarba}</EmptyState> : (
            <div className="grid gap-5">
              <EventCard event={garba[0]} large />
              {garba.length > 1 && <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{garba.slice(1).map((event) => <EventCard key={event.id} event={event} />)}</div>}
            </div>
          )}
        </SectionBlock>

        <SectionBlock id="cultural" block={content.intro("cultural")} lang={lang} eyebrow="02" title={t.cultural} intro={t.culturalIntro} tone="muted" {...SECTIONS.cultural}>
          {events === null ? <CardSkeleton /> : cultural.length === 0 ? <EmptyState>{t.noCultural}</EmptyState> : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{cultural.map((event) => <EventCard key={event.id} event={event} />)}</div>
          )}
        </SectionBlock>

        <SectionBlock id="calendar" block={content.intro("calendar")} lang={lang} eyebrow="03" title={t.calendar} intro={t.calendarIntro} {...SECTIONS.calendar}>
          {events === null ? <CardSkeleton count={2} /> : (
            <div className="space-y-8">
              {upcoming.length === 0 ? <EmptyState>{t.noUpcoming}</EmptyState> : Object.entries(months).map(([month, list]) => (
                <div key={month}>
                  <h3 className="mb-3 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.14em] text-gold-dark">
                    {formatDate(`${month}-01`, lang, { month: "long", year: "numeric" })}
                    <span className="h-px flex-1 bg-border" aria-hidden="true" />
                    <span className="text-xs font-medium normal-case tracking-normal text-muted-foreground">{list.length} {t.upcoming}</span>
                  </h3>
                  <ol className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">{list.map((event) => <CalendarRow key={event.id} event={event} />)}</ol>
                </div>
              ))}
              {past.length > 0 && (
                <details className="group rounded-2xl border border-border bg-muted/30">
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-5 text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                    {t.past} ({past.length})<ArrowRight className="h-4 w-4 transition group-open:rotate-90" aria-hidden="true" />
                  </summary>
                  <ol className="divide-y divide-border border-t border-border opacity-80">{past.map((event) => <CalendarRow key={event.id} event={event} />)}</ol>
                </details>
              )}
            </div>
          )}
        </SectionBlock>
      </main>

      <Dialog open={!!selected} onOpenChange={(value) => { if (!value) setSelected(null); }}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
          {selected && <>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-dark">{t[selected.category] || t.GENERAL}</p>
            <DialogTitle className="font-display text-2xl leading-snug text-maroon">{title(selected)}</DialogTitle>
            <DialogDescription className="sr-only">{localizedText(selected, "venue", lang)}</DialogDescription>
            {selected.bannerUrl && <img src={selected.bannerUrl} alt={title(selected)} className="max-h-[50dvh] w-full rounded-xl object-contain" />}
            <dl className="grid gap-3 rounded-xl bg-muted/50 p-4 text-sm sm:grid-cols-2">
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.calendar}</dt><dd className="mt-0.5 font-medium">{formatDate(selected.date, lang, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</dd></div>
              {selected.startTime && <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.time}</dt><dd className="mt-0.5 font-medium">{selected.startTime}{selected.endTime ? ` – ${selected.endTime}` : ""}</dd></div>}
              {selected.venue && <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.venue}</dt><dd className="mt-0.5 font-medium">{localizedText(selected, "venue", lang)}</dd></div>}
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.fee}</dt><dd className="mt-0.5 font-medium">{fee(selected)}</dd></div>
              {selected.organizer && <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.organizer}</dt><dd className="mt-0.5 font-medium">{localizedText(selected, "organizer", lang)}</dd></div>}
            </dl>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{localizedText(selected, "description", lang)}</p>
            <Link to="/portal/events" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-maroon px-5 py-2 text-sm font-semibold text-cream hover:bg-maroon-dark">{t.register} <ArrowRight className="h-4 w-4" /></Link>
          </>}
        </DialogContent>
      </Dialog>
      <PublicFooter />
    </div>
  );
}

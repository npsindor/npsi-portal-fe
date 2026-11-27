import React, { useEffect, useState } from "react";
import { ArrowRight, CalendarCheck, CalendarDays, Clock, History, MapPin, Sparkles, Ticket } from "lucide-react";
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
    upcoming: "Current & Upcoming Events", upcomingIntro: "Discover upcoming celebrations, cultural programmes and community gatherings.", upcomingSummary: "Programmes happening today and coming up next.",
    noUpcoming: "No upcoming events are scheduled yet. New programmes will appear here as soon as they are announced.",
    calendar: "Event Calendar", calendarIntro: "Explore all upcoming programmes month by month.", calendarSummary: "All upcoming programmes, month by month.",
    past: "Past Events", pastIntro: "Relive the memorable moments and celebrations of our Sangathan.", pastSummary: "Programmes the Sangathan has celebrated.",
    noPast: "No past events yet. Completed programmes will be kept here.",
    details: "View Details", register: "Register", registerPortal: "Register in member portal", free: "Free", fee: "Fee", date: "Date", time: "Time", venue: "Venue", organizer: "Organizer",
    today: "Today", completed: "Completed", events: "events", event: "event",
    GARBA: "Maa Na Garba", CULTURAL: "Cultural", GENERAL: "Community",
  },
  hi: {
    eyebrow: "कार्यक्रम एवं आयोजन", title: "समाज को एक साथ लाने वाले उत्सव", intro: "माँ ना गरबा से लेकर सांस्कृतिक संध्याओं और सामाजिक मिलन तक — संगठन के सभी कार्यक्रम एक ही जगह।",
    upcoming: "वर्तमान एवं आगामी कार्यक्रम", upcomingIntro: "आगामी उत्सवों, सांस्कृतिक कार्यक्रमों और सामाजिक मिलन के बारे में जानें।", upcomingSummary: "आज और आगे होने वाले कार्यक्रम।",
    noUpcoming: "अभी कोई आगामी कार्यक्रम निर्धारित नहीं है। नए कार्यक्रम घोषित होते ही यहाँ दिखेंगे।",
    calendar: "कार्यक्रम कैलेंडर", calendarIntro: "सभी आगामी कार्यक्रम महीनेवार देखें।", calendarSummary: "सभी आगामी कार्यक्रम, महीनेवार।",
    past: "पिछले कार्यक्रम", pastIntro: "संगठन के यादगार पलों और उत्सवों को फिर से जिएँ।", pastSummary: "संगठन द्वारा मनाए गए कार्यक्रम।",
    noPast: "अभी कोई पिछला कार्यक्रम नहीं है। संपन्न कार्यक्रम यहाँ रखे जाएँगे।",
    details: "विवरण देखें", register: "पंजीकरण करें", registerPortal: "सदस्य पोर्टल में पंजीकरण करें", free: "निःशुल्क", fee: "शुल्क", date: "तिथि", time: "समय", venue: "स्थान", organizer: "आयोजक",
    today: "आज", completed: "संपन्न", events: "कार्यक्रम", event: "कार्यक्रम",
    GARBA: "माँ ना गरबा", CULTURAL: "सांस्कृतिक", GENERAL: "सामाजिक",
  },
};

const SECTIONS = {
  upcoming: { icon: Sparkles, colors: ["#f59e0b", "#9a3412"] },
  calendar: { icon: CalendarDays, colors: ["#fbbf24", "#c2410c"] },
  past: { icon: History, colors: ["#94a3b8", "#334155"] },
};
// Old links to the former sections (/events#garba, /events?category=cultural, #programs) open the first section.
const OLD_SECTIONS = { programs: "upcoming", garba: "upcoming", cultural: "upcoming", general: "upcoming" };

// Today's date in India (YYYY-MM-DD), the zone the event dates are written in.
const indiaToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const dayOf = (value) => String(value || "").slice(0, 10);
const byDate = (a, b) => dayOf(a.date).localeCompare(dayOf(b.date)) || String(a.startTime || "").localeCompare(String(b.startTime || "")) || String(a.id).localeCompare(String(b.id));

// The one rule for the whole page: an event is upcoming on and before its date (India time), past from the next day.
// Every published event is in exactly one of the two lists, once (a repeated id is dropped).
export function splitEvents(rows, today = indiaToday()) {
  const seen = new Set();
  const published = (rows || []).filter((event) => event.status === "PUBLISHED" && dayOf(event.date) && !seen.has(event.id) && seen.add(event.id));
  return {
    upcoming: published.filter((event) => dayOf(event.date) >= today).sort(byDate), // soonest first
    past: published.filter((event) => dayOf(event.date) < today).sort((a, b) => byDate(b, a)), // latest first
  };
}

// Cards keep one width in every row: three per row on desktop, two on a tablet, one on a phone; a short last row is
// centred instead of stretching a card across the page.
const CARD_WIDTH = "w-full sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]";

export default function Events() {
  const { lang } = useLang();
  const t = copy[lang] || copy.en;
  const content = usePageContent("events");
  const [events, setEvents] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    document.title = `${t.eyebrow} | ${lang === "hi" ? "निमाड़ पाटीदार संगठन, इंदौर" : "Nimad Patidar Sangathan, Indore"}`;
  }, [t, lang]);
  useEffect(() => {
    base44.entities.Event.list("-date", 200).then(setEvents).catch(() => setEvents([]));
  }, []);
  useSectionLanding(OLD_SECTIONS, events !== null);

  const today = indiaToday();
  const { upcoming, past } = splitEvents(events, today);
  const months = upcoming.reduce((groups, event) => {
    const key = dayOf(event.date).slice(0, 7);
    (groups[key] ||= []).push(event);
    return groups;
  }, {});
  const title = (event) => localizedText(event, "title", lang);
  const isFree = (event) => !(Number(event.fee) > 0);
  const feeText = (event) => (isFree(event) ? t.free : `₹${Number(event.fee).toLocaleString("en-IN")}`);
  const longDate = (event) => formatDate(event.date, lang, { weekday: "short", day: "numeric", month: "long", year: "numeric" });

  // "View Details": the event's own page (details, team, joining) when it has one, otherwise the details window.
  const DetailsAction = ({ event, className }) => {
    const label = <>{t.details}<span className="sr-only">: {title(event)}</span> <ArrowRight className="h-4 w-4" aria-hidden="true" /></>;
    return event.slug
      ? <Link to={`/events/${event.slug}`} className={className}>{label}</Link>
      : <button type="button" onClick={() => setSelected(event)} className={className}>{label}</button>;
  };
  const primaryButton = "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-maroon px-4 text-sm font-semibold text-cream transition hover:bg-maroon-dark";
  const outlineButton = "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold text-maroon transition hover:border-gold/60";

  const EventCard = ({ event, isPast = false }) => (
    <li id={`event-${event.id}`} className={`${CARD_WIDTH} scroll-mt-32`}>
      <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-lg">
        <div className="relative aspect-video shrink-0 overflow-hidden bg-gradient-to-br from-maroon to-maroon-dark">
          {event.bannerUrl
            ? <img src={event.bannerUrl} alt={title(event)} loading="lazy" decoding="async" className={`h-full w-full object-contain transition duration-500 group-hover:scale-105 ${isPast ? "opacity-90" : ""}`} />
            : <CalendarDays className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 text-gold/60" aria-hidden="true" />}
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-maroon shadow">{dayOf(event.date) === today ? t.today : formatDate(event.date, lang)}</span>
          {isPast
            ? <span className="absolute right-3 top-3 rounded-full bg-slate-700/90 px-2.5 py-1 text-xs font-bold text-white shadow">{t.completed}</span>
            : <span className="absolute right-3 top-3 rounded-full bg-gold px-2.5 py-1 text-xs font-bold text-maroon shadow">{feeText(event)}</span>}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <span className="self-start rounded-full bg-muted px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">{t[event.category] || t.GENERAL}</span>
          <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-foreground">{title(event)}</h3>
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><CalendarCheck className="h-4 w-4 shrink-0 text-gold-dark" aria-hidden="true" />{longDate(event)}</li>
            {event.startTime && <li className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0 text-gold-dark" aria-hidden="true" />{event.startTime}{event.endTime ? ` – ${event.endTime}` : ""}</li>}
            {event.venue && <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" aria-hidden="true" /><span className="line-clamp-2">{localizedText(event, "venue", lang)}</span></li>}
          </ul>
          {event.description && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{localizedText(event, "description", lang)}</p>}
          <div className="mt-auto flex flex-wrap gap-2 pt-5">
            <DetailsAction event={event} className={primaryButton} />
            {!isPast && <Link to="/portal/events" className={outlineButton}>{t.register}<span className="sr-only">: {title(event)}</span></Link>}
          </div>
        </div>
      </article>
    </li>
  );
  const CardGrid = ({ list, isPast }) => (
    <ul className="flex flex-wrap justify-center gap-5">{list.map((event) => <EventCard key={event.id} event={event} isPast={isPast} />)}</ul>
  );
  const CalendarRow = ({ event }) => (
    <li id={`calendar-${event.id}`} className="flex scroll-mt-32 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
      <DateTile value={event.date} lang={lang} />
      <div className="min-w-0 flex-1">
        <span className="rounded-full bg-muted px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">{t[event.category] || t.GENERAL}</span>
        <h3 className="mt-1.5 font-semibold text-foreground">{title(event)}</h3>
        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />{longDate(event)}</span>
          {event.startTime && <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{event.startTime}</span>}
          {event.venue && <span className="inline-flex min-w-0 items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span className="truncate">{localizedText(event, "venue", lang)}</span></span>}
        </p>
        {event.description && <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{localizedText(event, "description", lang)}</p>}
      </div>
      <DetailsAction event={event} className={`${outlineButton} self-start sm:self-center`} />
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
            { id: "upcoming", title: t.upcoming, summary: t.upcomingSummary, count: events ? upcoming.length : undefined, ...SECTIONS.upcoming },
            { id: "calendar", title: t.calendar, summary: t.calendarSummary, count: events ? upcoming.length : undefined, ...SECTIONS.calendar },
            { id: "past", title: t.past, summary: t.pastSummary, count: events ? past.length : undefined, ...SECTIONS.past },
          ]}
        />

        <SectionBlock compact id="upcoming" block={content.intro("upcoming")} lang={lang} eyebrow="01" title={t.upcoming} intro={t.upcomingIntro} {...SECTIONS.upcoming}>
          {events === null ? <CardSkeleton /> : upcoming.length === 0 ? <EmptyState>{t.noUpcoming}</EmptyState> : <CardGrid list={upcoming} />}
        </SectionBlock>

        <SectionBlock compact id="calendar" block={content.intro("calendar")} lang={lang} eyebrow="02" title={t.calendar} intro={t.calendarIntro} tone="muted" {...SECTIONS.calendar}>
          {events === null ? <CardSkeleton count={2} /> : upcoming.length === 0 ? <EmptyState>{t.noUpcoming}</EmptyState> : (
            <div className="space-y-6">
              {Object.entries(months).map(([month, list]) => (
                <div key={month}>
                  <h3 className="mb-3 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.14em] text-gold-dark">
                    {formatDate(`${month}-01`, lang, { month: "long", year: "numeric" })}
                    <span className="h-px flex-1 bg-border" aria-hidden="true" />
                    <span className="text-xs font-medium normal-case tracking-normal text-muted-foreground">{list.length} {list.length === 1 ? t.event : t.events}</span>
                  </h3>
                  <ol className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">{list.map((event) => <CalendarRow key={event.id} event={event} />)}</ol>
                </div>
              ))}
            </div>
          )}
        </SectionBlock>

        <SectionBlock compact id="past" block={content.intro("past")} lang={lang} eyebrow="03" title={t.past} intro={t.pastIntro} {...SECTIONS.past}>
          {events === null ? <CardSkeleton /> : past.length === 0 ? <EmptyState>{t.noPast}</EmptyState> : <CardGrid list={past} isPast />}
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
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.date}</dt><dd className="mt-0.5 font-medium">{formatDate(selected.date, lang, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</dd></div>
              {selected.startTime && <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.time}</dt><dd className="mt-0.5 font-medium">{selected.startTime}{selected.endTime ? ` – ${selected.endTime}` : ""}</dd></div>}
              {selected.venue && <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.venue}</dt><dd className="mt-0.5 font-medium">{localizedText(selected, "venue", lang)}</dd></div>}
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.fee}</dt><dd className="mt-0.5 font-medium">{feeText(selected)}</dd></div>
              {selected.organizer && <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.organizer}</dt><dd className="mt-0.5 font-medium">{localizedText(selected, "organizer", lang)}</dd></div>}
            </dl>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{localizedText(selected, "description", lang)}</p>
            {dayOf(selected.date) >= today && <Link to="/portal/events" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-maroon px-5 py-2 text-sm font-semibold text-cream hover:bg-maroon-dark">{t.registerPortal} <ArrowRight className="h-4 w-4" /></Link>}
          </>}
        </DialogContent>
      </Dialog>
      <PublicFooter />
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, Megaphone, Newspaper, PartyPopper, ScrollText, Sparkles } from "lucide-react";
import PublicFooter from "@/components/PublicFooter";
import PublicNav from "@/components/PublicNav";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { usePageContent } from "@/components/PageContent";
import { CardSkeleton, DateTile, EmptyState, PageHero, SectionBlock, SectionOverview, formatDate, useSectionLanding } from "@/components/PageSections";
import { NewsHeroArt } from "@/components/hero/HeroArt";
import { base44 } from "@/api/base44Client";
import { useLang } from "@/lib/i18n";
import { localizedText } from "@/lib/utils";
import { categoryLabel, SANDESH_CATEGORIES } from "@/lib/sandesh";

// Admin → News / Announcements "type" decides the section.
const sandeshSection = (type) => (["News", "Event"].includes(type) ? "community" : type === "Festival" ? "greetings" : "notices");

const copy = {
  en: {
    eyebrow: "Sandesh", title: "News, notices and greetings from the samaj", intro: "Official notices from the committee, stories from our community and festival wishes — all in one place.",
    notices: "Important Notices", noticesSummary: "Official announcements and updates from the committee.", noticesIntro: "Please read these official announcements from the Sangathan carefully.",
    community: "Community News", communitySummary: "Stories, achievements and happenings in our community.", communityIntro: "What is happening across our families, programmes and initiatives.",
    greetings: "Festival Greetings", greetingsSummary: "Wishes and messages for festivals and special occasions.", greetingsIntro: "Warm wishes from the Nimar Patidar Sangathan, Indore on festivals and special occasions.",
    noNotices: "There are no notices right now. Official announcements will appear here.", noCommunity: "No community news yet. Stories and updates will appear here.", noGreetings: "No festival greetings yet. Wishes for upcoming festivals will appear here.",
    urgent: "Urgent", readMore: "Read more", close: "Close", latest: "Latest", allCategories: "All categories", search: "Search Sandesh", noMatch: "No Sandesh matches your filter.", clear: "Clear",
  },
  hi: {
    eyebrow: "संदेश", title: "समाज के समाचार, सूचनाएँ और शुभकामनाएँ", intro: "समिति की आधिकारिक सूचनाएँ, हमारे समाज की खबरें और त्योहारों की शुभकामनाएँ — सब एक ही जगह।",
    notices: "महत्वपूर्ण सूचनाएँ", noticesSummary: "समिति की आधिकारिक घोषणाएँ और अपडेट।", noticesIntro: "कृपया संगठन की इन आधिकारिक सूचनाओं को ध्यान से पढ़ें।",
    community: "सामुदायिक समाचार", communitySummary: "समाज की खबरें, उपलब्धियाँ और गतिविधियाँ।", communityIntro: "हमारे परिवारों, कार्यक्रमों और पहलों में क्या हो रहा है।",
    greetings: "त्योहार शुभकामनाएँ", greetingsSummary: "त्योहारों और विशेष अवसरों की शुभकामनाएँ।", greetingsIntro: "त्योहारों और विशेष अवसरों पर निमाड़ पाटीदार संगठन की हार्दिक शुभकामनाएँ।",
    noNotices: "अभी कोई सूचना नहीं है। आधिकारिक घोषणाएँ यहाँ दिखेंगी।", noCommunity: "अभी कोई सामुदायिक समाचार नहीं। खबरें और अपडेट यहाँ दिखेंगे।", noGreetings: "अभी कोई शुभकामना संदेश नहीं। आने वाले त्योहारों की शुभकामनाएँ यहाँ दिखेंगी।",
    urgent: "अत्यावश्यक", readMore: "पूरा पढ़ें", close: "बंद करें", latest: "नवीनतम", allCategories: "सभी श्रेणियाँ", search: "संदेश खोजें", noMatch: "आपके फ़िल्टर से कोई संदेश मेल नहीं खाता।", clear: "हटाएँ",
  },
};

const SECTIONS = {
  notices: { icon: ScrollText, colors: ["#3b82c4", "#123a63"] },
  community: { icon: Newspaper, colors: ["#38bdf8", "#0369a1"] },
  greetings: { icon: PartyPopper, colors: ["#fbbf24", "#c2410c"] },
};

export default function News() {
  const { lang } = useLang();
  const t = copy[lang] || copy.en;
  const content = usePageContent("news");
  const [news, setNews] = useState(null);
  const [selected, setSelected] = useState(null);
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    document.title = `${t.eyebrow} | ${lang === "hi" ? "निमाड़ पाटीदार संगठन, इंदौर" : "Nimar Patidar Sangathan, Indore"}`;
  }, [t, lang]);
  useEffect(() => {
    base44.entities.Announcement.list("-date", 200)
      .then((data) => setNews(data.filter((item) => item.status === "Active" && (!item.publishAt || new Date(item.publishAt) <= new Date()))))
      .catch(() => setNews([]));
  }, []);
  useSectionLanding({ notice: "notices", news: "community" }, news !== null);

  const q = query.trim().toLowerCase();
  const filtered = (news || []).filter((item) => (!category || item.category === category) && (!q || [item.title, item.titleHi, item.body, item.bodyHi].some((text) => (text || "").toLowerCase().includes(q))));
  const filtering = Boolean(category || q);
  const by = (section) => filtered.filter((item) => sandeshSection(item.type) === section);
  const notices = by("notices");
  const community = by("community");
  const greetings = by("greetings");
  const title = (item) => localizedText(item, "title", lang);
  const body = (item) => localizedText(item, "body", lang);
  const ReadMore = ({ item, className = "" }) => (
    <button type="button" onClick={() => setSelected(item)} className={`inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-maroon transition hover:text-gold-dark ${className}`}>
      {t.readMore}<span className="sr-only">: {title(item)}</span> <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main id="main-content">
        <PageHero block={content.intro("hero")} eyebrow={t.eyebrow} title={t.title} intro={t.intro} icon={Megaphone} lang={lang} theme="news" art={<NewsHeroArt lang={lang} />} tagline={lang === "hi" ? "संगठन की हर सूचना, समाचार और शुभकामना — एक जगह" : "Every notice, news story and greeting from the Sangathan — in one place"} />
        <SectionOverview
          lang={lang}
          sections={[
            { id: "notices", title: t.notices, summary: t.noticesSummary, count: news ? notices.length : undefined, ...SECTIONS.notices },
            { id: "community", title: t.community, summary: t.communitySummary, count: news ? community.length : undefined, ...SECTIONS.community },
            { id: "greetings", title: t.greetings, summary: t.greetingsSummary, count: news ? greetings.length : undefined, ...SECTIONS.greetings },
          ]}
        />

        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 pt-6 sm:px-6">
          <select aria-label={t.allCategories} value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 rounded-full border border-border bg-card px-4 text-sm">
            <option value="">{t.allCategories}</option>
            {Object.keys(SANDESH_CATEGORIES).map((key) => <option key={key} value={key}>{categoryLabel(key, lang)}</option>)}
          </select>
          <input type="search" aria-label={t.search} placeholder={t.search} value={query} onChange={(event) => setQuery(event.target.value)} maxLength={100} className="h-10 min-w-0 flex-1 rounded-full border border-border bg-card px-4 text-sm sm:max-w-xs" />
          {filtering && <button type="button" onClick={() => { setCategory(""); setQuery(""); }} className="text-sm font-semibold text-maroon hover:underline">{t.clear}</button>}
          {filtering && news && filtered.length === 0 && <p role="status" className="w-full text-sm text-muted-foreground">{t.noMatch}</p>}
        </div>

        <SectionBlock id="notices" block={content.intro("notices")} lang={lang} eyebrow="01" title={t.notices} intro={t.noticesIntro} {...SECTIONS.notices}>
          {news === null ? <CardSkeleton count={2} /> : notices.length === 0 ? <EmptyState>{t.noNotices}</EmptyState> : (
            <ol className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              {notices.map((item, index) => (
                <li key={item.id} id={`news-${item.id}`} className={`flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:p-6 ${item.type === "Urgent" ? "border-l-4 border-l-destructive" : ""}`}>
                  <DateTile value={item.date} lang={lang} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.type === "Urgent" && <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive"><AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />{t.urgent}</span>}
                      {index === 0 && !filtering && <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-xs font-semibold text-gold-dark">{t.latest}</span>}
                      {item.category && <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{categoryLabel(item.category, lang)}</span>}
                    </div>
                    <h3 className="mt-1.5 font-display text-lg font-semibold text-foreground">{title(item)}</h3>
                    <p className="mt-1.5 line-clamp-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{body(item)}</p>
                  </div>
                  <ReadMore item={item} className="self-start sm:self-center" />
                </li>
              ))}
            </ol>
          )}
        </SectionBlock>

        <SectionBlock id="community" block={content.intro("community")} lang={lang} eyebrow="02" title={t.community} intro={t.communityIntro} tone="muted" {...SECTIONS.community}>
          {news === null ? <CardSkeleton /> : community.length === 0 ? <EmptyState>{t.noCommunity}</EmptyState> : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {community.map((item, index) => (
                <article key={item.id} id={`news-${item.id}`} className={`group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-lg ${index === 0 && community.length > 2 ? "lg:col-span-2" : ""}`}>
                  {item.imageUrl && <img src={item.imageUrl} alt="" loading="lazy" className="-mx-6 -mt-6 mb-4 aspect-[16/9] w-[calc(100%+3rem)] max-w-none rounded-t-2xl object-cover" />}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Newspaper className="h-4 w-4 text-sky-600" aria-hidden="true" />
                    <time dateTime={item.date || undefined}>{formatDate(item.date, lang)}</time>
                    {item.category && <span className="rounded-full bg-muted px-2 py-0.5">{categoryLabel(item.category, lang)}</span>}
                  </div>
                  <h3 className={`mt-3 font-display font-semibold leading-snug text-foreground ${index === 0 && community.length > 2 ? "text-2xl" : "text-lg"}`}>{title(item)}</h3>
                  <p className={`mt-2 flex-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground ${index === 0 && community.length > 2 ? "line-clamp-5" : "line-clamp-4"}`}>{body(item)}</p>
                  <ReadMore item={item} className="mt-4 self-start" />
                </article>
              ))}
            </div>
          )}
        </SectionBlock>

        <SectionBlock id="greetings" block={content.intro("greetings")} lang={lang} eyebrow="03" title={t.greetings} intro={t.greetingsIntro} {...SECTIONS.greetings}>
          {news === null ? <CardSkeleton /> : greetings.length === 0 ? <EmptyState>{t.noGreetings}</EmptyState> : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {greetings.map((item) => (
                <article key={item.id} id={`news-${item.id}`} className="relative flex flex-col overflow-hidden rounded-2xl bg-gradient-to-br from-maroon via-maroon to-[#5d2440] p-6 text-cream shadow-lg">
                  <Sparkles className="absolute -right-4 -top-4 h-28 w-28 text-gold/10" aria-hidden="true" />
                  <span className="relative inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold"><PartyPopper className="h-4 w-4" aria-hidden="true" />{formatDate(item.date, lang, { day: "numeric", month: "long" })}</span>
                  <h3 className="relative mt-4 font-display text-2xl font-semibold leading-snug text-cream">{title(item)}</h3>
                  <p className="relative mt-3 line-clamp-5 flex-1 whitespace-pre-line text-sm leading-relaxed text-cream/80">{body(item)}</p>
                  <button type="button" onClick={() => setSelected(item)} className="relative mt-5 inline-flex min-h-10 items-center gap-1.5 self-start text-sm font-semibold text-gold hover:text-cream">
                    {t.readMore}<span className="sr-only">: {title(item)}</span> <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </article>
              ))}
            </div>
          )}
        </SectionBlock>
      </main>

      <Dialog open={!!selected} onOpenChange={(value) => { if (!value) setSelected(null); }}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
          {selected && <>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-dark">{t[sandeshSection(selected.type)]}{selected.category ? ` · ${categoryLabel(selected.category, lang)}` : ""} · {formatDate(selected.date, lang)}</p>
            {selected.imageUrl && <img src={selected.imageUrl} alt="" className="w-full rounded-xl object-cover" />}
            <DialogTitle className="font-display text-2xl leading-snug text-maroon">{title(selected)}</DialogTitle>
            <DialogDescription className="whitespace-pre-line text-base leading-relaxed text-foreground">{body(selected)}</DialogDescription>
          </>}
        </DialogContent>
      </Dialog>
      <PublicFooter />
    </div>
  );
}

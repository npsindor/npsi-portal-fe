import React, { useEffect, useState } from "react";
import { Ambulance, ArrowRight, CalendarDays, Droplet, Flame, HandHeart, HeartHandshake, LifeBuoy, MapPin, Phone, ShieldAlert, Siren, User } from "lucide-react";
import { Link } from "react-router-dom";
import PublicFooter from "@/components/PublicFooter";
import PublicNav from "@/components/PublicNav";
import { usePageContent } from "@/components/PageContent";
import { CardSkeleton, EmptyState, PageHero, SectionBlock, SectionOverview, formatDate, useSectionLanding } from "@/components/PageSections";
import { base44 } from "@/api/base44Client";
import { useLang } from "@/lib/i18n";

const copy = {
  en: {
    eyebrow: "Community Services", title: "Standing together when it matters most", intro: "Blood donation drives, emergency help and social welfare initiatives — organised by our samaj, for our samaj.",
    blood: "Blood Donation", bloodSummary: "Donation camps, donor drives and urgent requirements.", bloodIntro: "One donation can save up to three lives. Join our camps and donor network.",
    emergency: "Emergency Help", emergencySummary: "Helplines and community contacts for urgent support.", emergencyIntro: "Save these numbers. In a life-threatening emergency, call 112 first.",
    welfare: "Social Welfare", welfareSummary: "Education, health and support initiatives of the samaj.", welfareIntro: "Initiatives that support students, elders and families in need.",
    noBlood: "No blood donation camps are announced right now.", noEmergency: "Community emergency contacts will appear here.", noWelfare: "Social welfare initiatives will appear here.",
    eligibility: "Who can donate?", facts: ["Age 18 to 65 years", "Weight 50 kg or more", "Healthy, with haemoglobin 12.5 g/dL or more", "At least 3 months since the last donation"],
    national: "National helplines", communityContacts: "Community contacts", call: "Call", featured: "Featured",
    helplines: [["112", "All emergencies", Siren], ["108", "Ambulance", Ambulance], ["100", "Police", ShieldAlert], ["101", "Fire", Flame]],
    ctaTitle: "Want to volunteer or need support?", ctaBody: "Reach out to the Sangathan — our volunteers will connect you with the right people.", ctaButton: "Contact us",
  },
  hi: {
    eyebrow: "सामुदायिक सेवाएँ", title: "ज़रूरत के समय एक-दूसरे के साथ", intro: "रक्तदान शिविर, आपातकालीन सहायता और समाज कल्याण की पहलें — समाज द्वारा, समाज के लिए।",
    blood: "रक्तदान", bloodSummary: "रक्तदान शिविर, दाता अभियान और तत्काल आवश्यकताएँ।", bloodIntro: "एक रक्तदान तीन जीवन तक बचा सकता है। हमारे शिविरों और दाता नेटवर्क से जुड़ें।",
    emergency: "आपातकालीन सहायता", emergencySummary: "तत्काल सहायता के लिए हेल्पलाइन और सामुदायिक संपर्क।", emergencyIntro: "ये नंबर सहेज कर रखें। जानलेवा आपात स्थिति में पहले 112 पर कॉल करें।",
    welfare: "समाज कल्याण", welfareSummary: "समाज की शिक्षा, स्वास्थ्य और सहायता पहलें।", welfareIntro: "विद्यार्थियों, बुज़ुर्गों और ज़रूरतमंद परिवारों की सहायता करने वाली पहलें।",
    noBlood: "अभी कोई रक्तदान शिविर घोषित नहीं है।", noEmergency: "सामुदायिक आपातकालीन संपर्क यहाँ दिखेंगे।", noWelfare: "समाज कल्याण की पहलें यहाँ दिखेंगी।",
    eligibility: "कौन रक्तदान कर सकता है?", facts: ["आयु 18 से 65 वर्ष", "वज़न 50 किलो या अधिक", "स्वस्थ, हीमोग्लोबिन 12.5 g/dL या अधिक", "पिछले रक्तदान को कम से कम 3 महीने"],
    national: "राष्ट्रीय हेल्पलाइन", communityContacts: "सामुदायिक संपर्क", call: "कॉल करें", featured: "मुख्य",
    helplines: [["112", "सभी आपात स्थितियाँ", Siren], ["108", "एम्बुलेंस", Ambulance], ["100", "पुलिस", ShieldAlert], ["101", "अग्निशमन", Flame]],
    ctaTitle: "स्वयंसेवा करना चाहते हैं या सहायता चाहिए?", ctaBody: "संगठन से संपर्क करें — हमारे स्वयंसेवक आपको सही लोगों से जोड़ेंगे।", ctaButton: "संपर्क करें",
  },
};

const SECTIONS = {
  "blood-donation": { key: "BLOOD_DONATION", icon: Droplet, colors: ["#fb7185", "#b91c1c"] },
  "emergency-help": { key: "EMERGENCY_HELP", icon: LifeBuoy, colors: ["#fbbf24", "#c2410c"] },
  "social-welfare": { key: "SOCIAL_WELFARE", icon: HandHeart, colors: ["#34d399", "#047857"] },
};
const localized = (row, key, lang) => (lang === "hi" && row[`${key}Hi`]) || row[key] || "";
const tel = (phone) => `tel:${String(phone).replace(/[^\d+]/g, "")}`;

function PostLink({ post, lang, className }) {
  if (!post.linkUrl) return null;
  const label = localized(post, "ctaLabel", lang) || (lang === "hi" ? "और जानें" : "Learn more");
  const inner = <>{label} <ArrowRight className="h-4 w-4" aria-hidden="true" /></>;
  return /^https?:\/\//i.test(post.linkUrl)
    ? <a href={post.linkUrl} target="_blank" rel="noopener noreferrer" className={className}>{inner}</a>
    : <Link to={post.linkUrl} className={className}>{inner}</Link>;
}

function PostCard({ post, lang, t, accent, large = false }) {
  return (
    <article className={`group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-lg ${large ? "md:col-span-2 md:flex-row" : ""}`}>
      {post.imageUrl && (
        <div className={`relative shrink-0 overflow-hidden bg-muted ${large ? "aspect-video md:aspect-auto md:w-1/2" : "aspect-video"}`}>
          <img src={post.imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        </div>
      )}
      <div className={`flex flex-1 flex-col p-5 ${large ? "md:p-7" : ""}`}>
        {post.featured && <span className="mb-2 self-start rounded-full px-2.5 py-0.5 text-xs font-semibold text-white" style={{ background: accent }}>{t.featured}</span>}
        <h3 className={`font-display font-semibold leading-snug text-foreground ${large ? "text-2xl" : "text-lg"}`}>{localized(post, "title", lang)}</h3>
        {(post.eventDate || post.location) && (
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            {post.eventDate && <li className="flex items-center gap-2"><CalendarDays className="h-4 w-4 shrink-0 text-gold-dark" aria-hidden="true" />{formatDate(post.eventDate, lang, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</li>}
            {post.location && <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark" aria-hidden="true" />{localized(post, "location", lang)}</li>}
          </ul>
        )}
        {post.body && <p className={`mt-3 flex-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground ${large ? "line-clamp-6" : "line-clamp-4"}`}>{localized(post, "body", lang)}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {post.contactPhone && (
            <a href={tel(post.contactPhone)} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-maroon px-4 text-sm font-semibold text-cream transition hover:bg-maroon-dark">
              <Phone className="h-4 w-4" aria-hidden="true" />{post.contactName ? `${post.contactName} · ` : ""}{post.contactPhone}
            </a>
          )}
          <PostLink post={post} lang={lang} className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-maroon transition hover:text-gold-dark" />
        </div>
      </div>
    </article>
  );
}

export default function CommunityServices() {
  const { lang } = useLang();
  const t = copy[lang] || copy.en;
  const content = usePageContent("community-services");
  const [posts, setPosts] = useState(null);

  useEffect(() => {
    document.title = `${t.eyebrow} | ${lang === "hi" ? "निमाड़ पाटीदार संगठन, इंदौर" : "Nimar Patidar Sangathan, Indore"}`;
  }, [t, lang]);
  useEffect(() => {
    base44.communityPosts.list().then((rows) => setPosts(Array.isArray(rows) ? rows : [])).catch(() => setPosts([]));
  }, []);
  useSectionLanding({}, posts !== null);

  const of = (id) => (posts || []).filter((post) => post.section === SECTIONS[id].key);
  const blood = of("blood-donation");
  const emergency = of("emergency-help");
  const welfare = of("social-welfare");
  const grid = (list, id) => (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {list.map((post, index) => <PostCard key={post.id} post={post} lang={lang} t={t} accent={SECTIONS[id].colors[1]} large={index === 0 && post.featured && Boolean(post.imageUrl)} />)}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main id="main-content">
        <PageHero block={content.intro("hero")} eyebrow={t.eyebrow} title={t.title} intro={t.intro} icon={HeartHandshake} lang={lang} />
        <SectionOverview
          lang={lang}
          sections={[
            { id: "blood-donation", title: t.blood, summary: t.bloodSummary, count: posts ? blood.length : undefined, ...SECTIONS["blood-donation"] },
            { id: "emergency-help", title: t.emergency, summary: t.emergencySummary, ...SECTIONS["emergency-help"] },
            { id: "social-welfare", title: t.welfare, summary: t.welfareSummary, count: posts ? welfare.length : undefined, ...SECTIONS["social-welfare"] },
          ]}
        />

        <SectionBlock id="blood-donation" block={content.intro("blood-donation")} lang={lang} eyebrow="01" title={t.blood} intro={t.bloodIntro} {...SECTIONS["blood-donation"]}>
          <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
            <aside className="h-fit rounded-2xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-900/50 dark:bg-rose-950/30">
              <h3 className="flex items-center gap-2 font-semibold text-rose-800 dark:text-rose-200"><Droplet className="h-5 w-5" aria-hidden="true" />{t.eligibility}</h3>
              <ul className="mt-3 space-y-2 text-sm text-rose-900/80 dark:text-rose-100/80">
                {t.facts.map((fact) => <li key={fact} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" aria-hidden="true" />{fact}</li>)}
              </ul>
            </aside>
            <div className="min-w-0">{posts === null ? <CardSkeleton count={2} /> : blood.length === 0 ? <EmptyState>{t.noBlood}</EmptyState> : grid(blood, "blood-donation")}</div>
          </div>
        </SectionBlock>

        <SectionBlock id="emergency-help" block={content.intro("emergency-help")} lang={lang} eyebrow="02" title={t.emergency} intro={t.emergencyIntro} tone="muted" {...SECTIONS["emergency-help"]}>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-gold-dark">{t.national}</h3>
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {t.helplines.map(([number, label, Icon]) => (
              <li key={number}>
                <a href={tel(number)} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:border-gold/60 hover:shadow-md">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                  <span className="min-w-0"><span className="block font-display text-2xl font-bold leading-none text-foreground">{number}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{label}</span></span>
                </a>
              </li>
            ))}
          </ul>
          <h3 className="mb-3 mt-10 text-sm font-semibold uppercase tracking-[0.14em] text-gold-dark">{t.communityContacts}</h3>
          {posts === null ? <CardSkeleton count={3} /> : emergency.length === 0 ? <EmptyState>{t.noEmergency}</EmptyState> : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {emergency.map((post) => (
                <article key={post.id} className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <h4 className="font-semibold text-foreground">{localized(post, "title", lang)}</h4>
                  {post.body && <p className="mt-1.5 line-clamp-3 flex-1 whitespace-pre-line text-sm text-muted-foreground">{localized(post, "body", lang)}</p>}
                  {post.location && <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />{localized(post, "location", lang)}</p>}
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {post.contactPhone && (
                      <a href={tel(post.contactPhone)} aria-label={`${t.call} ${localized(post, "title", lang)}: ${post.contactPhone}`} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-destructive px-4 text-sm font-semibold text-white transition hover:opacity-90">
                        <Phone className="h-4 w-4" aria-hidden="true" />{post.contactPhone}
                      </a>
                    )}
                    {post.contactName && <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><User className="h-3.5 w-3.5" aria-hidden="true" />{post.contactName}</span>}
                    <PostLink post={post} lang={lang} className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-maroon hover:text-gold-dark" />
                  </div>
                </article>
              ))}
            </div>
          )}
        </SectionBlock>

        <SectionBlock id="social-welfare" block={content.intro("social-welfare")} lang={lang} eyebrow="03" title={t.welfare} intro={t.welfareIntro} {...SECTIONS["social-welfare"]}>
          {posts === null ? <CardSkeleton /> : welfare.length === 0 ? <EmptyState>{t.noWelfare}</EmptyState> : grid(welfare, "social-welfare")}
        </SectionBlock>

        <section className="bg-background">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
            <div className="flex flex-col items-start justify-between gap-5 rounded-3xl hero-band p-8 text-cream sm:flex-row sm:items-center sm:p-10">
              <div>
                <h2 className="font-display text-2xl font-semibold text-cream sm:text-3xl">{t.ctaTitle}</h2>
                <p className="mt-2 max-w-xl text-cream/75">{t.ctaBody}</p>
              </div>
              <Link to="/contact" className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-gold px-6 text-sm font-bold text-maroon transition hover:bg-cream">{t.ctaButton} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

import React, { useEffect } from "react";
import { ArrowRight, BookOpenCheck, Briefcase, BriefcaseBusiness, Building2, ClipboardList, Mail, Megaphone, Store } from "lucide-react";
import { Link } from "react-router-dom";
import PublicFooter from "@/components/PublicFooter";
import PublicNav from "@/components/PublicNav";
import { BlockCard, BlockLink, BlockMedia, usePageContent } from "@/components/PageContent";
import { CardSkeleton, EmptyState, PageHero, SectionBlock, SectionOverview, useSectionLanding } from "@/components/PageSections";
import { useLang } from "@/lib/i18n";
import { blockText } from "@/lib/page-content";

const SECTIONS = {
  "job-opportunities": { icon: Briefcase, colors: ["#818cf8", "#3730a3"] },
  "post-a-vacancy": { icon: ClipboardList, colors: ["#38bdf8", "#0369a1"] },
  "business-directory": { icon: Store, colors: ["#34d399", "#047857"] },
  "career-guidance": { icon: BookOpenCheck, colors: ["#fbbf24", "#c2410c"] },
  "business-promotion": { icon: Megaphone, colors: ["#fb7185", "#9f1239"] },
};
const copy = {
  en: {
    eyebrow: "Career & Business", title: "Opportunities grow when we connect", intro: "Jobs, businesses, mentoring and promotion — connecting job seekers, employers, entrepreneurs and professionals of our samaj.",
    jobs: "Job Opportunities", jobsSummary: "Openings shared by employers in the samaj.", jobsIntro: "Current openings shared by employers and members. Apply directly using the details in each listing.", noJobs: "No openings are listed right now. Check back soon.",
    vacancy: "Post a Vacancy", vacancySummary: "Share an opening with the community.", vacancyIntro: "Hiring? Send your vacancy to the Sangathan and we will publish it after review.",
    steps: [["Role & skills", "Job title, key responsibilities and the skills you need."], ["Experience & location", "Experience required, work location and whether it is on-site or remote."], ["Deadline", "The last date to apply and the expected joining date."], ["How to apply", "A phone number or email that may be published for applicants."]],
    sendVacancy: "Send your vacancy", directory: "Business Directory", directorySummary: "Businesses and professionals of our samaj.", directoryIntro: "Support businesses run by our community members.", noDirectory: "Business listings will appear here.",
    guidance: "Career Guidance", guidanceSummary: "Mentoring, resources and sessions.", guidanceIntro: "Mentoring, sessions and resources to help students and professionals grow.", noGuidance: "Guidance sessions and resources will appear here.",
    promotion: "Business Promotion", promotionSummary: "Promote your business to the samaj.", promotionIntro: "Introduce your products and services to families across the samaj.", noPromotion: "Featured promotions will appear here.",
    promoteTitle: "Want to feature your business?", promoteBody: "Contact the Sangathan to list your business in the directory or run a sponsored promotion.", contact: "Contact us",
  },
  hi: {
    eyebrow: "करियर और व्यवसाय", title: "जब हम जुड़ते हैं, अवसर बढ़ते हैं", intro: "नौकरी, व्यवसाय, मार्गदर्शन और प्रचार — समाज के नौकरी चाहने वालों, नियोक्ताओं, उद्यमियों और पेशेवरों को जोड़ना।",
    jobs: "नौकरी के अवसर", jobsSummary: "समाज के नियोक्ताओं द्वारा साझा अवसर।", jobsIntro: "नियोक्ताओं और सदस्यों द्वारा साझा वर्तमान अवसर। हर सूची में दिए विवरण से सीधे आवेदन करें।", noJobs: "अभी कोई अवसर सूचीबद्ध नहीं है। जल्द ही फिर देखें।",
    vacancy: "नौकरी की सूचना दें", vacancySummary: "समाज के साथ अवसर साझा करें।", vacancyIntro: "भर्ती कर रहे हैं? अपनी नौकरी की जानकारी संगठन को भेजें, समीक्षा के बाद हम उसे प्रकाशित करेंगे।",
    steps: [["पद और कौशल", "पद का नाम, मुख्य ज़िम्मेदारियाँ और आवश्यक कौशल।"], ["अनुभव और स्थान", "आवश्यक अनुभव, कार्य स्थान और ऑफिस या रिमोट।"], ["अंतिम तिथि", "आवेदन की अंतिम तिथि और अपेक्षित जॉइनिंग।"], ["आवेदन कैसे करें", "आवेदकों के लिए प्रकाशित किया जा सकने वाला फ़ोन या ईमेल।"]],
    sendVacancy: "अपनी नौकरी की जानकारी भेजें", directory: "व्यवसाय निर्देशिका", directorySummary: "हमारे समाज के व्यवसाय और पेशेवर।", directoryIntro: "समाज के सदस्यों द्वारा चलाए जा रहे व्यवसायों का साथ दें।", noDirectory: "व्यवसाय सूचियाँ यहाँ दिखेंगी।",
    guidance: "करियर मार्गदर्शन", guidanceSummary: "मार्गदर्शन, संसाधन और सत्र।", guidanceIntro: "विद्यार्थियों और पेशेवरों के विकास के लिए मार्गदर्शन, सत्र और संसाधन।", noGuidance: "मार्गदर्शन सत्र और संसाधन यहाँ दिखेंगे।",
    promotion: "व्यवसाय प्रचार", promotionSummary: "समाज में अपने व्यवसाय का प्रचार करें।", promotionIntro: "समाज के परिवारों तक अपने उत्पाद और सेवाएँ पहुँचाएँ।", noPromotion: "विशेष प्रचार यहाँ दिखेंगे।",
    promoteTitle: "अपने व्यवसाय को दिखाना चाहते हैं?", promoteBody: "निर्देशिका में व्यवसाय जोड़ने या प्रायोजित प्रचार के लिए संगठन से संपर्क करें।", contact: "संपर्क करें",
  },
};

export default function Careers() {
  const { lang } = useLang();
  const t = copy[lang] || copy.en;
  const content = usePageContent("careers");
  useEffect(() => {
    document.title = `${t.eyebrow} | ${lang === "hi" ? "निमाड़ पाटीदार संगठन, इंदौर" : "Nimar Patidar Sangathan, Indore"}`;
  }, [t, lang]);
  useSectionLanding({}, content.ready);

  const section = (id, title, intro, tone) => ({ id, title, intro, tone, block: content.intro(id), lang, ...SECTIONS[id] });
  const jobs = content.items("job-opportunities");
  const vacancySteps = content.items("post-a-vacancy");
  const directory = content.items("business-directory");
  const guidance = content.items("career-guidance");
  const promotions = content.items("business-promotion");
  const grid = (items, empty) => (!content.ready ? <CardSkeleton /> : items.length === 0 ? <EmptyState>{empty}</EmptyState> : (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map((block) => <BlockCard key={block.id} block={block} lang={lang} />)}</div>
  ));

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main id="main-content">
        <PageHero eyebrow={t.eyebrow} title={t.title} intro={t.intro} icon={BriefcaseBusiness} lang={lang} block={content.intro("hero")} />
        <SectionOverview
          lang={lang}
          sections={[
            { id: "job-opportunities", title: t.jobs, summary: t.jobsSummary, count: content.ready ? jobs.length : undefined, ...SECTIONS["job-opportunities"] },
            { id: "post-a-vacancy", title: t.vacancy, summary: t.vacancySummary, ...SECTIONS["post-a-vacancy"] },
            { id: "business-directory", title: t.directory, summary: t.directorySummary, count: content.ready ? directory.length : undefined, ...SECTIONS["business-directory"] },
            { id: "career-guidance", title: t.guidance, summary: t.guidanceSummary, ...SECTIONS["career-guidance"] },
            { id: "business-promotion", title: t.promotion, summary: t.promotionSummary, ...SECTIONS["business-promotion"] },
          ]}
        />

        <SectionBlock eyebrow="01" {...section("job-opportunities", t.jobs, t.jobsIntro)}>
          {!content.ready ? <CardSkeleton count={2} /> : jobs.length === 0 ? <EmptyState>{t.noJobs}</EmptyState> : (
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              {jobs.map((block) => (
                <li key={block.id} className="grid gap-4 p-5 sm:p-6 md:grid-cols-12 md:items-center">
                  <div className="flex items-start gap-4 md:col-span-9">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                      {block.mediaType === "IMAGE" && block.mediaUrl ? <img src={block.mediaUrl} alt="" className="h-full w-full object-cover" /> : <Briefcase className="h-6 w-6" aria-hidden="true" />}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display text-lg font-semibold text-foreground">{blockText(block, "title", lang)}</h3>
                      {blockText(block, "subtitle", lang) && <p className="mt-0.5 text-sm font-medium text-gold-dark">{blockText(block, "subtitle", lang)}</p>}
                      {blockText(block, "body", lang) && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{blockText(block, "body", lang)}</p>}
                    </div>
                  </div>
                  <div className="md:col-span-3 md:text-right">
                    <BlockLink block={block} lang={lang} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-maroon px-5 text-sm font-semibold text-cream transition hover:bg-maroon-dark" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionBlock>

        <SectionBlock eyebrow="02" {...section("post-a-vacancy", t.vacancy, t.vacancyIntro, "muted")}>
          <div className="grid gap-6 lg:grid-cols-12">
            <ol className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
              {(vacancySteps.length ? vacancySteps.map((block) => [blockText(block, "title", lang), blockText(block, "body", lang), block]) : t.steps).map(([title, body, block], index) => (
                <li key={`${title}-${index}`} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-sm font-bold text-white">{index + 1}</span>
                  <h3 className="mt-3 font-semibold text-foreground">{title}</h3>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{body}</p>
                  {block && <BlockMedia block={block} lang={lang} className="mt-3" />}
                </li>
              ))}
            </ol>
            <aside className="flex flex-col justify-between gap-5 rounded-2xl hero-band p-6 text-cream lg:col-span-4">
              <div>
                <ClipboardList className="h-8 w-8 text-gold" aria-hidden="true" />
                <h3 className="mt-3 font-display text-2xl font-semibold text-cream">{t.vacancy}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cream/75">{t.vacancyIntro}</p>
              </div>
              <a href="mailto:info@npsindore.org?subject=Job%20vacancy" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-gold px-5 text-sm font-bold text-maroon transition hover:bg-cream"><Mail className="h-4 w-4" aria-hidden="true" />{t.sendVacancy}</a>
            </aside>
          </div>
        </SectionBlock>

        <SectionBlock eyebrow="03" {...section("business-directory", t.directory, t.directoryIntro)}>{grid(directory, t.noDirectory)}</SectionBlock>
        <SectionBlock eyebrow="04" {...section("career-guidance", t.guidance, t.guidanceIntro, "muted")}>{grid(guidance, t.noGuidance)}</SectionBlock>

        <SectionBlock eyebrow="05" {...section("business-promotion", t.promotion, t.promotionIntro)}>
          <div className="space-y-6">
            {promotions.length > 0 && <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{promotions.map((block) => <BlockCard key={block.id} block={block} lang={lang} />)}</div>}
            <div className="flex flex-col items-start justify-between gap-5 rounded-3xl border border-gold/30 bg-gold/10 p-6 sm:flex-row sm:items-center sm:p-8">
              <div className="flex items-start gap-4">
                <Building2 className="mt-1 h-8 w-8 shrink-0 text-gold-dark" aria-hidden="true" />
                <div><h3 className="font-display text-xl font-semibold text-foreground">{t.promoteTitle}</h3><p className="mt-1 text-sm text-muted-foreground">{t.promoteBody}</p></div>
              </div>
              <Link to="/contact" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-maroon px-5 text-sm font-semibold text-cream transition hover:bg-maroon-dark">{t.contact} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
          </div>
        </SectionBlock>
      </main>
      <PublicFooter />
    </div>
  );
}

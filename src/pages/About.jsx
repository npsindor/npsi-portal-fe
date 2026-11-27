import React, { useEffect, useState } from "react";
import { Building2, Compass, Eye, Gavel, Heart, Landmark, Lightbulb, MapPin, ShieldCheck, Target, Users, UsersRound } from "lucide-react";
import PublicFooter from "@/components/PublicFooter";
import PublicNav from "@/components/PublicNav";
import SeniorDisciplineCommittee from "@/components/SeniorDisciplineCommittee";
import { BlockCard, BlockLink, BlockMedia, usePageContent } from "@/components/PageContent";
import { PageHero, SectionBlock, SectionOverview, useSectionLanding } from "@/components/PageSections";
import { base44 } from "@/api/base44Client";
import { PRINCIPLES_EN, PRINCIPLES_HI, RULES_EN, RULES_HI } from "@/lib/about-defaults";
import { useLang, useT } from "@/lib/i18n";
import { blockText } from "@/lib/page-content";
import { usePublicCopy } from "@/lib/public-copy";

const OBJECTIVES = [
  ["Unity & Brotherhood", "Build meaningful relationships between families and individuals through mutual respect and cooperation."],
  ["Education & Youth Development", "Encourage learning, career guidance, skill development, and mentoring opportunities."],
  ["Employment & Entrepreneurship", "Connect job seekers, employers, professionals, and businesses to share opportunities."],
  ["Culture & Social Connection", "Celebrate traditions and strengthen bonds between generations through community gatherings."],
  ["Welfare & Mutual Assistance", "Facilitate responsible community support, welfare initiatives, and blood-donation connections."],
  ["Transparency & Digital Participation", "Promote clear communication, consent-based membership, and responsible information sharing."],
];
const SECTIONS = {
  organization: { icon: Building2, colors: ["#3b82c4", "#123a63"] },
  "vision-mission": { icon: Compass, colors: ["#38bdf8", "#0369a1"] },
  objectives: { icon: Target, colors: ["#fbbf24", "#c2410c"] },
  committee: { icon: UsersRound, colors: ["#a78bfa", "#6d28d9"] },
  rules: { icon: Gavel, colors: ["#fb7185", "#9f1239"] },
  principles: { icon: Lightbulb, colors: ["#34d399", "#047857"] },
};
const copy = {
  en: {
    eyebrow: "About Us", title: "Nimad Patidar Sangathan, Indore", heroIntro: "A community organisation uniting Patidar families of Indore and the Nimad region — preserving our heritage and building a stronger future together.",
    organization: "About the Organization", organizationSummary: "Who we are and what we do.",
    vision: "Vision & Mission", visionSummary: "The future we are working towards.", visionIntro: "What guides every decision and programme of the Sangathan.",
    objectives: "Our Objectives", objectivesSummary: "Six goals that shape our work.", objectivesIntro: "The goals that shape the Sangathan's programmes and services.",
    committee: "Committee Members", committeeSummary: "The people who guide the Sangathan.", committeeIntro: "The organisation is guided by its office-bearers and committee members, who coordinate activities and encourage responsible participation.",
    rules: "Rules & Principles", rulesSummary: "How the Sangathan is governed.", rulesIntro: "The rules every office-bearer and member follows.",
    principles: "Guiding Principles", principlesSummary: "The values behind our work.", principlesIntro: "The principles that guide the Sangathan's work for the samaj.",
    families: "Registered families", members: "Members", region: "Indore & Nimad, Madhya Pradesh",
  },
  hi: {
    eyebrow: "हमारे बारे में", title: "निमाड़ पाटीदार संगठन, इंदौर", heroIntro: "इंदौर और निमाड़ क्षेत्र के पाटीदार परिवारों को जोड़ने वाला सामाजिक संगठन — अपनी विरासत को सँजोते हुए मिलकर बेहतर भविष्य का निर्माण।",
    organization: "संगठन के बारे में", organizationSummary: "हम कौन हैं और क्या करते हैं।",
    vision: "दृष्टि और लक्ष्य", visionSummary: "जिस भविष्य के लिए हम काम कर रहे हैं।", visionIntro: "संगठन के हर निर्णय और कार्यक्रम का मार्गदर्शन।",
    objectives: "हमारे उद्देश्य", objectivesSummary: "हमारे कार्य को दिशा देने वाले छह लक्ष्य।", objectivesIntro: "वे लक्ष्य जो संगठन के कार्यक्रमों और सेवाओं को दिशा देते हैं।",
    committee: "समिति सदस्य", committeeSummary: "संगठन का मार्गदर्शन करने वाले लोग।", committeeIntro: "संगठन का मार्गदर्शन इसके पदाधिकारी और समिति सदस्य करते हैं, जो गतिविधियों का समन्वय और जिम्मेदार भागीदारी को प्रोत्साहित करते हैं।",
    rules: "नियम और सिद्धांत", rulesSummary: "संगठन कैसे संचालित होता है।", rulesIntro: "वे नियम जिनका पालन हर पदाधिकारी और सदस्य करता है।",
    principles: "मार्गदर्शक सिद्धांत", principlesSummary: "हमारे कार्य के पीछे के मूल्य।", principlesIntro: "वे सिद्धांत जो समाज के लिए संगठन के कार्य का मार्गदर्शन करते हैं।",
    families: "पंजीकृत परिवार", members: "सदस्य", region: "इंदौर और निमाड़, मध्य प्रदेश",
  },
};

// "Title — description" (the built-in rules/principles format) → [title, description].
const split = (text) => { const [head, ...rest] = String(text).split(" — "); return rest.length ? [head, rest.join(" — ")] : ["", head]; };

function NumberedList({ items, accent }) {
  return (
    <ol className="grid gap-4 md:grid-cols-2">
      {items.map(([title, body], index) => (
        <li key={`${title}-${index}`} className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-base font-bold text-white" style={{ background: accent }}>{String(index + 1).padStart(2, "0")}</span>
          <div className="min-w-0">
            {title && <h3 className="font-semibold leading-snug text-foreground">{title}</h3>}
            <p className={`whitespace-pre-line text-sm leading-relaxed text-muted-foreground ${title ? "mt-1" : ""}`}>{body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function About() {
  const { lang } = useLang();
  const t = useT();
  const c = usePublicCopy();
  const w = copy[lang] || copy.en;
  const content = usePageContent("about");
  const [stats, setStats] = useState(null);
  const [rules, setRules] = useState(null);
  const [principles, setPrinciples] = useState(null);

  useEffect(() => {
    document.title = `${w.eyebrow} | ${w.title}`;
  }, [w]);
  useEffect(() => {
    base44.stats().then(setStats).catch(() => setStats(null));
    const active = (rows) => rows.filter((row) => (row.status || "Active") === "Active").sort((a, b) => (a.sectionNumber ?? 999) - (b.sectionNumber ?? 999));
    base44.entities.Rule.list("sectionNumber", 100).then((rows) => setRules(active(rows))).catch(() => setRules([]));
    base44.entities.Principle.list("sectionNumber", 100).then((rows) => setPrinciples(active(rows))).catch(() => setPrinciples([]));
  }, []);
  useSectionLanding({ "vision-mission": "vision-mission", committee: "committee" }, content.ready && rules !== null);

  const section = (id, title, intro, tone) => ({ id, title, intro, tone, block: content.intro(id), lang, ...SECTIONS[id] });
  const organizationItems = content.items("organization");
  const visionItems = content.items("vision-mission");
  const objectiveItems = content.items("objectives");
  const committeeItems = content.items("committee");
  const fromEntity = (rows, fallbackEn, fallbackHi) => (rows && rows.length
    ? rows.map((row) => [lang === "hi" ? row.titleHi || row.titleEn : row.titleEn || row.titleHi, lang === "hi" ? row.contentHi || row.contentEn : row.contentEn || row.contentHi])
    : (lang === "hi" ? fallbackHi : fallbackEn).map(split));
  const values = [
    { icon: Eye, title: t("about.vision"), body: t("about.visionD") },
    { icon: ShieldCheck, title: t("about.mission"), body: t("about.missionD") },
    { icon: Heart, title: t("about.values"), body: t("about.valuesD") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main id="main-content">
        <PageHero eyebrow={w.eyebrow} title={w.title} intro={w.heroIntro} icon={Landmark} lang={lang} block={content.intro("hero")} />
        <SectionOverview
          lang={lang}
          sections={[
            { id: "organization", title: w.organization, summary: w.organizationSummary, ...SECTIONS.organization },
            { id: "vision-mission", title: w.vision, summary: w.visionSummary, ...SECTIONS["vision-mission"] },
            { id: "objectives", title: w.objectives, summary: w.objectivesSummary, ...SECTIONS.objectives },
            { id: "committee", title: w.committee, summary: w.committeeSummary, ...SECTIONS.committee },
            { id: "rules", title: w.rules, summary: w.rulesSummary, ...SECTIONS.rules },
            { id: "principles", title: w.principles, summary: w.principlesSummary, ...SECTIONS.principles },
          ]}
        />

        <SectionBlock eyebrow="01" {...section("organization", w.organization, "")}>
          {organizationItems.length ? (
            <div className="space-y-10">
              {organizationItems.map((block, index) => (
                <div key={block.id} className="grid items-center gap-8 lg:grid-cols-12">
                  <div className={`lg:col-span-7 ${index % 2 && block.mediaType !== "NONE" ? "lg:order-2" : ""} ${block.mediaType === "NONE" ? "lg:col-span-12" : ""}`}>
                    {blockText(block, "title", lang) && <h3 className="font-display text-2xl font-semibold text-foreground">{blockText(block, "title", lang)}</h3>}
                    {blockText(block, "subtitle", lang) && <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-gold-dark">{blockText(block, "subtitle", lang)}</p>}
                    <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-foreground/80">{blockText(block, "body", lang)}</p>
                    <BlockLink block={block} lang={lang} className="mt-4 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-maroon hover:text-gold-dark" />
                  </div>
                  {block.mediaType !== "NONE" && <div className="lg:col-span-5"><BlockMedia block={block} lang={lang} className={block.mediaType === "IMAGE" ? "aspect-[4/3] shadow-lg" : "shadow-lg"} /></div>}
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gold-dark"><MapPin className="h-4 w-4" aria-hidden="true" />{t("about.loc")}</p>
                <p className="mt-4 text-lg leading-relaxed text-foreground/80">{t("about.intro")}</p>
              </div>
              <aside className="grid gap-4 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
                {[[Users, w.families, stats?.families], [UsersRound, w.members, stats?.members]].map(([Icon, label, value]) => (
                  <div key={label} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-maroon/10 text-maroon"><Icon className="h-6 w-6" aria-hidden="true" /></span>
                    <div><p className="font-display text-3xl font-bold text-foreground">{value ?? "—"}</p><p className="text-sm text-muted-foreground">{label}</p></div>
                  </div>
                ))}
                <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:col-span-2 lg:col-span-1">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/15 text-gold-dark"><MapPin className="h-6 w-6" aria-hidden="true" /></span>
                  <p className="font-semibold text-foreground">{w.region}</p>
                </div>
              </aside>
            </div>
          )}
        </SectionBlock>

        <SectionBlock eyebrow="02" {...section("vision-mission", w.vision, w.visionIntro, "muted")}>
          <div className="grid gap-5 md:grid-cols-3">
            {visionItems.length ? visionItems.map((block) => <BlockCard key={block.id} block={block} lang={lang} />) : values.map((value) => (
              <article key={value.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-maroon/10 text-maroon"><value.icon className="h-6 w-6" aria-hidden="true" /></span>
                <h3 className="mt-4 font-display text-xl font-semibold text-foreground">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{value.body}</p>
              </article>
            ))}
          </div>
        </SectionBlock>

        <SectionBlock eyebrow="03" {...section("objectives", w.objectives, w.objectivesIntro)}>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {objectiveItems.length ? objectiveItems.map((block) => <BlockCard key={block.id} block={block} lang={lang} />) : OBJECTIVES.map(([title, body], index) => (
              <article key={title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <span className="font-display text-3xl font-bold text-gold">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 font-semibold text-foreground">{c(title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c(body)}</p>
              </article>
            ))}
          </div>
        </SectionBlock>

        <SectionBlock eyebrow="04" {...section("committee", w.committee, w.committeeIntro, "muted")}>
          {committeeItems.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {committeeItems.map((block) => (
                <article key={block.id} className="overflow-hidden rounded-2xl border border-border bg-card text-center shadow-sm">
                  <div className="aspect-[3/4] bg-muted">{block.mediaType === "IMAGE" && block.mediaUrl ? <img src={block.mediaUrl} alt={blockText(block, "title", lang)} loading="lazy" className="h-full w-full object-cover object-top" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><UsersRound className="h-10 w-10" aria-hidden="true" /></div>}</div>
                  <div className="p-4">
                    <h3 className="font-semibold leading-snug text-foreground">{blockText(block, "title", lang)}</h3>
                    {blockText(block, "subtitle", lang) && <p className="mt-0.5 text-sm font-medium text-gold-dark">{blockText(block, "subtitle", lang)}</p>}
                    {blockText(block, "body", lang) && <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{blockText(block, "body", lang)}</p>}
                  </div>
                </article>
              ))}
            </div>
          )}
          <SeniorDisciplineCommittee />
        </SectionBlock>

        <SectionBlock eyebrow="05" {...section("rules", w.rules, w.rulesIntro)}>
          <NumberedList items={fromEntity(rules, RULES_EN, RULES_HI)} accent="linear-gradient(145deg, #fb7185, #9f1239)" />
        </SectionBlock>

        <SectionBlock eyebrow="06" {...section("principles", w.principles, w.principlesIntro, "muted")}>
          <NumberedList items={fromEntity(principles, PRINCIPLES_EN, PRINCIPLES_HI)} accent="linear-gradient(145deg, #34d399, #047857)" />
        </SectionBlock>
      </main>
      <PublicFooter />
    </div>
  );
}

import { Link } from "react-router-dom";
import { FileText, ShieldCheck } from "lucide-react";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { usePageContent } from "@/components/PageContent";
import { blockText } from "@/lib/page-content";
import { LEGAL, LEGAL_UPDATED } from "@/lib/legal-copy";
import { useLang } from "@/lib/i18n";

// Terms & Conditions (/terms) and Privacy Policy (/privacy). Built-in text from lib/legal-copy.js; when an administrator
// adds entries in Admin → Page Content (section "Page content"), those replace the built-in sections, and the
// "Page banner" entry replaces the heading and introduction.
export default function LegalPage({ kind }) {
  const { lang } = useLang();
  const copy = LEGAL[kind][lang] || LEGAL[kind].en;
  const content = usePageContent(kind);
  const hero = content.intro("hero");
  const custom = content.items("main");
  const sections = custom.length
    ? custom.map((block) => [blockText(block, "title", lang), blockText(block, "body", lang), block.id])
    : copy.sections.map(([title, body]) => [title, body, title]);
  const updatedAt = custom.length
    ? custom.map((block) => block.updatedAt || block.createdAt).filter(Boolean).sort().at(-1)?.slice(0, 10) || LEGAL_UPDATED
    : LEGAL_UPDATED;
  const updated = new Date(`${updatedAt}T00:00:00Z`).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const Icon = kind === "privacy" ? ShieldCheck : FileText;
  const other = kind === "privacy" ? ["/terms", LEGAL.terms[lang]?.eyebrow || LEGAL.terms.en.eyebrow] : ["/privacy", LEGAL.privacy[lang]?.eyebrow || LEGAL.privacy.en.eyebrow];

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main>
        <section className="relative overflow-hidden hero-band text-cream">
          <div className="absolute inset-0 shell-grid opacity-[0.06]" />
          <div className="relative mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 lg:py-16">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold tracking-wide text-gold">
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.eyebrow}
            </span>
            <h1 className="mt-5 font-display text-3xl font-semibold leading-tight text-cream sm:text-4xl">{blockText(hero, "title", lang) || copy.title}</h1>
            <p className="mt-4 text-base leading-relaxed text-cream/75">{blockText(hero, "body", lang) || copy.intro}</p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <p className="text-sm text-muted-foreground">
            {lang === "hi" ? "अंतिम अपडेट" : "Last updated"}: <time dateTime={updatedAt}>{updated}</time>
          </p>
          <ol className="mt-6 space-y-4">
            {sections.map(([title, body, key], index) => (
              <li key={key} className="premium-card p-5 sm:p-6">
                <h2 className="flex items-start gap-3 font-display text-lg font-semibold text-maroon">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/15 text-sm text-gold-dark">{index + 1}</span>
                  <span>{title}</span>
                </h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/85 sm:pl-10">{body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap gap-3 text-sm">
            <Link to="/contact" className="inline-flex min-h-11 items-center rounded-full bg-maroon px-5 font-semibold text-cream hover:bg-maroon-dark">
              {lang === "hi" ? "संगठन से संपर्क करें" : "Contact the Sangathan"}
            </Link>
            <Link to={other[0]} className="inline-flex min-h-11 items-center rounded-full border border-gold/40 px-5 font-semibold text-maroon hover:bg-gold/10">
              {other[1]}
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

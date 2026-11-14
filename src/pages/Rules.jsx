import React from "react";
import { ScrollText } from "lucide-react";
import { useLang } from "@/lib/i18n";
import PublicFooter from "@/components/PublicFooter";
import PublicNav from "@/components/PublicNav";

const rules = [
  "समानता, सम्मान एवं पारदर्शिता — संगठन में समानता, सम्मान, अनुशासन और वित्तीय पारदर्शिता को सुनिश्चित करना।",
  "सामूहिक निर्णय — महत्वपूर्ण संगठनात्मक निर्णय चर्चा, विचार-विमर्श और सामूहिक सहमति की प्रक्रिया।",
  "पद नहीं, जिम्मेदारी — व्यक्तिगत प्रतिष्ठा और अधिकार नहीं, संगठन और समाज के प्रति जवाबदेही।",
  "नेतृत्व एवं जिम्मेदारी में परिवर्तन — निर्धारित अवधि के बाद जिम्मेदारियों में परिवर्तन/रोटेशन की व्यवस्था।",
  "पूर्व योजना एवं स्वीकृति — कार्यक्रम, आर्थिक खर्च और महत्वपूर्ण गतिविधियाँ पूर्व योजना एवं संगठन द्वारा निर्धारित प्रक्रिया के अनुसार।",
  "सदस्य जानकारी की गोपनीयता — सदस्यों एवं परिवारों की व्यक्तिगत जानकारी बिना अनुमति के सार्वजनिक नहीं की जाएगी।",
];

export default function Rules() {
  const { lang } = useLang();
  const english = ["Equality, respect, and transparency — Ensure equality, respect, discipline, and financial transparency within the organization.", "Collective decisions — Make important organizational decisions through discussion, consultation, and collective agreement.", "Responsibility over status — Remain accountable to the organization and community rather than pursuing personal prestige or authority.", "Rotation of leadership and responsibilities — Rotate responsibilities after the prescribed term.", "Advance planning and approval — Plan programs, expenses, and important activities according to the organization’s established procedures.", "Privacy of member information — Do not publish personal information about members or families without permission."];
  const content = lang === "hi" ? rules : english;
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <section className="border-b border-gold/30 bg-cream/50">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
          <span className="gold-badge">{lang === "hi" ? "संगठन के नियम" : "Organization Rules"}</span>
          <h1 className="mt-4 font-display text-4xl font-semibold text-maroon">{lang === "hi" ? "संगठन के नियम" : "Organization Rules"}</h1>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="space-y-5">
          {content.map((rule, index) => (
            <article key={rule} className="rounded-2xl border border-gold/30 bg-card p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-3 border-b border-gold/20 pb-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-maroon/10">
                  <ScrollText className="h-5 w-5 text-maroon" />
                </div>
                <div>
                  <div className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                    {lang === "hi" ? "नियम" : "Rule"} {index + 1}
                  </div>
                  <h2 className="font-display text-lg font-semibold text-maroon">{rule.split(" — ")[0]}</h2>
                </div>
              </div>
              <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground/80">
                {rule.split(" — ").slice(1).join(" — ")}
              </div>
            </article>
          ))}
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
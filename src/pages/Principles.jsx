import React from "react";
import { ScrollText } from "lucide-react";
import PublicNav from "@/components/PublicNav";

const principles = [
  "डिजिटल संगठन एवं संपर्क व्यवस्था — समाज के परिवारों एवं सदस्यों को डिजिटल माध्यम से जोड़कर व्यवस्थित संपर्क एवं सूचना तंत्र विकसित करना।",
  "सामाजिक एकता एवं भाईचारा — समाज के सभी परिवारों और सदस्यों को जोड़ना तथा आपसी सहयोग एवं सद्भाव बढ़ाना।",
  "सामाजिक एवं सांस्कृतिक गतिविधियाँ — पारिवारिक, सामाजिक एवं सांस्कृतिक कार्यक्रमों के माध्यम से समाज को जोड़ना और परंपराओं को आगे बढ़ाना।",
  "महिला एवं युवा सहभागिता — महिलाओं और युवाओं को संगठन की गतिविधियों एवं नेतृत्व में सक्रिय भागीदारी के अवसर देना।",
  "प्रतिभा एवं उपलब्धि प्रोत्साहन — शिक्षा, खेल, व्यवसाय, कला, प्रशासन एवं अन्य क्षेत्रों की प्रतिभाओं को प्रोत्साहित एवं सम्मानित करना।",
  "समाज की प्रगति, उन्नति एवं कल्याण — समाज के प्रत्येक परिवार और आने वाली पीढ़ी की प्रगति, उन्नति एवं सामूहिक कल्याण के लिए निरंतर प्रयास करना।",
];

export default function Principles() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <section className="border-b border-gold/30 bg-cream/50">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
          <span className="gold-badge">संगठन के प्रमुख उद्देश्य</span>
          <h1 className="mt-4 font-display text-4xl font-semibold text-maroon">संगठन के प्रमुख उद्देश्य</h1>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="space-y-5">
          {principles.map((principle, index) => (
            <article key={principle} className="rounded-2xl border border-gold/30 bg-card p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-3 border-b border-gold/20 pb-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-maroon/10">
                  <ScrollText className="h-5 w-5 text-maroon" />
                </div>
                <div>
                  <div className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                    उद्देश्य {index + 1}
                  </div>
                  <h2 className="font-display text-lg font-semibold text-maroon">{principle.split(" — ")[0]}</h2>
                </div>
              </div>
              <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground/80">
                {principle.split(" — ").slice(1).join(" — ")}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

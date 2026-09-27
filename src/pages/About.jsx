import React from "react";
import { ShieldCheck, Eye, Heart } from "lucide-react";
import PublicNav from "@/components/PublicNav";
import { useT } from "@/lib/i18n";

export default function About() {
  const t = useT();
  const values = [
    { icon: Eye, title: t("about.vision"), desc: t("about.visionD") },
    { icon: ShieldCheck, title: t("about.mission"), desc: t("about.missionD") },
    { icon: Heart, title: t("about.values"), desc: t("about.valuesD") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <section className="border-b border-gold/30 bg-cream/50">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
          <span className="gold-badge">{t("about.badge")}</span>
          <h1 className="mt-4 font-display text-4xl font-semibold text-maroon">{t("about.title")}</h1>
          <p className="mt-2 text-sm uppercase tracking-wide text-muted-foreground">{t("about.loc")}</p>
          <p className="mt-6 text-base leading-relaxed text-foreground/75">{t("about.intro")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-3">
          {values.map((v) => (
            <div key={v.title} className="rounded-2xl border border-gold/30 bg-card p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-maroon/10">
                <v.icon className="h-5 w-5 text-maroon" />
              </div>
              <h3 className="mt-3 font-display text-base font-semibold text-maroon">{v.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
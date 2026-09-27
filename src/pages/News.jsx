import React, { useEffect, useState } from "react";
import { Bell, CalendarDays, Loader2 } from "lucide-react";
import PublicNav from "@/components/PublicNav";
import { base44 } from "@/api/base44Client";
import { useLang } from "@/lib/i18n";
import { localizedText } from "@/lib/utils";

export default function News() {
  const { lang, t } = useLang();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.Announcement.list("-date", 100);
        setNews(data.filter((item) => item.status === "Active"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const locale = lang === "hi" ? "hi-IN" : "en-IN";

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <section className="border-b border-gold/30 bg-cream/50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <span className="gold-badge"><Bell className="h-3.5 w-3.5" />{t("news.badge")}</span>
          <h1 className="mt-4 font-display text-4xl font-semibold text-maroon">{t("news.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("news.sub")}</p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {loading ? <div className="flex justify-center py-16 text-muted-foreground"><Loader2 className="mr-2 h-6 w-6 animate-spin" />{t("news.loading")}</div> : news.length === 0 ? <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">{t("news.empty")}</div> : <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {news.map((item) => <article key={item.id} className="premium-card flex flex-col p-5"><div className="flex items-center justify-between gap-3"><span className="gold-badge text-[0.6rem]">{item.type || "General"}</span><span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />{item.date ? new Date(item.date).toLocaleDateString(locale) : ""}</span></div><h2 className="mt-4 font-display text-lg font-semibold text-maroon">{localizedText(item, "title", lang)}</h2><p className="mt-2 flex-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{localizedText(item, "body", lang)}</p></article>)}
        </div>}
      </section>
    </div>
  );
}

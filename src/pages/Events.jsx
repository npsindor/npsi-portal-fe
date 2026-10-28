import React, { useEffect, useState } from "react";
import { CalendarDays, MapPin, Clock, ArrowRight } from "lucide-react";
import { Link, useSearchParams } from 'react-router-dom';
import PublicFooter from '@/components/PublicFooter';
import CommunityDemo from '@/components/CommunityDemo';
import { usePublicCopy } from '@/lib/public-copy';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import PublicNav from "@/components/PublicNav";
import { base44 } from "@/api/base44Client";
import { useT, useLang } from "@/lib/i18n";
import { localizedText } from "@/lib/utils";

export default function Events() {
  const t = useT();
  const c = usePublicCopy();
  const [params] = useSearchParams();
  const [selected, setSelected] = useState(null);
  const { lang } = useLang();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const evs = await base44.entities.Event.list("-date", 50);
        setEvents(evs.filter((e) => e.status === "PUBLISHED"));
      } catch {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const category = params.get('category');
  const visibleEvents = events.filter(event => {
    const type = `${event.type || ''} ${event.category || ''} ${event.title || ''} ${event.titleHi || event.title_hi || ''}`;
    return category === 'garba' ? /garba|गरबा/i.test(type) : category === 'cultural' ? /cultural|deepotsav|diwali|दीपोत्सव|दीपावली|सांस्कृतिक/i.test(type) : true;
  });
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <section className="border-b border-gold/30 bg-cream/50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <span className="gold-badge">{t("events.badge")}</span>
          <h1 className="mt-4 font-display text-4xl font-semibold text-maroon">{t("events.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("events.sub")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl border border-border bg-muted" />
            ))}
          </div>
        ) : visibleEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            {t("events.empty")}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visibleEvents.map((ev) => (
              <div key={ev.id} className="overflow-hidden rounded-2xl border border-gold/30 bg-card shadow-sm transition hover:shadow-md">
                <div className="relative aspect-square bg-gradient-to-br from-maroon to-maroon-dark">
                  {ev.bannerUrl && <img src={ev.bannerUrl} alt={localizedText(ev, "title", lang)} loading="lazy" decoding="async" className="h-full w-full object-contain" />}
                  {ev.fee > 0 && (
                    <span className="absolute right-3 top-3 rounded-full bg-gold px-2.5 py-1 text-xs font-bold text-maroon">
                      ₹{ev.fee}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {ev.date ? new Date(ev.date).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {ev.startTime || "—"}
                    </span>
                  </div>
                  <h3 className="mt-2 font-display text-lg font-semibold text-maroon">{localizedText(ev, "title", lang)}</h3>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {localizedText(ev, "venue", lang)}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">{localizedText(ev, "description", lang)}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t("events.by")} {localizedText(ev, "organizer", lang) || c("Nimar Patidar Sangathan, Indore")}</span>
                    <button type="button" onClick={() => setSelected(ev)} className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-maroon">
                      {t("events.view")} <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className="max-h-[85dvh] overflow-y-auto"><DialogTitle>{localizedText(selected, "title", lang)}</DialogTitle><DialogDescription>{localizedText(selected, "venue", lang)}</DialogDescription><>{selected?.bannerUrl && <img src={selected.bannerUrl} alt={localizedText(selected, "title", lang)} className="max-h-[55dvh] w-full rounded-lg object-contain" />}</><p className="whitespace-pre-wrap text-sm leading-relaxed">{localizedText(selected, "description", lang)}</p><Link to="/portal/events" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-maroon px-4 py-2 text-sm text-cream">{t("footer.memberPortal")}</Link></DialogContent></Dialog>
        <h2 className="mt-10 section-title">{c('Sample events')}</h2>
        <CommunityDemo group="events" />
      </section>
      <PublicFooter />
    </div>
  );
}
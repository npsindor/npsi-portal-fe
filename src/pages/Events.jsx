import React, { useEffect, useState } from "react";
import { CalendarDays, MapPin, Clock, ArrowRight } from "lucide-react";
import PublicNav from "@/components/PublicNav";
import { base44 } from "@/api/base44Client";
import { useT, useLang } from "@/lib/i18n";
import { localizedText } from "@/lib/utils";

export default function Events() {
  const t = useT();
  const { lang } = useLang();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const evs = await base44.entities.Event.list("-date", 50);
        setEvents(evs.filter((e) => e.status === "PUBLISHED"));
      } catch (e) {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            {t("events.empty")}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {events.map((ev) => (
              <div key={ev.id} className="overflow-hidden rounded-2xl border border-gold/30 bg-card shadow-sm transition hover:shadow-md">
                <div className="relative h-40 bg-gradient-to-br from-maroon to-maroon-dark">
                  {ev.banner_url && <img src={ev.banner_url} alt={localizedText(ev, "title", lang)} loading="lazy" decoding="async" className="h-full w-full object-cover" />}
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
                      {ev.date ? new Date(ev.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {ev.start_time || "—"}
                    </span>
                  </div>
                  <h3 className="mt-2 font-display text-lg font-semibold text-maroon">{localizedText(ev, "title", lang)}</h3>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {ev.venue}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">{localizedText(ev, "description", lang)}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t("events.by")} {ev.organizer || "Sangathan"}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-maroon">
                      {t("events.view")} <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
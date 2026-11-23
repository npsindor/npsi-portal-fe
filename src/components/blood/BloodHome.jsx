import { useEffect, useState } from "react";
import { ArrowRight, BedDouble, Droplet, HandHeart, HeartHandshake, Plus, UsersRound } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { bloodApi } from "@/api/bloodHelpApi";
import MembersOnly from "@/components/blood/MembersOnly";
import { HeroBackdrop, useHeroText } from "@/components/PageContent";
import RequestsTable from "@/components/blood/RequestsTable";
import StatCard from "@/components/blood/StatCard";
import { useAuth } from "@/lib/AuthContext";
import { BLOOD_PATHS, useBloodCopy } from "@/lib/blood-help";

// The network's home: hero, the two actions, live figures and the latest requests still looking for blood.
export default function BloodHome() {
  const { t, lang } = useBloodCopy();
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const location = useLocation();
  // Admin → Page Content → Community Services "hero" still sets the banner text and photo when filled in.
  const hero = useHeroText("community-services", lang);
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState({ state: "loading", rows: [] });

  useEffect(() => {
    bloodApi.summary().then(setSummary).catch(() => setSummary(null));
  }, []);
  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isAuthenticated) return setRecent({ state: "guest", rows: [] });
    bloodApi
      .recent(lang)
      .then((rows) => setRecent({ state: "ready", rows }))
      .catch((error) => setRecent({ state: error.status === 403 ? "members" : "error", rows: [] }));
  }, [isAuthenticated, isLoadingAuth, lang]);

  const action = (to, Icon, title, text, filled) => (
    <Link
      to={to}
      className={`group flex items-center gap-4 rounded-2xl p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${filled ? "bg-[#C8102E] text-white" : "border border-[#C8102E]/20 bg-card"}`}
    >
      <Icon className={`h-12 w-12 shrink-0 ${filled ? "text-white" : "text-[#C8102E]"}`} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className={`block font-display text-xl font-bold ${filled ? "text-white" : "text-[#C8102E]"}`}>{title}</span>
        <span className={`mt-1 block text-sm ${filled ? "text-white/90" : "text-muted-foreground"}`}>{text}</span>
      </span>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition group-hover:translate-x-0.5 ${filled ? "bg-white text-[#C8102E]" : "bg-[#C8102E] text-white"}`}>
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </Link>
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <div className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-[#fde8eb] via-white to-[#fbd5db] p-6 shadow-sm dark:from-[#3a0a12] dark:via-card dark:to-[#2a070d] sm:p-8">
          <HeroBackdrop block={hero.block} className="opacity-15" />
          <h1 className="font-display text-4xl font-extrabold leading-tight text-foreground sm:text-5xl">
            {hero.title || (
              <>
                {t.hero.title1}
                <span className="block text-[#C8102E]">{t.hero.title2}</span>
              </>
            )}
          </h1>
          <p className="mt-4 max-w-sm text-base text-muted-foreground">{hero.intro || t.hero.text}</p>
          <div className="pointer-events-none absolute -bottom-6 right-2 hidden items-end sm:flex" aria-hidden="true">
            <HandHeart className="h-40 w-40 text-[#C8102E]/15" />
            <span className="relative -ml-24 mb-14 flex h-24 w-20 items-center justify-center">
              <Droplet className="absolute h-24 w-24 fill-[#C8102E] text-[#C8102E] drop-shadow-lg" />
              <Plus className="relative mt-4 h-9 w-9 text-white" strokeWidth={3} />
            </span>
          </div>
        </div>
        <div className="grid gap-4">
          {action(BLOOD_PATHS.donor, UsersRound, t.cards.donorTitle, t.cards.donorText, false)}
          {action(BLOOD_PATHS.request, BedDouble, t.cards.requestTitle, t.cards.requestText, true)}
        </div>
      </section>

      <section aria-label={t.network} className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={UsersRound} value={summary?.donors?.toLocaleString("en-IN")} label={t.stats.donors} />
        <StatCard icon={Droplet} value={summary?.requests?.toLocaleString("en-IN")} label={t.stats.requests} />
        <StatCard icon={HeartHandshake} value={summary?.fulfilled?.toLocaleString("en-IN")} label={t.stats.fulfilled} />
      </section>

      <section aria-labelledby="recent-requests" className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 id="recent-requests" className="flex items-center gap-2 font-display text-xl font-bold text-[#C8102E]">
            <Droplet className="h-5 w-5 fill-[#C8102E]" aria-hidden="true" />
            {t.recentTitle}
          </h2>
          <Link to={BLOOD_PATHS.requests} className="inline-flex items-center gap-1 text-sm font-semibold text-[#C8102E] hover:underline">
            {t.viewAll} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        {recent.state === "loading" && <p className="py-8 text-center text-sm text-muted-foreground">{t.loading}</p>}
        {recent.state === "guest" && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {t.loginToSee}
            <Link to={`/login?returnTo=${encodeURIComponent(location.pathname)}`} className="rounded-lg bg-[#C8102E] px-4 py-2 font-semibold text-white hover:bg-[#a50d26]">
              {t.login}
            </Link>
          </div>
        )}
        {recent.state === "members" && <MembersOnly />}
        {recent.state === "error" && <p className="py-8 text-center text-sm text-destructive">{t.failed}</p>}
        {recent.state === "ready" && <RequestsTable rows={recent.rows} variant="recent" emptyText={t.noRecent} caption={t.recentTitle} />}
      </section>
    </div>
  );
}

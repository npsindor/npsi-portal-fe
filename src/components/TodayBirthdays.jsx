import { useEffect, useState } from "react";
import { Cake, PartyPopper } from "lucide-react";
import { homeMembersApi } from "@/api/homeMembersApi";
import MemberAvatar from "@/components/MemberAvatar";
import { useLang } from "@/lib/i18n";

const COPY = {
  en: { title: "Today Birthday", wish: "Happy Birthday", wishLine: "Warm wishes from the Nimar Patidar Sangathan family!", none: "No birthdays today. Check back tomorrow! 🎂", loading: "Loading…" },
  hi: { title: "आज जन्मदिन", wish: "जन्मदिन की हार्दिक शुभकामनाएँ", wishLine: "निमाड़ पाटीदार संगठन परिवार की ओर से ढेरों शुभकामनाएँ!", none: "आज किसी का जन्मदिन नहीं है। कल फिर देखें! 🎂", loading: "लोड हो रहा है…" },
};

// Home page "Today Birthday" column: a small greeting card (photo + name) for each adult member of the families an
// administrator chose to show whose birthday is today (India time). No birth date or age is shown.
export default function TodayBirthdays() {
  const { lang } = useLang();
  const t = COPY[lang] || COPY.en;
  const [people, setPeople] = useState(null);
  useEffect(() => {
    homeMembersApi.birthdays().then((rows) => setPeople(Array.isArray(rows) ? rows : [])).catch(() => setPeople([]));
  }, []);
  return (
    <section aria-labelledby="today-birthday-title" className="premium-card flex h-full flex-col p-5 sm:p-6">
      <h2 id="today-birthday-title" className="flex items-center gap-2 font-display text-xl font-semibold text-maroon">
        <Cake className="h-5 w-5 text-gold-dark" aria-hidden="true" />
        {t.title}
      </h2>
      <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-gold-dark">
        <PartyPopper className="h-4 w-4" aria-hidden="true" />
        {t.wish}
      </p>
      <div className="mt-4 flex-1">
        {people === null ? (
          <p className="text-sm text-muted-foreground">{t.loading}</p>
        ) : people.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">{t.none}</p>
        ) : (
          <ul className="max-h-96 space-y-3 overflow-y-auto pr-1">
            {people.map((person) => (
              <li key={person.id} className="relative overflow-hidden rounded-xl border border-gold/40 bg-gradient-to-r from-gold/15 via-background to-background p-3">
                <span className="pointer-events-none absolute -right-2 -top-3 text-4xl opacity-20" aria-hidden="true">
                  🎉
                </span>
                <div className="flex items-center gap-3">
                  <MemberAvatar name={person.name} photoUrl={person.photoUrl} size={48} />
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-foreground">{person.name}</div>
                    {person.place && <div className="truncate text-xs text-muted-foreground">{person.place}</div>}
                    <div className="mt-0.5 text-xs font-semibold text-maroon">
                      🎂 {t.wish}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">{t.wishLine}</p>
    </section>
  );
}

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { homeMembersApi } from "@/api/homeMembersApi";
import MemberAvatar from "@/components/MemberAvatar";
import { useLang } from "@/lib/i18n";

const COPY = {
  en: { eyebrow: "Our families", title: "NPS Family Heads", sub: "The heads of the families registered with Nimar Patidar Sangathan, Indore." },
  hi: { eyebrow: "हमारे परिवार", title: "NPS परिवार मुखिया", sub: "निमाड़ पाटीदार संगठन, इंदौर में पंजीकृत परिवारों के मुखिया।" },
};
// A short list is repeated so the strip is always wider than the screen and loops without a gap.
const MIN_ITEMS = 14;

// Home page: a slow, endless carousel of 60×60 round photos of the family heads an administrator chose to show
// (Admin → Families → "On website"), A to Z by name as the API returns them. Hidden when nobody is shown.
export default function FamilyHeadsCarousel() {
  const { lang } = useLang();
  const t = COPY[lang] || COPY.en;
  const [heads, setHeads] = useState(null);
  useEffect(() => {
    homeMembersApi.familyHeads().then((rows) => setHeads(Array.isArray(rows) ? rows : [])).catch(() => setHeads([]));
  }, []);
  if (!heads?.length) return null;
  const loop = [];
  while (loop.length < MIN_ITEMS) loop.push(...heads);
  const duration = `${Math.max(40, loop.length * 4)}s`;
  const item = (head, key, hidden) => (
    <li key={key} aria-hidden={hidden || undefined} className="flex w-28 shrink-0 flex-col items-center gap-2 px-2 text-center">
      <MemberAvatar name={head.name} photoUrl={head.photoUrl} size={60} />
      <span className="line-clamp-2 text-xs font-semibold leading-snug text-foreground">{head.name}</span>
      {head.place && <span className="-mt-1.5 line-clamp-1 text-[0.7rem] text-muted-foreground">{head.place}</span>}
    </li>
  );
  return (
    <section aria-labelledby="family-heads-title" className="border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <span className="eyebrow">
          <Users className="h-3.5 w-3.5" aria-hidden="true" /> {t.eyebrow}
        </span>
        <h2 id="family-heads-title" className="mt-3 section-title">
          {t.title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{t.sub}</p>
        <div className="family-heads-strip relative mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
          <div className="family-heads-track flex w-max" style={{ "--family-heads-duration": duration }}>
            <ul data-copy="1" className="flex" aria-label={t.title}>
              {loop.map((head, index) => item(head, `a-${head.id}-${index}`, index >= heads.length))}
            </ul>
            <ul data-copy="2" className="flex" aria-hidden="true">
              {loop.map((head, index) => item(head, `b-${head.id}-${index}`, true))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

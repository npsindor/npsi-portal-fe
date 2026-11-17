import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Loader2, MapPin, UserPlus, Users } from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';
import TeamSections from '@/components/event-members/TeamSections';
import BecomeMemberButton from '@/components/event-members/BecomeMemberDialog';
import { eventMembersApi } from '@/api/eventMembersApi';
import { useLang } from '@/lib/i18n';
import { localizedText } from '@/lib/utils';
import { sectionHeading } from '@/lib/event-member-copy';

const copy = {
  en: { back: 'All events', notFound: 'This event was not found.', error: 'Something went wrong. Please try again.', coreTeam: 'Core Team', coreTeamNote: 'Meet the Sangathan Core Team', noTeam: 'No team is shown for this event yet.' },
  hi: { back: 'सभी कार्यक्रम', notFound: 'यह कार्यक्रम नहीं मिला।', error: 'कुछ गलत हुआ। कृपया फिर प्रयास करें।', coreTeam: 'कोर टीम', coreTeamNote: 'संगठन की कोर टीम से मिलें', noTeam: 'इस कार्यक्रम की टीम अभी नहीं दिखाई गई है।' },
};

// Event page (/events/:slug): event details and its team sections (e.g. "Deepotsav Team"), filled automatically by
// approved Become a Member requests. Joining goes through the one common form.
export default function EventPage() {
  const { slug } = useParams();
  const { lang } = useLang();
  const t = copy[lang] || copy.en;
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { eventMembersApi.teams({ event: slug }).then(setData).catch((cause) => setError(cause.status === 404 ? t.notFound : t.error)); }, [slug, t]);
  const event = data?.event;
  const sections = data?.sections || [];
  useEffect(() => { if (event) document.title = `${localizedText(event, 'title', lang)} | ${lang === 'hi' ? 'निमाड़ पाटीदार संगठन, इंदौर' : 'Nimar Patidar Sangathan, Indore'}`; }, [event, lang]);
  useEffect(() => { if (data && window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: 'start' }); }, [data]);

  return <div className="min-h-screen bg-background"><PublicNav />
    <main id="main-content">
      <section className="relative overflow-hidden hero-band text-cream">
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <Link to="/events" className="inline-flex items-center gap-1.5 text-sm text-cream/80 hover:text-gold"><ArrowLeft className="h-4 w-4" />{t.back}</Link>
          {error && <p role="alert" className="mt-6 text-lg">{error}</p>}
          {!event && !error && <Loader2 className="mt-8 h-6 w-6 animate-spin" />}
          {event && <div className="mt-6 grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
            <div>
              <h1 className="font-display text-3xl font-semibold leading-tight sm:text-5xl">{localizedText(event, 'title', lang)}</h1>
              <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-cream/85">
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-gold" />{new Date(`${event.date}T00:00:00`).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                {event.venue && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-gold" />{event.venue}</span>}
              </p>
              {localizedText(event, 'description', lang) && <p className="mt-4 max-w-2xl whitespace-pre-line text-cream/80">{localizedText(event, 'description', lang)}</p>}
              <div className="mt-6 flex flex-wrap gap-3">
                {sections.map((section) => <a key={section.key} href={`#team-${section.key.toLowerCase()}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-5 text-sm font-bold text-maroon"><Users className="h-4 w-4" />{sectionHeading(section, lang)} ({section.members.length})</a>)}
                <BecomeMemberButton defaultSection={sections[0]?.key} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-cream/50 px-5 text-sm font-bold"><UserPlus className="h-4 w-4" /></BecomeMemberButton>
              </div>
            </div>
            {event.bannerUrl && <img src={event.bannerUrl} alt="" className="max-h-80 w-full rounded-2xl object-contain shadow-2xl ring-1 ring-cream/10" />}
          </div>}
        </div>
      </section>

      {event && <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6">
        {sections.length ? <TeamSections sections={sections} /> : <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{t.noTeam}</p>}
      </div>}

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6"><Link to="/core-team" className="flex items-center justify-between gap-3 rounded-2xl border border-gold/40 bg-gold/5 p-5 hover:bg-gold/10"><span><span className="block font-display text-lg font-semibold text-maroon">{t.coreTeam}</span><span className="text-sm text-muted-foreground">{t.coreTeamNote}</span></span><Users className="h-6 w-6 text-maroon" /></Link></section>
    </main>
    <PublicFooter /></div>;
}

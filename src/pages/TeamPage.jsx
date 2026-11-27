import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, Loader2, UserPlus, Users } from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';
import TeamSections from '@/components/event-members/TeamSections';
import BecomeMemberButton from '@/components/event-members/BecomeMemberDialog';
import { eventMembersApi } from '@/api/eventMembersApi';
import { sectionHeading, useEventMemberCopy } from '@/lib/event-member-copy';
import { localizedText } from '@/lib/utils';

const copy = {
  en: { core: 'The Core Team of Nimad Patidar Sangathan, Indore — the members who coordinate the Sangathan’s work and events.', team: 'Members of the samaj serving in this team.', notFound: 'This team was not found.', event: 'Event page' },
  hi: { core: 'निमाड़ पाटीदार संगठन, इंदौर की कोर टीम — संगठन के कार्य और कार्यक्रमों का समन्वय करने वाले सदस्य।', team: 'इस टीम में सेवा दे रहे समाज के सदस्य।', notFound: 'यह टीम नहीं मिली।', event: 'कार्यक्रम पेज' },
};

// One team section on its own page: /core-team, and /teams/:key for teams without an event page (e.g. Holi Milan).
export default function TeamPage({ sectionKey }) {
  const params = useParams();
  const key = (sectionKey || params.key || '').toUpperCase();
  const { lang } = useEventMemberCopy();
  const c = copy[lang] || copy.en;
  const [data, setData] = useState(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => { setData(null); setMissing(false); eventMembersApi.teams({ section: key }).then(setData).catch(() => setMissing(true)); }, [key]);
  const section = data?.sections?.[0];
  const title = section ? sectionHeading(section, lang) : '';
  useEffect(() => { if (title) document.title = `${title} | ${lang === 'hi' ? 'निमाड़ पाटीदार संगठन, इंदौर' : 'Nimad Patidar Sangathan, Indore'}`; }, [title, lang]);
  return <div className="min-h-screen bg-background"><PublicNav />
    <main id="main-content">
      <section className="hero-band text-cream"><div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-gold"><Users className="h-6 w-6" /></span>
        {missing ? <h1 className="mt-4 font-display text-3xl font-semibold">{c.notFound}</h1>
          : !section ? <Loader2 className="mt-6 h-6 w-6 animate-spin" />
            : <>
              <h1 className="mt-4 font-display text-3xl font-semibold sm:text-5xl">{title}</h1>
              <p className="mt-3 max-w-2xl text-cream/80">{section.isCoreTeam ? c.core : c.team}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <BecomeMemberButton defaultSection={section.key} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-5 text-sm font-bold text-maroon"><UserPlus className="h-4 w-4" /></BecomeMemberButton>
                {data.event?.slug && <Link to={`/events/${data.event.slug}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-cream/50 px-5 text-sm font-bold"><CalendarDays className="h-4 w-4" />{c.event}: {localizedText(data.event, 'title', lang)}</Link>}
              </div>
            </>}
      </div></section>
      {section && <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6"><TeamSections sections={[section]} /></div>}
    </main>
    <PublicFooter /></div>;
}

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, HeartHandshake } from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';
import CommunityDemo, { DemoMessageForm } from '@/components/CommunityDemo';
import { usePublicCopy } from '@/lib/public-copy';
import { services, careers, transportation, medical } from '@/lib/community-content';

const pages = {
  transportation: { eyebrow: 'Transportation', title: 'Travel Together with Our Community', intro: 'Find transport information, coordinate journeys, and explore community-shared travel resources.', cards: transportation },
  medical: { eyebrow: 'Medical', title: 'Community Health Resources', intro: 'Explore healthcare service information, health-awareness programs, and non-urgent community support resources.', cards: medical },
  services: { eyebrow: 'COMMUNITY SERVICES', title: 'Connecting People with Community Resources', intro: 'Our community services help members find useful information, connect with one another, and access community resources. Listings and requests require verification, privacy, and moderation.', cards: services },
  careers: { eyebrow: 'CAREER & BUSINESS', title: 'Opportunities Grow When We Connect.', intro: 'Connecting job seekers, employers, business owners, entrepreneurs, students, and experienced professionals to encourage shared progress.', cards: careers },
  sagun: { eyebrow: 'SAGUN', title: 'Building Meaningful Connections for the Future', intro: 'Sagun is intended to support voluntary matrimonial introductions among interested individuals and families, with respectful communication, informed consent, and careful handling of personal information.', cards: [['privacy-safety', 'Privacy & Safety', 'Profiles must remain private by default. Visibility and contact sharing should be controlled by the profile owner. Phone numbers, home addresses, identity documents, and sensitive details must not be published publicly. Consent is required before sharing information with another person or family.']] },
  contact: { eyebrow: 'CONTACT US', title: 'We Welcome Your Questions and Suggestions.', intro: 'For questions about membership, events, community services, or website assistance, use the organization’s approved public communication channels.', cards: [['contact-details', 'Contact Details', 'Confirmed public phone, email, office address, and office hours will be published here when approved by the organization.'], ['membership', 'Membership Assistance', 'Register your family or check an existing application using the links below.']] },
  feedback: { eyebrow: 'FEEDBACK', title: 'Your Suggestions Help Us Improve.', intro: 'We welcome suggestions, ideas, and constructive feedback to improve the website and strengthen community initiatives.', cards: [['suggestions', 'Share Your Feedback', 'For real feedback, use the member portal.']] },
};
export default function CommunityPage({ kind }) {
  const page = pages[kind];
  const c = usePublicCopy();
  useEffect(() => { document.title = `${c(page.eyebrow)} | ${c("Nimar Patidar Sangathan, Indore")}`; }, [page, c]);
  return <div className="min-h-screen bg-background"><PublicNav /><main id="main-content">
    <section className="bg-maroon text-cream"><div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20"><span className="text-xs font-semibold tracking-widest text-gold">{c(page.eyebrow)}</span><h1 className="mt-5 max-w-4xl font-display text-3xl font-semibold leading-tight sm:text-5xl">{c(page.title)}</h1><p className="mt-6 max-w-3xl text-base leading-relaxed text-cream/80">{c(page.intro)}</p></div></section>
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6"><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{page.cards.map(([id, title, description]) => <article key={id} id={id} className="rounded-2xl border border-border bg-card p-6"><HeartHandshake className="h-7 w-7 text-gold" aria-hidden="true" /><h2 className="mt-5 font-display text-xl font-semibold">{c(title)}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c(description)}</p></article>)}</div>
    {['services', 'careers', 'sagun', 'transportation', 'medical'].includes(kind) ? <CommunityDemo key={kind} group={kind} /> : <DemoMessageForm key={kind} kind={kind} />}
    <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-maroon px-5 py-3 text-sm font-semibold text-cream" to={kind === 'feedback' ? '/portal/feedback' : '/register'}>{c(kind === 'feedback' ? 'Real Member Feedback' : 'Register Your Family')}<ArrowUpRight className="h-4 w-4" /></Link><Link className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-5 py-3 text-sm" to="/application-status">{c("Check Application Status")}</Link></div>
    </section></main><PublicFooter /></div>;
}

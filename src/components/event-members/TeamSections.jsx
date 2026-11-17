import ProfileCard, { ProfileGrid } from '@/components/team/ProfileCard';
import { sectionHeading, useEventMemberCopy } from '@/lib/event-member-copy';

// The approved, visible members of each team section under its own heading (Core Team, Deepotsav Team, …).
export default function TeamSections({ sections, headingLevel = 2 }) {
  const { t, lang } = useEventMemberCopy();
  const H = `h${headingLevel}`;
  const labels = { village: t.village_, area: t.area_, mobile: t.mobile_, email: t.email_ };
  return sections.map((section) => <section key={section.key} id={`team-${section.key.toLowerCase()}`} className="scroll-mt-28">
    <H className="section-title">{sectionHeading(section, lang)}</H>
    <div className="mt-6">{section.members.length
      ? <ProfileGrid>{section.members.map((member) => <ProfileCard key={member.id} labels={labels} person={{ ...member, role: (lang === 'hi' && member.designationHi) || member.designation }} />)}</ProfileGrid>
      : <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{t.teamEmpty}</p>}</div>
  </section>);
}

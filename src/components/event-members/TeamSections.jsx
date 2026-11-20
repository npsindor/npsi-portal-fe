import ProfileCard, { ProfileGrid } from '@/components/team/ProfileCard';
import { sectionHeading, useEventMemberCopy } from '@/lib/event-member-copy';
import { INDORE_AREAS, NATIVE_VILLAGES } from '@/lib/native-places';

// Hindi for a village / Indore area the admin didn't translate: the portal's own lists, matched case-insensitively.
const listHindi = new Map([...NATIVE_VILLAGES, ...INDORE_AREAS].map((option) => [option.value.trim().toLowerCase(), option.hi]));
const inHindi = (value, own) => own || listHindi.get(String(value || '').trim().toLowerCase()) || value;

// A card in the chosen language: the Hindi name / village / role when there is one, else the English.
const localized = (member, lang) =>
  lang === 'hi'
    ? { ...member, name: member.nameHi || member.name, village: inHindi(member.village, member.villageHi), area: inHindi(member.area), role: member.designationHi || member.designation }
    : { ...member, role: member.designation };

// The approved, visible members of each team section under its own heading (Core Team, Deepotsav Team, …).
export default function TeamSections({ sections, headingLevel = 2 }) {
  const { t, lang } = useEventMemberCopy();
  const H = `h${headingLevel}`;
  const labels = { village: t.village_, area: t.area_, mobile: t.mobile_, email: t.email_ };
  return sections.map((section) => <section key={section.key} id={`team-${section.key.toLowerCase()}`} className="scroll-mt-28">
    <H className="section-title">{sectionHeading(section, lang)}</H>
    <div className="mt-6">{section.members.length
      ? <ProfileGrid>{section.members.map((member) => <ProfileCard key={member.id} labels={labels} person={localized(member, lang)} />)}</ProfileGrid>
      : <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{t.teamEmpty}</p>}</div>
  </section>);
}

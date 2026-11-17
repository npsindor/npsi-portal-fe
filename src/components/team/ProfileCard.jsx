import { Home, Mail, MapPin, Phone } from 'lucide-react';


const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => Array.from(part)[0]).join('');

// One profile card for every team (Core Team, Deepotsav Team, …): fixed 4:5 photo (initials when there is none) and
// only the fields that have a value. The API sends the mobile / email only when their owner agreed to show them.
export default function ProfileCard({ person, labels, badge }) {
  const { name, photoUrl, role, village, area, mobile, email } = person;
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-gold/60 hover:shadow-lg">
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-maroon/90 to-maroon-dark">
        {photoUrl
          ? <img src={photoUrl} alt={name} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          : <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center font-display text-5xl font-semibold text-gold/80">{initials(name)}</span>}
        {badge && <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[0.7rem] font-bold text-maroon shadow">{badge}</span>}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="font-display text-lg font-semibold leading-snug text-foreground">{name}</h3>
        {role && <p className="text-sm font-semibold text-gold-dark">{role}</p>}
        <dl className="mt-1 space-y-1 text-sm text-muted-foreground">
          {village && <div className="flex items-start gap-2"><dt className="sr-only">{labels.village}</dt><Home className="mt-0.5 h-4 w-4 shrink-0 text-maroon/70" aria-hidden="true" /><dd>{village}</dd></div>}
          {area && <div className="flex items-start gap-2"><dt className="sr-only">{labels.area}</dt><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-maroon/70" aria-hidden="true" /><dd>{area}</dd></div>}
          {mobile && <div className="flex items-center gap-2"><dt className="sr-only">{labels.mobile}</dt><Phone className="h-4 w-4 shrink-0 text-maroon/70" aria-hidden="true" /><dd><a href={`tel:+91${mobile}`} className="font-semibold text-maroon hover:underline">{mobile.replace(/(\d{5})(\d{5})/, '$1 $2')}</a></dd></div>}
          {email && <div className="flex items-center gap-2"><dt className="sr-only">{labels.email}</dt><Mail className="h-4 w-4 shrink-0 text-maroon/70" aria-hidden="true" /><dd className="min-w-0 break-all"><a href={`mailto:${email}`} className="text-maroon hover:underline">{email}</a></dd></div>}
        </dl>
      </div>
    </article>
  );
}

// Responsive grid for profile cards.
export const ProfileGrid = ({ children }) => <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{children}</div>;

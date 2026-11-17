import { Mail, MapPin, Phone } from 'lucide-react';
import { badge } from '@/components/room/room-ui';
import { rupees } from '@/lib/room-copy';

const dateText = (value, lang) => (value ? new Date(value).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

// Someone looking for a room: name shortened, contact only when they chose to share it.
export default function RequirementCard({ requirement, t, lang, status, actions }) {
  const budget = requirement.minBudget ? `${rupees(requirement.minBudget, lang)} – ${rupees(requirement.maxBudget, lang)}` : `≤ ${rupees(requirement.maxBudget, lang)}`;
  return <article className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
    <div className="flex items-start justify-between gap-2">
      <h3 className="font-semibold">{requirement.propertyType}</h3>
      {status && <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge(status)}`}>{t.status[status] || status}</span>}
    </div>
    <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4 shrink-0" />{requirement.area}</p>
    <p className="text-sm"><span className="text-muted-foreground">{t.budget}: </span><span className="font-semibold text-maroon">{budget}</span> <span className="text-muted-foreground">{t.perMonth}</span></p>
    {requirement.note && <p className="line-clamp-3 text-sm">{requirement.note}</p>}
    <p className="text-xs text-muted-foreground">{requirement.name} · {t.posted} {dateText(requirement.postedAt, lang)}{requirement.moveInDate ? ` · ${t.moveIn.replace(/ \(.*\)/, '')}: ${dateText(requirement.moveInDate, lang)}` : ''}</p>
    {(requirement.mobile || requirement.email) && <div className="space-y-1 border-t border-border pt-2 text-sm">
      {requirement.mobile && <a className="flex items-center gap-2 text-maroon hover:underline" href={`tel:+91${requirement.mobile}`}><Phone className="h-4 w-4" />{requirement.mobile}</a>}
      {requirement.email && <a className="flex items-center gap-2 break-all text-maroon hover:underline" href={`mailto:${requirement.email}`}><Mail className="h-4 w-4" />{requirement.email}</a>}
    </div>}
    {actions}
  </article>;
}

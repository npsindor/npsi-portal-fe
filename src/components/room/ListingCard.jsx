import { CalendarDays, Mail, MapPin, Phone } from 'lucide-react';
import { badge, secondary } from '@/components/room/room-ui';
import { rupees } from '@/lib/room-copy';
import PhotoCarousel from '@/components/room/PhotoCarousel';

const dateText = (value, lang) => (value ? new Date(value).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

// A public listing: only what the owner chose to show; enquiry button when contacts are hidden.
export default function ListingCard({ listing, t, lang, onEnquire, actions }) {
  return <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
    <PhotoCarousel photos={listing.photos?.length ? listing.photos : listing.photoUrl ? [listing.photoUrl] : []} t={t} alt={`${listing.propertyType}, ${listing.area}`} />
    <div className="flex flex-1 flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-foreground">{listing.propertyType}</h3>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge(listing.status)}`}>{t.status[listing.status] || listing.status}</span>
      </div>
      <p className="text-lg font-semibold text-maroon">{rupees(listing.rentAmount, lang)} <span className="text-sm font-normal text-muted-foreground">{t.perMonth}</span></p>
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4 shrink-0" />{listing.area}{listing.address ? ` · ${listing.address}` : ''}</p>
      {listing.description && <p className="line-clamp-3 text-sm">{listing.description}</p>}
      <dl className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <div><dt className="inline">{t.for}: </dt><dd className="inline">{t[listing.availableFor] || listing.availableFor}</dd></div>
        {listing.availableFrom && <div><dt className="inline">{t.availableFrom}: </dt><dd className="inline">{dateText(listing.availableFrom, lang)}</dd></div>}
        <div className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{t.posted} {dateText(listing.postedAt, lang)}</div>
        <div>{t.reference}: {listing.reference}</div>
      </dl>
      <div className="mt-auto space-y-2 border-t border-border pt-3 text-sm">
        <p className="font-medium">{listing.contactName}</p>
        {listing.mobile && <a className="flex items-center gap-2 text-maroon hover:underline" href={`tel:+91${listing.mobile}`}><Phone className="h-4 w-4" />{listing.mobile}</a>}
        {listing.email && <a className="flex items-center gap-2 break-all text-maroon hover:underline" href={`mailto:${listing.email}`}><Mail className="h-4 w-4" />{listing.email}</a>}
        {listing.contactHidden && <p className="text-xs text-muted-foreground">{t.hiddenContact}</p>}
        {onEnquire && <button type="button" className={`${secondary} w-full`} onClick={() => onEnquire(listing)}>{t.enquire}</button>}
        {actions}
      </div>
    </div>
  </article>;
}

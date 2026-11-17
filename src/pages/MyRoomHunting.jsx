import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { House, Loader2, Phone, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import ListingCard from '@/components/room/ListingCard';
import RequirementCard from '@/components/room/RequirementCard';
import ListingForm from '@/components/room/ListingForm';
import { primary, secondary } from '@/components/room/room-ui';
import { roomApi } from '@/api/roomHuntingApi';
import { useAuth } from '@/lib/AuthContext';
import { useLang } from '@/lib/i18n';
import { roomCopy, roomError } from '@/lib/room-copy';

const small = 'rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50';
const dateText = (value, lang) => (value ? new Date(value).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

// Member / student dashboard: own listings with their matches and enquiries, own requirements with matching listings.
export default function MyRoomHunting() {
  const { lang } = useLang();
  const t = roomCopy[lang];
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [options, setOptions] = useState(null);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(() => roomApi.mine().then((value) => setData({ eligible: false, listings: [], requirements: [], enquiriesSent: [], ...(value && !Array.isArray(value) ? value : {}) })).catch((cause) => setError(roomError(t, cause))), [t]);
  useEffect(() => { load(); roomApi.options().then(setOptions).catch(() => setOptions({ propertyTypes: [], areas: [] })); }, [load]);

  const act = async (key, work, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(key); setError(''); setMessage('');
    try { await work(); await load(); } catch (cause) { setError(roomError(t, cause)); } finally { setBusy(''); }
  };

  if (!data) return <div className="flex justify-center py-16">{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : <Loader2 className="h-6 w-6 animate-spin text-maroon" />}</div>;
  return <div className="space-y-8">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-maroon"><House className="h-6 w-6" />{t.myDashboard}</h1><p className="mt-1 text-sm text-muted-foreground">{t.intro}</p></div>
      <div className="flex flex-wrap gap-2">
        {data.eligible && <button type="button" className={primary} onClick={() => setEditing('new')}><Plus className="h-4 w-4" />{t.addProperty}</button>}
        <Link to="/room-hunting#post-requirement" className={secondary}>{t.postRequirement}</Link>
      </div>
    </header>
    {!data.eligible && <p role="alert" className="rounded-xl border border-gold/40 bg-gold/10 p-3 text-sm">{t.membersOnly}</p>}
    {message && <p role="status" className="rounded-xl border border-gold/40 bg-gold/10 p-3 text-sm">{message}</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

    <section aria-labelledby="my-listings"><h2 id="my-listings" className="font-display text-xl font-semibold">{t.myListings}</h2>
      {data.listings.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">{t.none}</p> : <div className="mt-4 space-y-6">{data.listings.map((listing) => <div key={listing.id} className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <ListingCard listing={listing} t={t} lang={lang} actions={<div className="space-y-2">
          {listing.adminRemarks && <p className="text-xs text-destructive">{t.remarks}: {listing.adminRemarks}</p>}
          {listing.expiresAt && <p className="text-xs text-muted-foreground">{t.expires}: {dateText(listing.expiresAt, lang)}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="button" className={small} disabled={!!busy} onClick={() => setEditing(listing)}>{t.edit}</button>
            {['PENDING', 'APPROVED'].includes(listing.status) && <button type="button" className={small} disabled={!!busy} onClick={() => act(listing.id, () => roomApi.listingStatus(listing.id, 'RENTED'))}>{t.markRented}</button>}
            {['PENDING', 'APPROVED'].includes(listing.status) && <button type="button" className={small} disabled={!!busy} onClick={() => act(listing.id, () => roomApi.listingStatus(listing.id, 'INACTIVE'))}>{t.deactivate}</button>}
            {['RENTED', 'INACTIVE', 'EXPIRED'].includes(listing.status) && <button type="button" className={small} disabled={!!busy} onClick={() => act(listing.id, () => roomApi.listingStatus(listing.id, 'ACTIVE'))}>{t.relist}</button>}
            <button type="button" className={`${small} text-destructive`} disabled={!!busy} onClick={() => act(listing.id, () => roomApi.removeListing(listing.id), t.confirmDelete)}>{t.remove}</button>
          </div>
        </div>} />
        <div className="space-y-4">
          <div><h3 className="text-sm font-semibold">{t.matchingRequests} ({listing.matches.length})</h3>
            {listing.matches.length === 0 ? <p className="mt-1 text-sm text-muted-foreground">{t.none}</p> : <div className="mt-2 grid gap-3 sm:grid-cols-2">{listing.matches.map((match) => <RequirementCard key={match.id} requirement={match.requirement} t={t} lang={lang} />)}</div>}
          </div>
          <div><h3 className="text-sm font-semibold">{t.enquiries} ({listing.enquiries.length})</h3>
            {listing.enquiries.length === 0 ? <p className="mt-1 text-sm text-muted-foreground">{t.none}</p> : <ul className="mt-2 space-y-2">{listing.enquiries.map((enquiry) => <li key={enquiry.id} className="rounded-xl border border-border p-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">{enquiry.name}</span><a href={`tel:+91${enquiry.mobile}`} className="flex items-center gap-1 text-maroon hover:underline"><Phone className="h-3.5 w-3.5" />{enquiry.mobile}</a></div><p className="mt-1 whitespace-pre-line">{enquiry.message}</p><p className="mt-1 text-xs text-muted-foreground">{dateText(enquiry.createdAt, lang)}</p></li>)}</ul>}
          </div>
        </div>
      </div>)}</div>}
    </section>

    <section aria-labelledby="my-requirements"><h2 id="my-requirements" className="font-display text-xl font-semibold">{t.myRequirements}</h2>
      {data.requirements.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">{t.none}</p> : <div className="mt-4 space-y-6">{data.requirements.map((requirement) => <div key={requirement.id} className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <RequirementCard requirement={requirement} t={t} lang={lang} status={requirement.status} actions={<div className="space-y-2">
          {requirement.adminRemarks && <p className="text-xs text-destructive">{t.remarks}: {requirement.adminRemarks}</p>}
          <p className="text-xs text-muted-foreground">{t.reference}: {requirement.reference} · {t.expires}: {dateText(requirement.expiresAt, lang)}</p>
          {['PENDING', 'APPROVED'].includes(requirement.status) && <button type="button" className={small} disabled={!!busy} onClick={() => act(requirement.id, () => roomApi.closeRequirement(requirement.id), t.confirmClose)}>{t.closeRequirement}</button>}
        </div>} />
        <div><h3 className="text-sm font-semibold">{t.matchesFound} ({requirement.matches.length})</h3>
          {requirement.matches.length === 0 ? <p className="mt-1 text-sm text-muted-foreground">{t.noMatches}</p> : <div className="mt-2 grid gap-3 sm:grid-cols-2">{requirement.matches.map((match) => <ListingCard key={match.id} listing={match.listing} t={t} lang={lang} />)}</div>}
        </div>
      </div>)}</div>}
    </section>

    {data.enquiriesSent.length > 0 && <section aria-labelledby="sent"><h2 id="sent" className="font-display text-xl font-semibold">{t.sentEnquiries}</h2>
      <ul className="mt-3 space-y-2">{data.enquiriesSent.map((enquiry) => <li key={enquiry.id} className="rounded-xl border border-border p-3 text-sm"><span className="font-semibold">{enquiry.listing.propertyType} · {enquiry.listing.area}</span> <span className="text-muted-foreground">({enquiry.listing.reference}) · {dateText(enquiry.createdAt, lang)}</span><p className="mt-1">{enquiry.message}</p></li>)}</ul>
    </section>}

    <Dialog open={Boolean(editing)} onOpenChange={(open) => { if (!open) setEditing(null); }}>
      <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
        <DialogTitle>{editing === 'new' ? t.addProperty : t.edit}</DialogTitle>
        <DialogDescription>{t.addPropertyHint}</DialogDescription>
        {editing && <ListingForm t={t} lang={lang} user={user} options={options} listing={editing === 'new' ? null : editing} onCancel={() => setEditing(null)} onSaved={(_saved, text) => { setEditing(null); setMessage(text); load(); }} />}
      </DialogContent>
    </Dialog>
  </div>;
}

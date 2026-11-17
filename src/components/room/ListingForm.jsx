import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import CreatableCombobox from '@/components/CreatableCombobox';
import { base44 } from '@/api/base44Client';
import { roomApi } from '@/api/roomHuntingApi';
import { comboCopy, optionList, roomError } from '@/lib/room-copy';
import { field, label, primary, secondary } from '@/components/room/room-ui';

const MAX_PHOTO = 5 * 1024 * 1024;
const blank = (user) => ({
  propertyType: '', availableFor: 'ANY', rentAmount: '', area: '', address: '', showAddress: false, availableFrom: '', description: '', photoUrl: '',
  contactName: user?.fullName || '', contactMobile: user?.phone || '', contactEmail: user?.email || '', showMobile: true, showEmail: false, ownerConfirmed: false,
});
const fromListing = (row) => ({
  propertyType: row.propertyType, availableFor: row.availableFor, rentAmount: String(row.rentAmount), area: row.area, address: row.address || '', showAddress: row.showAddress,
  availableFrom: row.availableFrom || '', description: row.description || '', photoUrl: row.photoUrl || '', contactName: row.contactName, contactMobile: row.contactMobile,
  contactEmail: row.contactEmail || '', showMobile: row.showMobile, showEmail: row.showEmail, ownerConfirmed: true,
});

// Add or edit a rental listing. Only essentials are required (type, rent, area, contact, permission); the rest is optional.
export default function ListingForm({ t, lang, user, options, listing, onSaved, onCancel }) {
  const [form, setForm] = useState(() => (listing ? fromListing(listing) : blank(user)));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(crypto.randomUUID());
  const set = (key, value) => { setForm((current) => ({ ...current, [key]: value })); setError(''); };

  const upload = async (file) => {
    if (!file) return;
    if (!/^image\/(jpe?g|png|webp)$/i.test(file.type)) return setError(lang === 'hi' ? 'केवल जेपीजी, पीएनजी या वेबपी फोटो।' : 'Only JPG, PNG or WebP photos.');
    if (file.size > MAX_PHOTO) return setError(lang === 'hi' ? 'फोटो 5 एमबी से बड़ी नहीं होनी चाहिए।' : 'The photo must be 5 MB or smaller.');
    setUploading(true);
    try { const { fileUrl } = await base44.integrations.Core.UploadPublicFile({ file }); set('photoUrl', fileUrl); }
    catch (cause) { setError(roomError(t, cause)); }
    finally { setUploading(false); }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    const rent = Number(form.rentAmount);
    if (!form.propertyType.trim() || !form.area.trim() || form.rentAmount === '' || !Number.isInteger(rent) || rent < 0 || !form.contactName.trim() || !form.contactMobile.trim() || !form.ownerConfirmed) return setError(t.required);
    const body = { ...form, rentAmount: rent, clientRequestId: requestId.current, showEmail: form.showEmail && Boolean(form.contactEmail.trim()) };
    setBusy(true);
    try {
      const saved = listing ? await roomApi.updateListing(listing.id, body) : await roomApi.addListing(body);
      requestId.current = crypto.randomUUID();
      onSaved?.(saved, listing ? t.listingUpdated : t.listingSubmitted);
    } catch (cause) { setError(roomError(t, cause)); }
    finally { setBusy(false); }
  };

  const types = optionList(options?.propertyTypes);
  const areas = optionList(options?.areas);
  const combo = comboCopy(lang);
  return <form onSubmit={submit} noValidate className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2">
      <CreatableCombobox id="listing-type" label={`${t.type} *`} value={form.propertyType} onChange={(value) => set('propertyType', value)} options={types} lang={lang} t={combo} maxLength={60} />
      <CreatableCombobox id="listing-area" label={`${t.area} *`} value={form.area} onChange={(value) => set('area', value)} options={areas} lang={lang} t={combo} />
      <label className={label}>{t.rent} *<input className={field} type="number" inputMode="numeric" min="0" step="1" required value={form.rentAmount} onChange={(e) => set('rentAmount', e.target.value)} /></label>
      <label className={label}>{t.availableFor}<select className={field} value={form.availableFor} onChange={(e) => set('availableFor', e.target.value)}>{['ANY', 'FAMILY', 'STUDENT'].map((value) => <option key={value} value={value}>{t[value]}</option>)}</select></label>
      <label className={label}>{t.availableFrom}<input className={field} type="date" value={form.availableFrom} onChange={(e) => set('availableFrom', e.target.value)} /></label>
    </div>
    <label className={label}>{t.description}<textarea className={field} rows={3} maxLength={2000} value={form.description} onChange={(e) => set('description', e.target.value)} /></label>
    <label className={label}>{t.address}<input className={field} maxLength={500} value={form.address} onChange={(e) => set('address', e.target.value)} /></label>
    {form.address.trim() && <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-maroon" checked={form.showAddress} onChange={(e) => set('showAddress', e.target.checked)} />{t.showAddress}</label>}

    <div><span className={label}>{t.photo}</span><p className="text-xs text-muted-foreground">{t.photoHint}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        {form.photoUrl ? <img src={form.photoUrl} alt="" className="h-24 w-32 rounded-xl border border-border object-cover" /> : <div className="flex h-24 w-32 items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground"><ImagePlus className="h-6 w-6" /></div>}
        <label className={`${secondary} cursor-pointer`}>{uploading ? <><Loader2 className="h-4 w-4 animate-spin" />{t.uploading}</> : form.photoUrl ? t.replacePhoto : t.uploadPhoto}<input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; upload(file); }} /></label>
        {form.photoUrl && <button type="button" className={secondary} onClick={() => set('photoUrl', '')}><Trash2 className="h-4 w-4" />{t.removePhoto}</button>}
      </div>
    </div>

    <fieldset className="space-y-3 rounded-2xl border border-border p-4"><legend className="px-1 text-sm font-semibold">{t.contact}</legend>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className={label}>{t.contactName} *<input className={field} maxLength={150} required value={form.contactName} onChange={(e) => set('contactName', e.target.value)} /></label>
        <label className={label}>{t.contactMobile} *<input className={field} type="tel" inputMode="numeric" maxLength={10} required value={form.contactMobile} onChange={(e) => set('contactMobile', e.target.value.replace(/\D/g, '').slice(0, 10))} /></label>
        <label className={label}>{t.contactEmail}<input className={field} type="email" maxLength={254} value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} /></label>
      </div>
      <p className="text-xs text-muted-foreground">{t.visibilityHint}</p>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-maroon" checked={form.showMobile} onChange={(e) => set('showMobile', e.target.checked)} />{t.showMobile}</label>
        <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-maroon" checked={form.showEmail} disabled={!form.contactEmail.trim()} onChange={(e) => set('showEmail', e.target.checked)} />{t.showEmail}</label>
      </div>
    </fieldset>
    <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-maroon" checked={form.ownerConfirmed} onChange={(e) => set('ownerConfirmed', e.target.checked)} />{t.ownerConfirmed} *</label>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex flex-wrap justify-end gap-2">
      {onCancel && <button type="button" className={secondary} onClick={onCancel}>{t.cancel}</button>}
      <button type="submit" className={primary} disabled={busy || uploading}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{listing ? t.updateListing : t.saveListing}</button>
    </div>
  </form>;
}

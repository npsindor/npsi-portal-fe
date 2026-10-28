import { useEffect, useState } from 'react';
import { House, MapPin, Plus, Search } from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useLang } from '@/lib/i18n';
import { indoreAreas } from '@/lib/contact-info-text';

const types = [['room', 'Single Room', 'सिंगल रूम'], ['1bhk', '1 BHK', '1 बीएचके'], ['2bhk', '2 BHK', '2 बीएचके'], ['3bhk', '3 BHK', '3 बीएचके'], ['other', 'Other', 'अन्य']];
const samples = [
  { id: 'sample-flat-204', area: 'Vijay Nagar', type: '2bhk', house: '204', rent: 12000, contactType: 'owner', phone: '', sample: true },
  { id: 'sample-flat-12', area: 'Bhawarkuan', type: '1bhk', house: '12', rent: 8000, contactType: 'poster', phone: '', sample: true },
];
const storageKey = 'nps-room-hunting-demo-v1';
const emptyDraft = () => ({ area: '', house: '', type: 'room', rent: '', contactType: 'owner', phone: '', consent: false });
const input = 'mt-2 min-h-12 w-full min-w-0 rounded-2xl border border-border bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring';
const primary = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-maroon px-6 py-3 text-center font-semibold text-cream hover:bg-maroon-dark';
const secondary = 'inline-flex min-h-12 items-center justify-center rounded-full border border-border px-5 py-3 text-sm font-semibold hover:bg-muted';

function readSaved() {
  try {
    const data = JSON.parse(sessionStorage.getItem(storageKey) || '[]');
    return Array.isArray(data) ? data.filter(item => item && typeof item.id === 'string' && indoreAreas.some(([area]) => area === item.area) && types.some(([type]) => type === item.type) && typeof item.house === 'string' && (item.rent === '' || (Number.isFinite(item.rent) && item.rent >= 0)) && ['owner', 'poster'].includes(item.contactType) && /^[6-9]\d{9}$/.test(item.phone)) : [];
  } catch { return []; }
}

export default function RoomHunting() {
  const { lang } = useLang();
  const hi = lang === 'hi';
  const copy = (en, hindi) => hi ? hindi : en;
  const [area, setArea] = useState('');
  const [type, setType] = useState('');
  const [filters, setFilters] = useState({ area: '', type: '' });
  const [saved, setSaved] = useState(readSaved);
  const [draft, setDraft] = useState(emptyDraft);
  const [preview, setPreview] = useState(null);
  const [contact, setContact] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(false);
  const areaLabel = value => indoreAreas.find(([en]) => en === value)?.[hi ? 1 : 0] || value;
  const typeLabel = value => types.find(([id]) => id === value)?.[hi ? 2 : 1] || value;
  const rentLabel = value => new Intl.NumberFormat(hi ? 'hi-IN' : 'en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  const listings = [...saved, ...samples].filter(item => (!filters.area || item.area === filters.area) && (!filters.type || item.type === filters.type));
  const change = (key, value) => { setDraft(current => ({ ...current, [key]: value })); setError(''); setNotice(false); };
  useEffect(() => { document.title = hi ? 'आवास साथी | निमाड़ पाटीदार संगठन' : 'Room Hunting | Nimar Patidar Sangathan'; }, [hi]);
  const onPreview = event => {
    event.preventDefault(); setError(''); setNotice(false);
    if (!draft.area || !draft.type || !draft.phone.trim() || !draft.consent) { setError('required'); return; }
    const phone = draft.phone.replace(/[\s()-]/g, '').replace(/^\+91/, '');
    if (!/^[6-9]\d{9}$/.test(phone)) { setError('phone'); return; }
    if (draft.rent !== '' && (!Number.isFinite(Number(draft.rent)) || Number(draft.rent) < 0 || Number(draft.rent) > 10000000)) { setError('rent'); return; }
    setPreview({ id: crypto.randomUUID(), area: draft.area, house: draft.house.trim(), type: draft.type, rent: draft.rent === '' ? '' : Number(draft.rent), contactType: draft.contactType, phone, sample: false });
  };
  const publish = () => {
    if (!preview) return;
    const next = [preview, ...saved];
    try { sessionStorage.setItem(storageKey, JSON.stringify(next)); }
    catch { setError('storage'); setPreview(null); return; }
    setSaved(next); setDraft(emptyDraft()); setPreview(null); setNotice(true);
    setArea(''); setType(''); setFilters({ area: '', type: '' });
  };
  const clearDemo = () => {
    try { sessionStorage.removeItem(storageKey); }
    catch { setError('storage'); return; }
    setSaved([]); setNotice(false); setError('');
  };
  const errors = {
    required: copy('Please select an area, enter a contact number, and accept the demo consent.', 'कृपया क्षेत्र चुनें, संपर्क नंबर भरें और डेमो सहमति दें।'),
    phone: copy('Enter a valid 10-digit Indian mobile number.', 'मान्य 10 अंकों का भारतीय मोबाइल नंबर भरें।'),
    rent: copy('Enter a monthly rent between ₹0 and ₹1,00,00,000, or leave it blank.', 'मासिक किराया ₹0 से ₹1,00,00,000 के बीच भरें या खाली छोड़ें।'),
    storage: copy('Could not save the demo. Browser storage may be disabled or full.', 'डेमो सहेजा नहीं जा सका। ब्राउज़र स्टोरेज बंद या भरा हो सकता है।'),
  };
  const ContactDetails = ({ listing }) => <div className="space-y-3 break-words text-sm leading-relaxed">
    <p>{areaLabel(listing.area)} · {typeLabel(listing.type)}</p>
    {listing.house && <p>{copy('House / Flat Number', 'मकान / फ्लैट नंबर')}: {listing.house}</p>}
    <p>{copy(listing.contactType === 'owner' ? "Owner’s Number" : 'My Number (Person Posting)', listing.contactType === 'owner' ? 'मकान मालिक का नंबर' : 'मेरा नंबर (पोस्ट करने वाला)')}</p>
    <p className="rounded-xl bg-muted p-4 font-semibold">{listing.phone || copy('No real contact number is provided for this sample.', 'इस नमूने में कोई वास्तविक संपर्क नंबर नहीं दिया गया है।')}</p>
    <p className="text-muted-foreground">{copy('Demo details are visible only in this browser session. No owner is contacted.', 'डेमो विवरण केवल इस ब्राउज़र सत्र में दिखते हैं। किसी मकान मालिक से संपर्क नहीं किया जाता।')}</p>
  </div>;

  return <div className="min-h-screen bg-background"><PublicNav /><main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
    <div className="flex items-start justify-between gap-3"><div><h1 className="font-display text-3xl font-semibold sm:text-4xl">{copy('Room Hunting', 'आवास साथी')}</h1><p className="mt-3 text-muted-foreground">{copy('Find a home within our community', 'अपने समाज में किराए का घर खोजें')}</p></div><House className="mt-1 h-9 w-9 shrink-0 text-maroon" aria-hidden="true" /></div>
    <aside className="mt-6 rounded-2xl border border-gold/40 bg-gold/10 p-4 text-sm leading-relaxed"><strong>{copy('Demo listings', 'डेमो लिस्टिंग')}</strong><p className="mt-1">{copy('Sample properties are fictional. Posts and contact details stay only in this browser session and are not sent to the organization. Use fictional details when trying the form.', 'नमूना संपत्तियाँ काल्पनिक हैं। पोस्ट और संपर्क विवरण केवल इस ब्राउज़र सत्र में रहते हैं और संगठन को नहीं भेजे जाते। फॉर्म आज़माते समय काल्पनिक जानकारी भरें।')}</p></aside>
    <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1fr_1fr]">
      <div className="min-w-0"><form className="rounded-3xl bg-muted p-5 sm:p-6" onSubmit={event => { event.preventDefault(); setFilters({ area, type }); }}>
        <label htmlFor="rent-area" className="flex items-center gap-2 text-lg font-semibold"><MapPin className="h-5 w-5" />{copy('Select Area', 'क्षेत्र चुनें')}</label>
        <select id="rent-area" className={input} value={area} onChange={event => setArea(event.target.value)}><option value="">{copy('All areas', 'सभी क्षेत्र')}</option>{indoreAreas.map(([en, hindi]) => <option value={en} key={en}>{hi ? hindi : en}</option>)}</select>
        <fieldset className="mt-6"><legend className="text-lg font-semibold">{copy('Property Type', 'संपत्ति का प्रकार')}</legend><div className="mt-3 flex flex-wrap gap-2">{types.map(([id, en, hindi]) => <button key={id} type="button" aria-pressed={type === id} onClick={() => setType(current => current === id ? '' : id)} className={`min-h-11 rounded-full border px-4 py-2 text-sm font-semibold ${type === id ? 'border-maroon bg-maroon text-cream' : 'border-border bg-background hover:border-gold'}`}>{hi ? hindi : (id === 'room' ? 'Room' : en)}</button>)}</div></fieldset>
        <button type="submit" className={`${primary} mt-5 w-full`}><Search className="h-4 w-4" />{copy('Search Rooms', 'कमरे खोजें')}</button>
      </form>
      <section aria-labelledby="rent-results" className="mt-8"><div className="flex flex-wrap items-center justify-between gap-2"><h2 id="rent-results" className="font-display text-2xl font-semibold">{copy('Available Listings', 'उपलब्ध लिस्टिंग')}</h2><p role="status" className="text-sm text-muted-foreground">{listings.length} {copy('results', 'परिणाम')}</p></div>
        <div className="mt-5 space-y-4">{listings.map(listing => <article key={listing.id} className="rounded-3xl border border-border bg-card p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><h3 className="text-xl font-semibold">{typeLabel(listing.type)}{listing.type.includes('bhk') ? copy(' Flat', ' फ्लैट') : ''}</h3><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">{copy('Available', 'उपलब्ध')}</span></div><p className="mt-3 text-muted-foreground">{areaLabel(listing.area)}</p><p className="mt-2 text-sm">{copy(listing.contactType === 'owner' ? 'Owner contact available' : 'Posted by community member', listing.contactType === 'owner' ? 'मकान मालिक का संपर्क देखें' : 'समाज के सदस्य द्वारा पोस्ट किया गया')}</p>{listing.rent !== '' && <p className="mt-2 text-sm font-semibold">{rentLabel(listing.rent)} {copy('/ month', '/ माह')}</p>}<p className="mt-2 text-xs text-muted-foreground">{listing.sample ? copy('Fictional sample', 'काल्पनिक नमूना') : copy('Your session-only demo post', 'आपकी सत्र तक सीमित डेमो पोस्ट')}</p><button type="button" className={`${secondary} mt-4 w-full`} onClick={() => setContact(listing)}>{copy('View Contact', 'संपर्क देखें')}</button></article>)}</div>
        {listings.length === 0 && <div className="mt-5 rounded-2xl border border-dashed border-border p-6 text-center"><p>{copy('No rooms match your search.', 'आपकी खोज से मेल खाने वाला कमरा नहीं मिला।')}</p><button type="button" className={`${secondary} mt-4`} onClick={() => { setArea(''); setType(''); setFilters({ area: '', type: '' }); }}>{copy('Clear filters', 'फ़िल्टर हटाएँ')}</button></div>}
      </section></div>
      <section id="post-property" className="min-w-0 rounded-3xl border border-border bg-card p-5 sm:p-6"><h2 className="flex items-center gap-2 font-display text-2xl font-semibold"><Plus className="h-5 w-5 shrink-0" />{copy('Post a Property', 'संपत्ति पोस्ट करें')}</h2><form onSubmit={onPreview} noValidate className="mt-6 space-y-6">
        <label className="block text-sm font-medium" htmlFor="post-area">{copy('Area', 'क्षेत्र')} *<select id="post-area" required className={input} value={draft.area} onChange={event => change('area', event.target.value)}><option value="">{copy('Select area', 'क्षेत्र चुनें')}</option>{indoreAreas.map(([en, hindi]) => <option value={en} key={en}>{hi ? hindi : en}</option>)}</select></label>
        <div><label className="block text-sm font-medium" htmlFor="post-house">{copy('House / Flat Number', 'मकान / फ्लैट नंबर')}<input id="post-house" maxLength={100} className={input} placeholder={copy('e.g. Flat 204, Block B', 'जैसे फ्लैट 204, ब्लॉक बी')} value={draft.house} onChange={event => change('house', event.target.value)} /></label><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{copy('Optional. Shown only after selecting View Contact.', 'वैकल्पिक। केवल संपर्क देखें चुनने के बाद दिखाया जाएगा।')}</p></div>
        <fieldset><legend className="text-sm font-semibold">{copy('Property Type', 'संपत्ति का प्रकार')} *</legend><div className="mt-2 space-y-1">{types.map(([id, en, hindi]) => <label key={id} className="flex min-h-11 items-center gap-3 text-sm"><input type="radio" name="post-type" value={id} checked={draft.type === id} onChange={() => change('type', id)} className="h-5 w-5 accent-maroon" />{hi ? hindi : en}</label>)}</div></fieldset>
        <label className="block text-sm font-medium" htmlFor="post-rent">{copy('Monthly Rent (Optional)', 'मासिक किराया (वैकल्पिक)')}<input id="post-rent" type="number" inputMode="decimal" min="0" max="10000000" step="any" className={input} placeholder={copy('₹ e.g. 8000', '₹ जैसे 8000')} value={draft.rent} onChange={event => change('rent', event.target.value)} /></label>
        <fieldset className="border-t border-border pt-6"><legend className="text-lg font-semibold">{copy('Contact Details', 'संपर्क विवरण')}</legend>{[['owner', "Owner’s Number", 'मकान मालिक का नंबर'], ['poster', 'My Number (Person Posting)', 'मेरा नंबर (पोस्ट करने वाला)']].map(([id, en, hindi]) => <label key={id} className="flex min-h-12 items-center gap-3 text-sm"><input type="radio" name="contact-type" value={id} checked={draft.contactType === id} onChange={() => change('contactType', id)} className="h-5 w-5 accent-maroon" />{hi ? hindi : en}</label>)}</fieldset>
        <label className="block text-sm font-medium" htmlFor="post-phone">{copy('Contact Number', 'संपर्क नंबर')} *<input id="post-phone" type="tel" inputMode="tel" maxLength={20} required className={input} placeholder={copy('Enter mobile number', 'मोबाइल नंबर भरें')} value={draft.phone} onChange={event => change('phone', event.target.value)} /></label>
        <label className="flex items-start gap-3 text-sm leading-relaxed"><input type="checkbox" checked={draft.consent} onChange={event => change('consent', event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-maroon" />{copy('I will use fictional details for this demo and consent to showing the contact details after View Contact in this browser session.', 'मैं इस डेमो में काल्पनिक जानकारी भरूँगा/भरूँगी और इस ब्राउज़र सत्र में संपर्क देखें चुनने के बाद संपर्क विवरण दिखाने की सहमति देता/देती हूँ।')}</label>
        {error && <p role="alert" className="text-sm text-destructive">{errors[error]}</p>}
        <button type="submit" className={`${primary} w-full`}>{copy('Preview Listing', 'लिस्टिंग का पूर्वावलोकन')}</button>
        {saved.length > 0 && <button type="button" className={`${secondary} w-full`} onClick={clearDemo}>{copy('Clear My Demo Posts', 'मेरी डेमो पोस्ट हटाएँ')}</button>}
        {notice && <p role="status" className="rounded-xl border border-gold/40 p-4 text-sm">{copy('Demo listing saved in this browser session. Nothing was sent to the organization.', 'डेमो लिस्टिंग इस ब्राउज़र सत्र में सहेजी गई। संगठन को कुछ नहीं भेजा गया।')}</p>}
      </form></section>
    </div>
    <Dialog open={!!contact} onOpenChange={open => { if (!open) setContact(null); }}><DialogContent className="max-h-[85dvh] overflow-y-auto"><DialogTitle>{copy('Contact Details', 'संपर्क विवरण')}</DialogTitle><DialogDescription>{copy('Demo property contact', 'डेमो संपत्ति का संपर्क')}</DialogDescription>{contact && <ContactDetails listing={contact} />}</DialogContent></Dialog>
    <Dialog open={!!preview} onOpenChange={open => { if (!open) setPreview(null); }}><DialogContent className="max-h-[85dvh] overflow-y-auto"><DialogTitle>{copy('Preview Listing', 'लिस्टिंग का पूर्वावलोकन')}</DialogTitle><DialogDescription>{copy('Review your session-only demo before saving.', 'सहेजने से पहले सत्र तक सीमित डेमो विवरण जाँचें।')}</DialogDescription>{preview && <><ContactDetails listing={preview} />{preview.rent !== '' && <p>{rentLabel(preview.rent)} {copy('/ month', '/ माह')}</p>}<button type="button" className={primary} onClick={publish}>{copy('Save Demo Listing', 'डेमो लिस्टिंग सहेजें')}</button><button type="button" className={secondary} onClick={() => setPreview(null)}>{copy('Edit Details', 'विवरण बदलें')}</button></>}</DialogContent></Dialog>
  </main><PublicFooter /></div>;
}

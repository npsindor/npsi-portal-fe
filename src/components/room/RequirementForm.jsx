import { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import CreatableCombobox from '@/components/CreatableCombobox';
import { roomApi } from '@/api/roomHuntingApi';
import { getRecaptchaToken } from '@/lib/recaptcha';
import { indiaToday } from '@/lib/dates';
import { BUDGETS, comboCopy, optionList, roomError, rupees } from '@/lib/room-copy';
import { field, label, primary } from '@/components/room/room-ui';
import ListingCard from '@/components/room/ListingCard';
import { normalizeField } from "@/lib/utils";

// Anyone may post what they need. Logged-in members/students are published and matched at once; visitors are checked first.
export default function RequirementForm({ t, lang, user, isAuthenticated, options, onPosted }) {
  const empty = () => ({ name: user?.fullName || '', mobile: user?.phone || '', email: user?.email || '', propertyType: '', area: '', minBudget: '', maxBudget: '', moveInDate: '', note: '', tenantType: 'ANY', showMobile: false, showEmail: false, consent: false });
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const requestId = useRef(crypto.randomUUID());
  const set = (key, value) => { setForm((current) => ({ ...current, [key]: normalizeField(key, value) })); setError(''); };
  const preset = ([min, max]) => setForm((current) => ({ ...current, minBudget: String(min), maxBudget: max ? String(max) : String(Math.max(min * 2, 30000)) }));

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    const max = Number(form.maxBudget);
    const min = form.minBudget === '' ? undefined : Number(form.minBudget);
    if (!form.name.trim() || !/^[6-9]\d{9}$/.test(form.mobile) || !form.propertyType.trim() || !form.area.trim() || !Number.isInteger(max) || max < 500 || !form.consent) return setError(!/^[6-9]\d{9}$/.test(form.mobile) && form.mobile ? t.errors.ROOM_MOBILE : t.required);
    if (min !== undefined && min > max) return setError(t.errors.ROOM_BUDGET);
    setBusy(true);
    try {
      const recaptchaToken = isAuthenticated ? undefined : await getRecaptchaToken('room_requirement').catch(() => undefined);
      const posted = await roomApi.postRequirement({ ...form, minBudget: min, maxBudget: max, showEmail: form.showEmail && Boolean(form.email.trim()), clientRequestId: requestId.current, recaptchaToken, lang });
      requestId.current = crypto.randomUUID();
      setResult(posted);
      setForm(empty());
      onPosted?.(posted);
    } catch (cause) { setError(roomError(t, cause)); }
    finally { setBusy(false); }
  };

  const combo = comboCopy(lang);
  return <div>
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>{t.name} *<input className={field} maxLength={150} autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} /></label>
        <label className={label}>{t.mobile} *<input className={field} type="tel" inputMode="numeric" maxLength={16} pattern="[6-9][0-9]{9}" autoComplete="tel-national" value={form.mobile} onChange={(e) => set('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))} /></label>
        <label className={label}>{t.emailOptional}<input className={field} type="email" maxLength={254} autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></label>
        <label className={label}>{t.tenantType}<select className={field} value={form.tenantType} onChange={(e) => set('tenantType', e.target.value)}>{['ANY', 'FAMILY', 'STUDENT'].map((value) => <option key={value} value={value}>{t[value]}</option>)}</select></label>
        <CreatableCombobox id="need-type" label={`${t.type} *`} value={form.propertyType} onChange={(value) => set('propertyType', value)} options={optionList(options?.propertyTypes)} lang={lang} t={combo} maxLength={60} />
        <CreatableCombobox id="need-area" label={`${t.area} *`} value={form.area} onChange={(value) => set('area', value)} options={optionList(options?.areas)} lang={lang} t={combo} />
      </div>
      <fieldset><legend className={label}>{t.budget} *</legend>
        <div className="mt-2 flex flex-wrap gap-2">{BUDGETS.map((range) => <button key={range[0]} type="button" onClick={() => preset(range)} aria-pressed={form.minBudget === String(range[0])} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${form.minBudget === String(range[0]) ? 'border-maroon bg-maroon text-cream' : 'border-border hover:bg-muted'}`}>{range[1] ? `${rupees(range[0], lang)} – ${rupees(range[1], lang)}` : `${rupees(range[0], lang)}+`}</button>)}</div>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <label className={label}>{t.budgetMin}<input className={field} type="number" inputMode="numeric" min="0" value={form.minBudget} onChange={(e) => set('minBudget', e.target.value)} /></label>
          <label className={label}>{t.budgetMax} *<input className={field} type="number" inputMode="numeric" min="500" value={form.maxBudget} onChange={(e) => set('maxBudget', e.target.value)} /></label>
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>{t.moveIn}<input className={field} type="date" min={indiaToday()} value={form.moveInDate} onChange={(e) => set('moveInDate', e.target.value)} /></label>
        <label className={label}>{t.note}<input className={field} maxLength={1000} value={form.note} onChange={(e) => set('note', e.target.value)} /></label>
      </div>
      <fieldset className="space-y-2"><legend className={label}>{t.visibility}</legend>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-maroon" checked={form.showMobile} onChange={(e) => set('showMobile', e.target.checked)} />{t.showMobile}</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-maroon" disabled={!form.email.trim()} checked={form.showEmail} onChange={(e) => set('showEmail', e.target.checked)} />{t.showEmail}</label>
      </fieldset>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-maroon" checked={form.consent} onChange={(e) => set('consent', e.target.checked)} />{t.consent} *</label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <button type="submit" className={`${primary} w-full sm:w-auto`} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{busy ? t.submitting : t.submit}</button>
    </form>
    {result && <section role="status" className="mt-6 space-y-3 rounded-2xl border border-gold/40 bg-gold/10 p-4">
      <p className="text-sm font-medium">{result.status === 'APPROVED' ? t.requirementPublished : t.requirementPending} <span className="text-muted-foreground">({t.reference}: {result.reference})</span></p>
      {result.status === 'APPROVED' && (result.matches.length ? <><h3 className="font-semibold">{t.matchesFound}</h3><div className="grid gap-3 sm:grid-cols-2">{result.matches.map((match) => <ListingCard key={match.listing.id} listing={match.listing} t={t} lang={lang} />)}</div></> : <p className="text-sm text-muted-foreground">{t.noMatches}</p>)}
    </section>}
  </div>;
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, ImagePlus, Loader2, UserRound } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CreatableCombobox from '@/components/CreatableCombobox';
import VillageCombobox from '@/components/VillageCombobox';
import { eventMembersApi } from '@/api/eventMembersApi';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { getRecaptchaToken } from '@/lib/recaptcha';
import { errorText, sectionLabel, useEventMemberCopy } from '@/lib/event-member-copy';
import { INDORE_AREAS } from '@/lib/native-places';
import { normalizeField } from "@/lib/utils";

const OTHER = 'OTHER';
const EMPTY = { sectionKey: '', customEventName: '', photoUrl: '', name: '', mobile: '', email: '', village: '', area: '', mobilePublic: false, emailPublic: false, consent: false };
const field = 'mt-1 min-h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-maroon/30';
const MOBILE = /^(\+?91[\s-]?)?[6-9]\d{9}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// "Become a Member": the one form for every event team and the Core Team. Opened from the public footer and from the
// member / student dashboards. Logged in, it fills the details from the account's own records (nobody else's).
export function BecomeMemberDialog({ open, onOpenChange, defaultSection = '', onSubmitted, presetPerson = null }) {
  const { t, lang } = useEventMemberCopy();
  const { isAuthenticated } = useAuth();
  const [sections, setSections] = useState(null);
  const [people, setPeople] = useState([]);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [personKey, setPersonKey] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const submitting = useRef(false);

  const fill = useCallback((person) => setForm((current) => ({
    ...current,
    photoUrl: person?.photoUrl || '',
    name: person?.name || '',
    mobile: person?.mobile || '',
    email: person?.email || '',
    village: person?.village || '',
  })), []);

  useEffect(() => {
    if (!open) return;
    setDone(false); setError(''); setForm({ ...EMPTY, sectionKey: defaultSection });
    eventMembersApi.sections().then(setSections).catch(() => setSections([]));
    // Admin filing a request for an existing member / student found by search.
    if (presetPerson) { setPeople([presetPerson]); setPersonKey(`${presetPerson.kind}:${presetPerson.id}`); fill(presetPerson); return; }
    if (!isAuthenticated) { setPeople([]); setPersonKey(''); return; }
    setLoadingPeople(true);
    eventMembersApi.candidates().then(({ candidates }) => {
      setPeople(candidates || []);
      const first = candidates?.find((item) => item.self) || candidates?.[0];
      setPersonKey(first ? `${first.kind}:${first.id}` : '');
      if (first) fill(first);
    }).catch(() => setPeople([])).finally(() => setLoadingPeople(false));
  }, [open, isAuthenticated, defaultSection, fill, presetPerson]);

  const person = people.find((item) => `${item.kind}:${item.id}` === personKey) || null;
  // A registered family member or student does not fill the form again: one question, the event, and submit. Their
  // details come from their own registration on the server.
  const quick = isAuthenticated && !presetPerson && Boolean(person);
  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: normalizeField(key, value) }));
  const choosePerson = (key) => { setPersonKey(key); fill(people.find((item) => `${item.kind}:${item.id}` === key) || null); };

  const upload = async (file) => {
    if (!file) return;
    setUploading(true); setError('');
    try { const { fileUrl } = await base44.integrations.Core.UploadPublicFile({ file }); set('photoUrl')(fileUrl); }
    catch (cause) { setError(cause.message || t.errors.EM_PHOTO); }
    finally { setUploading(false); }
  };

  const validate = () => {
    if (!form.sectionKey) return 'EM_SECTION';
    if (form.sectionKey === OTHER && !form.customEventName.trim()) return 'EM_OTHER_NAME';
    if (quick) return null;
    if (form.name.trim().length < 2) return 'EM_NAME';
    if (!MOBILE.test(form.mobile.trim())) return 'EM_MOBILE';
    if (!EMAIL.test(form.email.trim())) return 'EM_EMAIL';
    if (!form.village.trim()) return 'EM_VILLAGE';
    if (!form.area.trim()) return 'EM_AREA';
    if (!form.consent) return 'EM_CONSENT';
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submitting.current || uploading) return; // one request per click
    const problem = validate();
    if (problem) { setError(t.errors[problem]); return; }
    submitting.current = true; setBusy(true); setError('');
    try {
      const recaptchaToken = isAuthenticated ? undefined : await getRecaptchaToken('event_member');
      await eventMembersApi.apply(quick ? {
        sectionKey: form.sectionKey,
        customEventName: form.sectionKey === OTHER ? form.customEventName : undefined,
        personKind: person.kind,
        personId: person.id,
        consent: true,
      } : {
        ...form,
        customEventName: form.sectionKey === OTHER ? form.customEventName : undefined,
        photoUrl: form.photoUrl || undefined,
        ...(person ? { personKind: person.kind, personId: person.id } : {}),
        recaptchaToken,
      });
      setDone(true);
      onSubmitted?.();
    } catch (cause) {
      setError(errorText(t, cause));
    } finally {
      submitting.current = false; setBusy(false);
    }
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto rounded-2xl p-5 sm:p-6">
      <DialogHeader className="text-left">
        <DialogTitle className="font-display text-2xl text-maroon">{quick ? t.quickTitle : t.title}</DialogTitle>
        <DialogDescription>{quick ? `${t.applyingAs}: ${person.name}` : t.intro}</DialogDescription>
      </DialogHeader>
      {loadingPeople ? <Loader2 className="mx-auto my-6 h-6 w-6 animate-spin text-maroon" />
        : done ? <div role="status" className="space-y-4 py-4 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" aria-hidden="true" />
        <p className="text-sm">{t.sent}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => { setDone(false); setForm((current) => ({ ...current, sectionKey: '', customEventName: '', consent: false })); }} className="min-h-11 rounded-full border border-border px-5 text-sm font-semibold">{t.another}</button>
          <button type="button" onClick={() => onOpenChange(false)} className="min-h-11 rounded-full bg-maroon px-5 text-sm font-semibold text-cream">{t.close}</button>
        </div>
      </div>
        : quick ? <form onSubmit={submit} noValidate className="space-y-4">
          <SectionSelect t={t} lang={lang} sections={sections} form={form} set={set} />
          <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">{t.quickNote}</p>
          {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <button type="submit" disabled={busy} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-maroon px-6 text-sm font-semibold text-cream disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}{busy ? t.sending : t.quickSubmit}
          </button>
        </form>
        : <form onSubmit={submit} noValidate className="space-y-4">
          <SectionSelect t={t} lang={lang} sections={sections} form={form} set={set} />

          {people.length > 0 && <label className="block text-sm font-semibold">{t.who}
            <select className={field} value={personKey} onChange={(e) => choosePerson(e.target.value)}>
              {people.map((item) => <option key={`${item.kind}:${item.id}`} value={`${item.kind}:${item.id}`}>{item.name}</option>)}
              <option value="">{t.someoneElse}</option>
            </select>
            {person && <span className="mt-1 block text-xs font-normal text-muted-foreground">{t.filled}</span>}
          </label>}

          <div className="flex items-center gap-4">
            <span className="flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted ring-1 ring-border">
              {form.photoUrl ? <img src={form.photoUrl} alt={t.photo} className="h-full w-full object-cover" /> : <UserRound className="h-8 w-8 text-muted-foreground" aria-hidden="true" />}
            </span>
            <label className="text-sm font-semibold">{t.photo}
              <span className="mt-1 flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-input px-3 text-sm font-normal hover:bg-muted">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}{form.photoUrl ? t.change : t.upload}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading || busy} onChange={(e) => upload(e.target.files?.[0])} />
              </span>
              <span className="mt-1 block text-xs font-normal text-muted-foreground">{t.photoHelp}</span>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold sm:col-span-2">{t.name} *<input className={field} maxLength={120} autoComplete="name" value={form.name} onChange={(e) => set('name')(e.target.value)} /></label>
            <label className="block text-sm font-semibold">{t.mobile} *<input className={field} inputMode="numeric" maxLength={16} pattern="[6-9][0-9]{9}" autoComplete="tel" value={form.mobile} onChange={(e) => set('mobile')(e.target.value)} /></label>
            <label className="block text-sm font-semibold">{t.email} *<input className={field} type="email" maxLength={255} autoComplete="email" value={form.email} onChange={(e) => set('email')(e.target.value)} /></label>
            <VillageCombobox id="em-village" label={t.village} value={form.village} onChange={set('village')} lang={lang} required />
            <CreatableCombobox id="em-area" label={t.area} value={form.area} onChange={set('area')} options={INDORE_AREAS} lang={lang} t={t} />
          </div>

          <div className="space-y-2 rounded-xl bg-muted/50 p-3 text-sm">
            <label className="flex items-start gap-2"><input type="checkbox" className="mt-1" checked={form.mobilePublic} onChange={(e) => set('mobilePublic')(e.target.checked)} />{t.mobilePublic}</label>
            <label className="flex items-start gap-2"><input type="checkbox" className="mt-1" checked={form.emailPublic} onChange={(e) => set('emailPublic')(e.target.checked)} />{t.emailPublic}</label>
            <label className="flex items-start gap-2"><input type="checkbox" className="mt-1" checked={form.consent} onChange={(e) => set('consent')(e.target.checked)} />{t.consent} *</label>
          </div>

          {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <button type="submit" disabled={busy || uploading} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-maroon px-6 text-sm font-semibold text-cream disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}{busy ? t.sending : t.submit}
          </button>
        </form>}
    </DialogContent>
  </Dialog>;
}

// Area / interested event, and the event / team name when "Other" is chosen.
function SectionSelect({ t, lang, sections, form, set }) {
  return <>
    <label className="block text-sm font-semibold">{t.section} *
      <select className={field} value={form.sectionKey} onChange={(e) => set('sectionKey')(e.target.value)} disabled={!sections}>
        <option value="">{sections ? t.choose : '…'}</option>
        {(sections || []).map((section) => <option key={section.key} value={section.key}>{sectionLabel(section, lang)}</option>)}
        <option value={OTHER}>{t.other}</option>
      </select>
    </label>
    {form.sectionKey === OTHER && <label className="block text-sm font-semibold">{t.otherName} *<input className={field} maxLength={150} value={form.customEventName} onChange={(e) => set('customEventName')(e.target.value)} /></label>}
  </>;
}

// A button that opens the form; `label` defaults to "Become a Member".
export default function BecomeMemberButton({ className, label, defaultSection, onSubmitted, children }) {
  const { t } = useEventMemberCopy();
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className={className} onClick={() => setOpen(true)}>{children}{label || t.become}</button>
    <BecomeMemberDialog open={open} onOpenChange={setOpen} defaultSection={defaultSection} onSubmitted={onSubmitted} />
  </>;
}

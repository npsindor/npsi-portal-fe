import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, X } from 'lucide-react';
import logoImage from '@/images/logo.png';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/i18n';
import { indoreAreas, nimadVillages } from '@/lib/contact-info-text';
import ContactLocationSelect from '@/components/ContactLocationSelect';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ContactInfo() {
  const { lang, setLang, t } = useLang();
  const navigate = useNavigate();
  const submitting = useRef(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ fullName: '', contactNumber: '', email: '', indoreArea: '', nativeVillage: '', otherArea: '', otherVillage: '', isStudent: false });
  const change = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    if (submitting.current) return;
    setError('');
    const fullName = form.fullName.trim();
    const indoreArea = (form.indoreArea === '__other__' ? form.otherArea : form.indoreArea).trim();
    const nativeVillage = (form.nativeVillage === '__other__' ? form.otherVillage : form.nativeVillage).trim();
    const contactNumber = form.contactNumber.trim().replace(/[\s()-]/g, '').replace(/^(?:\+91|91)(?=\d{10}$)/, '');
    const email = form.email.trim();
    if (!fullName || !indoreArea || !nativeVillage) return setError('contact.required');
    if (!/^[6-9]\d{9}$/.test(contactNumber)) return setError('contact.invalidPhone');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('contact.invalidEmail');
    submitting.current = true;
    setBusy(true);
    try {
      await base44.contactInfo.create({ fullName, contactNumber, ...(email ? { email } : {}), indoreArea, nativeVillage, isStudent: form.isStudent, lang });
      setSaved(true);
    } catch (cause) {
      setError(cause.status === 429 ? 'contact.limited' : 'contact.failed');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };
  return <Dialog open onOpenChange={open => { if (!open && !busy) navigate('/'); }}>
    <DialogContent lang={lang} className="inset-0 left-0 top-0 flex h-[100dvh] max-w-none translate-x-0 translate-y-0 flex-col overflow-y-auto rounded-none border-0 bg-background text-foreground p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:rounded-none sm:p-8 [&>button]:hidden" onOpenAutoFocus={event => event.preventDefault()} onPointerDownOutside={event => event.preventDefault()} aria-describedby={undefined}>
      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-2xl border border-border bg-card text-card-foreground p-4 shadow-sm sm:p-8">
          <div className="flex items-start justify-between gap-2">
            <DialogTitle className="flex min-w-0 items-center gap-2 pt-1 text-base font-bold leading-snug text-foreground sm:text-lg"><img src={logoImage} alt="NPSI" className="h-7 w-7 shrink-0 rounded-full object-contain sm:h-8 sm:w-8" /><span>{saved ? t('contact.thanks') : (lang === 'hi' ? 'निमाड़ पाटीदार समाज, इंदौर' : 'Nimad Patidar Community, Indore')}</span></DialogTitle>
            <div className="flex shrink-0 items-center gap-1">
              <Button type="button" variant="outline" className="h-11 px-2 text-sm" onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}>{lang === 'en' ? 'हिंदी' : 'English'}</Button>
              <Button type="button" variant="ghost" size="icon" className="h-11 w-11" disabled={busy} aria-label={t('contact.close')} onClick={() => navigate('/')}><X className="h-5 w-5" /></Button>
            </div>
          </div>
          {saved && <DialogDescription className="mt-3 leading-relaxed">{t('contact.saved')}</DialogDescription>}
          {saved ? <div role="status" className="mt-8 space-y-6">
            <CheckCircle2 className="h-14 w-14 text-primary" aria-hidden="true" />
            <Button onClick={() => navigate('/')}>{t('contact.home')}</Button>
          </div> : <form onSubmit={submit} noValidate className="mt-4 space-y-2.5 sm:space-y-4">
            {[['fullName', 'contact.fullName', 'text', 'name', 150], ['contactNumber', 'contact.phone', 'tel', 'tel', 20], ['email', 'contact.email', 'email', 'email', 254]].map(([key, label, type, autoComplete, maxLength]) => <div key={key} className="space-y-1">
              <Label htmlFor={key}>{t(label)}{key !== 'email' ? ' *' : ''}</Label>
              <Input className="h-11 text-base" id={key} type={type} autoComplete={autoComplete} required={key !== 'email'} maxLength={maxLength} value={form[key]} disabled={busy} onChange={event => change(key, event.target.value)} />
            </div>)}
            <ContactLocationSelect id="indoreArea" label={t('contact.area')} options={indoreAreas} value={form.indoreArea} other={form.otherArea} onChange={v => change('indoreArea', v)} onOtherChange={v => change('otherArea', v)} otherLabel={t('contact.otherArea')} disabled={busy} />
            <ContactLocationSelect id="nativeVillage" label={t('contact.village')} options={nimadVillages} value={form.nativeVillage} other={form.otherVillage} onChange={v => change('nativeVillage', v)} onOtherChange={v => change('otherVillage', v)} otherLabel={t('contact.otherVillage')} disabled={busy} />
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm"><input type="checkbox" className="h-5 w-5 shrink-0 accent-primary" checked={form.isStudent} disabled={busy} onChange={event => change('isStudent', event.target.checked)} />{t('contact.student')}</label>
            {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{t(error)}</p>}
            <Button type="submit" disabled={busy} className="h-11 w-full font-medium">{t(busy ? 'contact.sending' : 'contact.submit')}</Button>
          </form>}
        </div>
      </div>
    </DialogContent>
  </Dialog>;
}

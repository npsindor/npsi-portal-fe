import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { API } from '@/api/endpoints';
import { API_BASE_URL } from '@/api/apiBaseUrl';
import { getRecaptchaToken } from '@/lib/recaptcha';
import { useLang } from '@/lib/i18n';
import { apiFetch } from '@/api/base44Client';

const copy = {
  en: {
    contact: 'Send us a message', feedback: 'Share your feedback', note: 'Your message reaches the Sangathan office (Admin → Feedback). We reply by email or phone.',
    name: 'Name (optional)', email: 'Email', mobile: 'Mobile', replyHint: 'Give an email or mobile number so we can reply.', type: 'Topic', subject: 'Subject (optional)', message: 'Message *',
    consent: 'I agree that the Sangathan may use these details only to respond to this message.', submit: 'Send message', sent: 'Thank you. Your message has been received. Reference:',
    contactTypes: ['General', 'Membership', 'Events', 'Community services', 'Website help'], feedbackTypes: ['Suggestion', 'Website', 'Events', 'Services', 'Other'],
    error: 'The message could not be sent. Please try again.',
  },
  hi: {
    contact: 'हमें संदेश भेजें', feedback: 'अपना सुझाव साझा करें', note: 'आपका संदेश संगठन कार्यालय (एडमिन → सुझाव) तक पहुँचता है। हम ईमेल या फ़ोन से उत्तर देते हैं।',
    name: 'नाम (वैकल्पिक)', email: 'ईमेल', mobile: 'मोबाइल', replyHint: 'उत्तर देने के लिए ईमेल या मोबाइल नंबर दें।', type: 'विषय-श्रेणी', subject: 'विषय (वैकल्पिक)', message: 'संदेश *',
    consent: 'मैं सहमत हूँ कि संगठन इन विवरणों का उपयोग केवल इस संदेश का उत्तर देने के लिए करे।', submit: 'संदेश भेजें', sent: 'धन्यवाद। आपका संदेश प्राप्त हो गया है। संदर्भ:',
    contactTypes: ['सामान्य', 'सदस्यता', 'कार्यक्रम', 'सामुदायिक सेवाएँ', 'वेबसाइट सहायता'], feedbackTypes: ['सुझाव', 'वेबसाइट', 'कार्यक्रम', 'सेवाएँ', 'अन्य'],
    error: 'संदेश नहीं भेजा जा सका। कृपया फिर प्रयास करें।',
  },
};
const field = 'mt-1 min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-base';
const EMPTY = { name: '', email: '', mobile: '', category: 0, subject: '', message: '', consent: false };

// Public Contact Us / Feedback form: a real message to the Sangathan (saved with member feedback, reCAPTCHA-protected).
export default function PublicMessageForm({ kind }) {
  const { lang } = useLang();
  const t = copy[lang] || copy.en;
  const contact = kind === 'contact';
  const types = contact ? t.contactTypes : t.feedbackTypes;
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setError('');
    if (form.message.trim().length < 5) { setError(t.message.replace(' *', '')); return; }
    if (contact && !form.email.trim() && !form.mobile.trim()) { setError(t.replyHint); return; }
    if (form.mobile.trim() && !/^(\+?91[\s-]?)?[6-9]\d{9}$/.test(form.mobile.trim())) { setError(`${t.mobile}: 10`); return; }
    if (!form.consent) { setError(t.consent); return; }
    setBusy(true);
    try {
      const recaptchaToken = await getRecaptchaToken(`${kind}_message`).catch(() => undefined);
      const response = await apiFetch(`${API_BASE_URL}${API.publicFeedback}`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: contact ? 'CONTACT' : 'FEEDBACK', name: form.name, email: form.email, mobile: form.mobile, category: copy.en[contact ? 'contactTypes' : 'feedbackTypes'][form.category], subject: form.subject, message: form.message, consent: true, lang, recaptchaToken }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || t.error);
      setReference(body.reference); setForm(EMPTY);
    } catch (cause) { setError(cause.message || t.error); } finally { setBusy(false); }
  };
  return <section className="mt-10">
    <form className="rounded-xl border border-border bg-card p-5 sm:p-6" onSubmit={submit} noValidate>
      <h2 className="text-xl font-semibold">{contact ? t.contact : t.feedback}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t.note}</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm" htmlFor={`${kind}-name`}>{t.name}<input id={`${kind}-name`} className={field} maxLength={120} autoComplete="name" value={form.name} onChange={set('name')} /></label>
        <label className="text-sm" htmlFor={`${kind}-type`}>{t.type}<select id={`${kind}-type`} className={field} value={form.category} onChange={(e) => setForm((current) => ({ ...current, category: Number(e.target.value) }))}>{types.map((label, index) => <option key={label} value={index}>{label}</option>)}</select></label>
        <label className="text-sm" htmlFor={`${kind}-email`}>{t.email}<input id={`${kind}-email`} type="email" className={field} maxLength={254} autoComplete="email" value={form.email} onChange={set('email')} /></label>
        <label className="text-sm" htmlFor={`${kind}-mobile`}>{t.mobile}<input id={`${kind}-mobile`} type="tel" inputMode="numeric" className={field} maxLength={16} autoComplete="tel" value={form.mobile} onChange={set('mobile')} /></label>
        {contact && <p className="-mt-2 text-xs text-muted-foreground sm:col-span-2">{t.replyHint}</p>}
        <label className="text-sm sm:col-span-2" htmlFor={`${kind}-subject`}>{t.subject}<input id={`${kind}-subject`} className={field} maxLength={150} value={form.subject} onChange={set('subject')} /></label>
        <label className="text-sm sm:col-span-2" htmlFor={`${kind}-message`}>{t.message}<textarea id={`${kind}-message`} className={field} rows={5} maxLength={2000} value={form.message} onChange={set('message')} /></label>
        <label className="flex items-start gap-3 text-sm leading-relaxed sm:col-span-2"><input type="checkbox" checked={form.consent} onChange={set('consent')} className="mt-1 h-5 w-5 shrink-0" />{t.consent}</label>
      </div>
      <button type="submit" disabled={busy} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-maroon px-5 py-3 text-sm font-semibold text-cream disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{t.submit}</button>
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      {reference && <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{t.sent} <b>{reference}</b></p>}
    </form>
  </section>;
}

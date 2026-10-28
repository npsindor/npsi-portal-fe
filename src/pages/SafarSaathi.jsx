import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bell, Handshake, MapPin, Route, ShieldCheck } from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';
import { useLang } from '@/lib/i18n';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { safarCopy } from '@/lib/safar-copy';

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const fresh = () => ({ clientRequestId: crypto.randomUUID(), kind: 'REQUEST', requestType: 'TRAVEL', name: '', phone: '', email: '', origin: '', destination: '', travelDate: '', preferredTime: '', itemDetails: '', instructions: '', notificationMethod: 'IN_APP', consent: false });
const fieldClass = 'mt-2 min-h-12 w-full min-w-0 rounded-xl border border-input bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-ring';
const primary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-maroon px-5 py-3 text-sm font-semibold text-cream disabled:opacity-50';
const secondary = 'inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50';

export default function SafarSaathi() {
  const { lang } = useLang();
  const t = safarCopy[lang];
  const { user, isAuthenticated } = useAuth();
  const [capabilities, setCapabilities] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(fresh);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(null);
  const [memberBlocked, setMemberBlocked] = useState(false);
  const submitting = useRef(false);
  const profileFilled = useRef(false);
  const accountVersion = useRef(0);
  const dateText = value => new Date(value).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
  const setField = (key, value) => setForm(current => ({ ...current, [key]: value }));

  useEffect(() => { document.title = `${t.title} | Nimar Patidar Sangathan, Indore`; }, [t]);
  const refresh = useCallback(async (silent = false) => {
    const version = accountVersion.current;
    if (!silent) setLoading(true);
    try {
      const [channels, mine] = await Promise.all([base44.safar.capabilities(), isAuthenticated ? base44.safar.mine() : Promise.resolve(null)]);
      if (version !== accountVersion.current) return;
      setCapabilities(channels); setData(mine); setMemberBlocked(false);
      if (mine?.profile && !profileFilled.current) { setForm(current => ({ ...current, ...mine.profile })); profileFilled.current = true; }
      if (!silent) setError('');
    } catch (cause) {
      if (version !== accountVersion.current) return;
      if (cause.status === 401 || cause.status === 403) { setMemberBlocked(true); setData(null); }
      setError(cause.message);
    } finally { if (version === accountVersion.current) setLoading(false); }
  }, [isAuthenticated]);
  useEffect(() => {
    accountVersion.current++;
    profileFilled.current = false;
    setData(null); setForm(fresh()); setMessage(null); setError('');
    refresh();
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible' && isAuthenticated) refresh(true); }, 30000);
    return () => { accountVersion.current++; window.clearInterval(timer); };
  }, [user?.id, refresh, isAuthenticated]);

  const submit = async event => {
    event.preventDefault();
    if (submitting.current) return;
    setError(''); setMessage(null);
    if (![form.name, form.phone, form.origin, form.destination, form.travelDate, form.preferredTime].every(value => value.trim()) || !form.consent) { setError('required'); return; }
    submitting.current = true; setBusy(true);
    try {
      const result = await base44.safar.create({ ...form, phone: form.phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''), email: form.email.trim() || undefined, lang });
      setMessage({ id: result.id, matches: result.matches });
      setForm(current => ({ ...fresh(), name: current.name, phone: current.phone, email: current.email, kind: current.kind, requestType: current.kind === 'OFFER' ? 'BOTH' : 'TRAVEL' }));
      await refresh(true);
    } catch (cause) { setError(cause.message); }
    finally { submitting.current = false; setBusy(false); }
  };
  const action = async operation => {
    if (submitting.current) return;
    submitting.current = true; setBusy(true); setError(''); setMessage(null);
    try { await operation(); setMessage({ changed: true }); await refresh(true); }
    catch (cause) { setError(cause.message); await refresh(true); }
    finally { submitting.current = false; setBusy(false); }
  };
  const errorText = error === 'required' ? t.required : (t.errors[error] || t.error);
  const isOffer = form.kind === 'OFFER';
  return <div className="min-h-screen bg-background"><PublicNav /><main>
    <section className="bg-maroon text-cream"><div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20"><span className="inline-flex items-center gap-2 text-sm font-semibold text-gold"><Route className="h-5 w-5" />{t.title}</span><p className="mt-3 text-sm text-cream/75">{t.subtitle}</p><h1 className="mt-5 max-w-4xl font-display text-3xl font-semibold leading-tight sm:text-5xl">{t.headline}</h1><p className="mt-6 max-w-3xl text-base leading-relaxed text-cream/80">{t.intro}</p><a href="#safar-form" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-gold px-5 py-3 font-semibold text-maroon">{t.submit}<ArrowRight className="h-4 w-4" /></a></div></section>
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6"><h2 className="section-title">{t.how}</h2><ol className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{t.steps.map(([title, description], index) => <li key={index} className="rounded-2xl border border-border bg-card p-5"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-maroon font-semibold text-gold">{index + 1}</span><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p></li>)}</ol></section>
    <section className="border-y border-border bg-card"><div className="mx-auto max-w-7xl px-4 py-12 sm:px-6"><h2 className="section-title">{t.requests}</h2><div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{t.requestCards.map(([title, description]) => <article key={title} className="rounded-xl border border-border p-5"><Handshake className="h-6 w-6 text-gold" /><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p></article>)}</div><h2 className="mt-10 text-xl font-semibold">{t.why}</h2><ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">{t.benefits.map(text => <li key={text}>{text}</li>)}</ul></div></section>
    <section id="safar-form" className="mx-auto max-w-7xl px-4 py-12 sm:px-6"><h2 className="section-title">{t.formTitle}</h2><p className="mt-3 text-sm text-muted-foreground">{t.membership}</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.channels}</p>
      {!isAuthenticated && <div className="mt-6 rounded-2xl border border-border bg-card p-6"><p>{t.login}</p><div className="mt-5 flex flex-wrap gap-3"><Link to="/login?returnTo=%2Ftransportation" className={primary}>{t.loginButton}</Link><Link to="/register" className={secondary}>{t.register}</Link></div></div>}
      {error && <div role="alert" className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"><p>{errorText}</p><button type="button" className={`${secondary} mt-3`} disabled={busy || loading} onClick={() => refresh()}>{t.refresh}</button></div>}
      {loading && <p role="status" className="mt-5 text-sm">{t.loading}</p>}
      {isAuthenticated && data && !memberBlocked && <form onSubmit={submit} className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-8"><fieldset disabled={busy}><legend className="sr-only">{t.formTitle}</legend>
        <div className="flex flex-col gap-3 sm:flex-row">{[['REQUEST', t.requestMode], ['OFFER', t.offerMode]].map(([kind, label]) => <button type="button" key={kind} aria-pressed={form.kind === kind} className={form.kind === kind ? primary : secondary} onClick={() => setForm(current => ({ ...current, kind, requestType: kind === 'OFFER' ? 'BOTH' : 'TRAVEL', clientRequestId: crypto.randomUUID() }))}>{label}</button>)}</div>
        <h3 className="mt-6 text-lg font-semibold">{isOffer ? t.offerTitle : t.formTitle}</h3>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {[['name', t.name, 'text', 150], ['phone', t.phone, 'tel', 20], ['email', t.email, 'email', 254], ['origin', t.origin, 'text', 150], ['destination', t.destination, 'text', 150], ['travelDate', t.date, 'date'], ['preferredTime', t.time, 'time']].map(([key, label, type, maxLength]) => <label key={key} className="min-w-0 text-sm font-medium" htmlFor={`safar-${key}`}>{label}{key !== 'email' && ' *'}<input id={`safar-${key}`} className={fieldClass} type={type} maxLength={maxLength} required={key !== 'email'} min={type === 'date' ? today() : undefined} value={form[key]} onChange={event => setField(key, event.target.value)} /></label>)}
          <label className="min-w-0 text-sm font-medium" htmlFor="safar-requestType">{isOffer ? t.offerType : t.type} *<select id="safar-requestType" className={fieldClass} value={form.requestType} onChange={event => setField('requestType', event.target.value)}>{(isOffer ? ['BOTH', 'TRAVEL', 'DELIVERY'] : ['TRAVEL', 'DELIVERY', 'URGENT']).map(type => <option key={type} value={type}>{t[type]}</option>)}</select></label>
          {form.requestType === 'DELIVERY' && !isOffer && <label className="text-sm font-medium sm:col-span-2" htmlFor="safar-itemDetails">{t.item} *<textarea id="safar-itemDetails" rows={3} required className={fieldClass} maxLength={1000} value={form.itemDetails} onChange={event => setField('itemDetails', event.target.value)} /></label>}
          <label className="text-sm font-medium sm:col-span-2" htmlFor="safar-instructions">{t.instructions}<textarea id="safar-instructions" rows={3} className={fieldClass} maxLength={2000} value={form.instructions} onChange={event => setField('instructions', event.target.value)} /></label>
          <label className="min-w-0 text-sm font-medium" htmlFor="safar-notificationMethod">{t.method}<select id="safar-notificationMethod" className={fieldClass} value={form.notificationMethod} onChange={event => setField('notificationMethod', event.target.value)}><option value="IN_APP">{t.IN_APP}</option>{capabilities?.email && <option value="EMAIL">{t.EMAIL}</option>}</select></label>
        </div><p className="mt-3 text-xs text-muted-foreground">{t.emailHint}</p><label className="mt-6 flex items-start gap-3 text-sm leading-relaxed"><input type="checkbox" required checked={form.consent} onChange={event => setField('consent', event.target.checked)} className="mt-1 h-5 w-5 shrink-0" />{t.consent}</label><button type="submit" className={`${primary} mt-6 w-full sm:w-auto`}>{busy ? t.saving : isOffer ? t.submitOffer : t.submit}</button>
      </fieldset></form>}
      {message && <div role="status" className="mt-5 break-words rounded-xl border border-gold/50 p-4 text-sm">{message.changed ? t.changed : <><p>{t.success} <strong>{message.id}</strong></p><p className="mt-2">{message.matches} {t.matchCount}</p></>}</div>}
      {data && isAuthenticated && <section className="mt-12" aria-label={t.dashboard}><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="section-title">{t.dashboard}</h2><button type="button" className={secondary} disabled={busy || loading} onClick={() => refresh()}>{t.refresh}</button></div><p className="mt-2 text-xs text-muted-foreground">{t.history}</p>
        <h3 className="mt-8 text-xl font-semibold">{t.entries}</h3><div className="mt-4 grid gap-4 sm:grid-cols-2">{data.entries.map(entry => <article className="min-w-0 rounded-xl border border-border bg-card p-5" key={entry.id}><p className="text-xs font-semibold text-muted-foreground">{t[entry.kind]} · {t[entry.requestType]} · {entry.status === 'OPEN' && entry.travelDate.slice(0, 10) < today() ? t.EXPIRED : t[entry.status]}</p><h4 className="mt-3 break-words font-semibold">{entry.origin} → {entry.destination}</h4><p className="mt-2 text-sm">{dateText(entry.travelDate)} · {entry.preferredTime}</p><p className="mt-2 break-all text-xs text-muted-foreground">{entry.id}</p>{entry.itemDetails && <p className="mt-3 break-words text-sm">{t.item}: {entry.itemDetails}</p>}{entry.instructions && <p className="mt-2 break-words text-sm">{t.instructions}: {entry.instructions}</p>}{entry.status === 'OPEN' && <button type="button" className={`${secondary} mt-4`} disabled={busy} onClick={() => action(() => base44.safar.cancel(entry.id))}>{t.cancel}</button>}</article>)}</div>{!data.entries.length && <p className="mt-4 text-sm text-muted-foreground">{t.emptyEntries}</p>}
        <h3 className="mt-8 text-xl font-semibold">{t.matches}</h3><div className="mt-4 grid gap-4 sm:grid-cols-2">{data.matches.map(match => <article key={match.id} className="min-w-0 rounded-xl border border-border bg-card p-5"><span className="text-xs font-semibold text-muted-foreground">{t[match.status]} · {t[match.requestType]}</span><h4 className="mt-3 flex items-start gap-2 break-words font-semibold"><MapPin className="h-5 w-5 shrink-0" />{match.origin} → {match.destination}</h4><p className="mt-2 text-sm">{dateText(match.travelDate)} · {match.preferredTime}</p><p className="mt-2 text-xs text-muted-foreground">{t.timeHint}</p>{match.contact ? <div className="mt-4 space-y-2 break-words rounded-lg bg-muted p-4 text-sm"><h5 className="font-semibold">{t.contact}</h5><p>{match.contact.name}</p><a className="block underline" href={`tel:${match.contact.phone}`}>{match.contact.phone}</a>{match.contact.email && <a className="block break-all underline" href={`mailto:${match.contact.email}`}>{match.contact.email}</a>}{match.contact.itemDetails && <p>{t.item}: {match.contact.itemDetails}</p>}{match.contact.instructions && <p>{t.instructions}: {match.contact.instructions}</p>}</div> : <p className="mt-4 text-sm text-muted-foreground">{t.private}</p>}
          {['PROPOSED', 'CONFIRMED'].includes(match.status) && <div className="mt-4 flex flex-wrap gap-2">{match.status === 'PROPOSED' && match.travelDate.slice(0, 10) >= today() && <button type="button" className={primary} disabled={busy || match.acceptedByMe} onClick={() => action(() => base44.safar.decide(match.id, 'ACCEPT'))}>{match.acceptedByMe ? t.accepted : t.accept}</button>}{match.status === 'CONFIRMED' && <button type="button" className={primary} disabled={busy} onClick={() => action(() => base44.safar.decide(match.id, 'COMPLETE'))}>{t.complete}</button>}<button type="button" className={secondary} disabled={busy} onClick={() => action(() => base44.safar.decide(match.id, 'DECLINE'))}>{t.decline}</button></div>}</article>)}</div>{!data.matches.length && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t.emptyMatches}</p>}
        <h3 className="mt-8 flex items-center gap-2 text-xl font-semibold"><Bell className="h-5 w-5" />{t.inbox}</h3><ul className="mt-4 space-y-3">{data.notices.map(notice => <li key={notice.id} className="rounded-xl border border-border bg-card p-4 text-sm"><p className="font-semibold">{t[notice.kind]}</p><p className="mt-2 break-all text-xs text-muted-foreground">{notice.matchId}</p><p className="mt-2 text-xs">{t.mailStatus}: {t[notice.emailStatus]}</p></li>)}</ul>{!data.notices.length && <p className="mt-4 text-sm text-muted-foreground">{t.emptyInbox}</p>}
      </section>}
    </section>
    <section className="border-y border-border bg-card"><div className="mx-auto max-w-7xl px-4 py-12 sm:px-6"><h2 className="flex items-center gap-2 text-xl font-semibold"><ShieldCheck className="h-6 w-6 shrink-0 text-gold" />{t.guidelines}</h2><p className="mt-4 max-w-4xl text-sm leading-relaxed text-muted-foreground">{t.safety}</p></div></section><section className="px-4 py-12 text-center"><h2 className="section-title">{t.closing}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t.closingText}</p></section>
  </main><PublicFooter /></div>;
}

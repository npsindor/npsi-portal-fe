import { useCallback, useEffect, useState } from 'react';
import { Car, CheckCircle2, Clock, Handshake, MapPin, Package, Search, Siren, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';

const fieldClass = 'mt-1.5 min-h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-ring';
const primary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-maroon px-4 py-2 text-sm font-semibold text-cream disabled:opacity-50';
const secondary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50';
const EMPTY_FILTERS = { origin: '', destination: '', date: '', time: '' };

const kindLabel = (t, item) => (item.kind === 'OFFER' ? t.entryKindOFFER : t[`entryKindREQUEST_${item.requestType}`] || t.REQUEST);
const kindIcon = (item) => (item.kind === 'OFFER' ? Car : item.requestType === 'DELIVERY' ? Package : item.requestType === 'URGENT' ? Siren : Users);
// What a member can ask of an entry: a travel plan that carries items takes parcels, one that takes people takes
// companions (BOTH = both); someone's request can be answered with an offer to help.
export const actionsFor = (item) => (item.kind === 'OFFER'
  ? [...(['DELIVERY', 'BOTH'].includes(item.requestType) ? ['DELIVERY'] : []), ...(['TRAVEL', 'BOTH'].includes(item.requestType) ? ['TRAVEL'] : [])]
  : ['HELP']);

// "Available Journeys & Requests": every other member's open, upcoming travel plan and request (no names or phone
// numbers), ranked by the route and time the member looks for, with a direct request from each card.
export default function AvailableJourneys({ t, lang, dateText, gapText, version, onConnected }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [list, setList] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [open, setOpen] = useState(null); // { item, mode: 'details' | 'DELIVERY' | 'TRAVEL' | 'HELP' }
  const [form, setForm] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    try {
      setList(await base44.safar.available(applied));
      setLoadError('');
    } catch (cause) { setLoadError(cause.message); }
  }, [applied]);
  useEffect(() => { load(); }, [load, version]);

  const hours = list?.matchWindowHours || 12;
  const items = Array.isArray(list?.items) ? list.items : [];
  const filtered = Boolean(applied.origin || applied.destination || applied.date);
  const startRequest = (item, mode) => {
    setError(''); setNotice('');
    setForm({ clientRequestId: crypto.randomUUID(), itemDetails: '', instructions: '', preferredTime: item.preferredTime, consent: false });
    setOpen({ item, mode });
  };
  const send = async (event) => {
    event.preventDefault();
    if (sending) return;
    const { item, mode } = open;
    setSending(true); setError('');
    try {
      const result = await base44.safar.connect(item.id, {
        clientRequestId: form.clientRequestId,
        requestType: mode === 'HELP' ? undefined : mode,
        itemDetails: mode === 'DELIVERY' ? form.itemDetails.trim() : undefined,
        instructions: form.instructions.trim() || undefined,
        preferredTime: form.preferredTime || undefined,
        lang,
        consent: form.consent,
      });
      setOpen(null);
      setNotice(result.existing ? t.alreadySent : t.sent);
      await load();
      await onConnected?.();
    } catch (cause) {
      setError(t.errors[cause.message] || t.error);
    } finally { setSending(false); }
  };

  const actionButtons = (item, compact = false) => {
    if (item.connection) return <a href="#safar-matches" className={`${secondary} text-emerald-800`}><CheckCircle2 className="h-4 w-4" aria-hidden="true" />{item.connection.status === 'CONFIRMED' ? t.requestConfirmed : t.requested}</a>;
    return actionsFor(item).map((mode) => (
      <button key={mode} type="button" className={primary} onClick={() => startRequest(item, mode)}>
        {mode === 'DELIVERY' ? <Package className="h-4 w-4" aria-hidden="true" /> : mode === 'TRAVEL' ? <Users className="h-4 w-4" aria-hidden="true" /> : <Handshake className="h-4 w-4" aria-hidden="true" />}
        {mode === 'DELIVERY' ? t.requestParcel : mode === 'TRAVEL' ? t.requestTravel : t.offerHelp}
        {!compact && <span className="sr-only">: {item.origin} → {item.destination}</span>}
      </button>
    ));
  };

  return (
    <section id="safar-available" aria-labelledby="safar-available-title" className="mt-10 scroll-mt-32">
      <h3 id="safar-available-title" className="text-xl font-semibold">{t.available}</h3>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{t.availableIntro}</p>
      <form className="mt-4 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto_auto]" onSubmit={(event) => { event.preventDefault(); setApplied({ ...filters }); }}>
        {[['origin', t.filterFrom, 'text'], ['destination', t.filterTo, 'text'], ['date', t.filterDate, 'date'], ['time', t.filterTime, 'time']].map(([key, label, type]) => (
          <label key={key} className="min-w-0 text-sm font-medium" htmlFor={`available-${key}`}>{label}
            <input id={`available-${key}`} type={type} className={fieldClass} maxLength={type === 'text' ? 150 : undefined} value={filters[key]} onChange={(event) => setFilters((current) => ({ ...current, [key]: event.target.value }))} />
          </label>
        ))}
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
          <button type="submit" className={primary}><Search className="h-4 w-4" aria-hidden="true" />{t.search}</button>
          {filtered && <button type="button" className={secondary} onClick={() => { setFilters(EMPTY_FILTERS); setApplied(EMPTY_FILTERS); }}>{t.clear}</button>}
        </div>
      </form>
      {filtered && <p className="mt-3 text-xs text-muted-foreground">{t.windowNote(hours)}</p>}
      {notice && <p role="status" className="mt-4 rounded-xl border border-gold/50 bg-gold/10 p-4 text-sm">{notice}</p>}
      {loadError && <p role="alert" className="mt-4 text-sm text-destructive">{t.errors[loadError] || t.error}</p>}
      {list && !items.length && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{filtered ? t.noAvailableFiltered : t.noAvailable}</p>}
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = kindIcon(item);
          return (
            <li key={item.id} data-testid="safar-available" className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-maroon/10 px-2.5 py-1 text-maroon"><Icon className="h-3.5 w-3.5" aria-hidden="true" />{kindLabel(t, item)}</span>
                {item.kind === 'OFFER' && <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">{t[item.requestType]}</span>}
                <span className="rounded-full bg-gold/20 px-2.5 py-1">{t[item.status] || item.status}</span>
              </div>
              <h4 className="mt-3 flex items-start gap-2 break-words font-semibold"><MapPin className="h-5 w-5 shrink-0" aria-hidden="true" />{item.origin} → {item.destination}</h4>
              <p className="mt-2 flex items-center gap-1.5 text-sm"><Clock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />{dateText(item.travelDate)} · {t.departure} {item.preferredTime}</p>
              {item.minutesFromWanted !== null && <p className="mt-1 text-xs text-muted-foreground">{gapText(item.minutesFromWanted)} {t.fromWanted} · {t.withinWindow(hours)}</p>}
              {item.itemDetails && <p className="mt-2 line-clamp-2 break-words text-sm">{t.item}: {item.itemDetails}</p>}
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                {actionButtons(item)}
                <button type="button" className={secondary} onClick={() => { setError(''); setOpen({ item, mode: 'details' }); }}>{t.viewDetails}<span className="sr-only">: {item.origin} → {item.destination}</span></button>
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog open={!!open} onOpenChange={(value) => { if (!value && !sending) setOpen(null); }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          {open && <>
            <DialogTitle className="text-xl font-semibold text-maroon">{open.mode === 'details' ? kindLabel(t, open.item) : t[`connectTitle${open.mode}`]}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">{open.item.origin} → {open.item.destination} · {dateText(open.item.travelDate)} · {t.theirTime} {open.item.preferredTime}</DialogDescription>
            {open.mode === 'details' ? <div className="space-y-3 text-sm">
              <dl className="grid gap-3 rounded-xl bg-muted/50 p-4 sm:grid-cols-2">
                <div><dt className="text-xs font-semibold uppercase text-muted-foreground">{t.type}</dt><dd className="mt-0.5 font-medium">{t[open.item.requestType]}</dd></div>
                <div><dt className="text-xs font-semibold uppercase text-muted-foreground">{t.departure}</dt><dd className="mt-0.5 font-medium">{open.item.preferredTime}</dd></div>
                {open.item.itemDetails && <div className="sm:col-span-2"><dt className="text-xs font-semibold uppercase text-muted-foreground">{t.item}</dt><dd className="mt-0.5 whitespace-pre-wrap font-medium">{open.item.itemDetails}</dd></div>}
              </dl>
              <p className="text-xs text-muted-foreground">{t.private} {t.approxTiming}</p>
              <div className="flex flex-wrap gap-2">{actionButtons(open.item, true)}</div>
            </div> : <form onSubmit={send} className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">{t.connectNote}</p>
              {open.mode === 'DELIVERY' && <label className="block text-sm font-medium" htmlFor="connect-item">{t.item} *<textarea id="connect-item" required rows={3} maxLength={1000} className={fieldClass} value={form.itemDetails} onChange={(event) => setForm((current) => ({ ...current, itemDetails: event.target.value }))} /></label>}
              <label className="block text-sm font-medium" htmlFor="connect-time">{t.yourTime}<input id="connect-time" type="time" className={fieldClass} value={form.preferredTime} onChange={(event) => setForm((current) => ({ ...current, preferredTime: event.target.value }))} /><span className="mt-1 block text-xs font-normal text-muted-foreground">{t.withinWindow(hours)} · {t.approxTiming}</span></label>
              <label className="block text-sm font-medium" htmlFor="connect-instructions">{t.instructions}<textarea id="connect-instructions" rows={2} maxLength={2000} className={fieldClass} value={form.instructions} onChange={(event) => setForm((current) => ({ ...current, instructions: event.target.value }))} /></label>
              <label className="flex items-start gap-3 text-sm leading-relaxed"><input type="checkbox" required checked={form.consent} onChange={(event) => setForm((current) => ({ ...current, consent: event.target.checked }))} className="mt-1 h-5 w-5 shrink-0" />{t.consent}</label>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <button type="submit" className={`${primary} w-full sm:w-auto`} disabled={sending}>{sending ? t.sending : t.send}</button>
            </form>}
          </>}
        </DialogContent>
      </Dialog>
    </section>
  );
}

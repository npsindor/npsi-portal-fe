import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { roomApi } from '@/api/roomHuntingApi';
import { roomError } from '@/lib/room-copy';
import { field, label, primary } from '@/components/room/room-ui';

// A registered member/student writes to an owner; their name and registered mobile go to the owner with consent.
export default function EnquiryDialog({ listing, t, onClose }) {
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const send = async (event) => {
    event.preventDefault();
    if (message.trim().length < 5 || !consent) return setError(t.required);
    setBusy(true);
    try { await roomApi.enquire(listing.id, { message: message.trim(), consent }); setDone(true); }
    catch (cause) { setError(roomError(t, cause)); }
    finally { setBusy(false); }
  };
  return <Dialog open={Boolean(listing)} onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent className="max-h-[85dvh] overflow-y-auto">
      <DialogTitle>{t.enquiryTitle}</DialogTitle>
      <DialogDescription>{listing ? `${listing.propertyType} · ${listing.area} · ${listing.reference}` : ''}</DialogDescription>
      {done ? <p role="status" className="text-sm">{t.enquirySent}</p> : <form onSubmit={send} className="space-y-3">
        <label className={label}>{t.enquiryMessage} *<textarea className={field} rows={4} maxLength={1000} value={message} onChange={(e) => { setMessage(e.target.value); setError(''); }} /></label>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-maroon" checked={consent} onChange={(e) => { setConsent(e.target.checked); setError(''); }} />{t.enquiryConsent} *</label>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <button type="submit" className={`${primary} w-full`} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{t.enquire}</button>
      </form>}
    </DialogContent>
  </Dialog>;
}

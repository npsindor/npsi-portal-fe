import { useEffect, useState } from "react";
import { CheckCircle2, Droplet, XCircle } from "lucide-react";
import { bloodApi } from "@/api/bloodHelpApi";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/AuthContext";
import { bloodError, useBloodCopy } from "@/lib/blood-help";

const SEEN = "nps_blood_confirm_checked";

// After login: asks the member "Did you receive the required blood?" for each of their requests that is due a
// follow-up (the server decides which). Yes completes the request; No keeps it in progress (asked again in a few
// days). Checked once per browser session; nothing is shown to visitors or for requests already completed.
export default function ConfirmReceiptPrompt() {
  const { t } = useBloodCopy();
  const { isAuthenticated, user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    let key = "";
    try {
      key = `${SEEN}:${user.id}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Without storage it is simply checked again next time.
    }
    bloodApi
      .pendingConfirmations()
      .then((rows) => setQueue(Array.isArray(rows) ? rows : []))
      .catch(() => setQueue([]));
  }, [isAuthenticated, user?.id]);

  const current = queue[0];
  const answer = async (received) => {
    setBusy(true);
    try {
      await bloodApi.confirm(current.id, received);
      setNote({ ok: true, text: received ? t.confirmedDone : t.keptOpen });
      setTimeout(() => {
        setNote(null);
        setQueue((list) => list.slice(1));
      }, 1600);
    } catch (error) {
      setNote({ ok: false, text: bloodError(error, t) });
    } finally {
      setBusy(false);
    }
  };
  if (!current) return null;
  return (
    <Dialog open onOpenChange={(open) => !open && !busy && setQueue((list) => list.slice(1))}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#C8102E]/10 text-[#C8102E]">
            <Droplet className="h-7 w-7" aria-hidden="true" />
          </div>
          <DialogTitle className="text-center text-xl">{t.confirmTitle}</DialogTitle>
          <DialogDescription className="text-center">
            {current.reference} · {t.confirmText(current)}
          </DialogDescription>
        </DialogHeader>
        {note ? (
          <p role={note.ok ? "status" : "alert"} className={`rounded-lg p-3 text-center text-sm ${note.ok ? "bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-200" : "bg-destructive/10 text-destructive"}`}>
            {note.text}
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" disabled={busy} onClick={() => answer(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {t.yesReceived}
            </button>
            <button type="button" disabled={busy} onClick={() => answer(false)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#C8102E] px-4 py-3 text-sm font-semibold text-[#C8102E] hover:bg-[#C8102E]/10 disabled:opacity-60">
              <XCircle className="h-4 w-4" aria-hidden="true" />
              {t.notReceived}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

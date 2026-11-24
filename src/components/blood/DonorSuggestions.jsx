import { useState } from "react";
import { Loader2, Send, UserRound } from "lucide-react";
import { bloodApi } from "@/api/bloodHelpApi";
import WhatsAppButton from "@/components/blood/WhatsAppButton";
import { bloodError, formatDay, useBloodCopy } from "@/lib/blood-help";

// Eligible donors for one of the member's own requests: tick donors (or Select All) and send them the request as a
// portal notification, or WhatsApp a donor directly. Donor numbers are never shown, only the WhatsApp button.
export default function DonorSuggestions({ requestId, suggestions }) {
  const { t, lang } = useBloodCopy();
  const [chosen, setChosen] = useState([]);
  const [sentIds, setSentIds] = useState([]); // each donor is sent a request once
  const open = suggestions.filter((s) => !sentIds.includes(s.donorId));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const all = open.length > 0 && chosen.length === open.length;
  const toggle = (id) => setChosen((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
  const send = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const { sent } = await bloodApi.notifyDonors(requestId, chosen, lang);
      setMessage({ ok: true, text: t.sent(sent) });
      setSentIds((ids) => [...ids, ...chosen]);
      setChosen([]);
    } catch (error) {
      setMessage({ ok: false, text: bloodError(error, t) });
    } finally {
      setBusy(false);
    }
  };
  return (
    <section aria-labelledby="donor-suggestions" className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 id="donor-suggestions" className="font-display text-xl font-bold text-[#C8102E]">
        {t.suggestionsTitle}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">{t.suggestionsHint}</p>
      {suggestions.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{t.noSuggestions}</p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" className="h-4 w-4 accent-[#C8102E]" checked={all} disabled={!open.length} onChange={() => setChosen(all ? [] : open.map((s) => s.donorId))} />
              {t.selectAll}
            </label>
            <button type="button" onClick={send} disabled={busy || chosen.length === 0} className="inline-flex items-center gap-2 rounded-lg bg-[#C8102E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#a50d26] disabled:opacity-50">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
              {busy ? t.sending : `${t.sendSelected}${chosen.length ? ` (${chosen.length})` : ""}`}
            </button>
          </div>
          {message && (
            <p role={message.ok ? "status" : "alert"} className={`mt-3 rounded-lg p-3 text-sm ${message.ok ? "bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-200" : "bg-destructive/10 text-destructive"}`}>
              {message.text}
            </p>
          )}
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {suggestions.map((donor) => (
              <li key={donor.donorId} className="flex items-center gap-3 rounded-xl border border-border p-3">
                {sentIds.includes(donor.donorId) ? (
                  <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-950/50 dark:text-green-200">{t.sentBadge}</span>
                ) : (
                  <input type="checkbox" className="h-4 w-4 shrink-0 accent-[#C8102E]" checked={chosen.includes(donor.donorId)} onChange={() => toggle(donor.donorId)} aria-label={t.selectDonor(donor.name)} />
                )}
                <UserRound className="h-8 w-8 shrink-0 text-[#C8102E]" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{donor.name}</div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-bold text-[#C8102E]">{donor.bloodGroup}</span> · {donor.exactMatch ? t.exact : t.compatible} · {t.lastDonated}:{" "}
                    {donor.lastDonationDate ? formatDay(donor.lastDonationDate, lang) : t.neverDonated}
                  </div>
                </div>
                <WhatsAppButton href={donor.whatsapp} name={donor.name} size="sm" />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

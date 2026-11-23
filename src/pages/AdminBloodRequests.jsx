import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, Phone, RefreshCw, RotateCcw } from "lucide-react";
import { bloodApi } from "@/api/bloodHelpApi";
import ExportMenu from "@/components/ExportMenu";
import RequestFilters from "@/components/blood/RequestFilters";
import StatusBadge from "@/components/blood/StatusBadge";
import WhatsAppButton from "@/components/blood/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { bloodError, formatDay, useBloodCopy } from "@/lib/blood-help";

const NO_FILTERS = { bloodGroup: "", city: "", status: "", q: "" };
const tel = (phone) => `tel:+91${String(phone || "").replace(/\D/g, "").slice(-10)}`;

// Admin → Blood Requests: every request with the requester's and contact person's numbers. After a call or WhatsApp
// with the requester, the admin records whether the blood was received; each change is kept in the request's history.
export default function AdminBloodRequests() {
  const { t, lang } = useBloodCopy();
  const [filters, setFilters] = useState(NO_FILTERS);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState({});
  const [busy, setBusy] = useState("");

  const load = useCallback(() => {
    setError("");
    bloodApi.admin
      .requests(filters)
      .then(setRows)
      .catch((err) => {
        setRows([]);
        setError(bloodError(err, t));
      });
  }, [filters, t]);
  useEffect(load, [load]);

  const setStatus = async (row, status) => {
    setBusy(row.id);
    setError("");
    try {
      const updated = await bloodApi.admin.setStatus(row.id, { status, note: notes[row.id]?.trim() || undefined });
      setRows((list) => list.map((item) => (item.id === row.id ? { ...item, ...updated, completedBy: status === "COMPLETED" ? item.completedBy : null } : item)));
      setNotes((all) => ({ ...all, [row.id]: "" }));
      load();
    } catch (err) {
      setError(bloodError(err, t));
    } finally {
      setBusy("");
    }
  };

  const cities = [...new Set((rows || []).map((row) => row.city))].sort();
  const exportRows = (rows || []).map((row) => ({
    reference: row.reference,
    requestedOn: formatDay(row.requestedOn, lang),
    patient: row.patientName,
    group: row.bloodGroup,
    units: row.units,
    hospital: row.hospital,
    city: row.city,
    contact: `${row.contactName} ${row.contactPhone}`,
    requester: row.requester ? `${row.requester.name || ""} ${row.requester.phone || ""}`.trim() : "",
    status: t.status[row.status],
    confirmedBy: row.completionSource ? t.confirmedBy[row.completionSource] : "",
  }));
  const exportColumns = [
    { key: "reference", label: "ID" },
    { key: "requestedOn", label: t.cols.requestedOn },
    { key: "patient", label: t.cols.patient },
    { key: "group", label: t.cols.group },
    { key: "units", label: t.cols.units },
    { key: "hospital", label: t.cols.hospital },
    { key: "city", label: t.cols.city },
    { key: "contact", label: t.contactSection },
    { key: "requester", label: t.requester },
    { key: "status", label: t.cols.status },
    { key: "confirmedBy", label: t.history },
  ];

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t.adminTitle}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.adminSub}</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportMenu filename="blood-requests" title={t.adminTitle} columns={exportColumns} rows={exportRows} />
          <Button variant="outline" onClick={load}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {lang === "hi" ? "रीफ्रेश" : "Refresh"}
          </Button>
        </div>
      </header>
      <RequestFilters value={filters} onChange={setFilters} cities={cities} />
      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {rows === null ? (
        <p className="py-12 text-center text-muted-foreground">{t.loading}</p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border p-10 text-center text-muted-foreground">{t.emptyCommunity}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong>{row.patientName}</strong>
                    <span className="rounded-md bg-[#C8102E]/10 px-2 py-0.5 text-sm font-bold text-[#C8102E]">{row.bloodGroup}</span>
                    <span className="text-sm">{t.unitsN(row.units)}</span>
                    <StatusBadge status={row.status} />
                    {row.completionSource && <span className="text-xs text-muted-foreground">{t.confirmedBy[row.completionSource]}{row.completedBy ? ` · ${row.completedBy}` : ""}</span>}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {row.reference} · {row.hospital}, {row.city} · {formatDay(row.requestedOn, lang)}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    <span>
                      {t.contactSection}: <strong>{row.contactName}</strong>{" "}
                      <a href={tel(row.contactPhone)} className="inline-flex items-center gap-1 text-[#C8102E] underline">
                        <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                        {row.contactPhone}
                      </a>
                    </span>
                    {row.requester && (
                      <span>
                        {t.requester}: <strong>{row.requester.name || row.requester.email}</strong>{" "}
                        {row.requester.phone && (
                          <a href={tel(row.requester.phone)} className="inline-flex items-center gap-1 text-[#C8102E] underline">
                            <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                            {row.requester.phone}
                          </a>
                        )}
                      </span>
                    )}
                    <WhatsAppButton href={row.contactWhatsapp} name={row.contactName} size="sm" />
                  </div>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-72">
                  <input aria-label={t.note} placeholder={t.note} maxLength={300} value={notes[row.id] || ""} onChange={(event) => setNotes((all) => ({ ...all, [row.id]: event.target.value }))} className="h-10 rounded-lg border border-border bg-background px-3 text-sm" />
                  {row.status === "IN_PROGRESS" ? (
                    <Button disabled={busy === row.id} onClick={() => setStatus(row, "COMPLETED")} className="bg-green-600 hover:bg-green-700">
                      {busy === row.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                      {t.markCompleted}
                    </Button>
                  ) : (
                    <Button variant="outline" disabled={busy === row.id} onClick={() => setStatus(row, "IN_PROGRESS")}>
                      {busy === row.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                      {t.markInProgress}
                    </Button>
                  )}
                </div>
              </div>
              {row.history?.length > 0 && (
                <details className="mt-3 text-xs text-muted-foreground">
                  <summary className="cursor-pointer font-semibold">{t.history} ({row.history.length})</summary>
                  <ol className="mt-2 space-y-1">
                    {row.history.map((entry, index) => (
                      <li key={index}>
                        {new Date(entry.at).toLocaleString(lang === "hi" ? "hi-IN" : "en-IN")} · {t.status[entry.status]} · {entry.source}
                        {entry.note ? ` · ${entry.note}` : ""}
                      </li>
                    ))}
                  </ol>
                </details>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

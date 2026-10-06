import React, { useEffect, useState } from "react";
import { Eye, X, Check, Ban } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useT, useLang } from "@/lib/i18n";
import StatusBadge from "@/components/StatusBadge";
import SearchBox from "@/components/admin/SearchBox";
import ExportMenu from "@/components/ExportMenu";
import TablePagination from "@/components/admin/TablePagination";
import DateRangeFilter from "@/components/admin/DateRangeFilter";
import { inDateRange } from "@/lib/dateRangeFilter";

const STATUSES = ["REGISTERED", "ATTENDED", "CANCELLED"];

export default function AdminEventRegistrations() {
  const t = useT();
  const { lang } = useLang();
  const { toast } = useToast();
  const locale = lang === "hi" ? "hi-IN" : "en-IN";

  const [regs, setRegs] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventFilter, setEventFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const load = async () => {
    setLoading(true);
    try {
      const [list, evs] = await Promise.all([
        base44.entities.EventRegistration.listAll("-registeredDate"),
        base44.entities.Event.listAll(),
      ]);
      setRegs(list);
      setEvents(evs);
    } catch (e) {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (r, status) => {
    try {
      await base44.entities.EventRegistration.update(r.id, { status });
      toast({ title: t("er.updated") });
      setSelected(null);
      load();
    } catch (e) {
      toast({ title: t("er.updateFailed"), description: e.message, variant: "destructive" });
    }
  };

  const visible = regs.filter((r) => {
    if (eventFilter !== "All" && r.eventId !== eventFilter) return false;
    if (statusFilter !== "All" && r.status !== statusFilter) return false;
    if (search && !r.registrationId?.toLowerCase().includes(search.toLowerCase()) && !r.registrantName?.toLowerCase().includes(search.toLowerCase())) return false;
    if ((dateFrom || dateTo) && !inDateRange(r.registeredDate, dateFrom, dateTo)) return false;
    return true;
  });

  useEffect(() => { setPage(1); }, [eventFilter, statusFilter, search, dateFrom, dateTo]);
  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageItems = visible.slice(startIndex, startIndex + pageSize);

  const eventTitle = (id) => events.find((e) => e.id === id)?.title || "—";

  const exportColumns = [
    { key: "registrationId", label: t("er.thId") },
    { key: "eventTitle", label: t("er.thEvent") },
    { key: "registrantName", label: t("er.thRegistrant") },
    { key: "count", label: t("er.thCount") },
    { key: "totalFee", label: t("er.thFee") },
    { key: "paymentStatus", label: t("er.thPayment") },
    { key: "status", label: t("er.thStatus") },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-maroon">{t("er.adminTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("er.adminSub")}</p>
        </div>
        <ExportMenu filename="event-registrations" title={t("er.adminTitle")} columns={exportColumns} rows={visible} />
      </div>

      <div className="flex flex-wrap gap-2">
        <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} className="rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-foreground">
          <option value="All">{t("er.allEvents")}</option>
          {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
        {["All", ...STATUSES].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${statusFilter === s ? "bg-maroon text-cream" : "border border-border bg-card text-muted-foreground hover:bg-muted"}`}>
            {s === "All" ? t("er.filterAll") : t(`er.status.${s}`)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[220px] flex-1"><SearchBox value={search} onChange={setSearch} placeholder={t("er.searchPh")} /></div>
        <DateRangeFilter from={dateFrom} to={dateTo} onFromChange={setDateFrom} onToChange={setDateTo} />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gold/30 bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">{t("er.thId")}</th>
              <th className="px-4 py-3">{t("er.thEvent")}</th>
              <th className="px-4 py-3">{t("er.thRegistrant")}</th>
              <th className="hidden px-4 py-3 md:table-cell">{t("er.thCount")}</th>
              <th className="hidden px-4 py-3 md:table-cell">{t("er.thFee")}</th>
              <th className="px-4 py-3">{t("er.thPayment")}</th>
              <th className="px-4 py-3">{t("er.thStatus")}</th>
              <th className="px-4 py-3 text-right">{t("er.thActions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading && (<tr><td colSpan={9} className="px-4 py-10 text-center"><div className="mx-auto h-6 w-6 animate-spin rounded-full border-4 border-gold/30 border-t-maroon" /></td></tr>)}
            {!loading && visible.length === 0 && (<tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">{t("er.empty")}</td></tr>)}
            {pageItems.map((r, i) => (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 text-muted-foreground">{startIndex + i + 1}</td>
                <td className="px-4 py-3 font-mono text-xs font-semibold text-maroon">{r.registrationId}</td>
                <td className="px-4 py-3">{r.eventTitle || eventTitle(r.eventId)}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{r.registrantName}</div>
                  <div className="text-xs text-muted-foreground">{r.familyId || ""}</div>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">{r.count}</td>
                <td className="hidden px-4 py-3 md:table-cell">₹{r.totalFee || 0}</td>
                <td className="px-4 py-3"><StatusBadge status={r.paymentStatus} /></td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setSelected(r)} className="inline-flex items-center gap-1 rounded-full border border-gold/40 px-3 py-1.5 text-xs font-semibold text-maroon hover:bg-gold/10">
                    <Eye className="h-3.5 w-3.5" /> {t("er.view")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <TablePagination page={safePage} totalPages={totalPages} totalItems={visible.length} pageSize={pageSize} onPageChange={setPage} />
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setSelected(null)}>
          <div className="h-full w-full max-w-md overflow-y-auto bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{t("er.detail")}</div>
                <div className="font-display text-lg font-bold text-maroon">{selected.registrationId}</div>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-full p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div><span className="text-muted-foreground">{t("er.thEvent")}:</span> {selected.eventTitle}</div>
              <div><span className="text-muted-foreground">{t("er.thRegistrant")}:</span> <span className="font-medium">{selected.registrantName}</span></div>
              {selected.familyId && <div><span className="text-muted-foreground">{t("er.family")}:</span> {selected.familyId}</div>}
              <div><span className="text-muted-foreground">{t("er.thCount")}:</span> {selected.count}</div>
              <div><span className="text-muted-foreground">{t("er.thFee")}:</span> ₹{selected.totalFee} ({t("er.feeNote")}: ₹{selected.feePerMember}/{t("er.perMember")})</div>
              <div><span className="text-muted-foreground">{t("er.thPayment")}:</span> <StatusBadge status={selected.paymentStatus} /></div>
              {selected.transactionId && <div><span className="text-muted-foreground">{t("er.transaction")}:</span> <span className="font-mono text-xs">{selected.transactionId}</span></div>}
              <div><span className="text-muted-foreground">{t("er.members")}:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {(selected.memberNames || []).map((n, i) => (
                    <span key={i} className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-xs font-semibold text-maroon">{n}</span>
                  ))}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">{selected.registeredDate ? new Date(selected.registeredDate).toLocaleDateString(locale) : ""}</div>
            </div>
            {selected.status === "REGISTERED" && (
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button onClick={() => setStatus(selected, "ATTENDED")} className="inline-flex items-center justify-center gap-1 rounded-xl bg-green-600 py-2.5 text-xs font-semibold text-white hover:bg-green-700">
                  <Check className="h-4 w-4" /> {t("er.markAttended")}
                </button>
                <button onClick={() => setStatus(selected, "CANCELLED")} className="inline-flex items-center justify-center gap-1 rounded-xl bg-red-600 py-2.5 text-xs font-semibold text-white hover:bg-red-700">
                  <Ban className="h-4 w-4" /> {t("er.cancel")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
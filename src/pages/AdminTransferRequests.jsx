import React, { useEffect, useState } from "react";
import { ArrowRightLeft, Eye, X, Loader2, Check, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useT, useLang } from "@/lib/i18n";
import StatusBadge from "@/components/StatusBadge";
import SearchBox from "@/components/admin/SearchBox";
import ExportMenu from "@/components/ExportMenu";
import TablePagination from "@/components/admin/TablePagination";
import DateRangeFilter from "@/components/admin/DateRangeFilter";
import { inDateRange } from "@/lib/dateRangeFilter";

const FILTERS = ["All", "PENDING", "CORRECTION_REQUIRED", "APPROVED", "REJECTED"];

export default function AdminTransferRequests() {
  const t = useT();
  const { lang } = useLang();
  const { toast } = useToast();
  const locale = lang === "hi" ? "hi-IN" : "en-IN";

  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selected, setSelected] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [processing, setProcessing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.TransferRequest.listAll("-requestedDate");
      setAll(list);
    } catch (e) {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const open = (r) => { setSelected(r); setRemarks(r.adminRemarks || ""); };

  // One server call per decision: approving moves the member (or adds the
  // student to the target family), updates both families' member counts and
  // notifies the target family, all or nothing.
  const decide = async (decision) => {
    if (decision !== "APPROVED" && !remarks.trim()) { toast({ title: t("tr.remarksReq"), variant: "destructive" }); return; }
    setProcessing(true);
    try {
      await base44.entities.TransferRequest.review(selected.id, { decision, remarks: remarks.trim() || undefined, lang });
      toast({ title: t(decision === "APPROVED" ? "tr.approved" : decision === "REJECTED" ? "tr.rejected" : "tr.correctionRequested") });
      setSelected(null);
      load();
    } catch (e) {
      toast({ title: t("tr.actionFailed"), description: e.message, variant: "destructive" });
    } finally { setProcessing(false); }
  };
  const approve = () => decide("APPROVED");
  const reject = () => decide("REJECTED");
  const correction = () => decide("CORRECTION_REQUIRED");

  const visible = all.filter((r) => {
    if (filter !== "All" && r.status !== filter) return false;
    if (search && !r.requestId?.toLowerCase().includes(search.toLowerCase()) && !r.requesterName?.toLowerCase().includes(search.toLowerCase())) return false;
    if ((dateFrom || dateTo) && !inDateRange(r.requestedDate, dateFrom, dateTo)) return false;
    return true;
  });

  useEffect(() => { setPage(1); }, [filter, search, dateFrom, dateTo]);
  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageItems = visible.slice(startIndex, startIndex + pageSize);

  const exportColumns = [
    { key: "requestId", label: t("tr.thId") },
    { key: "requestType", label: t("tr.thType") },
    { key: "requesterName", label: t("tr.thRequester") },
    { key: "targetFamilyName", label: t("tr.thTarget") },
    { key: "requestedDate", label: t("tr.thDate") },
    { key: "status", label: t("tr.thStatus") },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-maroon">{t("tr.adminTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("tr.adminSub")}</p>
        </div>
        <ExportMenu filename="transfer-requests" title={t("tr.adminTitle")} columns={exportColumns} rows={visible} />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${filter === f ? "bg-maroon text-cream" : "border border-border bg-card text-muted-foreground hover:bg-muted"}`}>
            {f === "All" ? t("tr.filterAll") : t(`tr.status.${f}`) || f}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[220px] flex-1"><SearchBox value={search} onChange={setSearch} placeholder={t("tr.searchPh")} /></div>
        <DateRangeFilter from={dateFrom} to={dateTo} onFromChange={setDateFrom} onToChange={setDateTo} />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gold/30 bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">{t("tr.thId")}</th>
              <th className="px-4 py-3">{t("tr.thType")}</th>
              <th className="px-4 py-3">{t("tr.thRequester")}</th>
              <th className="hidden px-4 py-3 md:table-cell">{t("tr.thTarget")}</th>
              <th className="hidden px-4 py-3 md:table-cell">{t("tr.thDate")}</th>
              <th className="px-4 py-3">{t("tr.thStatus")}</th>
              <th className="px-4 py-3 text-right">{t("tr.thActions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading && (<tr><td colSpan={8} className="px-4 py-10 text-center"><div className="mx-auto h-6 w-6 animate-spin rounded-full border-4 border-gold/30 border-t-maroon" /></td></tr>)}
            {!loading && visible.length === 0 && (<tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">{t("tr.empty")}</td></tr>)}
            {pageItems.map((r, i) => (
              <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 text-muted-foreground">{startIndex + i + 1}</td>
                <td className="px-4 py-3 font-mono text-xs font-semibold text-maroon">{r.requestId}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[0.6rem] font-semibold text-maroon">
                    <ArrowRightLeft className="h-3 w-3" />
                    {r.requestType === "student_to_family" ? t("tr.typeStudent") : t("tr.typeFamily")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{r.requesterName}</div>
                  <div className="text-xs text-muted-foreground">{r.sourceStudentId || r.sourceMembershipId || ""}</div>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">{r.targetFamilyName || r.targetFamilyId}</td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{r.requestedDate ? new Date(r.requestedDate).toLocaleDateString(locale) : "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => open(r)} className="inline-flex items-center gap-1 rounded-full border border-gold/40 px-3 py-1.5 text-xs font-semibold text-maroon hover:bg-gold/10">
                    <Eye className="h-3.5 w-3.5" /> {t("tr.view")}
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
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{t("tr.detail")}</div>
                <div className="font-display text-lg font-bold text-maroon">{selected.requestId}</div>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div><span className="text-muted-foreground">{t("tr.thType")}:</span> {selected.requestType === "student_to_family" ? t("tr.typeStudent") : t("tr.typeFamily")}</div>
              <div><span className="text-muted-foreground">{t("tr.thRequester")}:</span> <span className="font-medium">{selected.requesterName}</span></div>
              {selected.requesterMobile && <div><span className="text-muted-foreground">{t("tr.mobile")}:</span> {selected.requesterMobile}</div>}
              {selected.sourceStudentId && <div><span className="text-muted-foreground">{t("tr.studentId")}:</span> {selected.sourceStudentId}</div>}
              {selected.sourceMembershipId && <div><span className="text-muted-foreground">{t("tr.memberId")}:</span> {selected.sourceMembershipId}</div>}
              {selected.sourceFamilyId && <div><span className="text-muted-foreground">{t("tr.fromFamily")}:</span> {selected.sourceFamilyId}</div>}
              <div><span className="text-muted-foreground">{t("tr.targetFamilyId")}:</span> {selected.targetFamilyId} ({selected.targetFamilyName || "—"})</div>
              {selected.reason && <div className="rounded-xl border border-border bg-cream p-3"><span className="text-xs font-semibold text-maroon">{t("tr.reason")}:</span> <p className="mt-1">{selected.reason}</p></div>}
              {selected.adminRemarks && <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-orange-700"><span className="font-semibold">{t("tr.remarksLabel")}:</span> {selected.adminRemarks}</div>}
              {selected.status === "APPROVED" && selected.resultingMembershipId && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-green-700"><span className="font-semibold">{t("tr.resultingMem")}:</span> {selected.resultingMembershipId}</div>
              )}
            </div>

            {selected.status === "PENDING" && (
              <div className="mt-5 space-y-3">
                <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} placeholder={t("tr.remarksPh")} className="w-full resize-none rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" />
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={approve} disabled={processing} className="inline-flex flex-col items-center gap-1 rounded-xl bg-green-600 py-3 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60">
                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {t("tr.approve")}
                  </button>
                  <button onClick={correction} disabled={processing} className="inline-flex flex-col items-center gap-1 rounded-xl bg-amber-500 py-3 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-60">
                    <AlertCircle className="h-4 w-4" /> {t("tr.correction")}
                  </button>
                  <button onClick={reject} disabled={processing} className="inline-flex flex-col items-center gap-1 rounded-xl bg-red-600 py-3 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                    <X className="h-4 w-4" /> {t("tr.reject")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
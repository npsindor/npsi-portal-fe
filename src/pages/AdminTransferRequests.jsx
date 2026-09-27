import React, { useEffect, useState } from "react";
import { ArrowRightLeft, Eye, X, Loader2, Check, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useT, useLang } from "@/lib/i18n";
import StatusBadge from "@/components/StatusBadge";
import { findExistingPerson } from "@/lib/findPerson";
import SearchBox from "@/components/admin/SearchBox";
import ExportMenu from "@/components/ExportMenu";
import TablePagination from "@/components/admin/TablePagination";
import DateRangeFilter from "@/components/admin/DateRangeFilter";
import { inDateRange } from "@/lib/dateRangeFilter";

const FILTERS = ["All", "PENDING", "CORRECTION_REQUIRED", "APPROVED", "REJECTED"];

export default function AdminTransferRequests() {
  const t = useT();
  const { lang } = useLang();
  const { user } = useAuth();
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
      const list = await base44.entities.TransferRequest.list("-requested_date", 200);
      setAll(list);
    } catch (e) {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const open = (r) => { setSelected(r); setRemarks(r.admin_remarks || ""); };

  const approve = async () => {
    setProcessing(true);
    try {
      const targetFams = await base44.entities.Family.filter({ family_id: selected.target_family_id, status: "ACTIVE" });
      if (targetFams.length === 0) { toast({ title: t("tr.targetNotFound"), variant: "destructive" }); setProcessing(false); return; }
      const target = targetFams[0];

      if (selected.request_type === "student_to_family") {
        const students = await base44.entities.Student.list();
        const stu = students.find((s) => s.student_id === selected.source_student_id);
        if (!stu) { toast({ title: t("tr.sourceNotFound"), variant: "destructive" }); setProcessing(false); return; }

        // duplicate check within target family
        const dup = await findExistingPerson({ mobile: stu.mobile, email: stu.email });
        if (dup.found && dup.type === "member") {
          const existingMember = dup.record;
          if (existingMember.family_id === target.family_id) {
            toast({ title: t("tr.duplicateInTarget"), variant: "destructive" });
            setProcessing(false);
            return;
          }
        }

        const newMember = await base44.entities.FamilyMember.create({
          family_id: target.family_id,
          name: stu.student_name,
          relationship: "Other",
          gender: stu.gender || "",
          dob: stu.dob || "",
          mobile: stu.mobile || "",
          email: stu.email || "",
          address: stu.address || "",
          photo_url: stu.photo_url || "",
          status: "ACTIVE",
          linked_student_id: stu.student_id,
        });
        const memId = newMember.membership_id;
        await base44.entities.Student.update(stu.id, {
          status: "TRANSFERRED",
          linked_family_id: target.family_id,
          linked_membership_id: memId,
        });
        await base44.entities.Family.update(target.id, { member_count: (target.member_count || 0) + 1 });

        await base44.entities.TransferRequest.update(selected.id, {
          status: "APPROVED",
          admin_remarks: remarks.trim(),
          reviewed_date: new Date().toISOString(),
          approved_by_id: user?.id,
          resulting_membership_id: memId,
          new_family_id: target.family_id,
        });
        await base44.entities.Notification.create({
          title: t("tr.approvedNotif"),
          message: t("tr.approvedMsg", { fam: target.family_name, mem: memId }),
          type: "Approval",
          recipient_family_id: target.family_id,
          date: new Date().toISOString(),
        });
        toast({ title: t("tr.approved"), description: memId });
      } else {
        // family_to_family
        const members = await base44.entities.FamilyMember.list();
        const mem = members.find((m) => m.membership_id === selected.source_membership_id);
        if (!mem) { toast({ title: t("tr.sourceNotFound"), variant: "destructive" }); setProcessing(false); return; }
        const oldFamId = mem.family_id;
        await base44.entities.FamilyMember.update(mem.id, { family_id: target.family_id, status: "ACTIVE" });

        const oldFams = await base44.entities.Family.filter({ family_id: oldFamId });
        if (oldFams[0]) await base44.entities.Family.update(oldFams[0].id, { member_count: Math.max((oldFams[0].member_count || 1) - 1, 0) });
        await base44.entities.Family.update(target.id, { member_count: (target.member_count || 0) + 1 });

        await base44.entities.TransferRequest.update(selected.id, {
          status: "APPROVED",
          admin_remarks: remarks.trim(),
          reviewed_date: new Date().toISOString(),
          approved_by_id: user?.id,
          old_family_id: oldFamId,
          new_family_id: target.family_id,
        });
        await base44.entities.Notification.create({
          title: t("tr.approvedNotif"),
          message: t("tr.transferMsg", { from: oldFamId, to: target.family_name }),
          type: "Approval",
          recipient_family_id: target.family_id,
          date: new Date().toISOString(),
        });
        toast({ title: t("tr.approved") });
      }
      setSelected(null);
      load();
    } catch (e) {
      toast({ title: t("tr.actionFailed"), description: e.message, variant: "destructive" });
    } finally { setProcessing(false); }
  };

  const reject = async () => {
    if (!remarks.trim()) { toast({ title: t("tr.remarksReq"), variant: "destructive" }); return; }
    setProcessing(true);
    try {
      await base44.entities.TransferRequest.update(selected.id, {
        status: "REJECTED",
        admin_remarks: remarks.trim(),
        reviewed_date: new Date().toISOString(),
        approved_by_id: user?.id,
      });
      toast({ title: t("tr.rejected") });
      setSelected(null);
      load();
    } catch (e) {
      toast({ title: t("tr.actionFailed"), description: e.message, variant: "destructive" });
    } finally { setProcessing(false); }
  };

  const correction = async () => {
    if (!remarks.trim()) { toast({ title: t("tr.remarksReq"), variant: "destructive" }); return; }
    setProcessing(true);
    try {
      await base44.entities.TransferRequest.update(selected.id, {
        status: "CORRECTION_REQUIRED",
        admin_remarks: remarks.trim(),
        reviewed_date: new Date().toISOString(),
        approved_by_id: user?.id,
      });
      toast({ title: t("tr.correctionRequested") });
      setSelected(null);
      load();
    } catch (e) {
      toast({ title: t("tr.actionFailed"), description: e.message, variant: "destructive" });
    } finally { setProcessing(false); }
  };

  const visible = all.filter((r) => {
    if (filter !== "All" && r.status !== filter) return false;
    if (search && !r.request_id?.toLowerCase().includes(search.toLowerCase()) && !r.requester_name?.toLowerCase().includes(search.toLowerCase())) return false;
    if ((dateFrom || dateTo) && !inDateRange(r.requested_date, dateFrom, dateTo)) return false;
    return true;
  });

  useEffect(() => { setPage(1); }, [filter, search, dateFrom, dateTo]);
  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageItems = visible.slice(startIndex, startIndex + pageSize);

  const exportColumns = [
    { key: "request_id", label: t("tr.thId") },
    { key: "request_type", label: t("tr.thType") },
    { key: "requester_name", label: t("tr.thRequester") },
    { key: "target_family_name", label: t("tr.thTarget") },
    { key: "requested_date", label: t("tr.thDate") },
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
                <td className="px-4 py-3 font-mono text-xs font-semibold text-maroon">{r.request_id}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[0.6rem] font-semibold text-maroon">
                    <ArrowRightLeft className="h-3 w-3" />
                    {r.request_type === "student_to_family" ? t("tr.typeStudent") : t("tr.typeFamily")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{r.requester_name}</div>
                  <div className="text-xs text-muted-foreground">{r.source_student_id || r.source_membership_id || ""}</div>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">{r.target_family_name || r.target_family_id}</td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{r.requested_date ? new Date(r.requested_date).toLocaleDateString(locale) : "—"}</td>
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
                <div className="font-display text-lg font-bold text-maroon">{selected.request_id}</div>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div><span className="text-muted-foreground">{t("tr.thType")}:</span> {selected.request_type === "student_to_family" ? t("tr.typeStudent") : t("tr.typeFamily")}</div>
              <div><span className="text-muted-foreground">{t("tr.thRequester")}:</span> <span className="font-medium">{selected.requester_name}</span></div>
              {selected.requester_mobile && <div><span className="text-muted-foreground">{t("tr.mobile")}:</span> {selected.requester_mobile}</div>}
              {selected.source_student_id && <div><span className="text-muted-foreground">{t("tr.studentId")}:</span> {selected.source_student_id}</div>}
              {selected.source_membership_id && <div><span className="text-muted-foreground">{t("tr.memberId")}:</span> {selected.source_membership_id}</div>}
              {selected.source_family_id && <div><span className="text-muted-foreground">{t("tr.fromFamily")}:</span> {selected.source_family_id}</div>}
              <div><span className="text-muted-foreground">{t("tr.targetFamilyId")}:</span> {selected.target_family_id} ({selected.target_family_name || "—"})</div>
              {selected.reason && <div className="rounded-xl border border-border bg-cream p-3"><span className="text-xs font-semibold text-maroon">{t("tr.reason")}:</span> <p className="mt-1">{selected.reason}</p></div>}
              {selected.admin_remarks && <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-orange-700"><span className="font-semibold">{t("tr.remarksLabel")}:</span> {selected.admin_remarks}</div>}
              {selected.status === "APPROVED" && selected.resulting_membership_id && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-green-700"><span className="font-semibold">{t("tr.resultingMem")}:</span> {selected.resulting_membership_id}</div>
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
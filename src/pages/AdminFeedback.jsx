import React, { useEffect, useState } from "react";
import { Eye, X, Loader2, Archive, ArchiveRestore } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useT, useLang } from "@/lib/i18n";
import StatusBadge from "@/components/StatusBadge";
import SearchBox from "@/components/admin/SearchBox";
import ExportMenu from "@/components/ExportMenu";
import TablePagination from "@/components/admin/TablePagination";
import DateRangeFilter from "@/components/admin/DateRangeFilter";
import { inDateRange } from "@/lib/dateRangeFilter";

const STATUS_FLOW = ["Submitted", "In Review", "Resolved", "Closed"];
const FILTERS = ["All", "Submitted", "In Review", "Resolved", "Closed", "Archived"];

export default function AdminFeedback() {
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
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("Submitted");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.Feedback.listAll("-submittedDate");
      setAll(list);
    } catch (e) {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const open = (f) => {
    setSelected(f);
    setReply(f.reply || "");
    setNote(f.internalNote || "");
    setStatus(STATUS_FLOW.includes(f.status) ? f.status : "Submitted");
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        reply: reply.trim(),
        internalNote: note.trim(),
        status,
        repliedDate: reply.trim() ? new Date().toISOString() : selected.repliedDate,
        repliedById: user?.id,
      };
      await base44.entities.Feedback.update(selected.id, payload);
      toast({ title: t("fbAdmin.updated") });
      setSelected(null);
      load();
    } catch (e) {
      toast({ title: t("fbAdmin.updateFailed"), description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const toggleArchive = async (f) => {
    try {
      await base44.entities.Feedback.update(f.id, { archived: !f.archived });
      load();
      if (selected?.id === f.id) setSelected(null);
    } catch (e) {
      toast({ title: t("fbAdmin.updateFailed"), description: e.message, variant: "destructive" });
    }
  };

  const visible = all.filter((f) => {
    if (filter === "Archived") { if (!f.archived) return false; }
    else if (f.archived) return false;
    else if (filter !== "All" && f.status !== filter) return false;
    if (search && !f.memberName?.toLowerCase().includes(search.toLowerCase()) && !f.message?.toLowerCase().includes(search.toLowerCase())) return false;
    if ((dateFrom || dateTo) && !inDateRange(f.submittedDate, dateFrom, dateTo)) return false;
    return true;
  });

  useEffect(() => { setPage(1); }, [filter, search, dateFrom, dateTo]);
  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageItems = visible.slice(startIndex, startIndex + pageSize);

  const exportColumns = [
    { key: "feedbackId", label: t("fbAdmin.thId") },
    { key: "memberName", label: t("fbAdmin.thMember") },
    { key: "subject", label: t("fbAdmin.thSubject") },
    { key: "submittedDate", label: t("fbAdmin.thDate") },
    { key: "status", label: t("fbAdmin.thStatus") },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-maroon">{t("fbAdmin.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("fbAdmin.sub")}</p>
        </div>
        <ExportMenu filename="feedback" title={t("fbAdmin.title")} columns={exportColumns} rows={visible} />
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${filter === f ? "bg-maroon text-cream" : "border border-border bg-card text-muted-foreground hover:bg-muted"}`}
          >
            {f === "Archived" ? t("fbAdmin.archived") : f === "All" ? t("fbAdmin.filterAll") : t(`fb.status.${f}`) || f}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[220px] flex-1"><SearchBox value={search} onChange={setSearch} placeholder={t("fbAdmin.searchPh")} /></div>
        <DateRangeFilter from={dateFrom} to={dateTo} onFromChange={setDateFrom} onToChange={setDateTo} />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gold/30 bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">{t("fbAdmin.thId")}</th>
              <th className="px-4 py-3">{t("fbAdmin.thMember")}</th>
              <th className="px-4 py-3">{t("fbAdmin.thSubject")}</th>
              <th className="hidden px-4 py-3 md:table-cell">{t("fbAdmin.thDate")}</th>
              <th className="px-4 py-3">{t("fbAdmin.thStatus")}</th>
              <th className="px-4 py-3 text-right">{t("fbAdmin.thActions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="px-4 py-10 text-center"><div className="mx-auto h-6 w-6 animate-spin rounded-full border-4 border-gold/30 border-t-maroon" /></td></tr>
            )}
            {!loading && visible.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">{t("fbAdmin.empty")}</td></tr>
            )}
            {pageItems.map((f, i) => (
              <tr key={f.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 text-muted-foreground">{startIndex + i + 1}</td>
                <td className="px-4 py-3 font-mono text-xs font-semibold text-maroon">{f.feedbackId || "—"}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{f.memberName}</div>
                  <div className="text-xs text-muted-foreground">{f.email || ""}</div>
                </td>
                <td className="px-4 py-3">
                  {f.subject && <div className="font-medium text-foreground line-clamp-1">{f.subject}</div>}
                  <div className="text-xs text-muted-foreground line-clamp-1">{f.message}</div>
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{f.submittedDate ? new Date(f.submittedDate).toLocaleDateString(locale) : "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={f.status} /></td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <button onClick={() => open(f)} className="inline-flex items-center gap-1 rounded-full border border-gold/40 px-3 py-1.5 text-xs font-semibold text-maroon hover:bg-gold/10">
                      <Eye className="h-3.5 w-3.5" /> {t("fbAdmin.view")}
                    </button>
                    <button onClick={() => toggleArchive(f)} title={f.archived ? t("fbAdmin.unarchive") : t("fbAdmin.archive")} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted">
                      {f.archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <TablePagination page={safePage} totalPages={totalPages} totalItems={visible.length} pageSize={pageSize} onPageChange={setPage} />
      </div>

      {/* Detail + reply drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setSelected(null)}>
          <div className="h-full w-full max-w-md overflow-y-auto bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{t("fbAdmin.detail")}</div>
                <div className="font-display text-lg font-bold text-maroon">{selected.feedbackId || "—"}</div>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div><span className="text-muted-foreground">{t("fbAdmin.thMember")}:</span> <span className="font-medium">{selected.memberName}</span></div>
              {selected.email && <div><span className="text-muted-foreground">Email:</span> {selected.email}</div>}
              {selected.feedbackType && <div><span className="text-muted-foreground">{t("fb.type")}:</span> {t(`fb.types.${selected.feedbackType}`)}</div>}
              {selected.subject && <div className="font-semibold text-foreground">{selected.subject}</div>}
              <div className="rounded-xl border border-border bg-cream p-3 text-foreground">{selected.message}</div>
              {selected.attachmentUrl && (
                <a href={selected.attachmentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-maroon hover:underline">📎 {t("fb.attachment")}</a>
              )}
              {selected.reply && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-3">
                  <div className="text-xs font-semibold text-green-700">{t("fb.reply")}</div>
                  <p className="mt-1 text-sm text-green-800">{selected.reply}</p>
                </div>
              )}
            </div>

            <div className="mt-5 space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("fbAdmin.replyLabel")}</label>
                <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} placeholder={t("fbAdmin.replyPh")} className="mt-1.5 w-full resize-none rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("fbAdmin.internalNote")}</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder={t("fbAdmin.internalNotePh")} className="mt-1.5 w-full resize-none rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("fbAdmin.changeStatus")}</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1.5 w-full rounded-xl border border-border bg-cream px-3 py-2.5 text-sm outline-none focus:border-maroon">
                  {STATUS_FLOW.map((s) => <option key={s} value={s}>{t(`fb.status.${s}`)}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={save} disabled={saving} className="flex-1 rounded-full bg-maroon py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark disabled:opacity-60">
                  {saving ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : t("fbAdmin.save")}
                </button>
                <button onClick={() => setSelected(null)} className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
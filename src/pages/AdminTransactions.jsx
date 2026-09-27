import React, { useEffect, useState } from "react";
import { Search, Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useLang } from "@/lib/i18n";
import TablePagination from "@/components/admin/TablePagination";
import ExportMenu from "@/components/ExportMenu";
import DateRangeFilter from "@/components/admin/DateRangeFilter";
import { inDateRange } from "@/lib/dateRangeFilter";

const TYPES = ["Family Registration", "Membership Payment", "Event Registration", "Donation", "Other"];
const METHODS = ["UPI", "QR", "Card", "Net Banking", "Cash"];
const STATUSES = ["PENDING", "SUCCESS", "FAILED", "REFUNDED"];

const EMPTY = {
  transaction_id: "", type: "Family Registration", amount: "", payment_method: "UPI",
  payment_status: "PENDING", family_id: "", member_id: "", event_id: "", reference_id: "", date: "", remarks: ""
};

const L = {
  en: {
    title: "Transactions",
    sub: "All payments and transactions.",
    export: "Export",
    add: "Add Transaction",
    totalRevenue: "Total Revenue",
    totalTxns: "Total Transactions",
    successful: "Successful",
    searchPh: "Search by Txn ID or Family ID...",
    allStatus: "All Status",
    allTypes: "All Types",
    thTxnId: "Transaction ID",
    thType: "Type",
    thAmount: "Amount",
    thMethod: "Method",
    thReference: "Reference",
    thDate: "Date",
    thStatus: "Status",
    thActions: "Actions",
    empty: "No transactions found.",
    editTxn: "Edit Transaction",
    addTxn: "Add Transaction",
    lblTxnId: "Transaction ID",
    lblType: "Type",
    lblAmount: "Amount (₹)",
    lblMethod: "Method",
    lblStatus: "Status",
    lblFamilyId: "Family ID",
    lblMemberId: "Member ID",
    lblRefId: "Reference ID",
    lblDate: "Date",
    lblRemarks: "Remarks",
    saving: "Saving...",
    updateTxn: "Update Transaction",
    reqFields: "Transaction ID, type and amount are required",
    updated: "Transaction updated",
    added: "Transaction added",
    saveFailed: "Save failed",
    deleted: "Transaction deleted",
    delFailed: "Delete failed",
    confirmDel: "Delete transaction",
  },
  hi: {
    title: "लेन-देन",
    sub: "सभी भुगतान और लेन-देन।",
    export: "निर्यात",
    add: "लेन-देन जोड़ें",
    totalRevenue: "कुल आय",
    totalTxns: "कुल लेन-देन",
    successful: "सफल",
    searchPh: "Txn आईडी या परिवार आईडी से खोजें...",
    allStatus: "सभी स्थिति",
    allTypes: "सभी प्रकार",
    thTxnId: "लेन-देन आईडी",
    thType: "प्रकार",
    thAmount: "राशि",
    thMethod: "विधि",
    thReference: "संदर्भ",
    thDate: "तिथि",
    thStatus: "स्थिति",
    thActions: "क्रियाएँ",
    empty: "कोई लेन-देन नहीं मिला।",
    editTxn: "लेन-देन संपादित करें",
    addTxn: "लेन-देन जोड़ें",
    lblTxnId: "लेन-देन आईडी",
    lblType: "प्रकार",
    lblAmount: "राशि (₹)",
    lblMethod: "विधि",
    lblStatus: "स्थिति",
    lblFamilyId: "परिवार आईडी",
    lblMemberId: "सदस्य आईडी",
    lblRefId: "संदर्भ आईडी",
    lblDate: "तिथि",
    lblRemarks: "टिप्पणियाँ",
    saving: "सहेजा जा रहा है...",
    updateTxn: "लेन-देन अपडेट करें",
    reqFields: "लेन-देन आईडी, प्रकार और राशि आवश्यक हैं",
    updated: "लेन-देन अपडेट हुआ",
    added: "लेन-देन जोड़ा गया",
    saveFailed: "सहेजने में विफल",
    deleted: "लेन-देन हटाया गया",
    delFailed: "हटाने में विफल",
    confirmDel: "लेन-देन हटाएँ",
  },
};

export default function AdminTransactions() {
  const { lang } = useLang();
  const t = L[lang];
  const { toast } = useToast();
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setTxns(await base44.entities.Transaction.list("-date", 200)); }
    catch (e) {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = txns.filter((tx) => {
    if (search && !tx.transaction_id?.toLowerCase().includes(search.toLowerCase()) && !tx.family_id?.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "All" && tx.payment_status !== statusFilter) return false;
    if (typeFilter !== "All" && tx.type !== typeFilter) return false;
    if ((dateFrom || dateTo) && !inDateRange(tx.date, dateFrom, dateTo)) return false;
    return true;
  });

  const pageSize = 10;
  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [search, statusFilter, typeFilter, dateFrom, dateTo]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageItems = filtered.slice(startIndex, startIndex + pageSize);

  const parseAmount = (value) => {
    const numeric = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
    return Number.isFinite(numeric) ? numeric : 0;
  };
  const totalRevenue = filtered.filter((tx) => tx.payment_status === "SUCCESS").reduce((s, tx) => s + parseAmount(tx.amount), 0);

  const openNew = () => {
    const now = Date.now().toString(36).toUpperCase();
    setEditing({ ...EMPTY, transaction_id: `TXN-${now}` });
  };
  const openEdit = (tx) => setEditing({ ...tx, amount: tx.amount ?? "", date: tx.date ? new Date(tx.date).toISOString().slice(0, 16) : "" });

  const save = async () => {
    if (!editing.transaction_id || !editing.type || editing.amount === "") {
      toast({ title: t.reqFields, variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        transaction_id: editing.transaction_id,
        type: editing.type,
        amount: Number(editing.amount) || 0,
        payment_method: editing.payment_method,
        payment_status: editing.payment_status,
        family_id: editing.family_id || "",
        member_id: editing.member_id || "",
        event_id: editing.event_id || "",
        reference_id: editing.reference_id || "",
        date: editing.date ? new Date(editing.date).toISOString() : new Date().toISOString(),
        remarks: editing.remarks || "",
      };
      if (editing.id) {
        await base44.entities.Transaction.update(editing.id, payload);
        toast({ title: t.updated });
      } else {
        await base44.entities.Transaction.create(payload);
        toast({ title: t.added });
      }
      setEditing(null);
      await load();
    } catch (e) {
      toast({ title: t.saveFailed, description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const remove = async (tx) => {
    if (!window.confirm(`${t.confirmDel} ${tx.transaction_id}?`)) return;
    try {
      await base44.entities.Transaction.delete(tx.id);
      await load();
      toast({ title: t.deleted });
    } catch (e) {
      toast({ title: t.delFailed, description: e.message, variant: "destructive" });
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gold/30 border-t-maroon" /></div>;

  const locale = lang === "hi" ? "hi-IN" : "en-IN";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-maroon">{t.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.sub}</p>
        </div>
        <div className="flex gap-2">
          <ExportMenu
            filename="transactions"
            title={t.title}
            labels={{ export: t.export }}
            columns={[
              { key: "transaction_id", label: t.thTxnId },
              { key: "type", label: t.thType },
              { key: "amount", label: t.thAmount },
              { key: "payment_method", label: t.thMethod },
              { key: "reference_id", label: t.thReference },
              { key: "date", label: t.thDate },
              { key: "payment_status", label: t.thStatus },
            ]}
            rows={filtered}
          />
          <button onClick={openNew} className="inline-flex items-center gap-1.5 rounded-full bg-maroon px-5 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark">
            <Plus className="h-4 w-4" /> {t.add}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gold/30 bg-card p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.totalRevenue}</div>
          <div className="mt-1 font-display text-2xl font-bold text-green-600">₹{totalRevenue.toLocaleString(locale)}</div>
        </div>
        <div className="rounded-2xl border border-gold/30 bg-card p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.totalTxns}</div>
          <div className="mt-1 font-display text-2xl font-bold text-maroon">{filtered.length}</div>
        </div>
        <div className="rounded-2xl border border-gold/30 bg-card p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.successful}</div>
          <div className="mt-1 font-display text-2xl font-bold text-green-600">{filtered.filter((tx) => tx.payment_status === "SUCCESS").length}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.searchPh} className="w-full rounded-full border border-gold/40 bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:border-maroon" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-full border border-gold/40 bg-card px-4 py-2.5 text-sm outline-none focus:border-maroon">
          <option value="All">{t.allStatus}</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-full border border-gold/40 bg-card px-4 py-2.5 text-sm outline-none focus:border-maroon">
          <option value="All">{t.allTypes}</option>
          {TYPES.map((tp) => <option key={tp}>{tp}</option>)}
        </select>
        <DateRangeFilter from={dateFrom} to={dateTo} onFromChange={setDateFrom} onToChange={setDateTo} />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gold/30 bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">{t.thTxnId}</th>
              <th className="px-4 py-3">{t.thType}</th>
              <th className="px-4 py-3">{t.thAmount}</th>
              <th className="px-4 py-3">{t.thMethod}</th>
              <th className="px-4 py-3">{t.thReference}</th>
              <th className="px-4 py-3">{t.thDate}</th>
              <th className="px-4 py-3">{t.thStatus}</th>
              <th className="px-4 py-3 text-right">{t.thActions}</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((tx, i) => (
              <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 text-muted-foreground">{startIndex + i + 1}</td>
                <td className="px-4 py-3 font-semibold text-maroon">{tx.transaction_id}</td>
                <td className="px-4 py-3">{tx.type}</td>
                <td className="px-4 py-3 font-semibold">₹{parseAmount(tx.amount).toLocaleString(locale)}</td>
                <td className="px-4 py-3 text-muted-foreground">{tx.payment_method}</td>
                <td className="px-4 py-3 text-muted-foreground">{tx.reference_id || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{tx.date ? new Date(tx.date).toLocaleDateString(locale) : "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={tx.payment_status} /></td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1.5">
                    <button onClick={() => openEdit(tx)} className="rounded-full p-1.5 text-maroon hover:bg-maroon/10"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => remove(tx)} className="rounded-full p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">{t.empty}</td></tr>}
          </tbody>
        </table>
        <TablePagination page={safePage} totalPages={totalPages} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} />
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={() => setEditing(null)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-gold/40 bg-card p-6 shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-maroon">{editing.id ? t.editTxn : t.addTxn}</h2>
              <button onClick={() => setEditing(null)} className="rounded-full p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblTxnId} *</label><input value={editing.transaction_id} onChange={(e) => setEditing({ ...editing, transaction_id: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblType} *</label>
                <select value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon">{TYPES.map((tp) => <option key={tp}>{tp}</option>)}</select>
              </div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblAmount} *</label><input type="number" value={editing.amount} onChange={(e) => setEditing({ ...editing, amount: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblMethod}</label>
                <select value={editing.payment_method} onChange={(e) => setEditing({ ...editing, payment_method: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon">{METHODS.map((m) => <option key={m}>{m}</option>)}</select>
              </div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblStatus}</label>
                <select value={editing.payment_status} onChange={(e) => setEditing({ ...editing, payment_status: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon">{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
              </div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblFamilyId}</label><input value={editing.family_id} onChange={(e) => setEditing({ ...editing, family_id: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblMemberId}</label><input value={editing.member_id} onChange={(e) => setEditing({ ...editing, member_id: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblRefId}</label><input value={editing.reference_id} onChange={(e) => setEditing({ ...editing, reference_id: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblDate}</label><input type="datetime-local" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div className="sm:col-span-2"><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblRemarks}</label><textarea value={editing.remarks} onChange={(e) => setEditing({ ...editing, remarks: e.target.value })} rows={2} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
            </div>
            <button onClick={save} disabled={saving} className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-maroon py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? t.saving : (editing.id ? t.updateTxn : t.add)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useEffect, useState } from "react";
import { Search, Users, Eye, X, Plus, Pencil, Trash2, Loader2, KeyRound } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useLang } from "@/lib/i18n";
import { sanitizeMobile, sanitizePincode } from "@/lib/utils";
import { useTableControls } from "@/lib/useTableControls";
import TablePagination from "@/components/admin/TablePagination";
import ExportMenu from "@/components/ExportMenu";
import DateRangeFilter from "@/components/admin/DateRangeFilter";

const STATUSES = ["PENDING", "ACTIVE", "SUSPENDED", "DEACTIVATED"];

const EMPTY = {
  familyId: "", familyName: "", headName: "", status: "ACTIVE",
  address: "", city: "", district: "", state: "", pincode: "",
  nativePlace: "", village: "", gotra: "", contactNumber: "", email: ""
};

const L = {
  en: {
    title: "Families",
    sub: "Manage all registered families.",
    add: "Add Family",
    searchPh: "Search by Family ID, Application ID, name, or head...",
    thFamId: "Family ID",
    thFamName: "Family Name",
    thHead: "Head",
    thMembers: "Members",
    thCity: "City",
    thStatus: "Status",
    thActions: "Actions",
    view: "View",
    empty: "No families found.",
    family: "Family",
    head: "Head",
    gotra: "Gotra",
    native: "Native",
    contact: "Contact",
    email: "Email",
    address: "Address",
    members: "Members",
    editFamily: "Edit Family",
    addFamily: "Add Family",
    lblFamId: "Family ID",
    lblStatus: "Status",
    lblFamName: "Family Name",
    lblHeadName: "Head Name",
    lblAddress: "Address",
    lblCity: "City",
    lblDistrict: "District",
    lblState: "State",
    lblPincode: "Pincode",
    lblGotra: "Gotra",
    lblNativePlace: "Native Place",
    lblVillage: "Village",
    lblContact: "Contact Number",
    lblEmail: "Email",
    saving: "Saving...",
    updateFamily: "Update Family",
    reqFields: "Family name and head name are required",
    updated: "Family updated",
    added: "Family added",
    saveFailed: "Save failed",
    confirmDel: "Delete family",
    delSub: "This also removes its member records.",
    deleted: "Family deleted",
    delFailed: "Delete failed",
    noMembers: "No members.",
    resendCreds: "Resend Login Credentials",
    resending: "Sending...",
    noEmailOnFile: "This family has no email on file.",
    credentialsSent: "Login credentials sent",
    credentialsFailed: "Failed to send credentials",
  },
  hi: {
    title: "परिवार",
    sub: "सभी पंजीकृत परिवार प्रबंधित करें।",
    add: "परिवार जोड़ें",
    searchPh: "परिवार आईडी, आवेदन आईडी, नाम या मुखिया से खोजें...",
    thFamId: "परिवार आईडी",
    thFamName: "परिवार का नाम",
    thHead: "मुखिया",
    thMembers: "सदस्य",
    thCity: "शहर",
    thStatus: "स्थिति",
    thActions: "क्रियाएँ",
    view: "देखें",
    empty: "कोई परिवार नहीं मिला।",
    family: "परिवार",
    head: "मुखिया",
    gotra: "गोत्र",
    native: "मूक",
    contact: "संपर्क",
    email: "ईमेल",
    address: "पता",
    members: "सदस्य",
    editFamily: "परिवार संपादित करें",
    addFamily: "परिवार जोड़ें",
    lblFamId: "परिवार आईडी",
    lblStatus: "स्थिति",
    lblFamName: "परिवार का नाम",
    lblHeadName: "मुखिया नाम",
    lblAddress: "पता",
    lblCity: "शहर",
    lblDistrict: "ज़िला",
    lblState: "राज्य",
    lblPincode: "पिनकोड",
    lblGotra: "गोत्र",
    lblNativePlace: "मूल स्थान",
    lblVillage: "गाँव",
    lblContact: "संपर्क नंबर",
    lblEmail: "ईमेल",
    saving: "सहेजा जा रहा है...",
    updateFamily: "परिवार अपडेट करें",
    reqFields: "परिवार नाम और मुखिया नाम आवश्यक हैं",
    updated: "परिवार अपडेट हुआ",
    added: "परिवार जोड़ा गया",
    saveFailed: "सहेजने में विफल",
    confirmDel: "परिवार हटाएँ",
    delSub: "इससे इसके सदस्य रिकॉर्ड भी हट जाएँगे।",
    deleted: "परिवार हटाया गया",
    delFailed: "हटाने में विफल",
    noMembers: "कोई सदस्य नहीं।",
    resendCreds: "लॉगिन जानकारी पुनः भेजें",
    resending: "भेजा जा रहा है...",
    noEmailOnFile: "इस परिवार का कोई ईमेल दर्ज नहीं है।",
    credentialsSent: "लॉगिन जानकारी भेज दी गई",
    credentialsFailed: "जानकारी भेजने में विफल",
  },
};

export default function AdminFamilies() {
  const { lang } = useLang();
  const t = L[lang];
  const { toast } = useToast();
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [members, setMembers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setFamilies(await base44.entities.Family.list()); }
    catch (e) {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const viewFamily = async (f) => {
    setSelected(f);
    const mems = await base44.entities.FamilyMember.filter({ familyId: f.familyId });
    setMembers(mems);
  };

  const resendCredentials = async (f) => {
    if (!f.email) {
      toast({ title: t.noEmailOnFile, variant: "destructive" });
      return;
    }
    setResending(true);
    try {
      const result = await base44.users.inviteUser(f.email, "user", {
        fullName: f.headName,
        phone: f.contactNumber,
      });
      toast({ title: t.credentialsSent, description: `${f.email} · ${result.password}` });
    } catch (e) {
      toast({ title: t.credentialsFailed, description: e.message, variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  const openNew = () => setEditing({ ...EMPTY });
  const openEdit = (f) => setEditing({ ...f });

  const save = async () => {
    if (!editing.familyName || !editing.headName) {
      toast({ title: t.reqFields, variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        familyId: editing.familyId,
        familyName: editing.familyName,
        headName: editing.headName,
        status: editing.status || "ACTIVE",
        address: editing.address || "",
        city: editing.city || "",
        district: editing.district || "",
        state: editing.state || "",
        pincode: editing.pincode || "",
        nativePlace: editing.nativePlace || "",
        village: editing.village || "",
        gotra: editing.gotra || "",
        contactNumber: editing.contactNumber || "",
        email: editing.email || "",
        registrationDate: editing.registrationDate || new Date().toISOString(),
        memberCount: editing.memberCount || 0,
        applicationId: editing.applicationId || "",
      };
      if (editing.id) {
        await base44.entities.Family.update(editing.id, payload);
        toast({ title: t.updated });
      } else {
        await base44.entities.Family.create(payload);
        toast({ title: t.added });
      }
      setEditing(null);
      await load();
    } catch (e) {
      toast({ title: t.saveFailed, description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const remove = async (f) => {
    if (!window.confirm(`${t.confirmDel} ${f.familyId}? ${t.delSub}`)) return;
    try {
      const mems = await base44.entities.FamilyMember.filter({ familyId: f.familyId });
      if (mems.length > 0) {
        await base44.entities.FamilyMember.deleteMany({ familyId: f.familyId });
      }
      await base44.entities.Family.delete(f.id);
      await load();
      toast({ title: t.deleted });
    } catch (e) {
      toast({ title: t.delFailed, description: e.message, variant: "destructive" });
    }
  };

  const { search, setSearch, page, setPage, totalPages, totalItems, startIndex, pageSize, pageItems, filtered, dateFrom, setDateFrom, dateTo, setDateTo } = useTableControls(families, {
    searchFields: ["familyId", "familyName", "headName", "applicationId"],
    dateField: "registrationDate",
  });

  const exportColumns = [
    { key: "familyId", label: t.thFamId },
    { key: "familyName", label: t.thFamName },
    { key: "headName", label: t.thHead },
    { key: "memberCount", label: t.thMembers },
    { key: "city", label: t.thCity },
    { key: "status", label: t.thStatus },
  ];

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gold/30 border-t-maroon" /></div>;

  const locale = lang === "hi" ? "hi-IN" : "en-IN";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-maroon">{t.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.sub}</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportMenu filename="families" title={t.title} columns={exportColumns} rows={filtered} />
          <button onClick={openNew} className="inline-flex items-center gap-1.5 rounded-full bg-maroon px-5 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark">
            <Plus className="h-4 w-4" /> {t.add}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPh}
            className="w-full rounded-full border border-gold/40 bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:border-maroon"
          />
        </div>
        <DateRangeFilter from={dateFrom} to={dateTo} onFromChange={setDateFrom} onToChange={setDateTo} />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gold/30 bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">{t.thFamId}</th>
              <th className="px-4 py-3">{t.thFamName}</th>
              <th className="px-4 py-3">{t.thHead}</th>
              <th className="px-4 py-3">{t.thMembers}</th>
              <th className="px-4 py-3">{t.thCity}</th>
              <th className="px-4 py-3">{t.thStatus}</th>
              <th className="px-4 py-3 text-right">{t.thActions}</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((f, i) => (
              <tr key={f.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 text-muted-foreground">{startIndex + i + 1}</td>
                <td className="px-4 py-3 font-semibold text-maroon">{f.familyId}</td>
                <td className="px-4 py-3">{f.familyName}</td>
                <td className="px-4 py-3">{f.headName}</td>
                <td className="px-4 py-3">{f.memberCount || 0}</td>
                <td className="px-4 py-3 text-muted-foreground">{f.city}</td>
                <td className="px-4 py-3"><StatusBadge status={f.status} /></td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1.5">
                    <button onClick={() => viewFamily(f)} className="inline-flex items-center gap-1 rounded-full border border-gold/40 px-3 py-1.5 text-xs font-semibold text-maroon hover:bg-gold/10">
                      <Eye className="h-3.5 w-3.5" /> {t.view}
                    </button>
                    <button onClick={() => openEdit(f)} className="rounded-full p-1.5 text-maroon hover:bg-maroon/10"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => remove(f)} className="rounded-full p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {totalItems === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">{t.empty}</td></tr>}
          </tbody>
        </table>
        <TablePagination page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setSelected(null)}>
          <div className="h-full w-full max-w-md overflow-y-auto bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.family}</div>
                <div className="font-display text-lg font-bold text-maroon">{selected.familyId}</div>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-full p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl border border-gold/30 bg-cream p-4">
                <div className="font-display text-base font-semibold text-maroon">{selected.familyName}</div>
                <div className="text-xs text-muted-foreground">{t.head}: {selected.headName}</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">{t.gotra}:</span> {selected.gotra || "—"}</div>
                  <div><span className="text-muted-foreground">{t.native}:</span> {selected.nativePlace || "—"}</div>
                  <div><span className="text-muted-foreground">{t.contact}:</span> {selected.contactNumber}</div>
                  <div><span className="text-muted-foreground">{t.email}:</span> {selected.email || "—"}</div>
                  <div className="col-span-2"><span className="text-muted-foreground">{t.address}:</span> {selected.address}, {selected.city}, {selected.state}</div>
                </div>
                <button
                  onClick={() => resendCredentials(selected)}
                  disabled={resending}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-maroon px-4 py-2 text-xs font-semibold text-cream hover:bg-maroon-dark disabled:opacity-60"
                >
                  {resending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
                  {resending ? t.resending : t.resendCreds}
                </button>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-maroon">{t.members} ({members.length})</div>
                <div className="mt-2 space-y-2">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-maroon/10"><Users className="h-4 w-4 text-maroon" /></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">{m.name}</div>
                        <div className="text-xs text-muted-foreground">{m.relationship} · {m.membershipId}</div>
                      </div>
                      <StatusBadge status={m.status} />
                    </div>
                  ))}
                  {members.length === 0 && <p className="text-xs text-muted-foreground">{t.noMembers}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={() => setEditing(null)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-gold/40 bg-card p-6 shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-maroon">{editing.id ? t.editFamily : t.addFamily}</h2>
              <button onClick={() => setEditing(null)} className="rounded-full p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblFamId}</label><input value={editing.familyId} onChange={(e) => setEditing({ ...editing, familyId: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblStatus}</label>
                <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon">{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
              </div>
              <div className="sm:col-span-2"><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblFamName} *</label><input value={editing.familyName} onChange={(e) => setEditing({ ...editing, familyName: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div className="sm:col-span-2"><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblHeadName} *</label><input value={editing.headName} onChange={(e) => setEditing({ ...editing, headName: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div className="sm:col-span-2"><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblAddress}</label><input value={editing.address} onChange={(e) => setEditing({ ...editing, address: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblCity}</label><input value={editing.city} onChange={(e) => setEditing({ ...editing, city: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblDistrict}</label><input value={editing.district} onChange={(e) => setEditing({ ...editing, district: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblState}</label><input value={editing.state} onChange={(e) => setEditing({ ...editing, state: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblPincode}</label><input value={editing.pincode} onChange={(e) => setEditing({ ...editing, pincode: sanitizePincode(e.target.value) })} inputMode="numeric" maxLength={6} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblGotra}</label><input value={editing.gotra} onChange={(e) => setEditing({ ...editing, gotra: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblNativePlace}</label><input value={editing.nativePlace} onChange={(e) => setEditing({ ...editing, nativePlace: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblVillage}</label><input value={editing.village} onChange={(e) => setEditing({ ...editing, village: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblContact}</label><input value={editing.contactNumber} onChange={(e) => setEditing({ ...editing, contactNumber: sanitizeMobile(e.target.value) })} inputMode="numeric" maxLength={10} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblEmail}</label><input value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
            </div>
            <button onClick={save} disabled={saving} className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-maroon py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? t.saving : (editing.id ? t.updateFamily : t.add)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
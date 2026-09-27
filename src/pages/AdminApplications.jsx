import React, { useEffect, useState } from "react";
import { Check, X, AlertCircle, Eye, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useLang } from "@/lib/i18n";
import { sanitizeMobile, sanitizePincode } from "@/lib/utils";
import { useTableControls } from "@/lib/useTableControls";
import SearchBox from "@/components/admin/SearchBox";
import ExportMenu from "@/components/ExportMenu";
import DateRangeFilter from "@/components/admin/DateRangeFilter";
import TablePagination from "@/components/admin/TablePagination";

const STATUSES = ["DRAFT", "SUBMITTED", "PENDING_VERIFICATION", "CORRECTION_REQUIRED", "APPROVED", "REJECTED"];

const L = {
  en: {
    title: "Registrations",
    sub: "Review and approve family registration applications.",
    add: "Add Application",
    thAppId: "Application ID",
    thFamilyHead: "Family Head",
    thFamily: "Family",
    thSubmitted: "Submitted",
    thStatus: "Status",
    thActions: "Actions",
    review: "Review",
    empty: "No applications yet.",
    searchPh: "Search by Application ID, name, or family...",
    app: "Application",
    familyHead: "Family Head",
    familyName: "Family Name",
    gotra: "Gotra",
    nativePlace: "Native Place",
    village: "Village",
    address: "Address",
    members: "Members",
    adminRemarks: "Admin Remarks",
    enterCorrection: "Enter correction reason...",
    enterRejection: "Enter rejection reason...",
    approve: "Approve",
    correction: "Correction",
    reject: "Reject",
    processing: "Processing...",
    confirm: "Confirm",
    cancel: "Cancel",
    editApp: "Edit Application",
    addApp: "Add Application",
    lblAppId: "Application ID",
    lblStatus: "Status",
    lblHeadName: "Family Head Name",
    lblMobile: "Mobile",
    lblEmail: "Email",
    lblFamilyName: "Family Name",
    lblAddress: "Address",
    lblCity: "City",
    lblDistrict: "District",
    lblState: "State",
    lblPincode: "Pincode",
    lblGotra: "Gotra",
    lblNative: "Native Place",
    lblVillage: "Village",
    lblRemarks: "Admin Remarks",
    saving: "Saving...",
    updateApp: "Update Application",
    reqFields: "Application ID, family head name, mobile and family name are required",
    updated: "Application updated",
    added: "Application added",
    saveFailed: "Save failed",
    deleted: "Application deleted",
    delFailed: "Delete failed",
    confirmDel: "Delete application",
    remarksReq: "Remarks are required",
    approvedToast: "Application Approved",
    famIdGenerated: "Family ID generated. Login invite sent to member's email.",
    correctionRequested: "Correction requested",
    rejectedToast: "Application rejected",
    actionFailed: "Action failed",
    notifApprovedTitle: "Application Approved!",
    notifApprovedMsg: "Your family registration has been approved. Your Family ID is",
    notifApprovedMsg2: "You can now log in to the member portal.",
    notifCorrectionTitle: "Correction Required",
    notifCorrectionMsg: "Your application needs correction:",
    notifRejectedTitle: "Application Rejected",
    notifRejectedMsg: "Your application has been rejected:",
  },
  hi: {
    title: "रजिस्ट्रेशन",
    sub: "परिवार रजिस्ट्रेशन आवेदन समीक्षित और स्वीकृत करें।",
    add: "आवेदन जोड़ें",
    thAppId: "आवेदन आईडी",
    thFamilyHead: "परिवार मुखिया",
    thFamily: "परिवार",
    thSubmitted: "जमा",
    thStatus: "स्थिति",
    thActions: "क्रियाएँ",
    review: "समीक्षा",
    empty: "अभी कोई आवेदन नहीं।",
    searchPh: "आवेदन आईडी, नाम या परिवार से खोजें...",
    app: "आवेदन",
    familyHead: "परिवार मुखिया",
    familyName: "परिवार का नाम",
    gotra: "गोत्र",
    nativePlace: "मूल स्थान",
    village: "गाँव",
    address: "पता",
    members: "सदस्य",
    adminRemarks: "एडमिन टिप्पणियाँ",
    enterCorrection: "सुधार का कारण दर्ज करें...",
    enterRejection: "अस्वीकरण का कारण दर्ज करें...",
    approve: "स्वीकृत करें",
    correction: "सुधार",
    reject: "अस्वीकृत करें",
    processing: "प्रसंस्करण...",
    confirm: "पुष्टि करें",
    cancel: "रद्द करें",
    editApp: "आवेदन संपादित करें",
    addApp: "आवेदन जोड़ें",
    lblAppId: "आवेदन आईडी",
    lblStatus: "स्थिति",
    lblHeadName: "परिवार मुखिया नाम",
    lblMobile: "मोबाइल",
    lblEmail: "ईमेल",
    lblFamilyName: "परिवार का नाम",
    lblAddress: "पता",
    lblCity: "शहर",
    lblDistrict: "ज़िला",
    lblState: "राज्य",
    lblPincode: "पिनकोड",
    lblGotra: "गोत्र",
    lblNative: "मूल स्थान",
    lblVillage: "गाँव",
    lblRemarks: "एडमिन टिप्पणियाँ",
    saving: "सहेजा जा रहा है...",
    updateApp: "आवेदन अपडेट करें",
    reqFields: "आवेदन आईडी, परिवार मुखिया नाम, मोबाइल और परिवार नाम आवश्यक हैं",
    updated: "आवेदन अपडेट हुआ",
    added: "आवेदन जोड़ा गया",
    saveFailed: "सहेजने में विफल",
    deleted: "आवेदन हटाया गया",
    delFailed: "हटाने में विफल",
    confirmDel: "आवेदन हटाएँ",
    remarksReq: "टिप्पणियाँ आवश्यक हैं",
    approvedToast: "आवेदन स्वीकृत",
    famIdGenerated: "परिवार आईडी बनाई गई। लॉगिन निमंत्रण सदस्य के ईमेल पर भेजा गया।",
    correctionRequested: "सुधार का अनुरोध किया गया",
    rejectedToast: "आवेदन अस्वीकृत",
    actionFailed: "क्रिया विफल",
    notifApprovedTitle: "आवेदन स्वीकृत!",
    notifApprovedMsg: "आपका परिवार रजिस्ट्रेशन स्वीकृत हो गया है। आपका परिवार आईडी है",
    notifApprovedMsg2: "अब आप सदस्य पोर्टल में लॉगिन कर सकते हैं।",
    notifCorrectionTitle: "सुधार आवश्यक",
    notifCorrectionMsg: "आपके आवेदन में सुधार आवश्यक है:",
    notifRejectedTitle: "आवेदन अस्वीकृत",
    notifRejectedMsg: "आपका आवेदन अस्वीकृत किया गया है:",
  },
};

const normalizeMembersPayload = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }
  if (Array.isArray(value.items)) return value.items;
  if (Array.isArray(value.data)) return value.data;
  if (typeof value === "object") {
    const values = Object.values(value);
    if (values.length && values.every((entry) => entry && typeof entry === "object")) return values;
    return [];
  }
  return [];
};

export default function AdminApplications() {
  const { lang } = useLang();
  const t = L[lang];
  const { toast } = useToast();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState(null); // "approve" | "correction" | "reject"
  const [remarks, setRemarks] = useState("");
  const [processing, setProcessing] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.Application.list("-submitted_date", 100);
      setApps(list);
    } catch (e) {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const takeAction = async () => {
    if ((action === "correction" || action === "reject") && !remarks.trim()) {
      toast({ title: t.remarksReq, variant: "destructive" });
      return;
    }
    setProcessing(true);
    try {
      if (action === "approve") {
        const normalizedMembers = normalizeMembersPayload(selected.members_data);
        const newFamily = await base44.entities.Family.create({
          family_name: selected.family_name,
          head_name: selected.family_head_name,
          status: "ACTIVE",
          address: selected.address,
          city: selected.city,
          district: selected.district,
          state: selected.state,
          pincode: selected.pincode,
          gotra: selected.gotra,
          native_place: selected.native_place,
          village: selected.village,
          contact_number: selected.mobile,
          email: selected.email,
          registration_date: new Date().toISOString(),
          member_count: normalizedMembers.length,
          application_id: selected.application_id,
        });
        const famId = newFamily.family_id;
        const memberRecords = normalizedMembers.map((m) => {
          return {
            family_id: famId,
            name: m.name,
            relationship: m.relationship,
            gender: m.gender,
            dob: m.dob,
            mobile: m.mobile,
            email: m.email,
            education: m.education,
            occupation: m.occupation,
            address: m.address,
            status: "ACTIVE",
          };
        });
        if (memberRecords.length > 0) {
          await base44.entities.FamilyMember.bulkCreate(memberRecords);
        }
        await base44.entities.Application.update(selected.id, {
          status: "APPROVED",
          reviewed_date: new Date().toISOString(),
          resulting_family_id: famId,
        });
        await base44.entities.Notification.create({
          title: t.notifApprovedTitle,
          message: `${t.notifApprovedMsg} ${famId}. ${t.notifApprovedMsg2}`,
          type: "Approval",
          recipient_family_id: famId,
          date: new Date().toISOString(),
        });
        try {
          if (selected.email) {
            await base44.users.inviteUser(selected.email, "user", {
              full_name: selected.family_head_name,
              phone: selected.mobile,
            });
          }
        } catch (e) {
          console.error("Approval invite email failed:", e);
        }
        toast({ title: t.approvedToast, description: `${t.famIdGenerated}` });
      } else if (action === "correction") {
        await base44.entities.Application.update(selected.id, {
          status: "CORRECTION_REQUIRED",
          admin_remarks: remarks,
          reviewed_date: new Date().toISOString(),
        });
        await base44.entities.Notification.create({
          title: t.notifCorrectionTitle,
          message: `${t.notifCorrectionMsg} ${remarks}`,
          type: "Correction",
          recipient_family_id: selected.application_id,
          date: new Date().toISOString(),
        });
        toast({ title: t.correctionRequested });
      } else if (action === "reject") {
        await base44.entities.Application.update(selected.id, {
          status: "REJECTED",
          admin_remarks: remarks,
          reviewed_date: new Date().toISOString(),
        });
        await base44.entities.Notification.create({
          title: t.notifRejectedTitle,
          message: `${t.notifRejectedMsg} ${remarks}`,
          type: "Correction",
          recipient_family_id: selected.application_id,
          date: new Date().toISOString(),
        });
        toast({ title: t.rejectedToast });
      }
      setAction(null);
      setRemarks("");
      setSelected(null);
      load();
    } catch (err) {
      toast({ title: t.actionFailed, description: err.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const openNew = () => {
    setEditing({
      application_id: "", status: "SUBMITTED", family_head_name: "", mobile: "", email: "", family_name: "",
      address: "", city: "", district: "", state: "", pincode: "", gotra: "", native_place: "", village: "",
      members_data: [], admin_remarks: "",
    });
  };

  const openEdit = (a) => setEditing({ ...a });

  const saveEdit = async () => {
    if ((editing.id && !editing.application_id) || !editing.family_head_name || !editing.mobile || !editing.family_name) {
      toast({ title: t.reqFields, variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        application_id: editing.application_id,
        status: editing.status || "SUBMITTED",
        family_head_name: editing.family_head_name,
        mobile: editing.mobile,
        email: editing.email || "",
        family_name: editing.family_name,
        address: editing.address || "",
        city: editing.city || "",
        district: editing.district || "",
        state: editing.state || "",
        pincode: editing.pincode || "",
        gotra: editing.gotra || "",
        native_place: editing.native_place || "",
        village: editing.village || "",
        members_data: editing.members_data || [],
        admin_remarks: editing.admin_remarks || "",
        submitted_date: editing.submitted_date || new Date().toISOString(),
      };
      if (editing.id) {
        await base44.entities.Application.update(editing.id, payload);
        toast({ title: t.updated });
      } else {
        await base44.entities.Application.create(payload);
        toast({ title: t.added });
      }
      setEditing(null);
      await load();
    } catch (e) {
      toast({ title: t.saveFailed, description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const remove = async (a) => {
    if (!window.confirm(`${t.confirmDel} ${a.application_id}?`)) return;
    try {
      await base44.entities.Application.delete(a.id);
      await load();
      toast({ title: t.deleted });
    } catch (e) {
      toast({ title: t.delFailed, description: e.message, variant: "destructive" });
    }
  };

  const { search, setSearch, page, setPage, totalPages, totalItems, startIndex, pageSize, pageItems, filtered, dateFrom, setDateFrom, dateTo, setDateTo } = useTableControls(apps, {
    searchFields: ["application_id", "family_head_name", "family_name", "mobile"],
    dateField: "submitted_date",
  });

  const exportColumns = [
    { key: "application_id", label: t.thAppId },
    { key: "family_head_name", label: t.thFamilyHead },
    { key: "family_name", label: t.thFamily },
    { key: "submitted_date", label: t.thSubmitted },
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
          <ExportMenu filename="applications" title={t.title} columns={exportColumns} rows={filtered} />
          <button onClick={openNew} className="inline-flex items-center gap-1.5 rounded-full bg-maroon px-5 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark">
            <Plus className="h-4 w-4" /> {t.add}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[220px] flex-1"><SearchBox value={search} onChange={setSearch} placeholder={t.searchPh} /></div>
        <DateRangeFilter from={dateFrom} to={dateTo} onFromChange={setDateFrom} onToChange={setDateTo} />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gold/30 bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">{t.thAppId}</th>
              <th className="px-4 py-3">{t.thFamilyHead}</th>
              <th className="px-4 py-3">{t.thFamily}</th>
              <th className="px-4 py-3">{t.thSubmitted}</th>
              <th className="px-4 py-3">{t.thStatus}</th>
              <th className="px-4 py-3 text-right">{t.thActions}</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((a, i) => (
              <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 text-muted-foreground">{startIndex + i + 1}</td>
                <td className="px-4 py-3 font-semibold text-maroon">{a.application_id}</td>
                <td className="px-4 py-3">{a.family_head_name}</td>
                <td className="px-4 py-3">{a.family_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.submitted_date ? new Date(a.submitted_date).toLocaleDateString(locale) : "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <button onClick={() => setSelected(a)} className="inline-flex items-center gap-1 rounded-full border border-gold/40 px-3 py-1.5 text-xs font-semibold text-maroon hover:bg-gold/10">
                      <Eye className="h-3.5 w-3.5" /> {t.review}
                    </button>
                    <button onClick={() => openEdit(a)} className="rounded-full p-1.5 text-maroon hover:bg-maroon/10"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => remove(a)} className="rounded-full p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {totalItems === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">{t.empty}</td></tr>
            )}
          </tbody>
        </table>
        <TablePagination page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
      </div>

      {/* Review drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => { setSelected(null); setAction(null); }}>
          <div className="h-full w-full max-w-md overflow-y-auto bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.app}</div>
                <div className="font-display text-lg font-bold text-maroon">{selected.application_id}</div>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-gold/30 bg-cream p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-maroon">{t.familyHead}</div>
                <div className="mt-1 text-sm font-medium text-foreground">{selected.family_head_name}</div>
                <div className="text-xs text-muted-foreground">{selected.mobile} · {selected.email || "—"}</div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-xs text-muted-foreground">{t.familyName}</div><div className="font-medium">{selected.family_name}</div></div>
                <div><div className="text-xs text-muted-foreground">{t.gotra}</div><div className="font-medium">{selected.gotra || "—"}</div></div>
                <div><div className="text-xs text-muted-foreground">{t.nativePlace}</div><div className="font-medium">{selected.native_place || "—"}</div></div>
                <div><div className="text-xs text-muted-foreground">{t.village}</div><div className="font-medium">{selected.village || "—"}</div></div>
                <div className="col-span-2"><div className="text-xs text-muted-foreground">{t.address}</div><div className="font-medium">{selected.address}, {selected.city}, {selected.state} {selected.pincode}</div></div>
              </div>
              {(() => {
                const memberList = normalizeMembersPayload(selected.members_data);
                return (
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-maroon">{t.members} ({memberList.length})</div>
                    <div className="mt-2 space-y-2">
                      {memberList.map((m, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border border-border p-2.5 text-sm">
                          <div>
                            <div className="font-medium text-foreground">{m.name}</div>
                            <div className="text-xs text-muted-foreground">{m.relationship} · {m.gender || "—"}</div>
                          </div>
                          <div className="text-xs text-muted-foreground">{m.occupation || ""}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
              {selected.admin_remarks && (
                <div className="rounded-xl border border-orange-300 bg-orange-50 p-3 text-sm text-orange-700">
                  <div className="font-semibold">{t.adminRemarks}:</div> {selected.admin_remarks}
                </div>
              )}
            </div>

            {selected.status !== "APPROVED" && selected.status !== "REJECTED" && (
              <div className="mt-6 space-y-3">
                {action && (action === "correction" || action === "reject") && (
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder={action === "correction" ? t.enterCorrection : t.enterRejection}
                    rows={3}
                    className="w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon"
                  />
                )}
                {!action && (
                  <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => setAction("approve")} className="inline-flex flex-col items-center gap-1 rounded-xl bg-green-600 py-3 text-xs font-semibold text-white hover:bg-green-700">
                      <Check className="h-4 w-4" /> {t.approve}
                    </button>
                    <button onClick={() => setAction("correction")} className="inline-flex flex-col items-center gap-1 rounded-xl bg-amber-500 py-3 text-xs font-semibold text-white hover:bg-amber-600">
                      <AlertCircle className="h-4 w-4" /> {t.correction}
                    </button>
                    <button onClick={() => setAction("reject")} className="inline-flex flex-col items-center gap-1 rounded-xl bg-red-600 py-3 text-xs font-semibold text-white hover:bg-red-700">
                      <X className="h-4 w-4" /> {t.reject}
                    </button>
                  </div>
                )}
                {action && (
                  <div className="flex gap-2">
                    <button onClick={takeAction} disabled={processing} className="flex-1 rounded-full bg-maroon py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark disabled:opacity-60">
                      {processing ? t.processing : `${t.confirm} ${action === "approve" ? t.approve : action === "correction" ? t.correction : t.reject}`}
                    </button>
                    <button onClick={() => { setAction(null); setRemarks(""); }} className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted">
                      {t.cancel}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={() => setEditing(null)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-gold/40 bg-card p-6 shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-maroon">{editing.id ? t.editApp : t.addApp}</h2>
              <button onClick={() => setEditing(null)} className="rounded-full p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblAppId} *</label><input value={editing.application_id} onChange={(e) => setEditing({ ...editing, application_id: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblStatus}</label>
                <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon">{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
              </div>
              <div className="sm:col-span-2"><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblHeadName} *</label><input value={editing.family_head_name} onChange={(e) => setEditing({ ...editing, family_head_name: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblMobile} *</label><input value={editing.mobile} onChange={(e) => setEditing({ ...editing, mobile: sanitizeMobile(e.target.value) })} inputMode="numeric" maxLength={10} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblEmail}</label><input value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div className="sm:col-span-2"><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblFamilyName} *</label><input value={editing.family_name} onChange={(e) => setEditing({ ...editing, family_name: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div className="sm:col-span-2"><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblAddress}</label><input value={editing.address} onChange={(e) => setEditing({ ...editing, address: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblCity}</label><input value={editing.city} onChange={(e) => setEditing({ ...editing, city: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblDistrict}</label><input value={editing.district} onChange={(e) => setEditing({ ...editing, district: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblState}</label><input value={editing.state} onChange={(e) => setEditing({ ...editing, state: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblPincode}</label><input value={editing.pincode} onChange={(e) => setEditing({ ...editing, pincode: sanitizePincode(e.target.value) })} inputMode="numeric" maxLength={6} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblGotra}</label><input value={editing.gotra} onChange={(e) => setEditing({ ...editing, gotra: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblNative}</label><input value={editing.native_place} onChange={(e) => setEditing({ ...editing, native_place: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblVillage}</label><input value={editing.village} onChange={(e) => setEditing({ ...editing, village: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div className="sm:col-span-2"><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblRemarks}</label><textarea value={editing.admin_remarks} onChange={(e) => setEditing({ ...editing, admin_remarks: e.target.value })} rows={2} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
            </div>
            <button onClick={saveEdit} disabled={saving} className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-maroon py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? t.saving : (editing.id ? t.updateApp : t.add)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
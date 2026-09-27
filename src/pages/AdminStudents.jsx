import React, { useEffect, useState } from "react";
import { Check, X, AlertCircle, Eye, Plus, Pencil, Trash2, Loader2, GraduationCap, KeyRound } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useLang } from "@/lib/i18n";
import { sanitizeMobile, sanitizePincode } from "@/lib/utils";
import { useTableControls } from "@/lib/useTableControls";
import SearchBox from "@/components/admin/SearchBox";
import TablePagination from "@/components/admin/TablePagination";
import ExportMenu from "@/components/ExportMenu";
import DateRangeFilter from "@/components/admin/DateRangeFilter";

const STATUSES = ["DRAFT", "SUBMITTED", "PENDING_VERIFICATION", "CORRECTION_REQUIRED", "APPROVED", "REJECTED"];

const L = {
  en: {
    title: "Student Management",
    sub: "Review, approve, and manage student registrations.",
    add: "Add Student Application",
    thAppId: "Application ID",
    thStudent: "Student",
    thCourse: "Course",
    thSubmitted: "Submitted",
    thStatus: "Status",
    thActions: "Actions",
    review: "Review",
    empty: "No student applications yet.",
    searchPh: "Search by Application ID, student, or course...",
    resendCreds: "Resend Login Credentials",
    noEmailOnFile: "This student has no email on file.",
    credentialsSent: "Login credentials sent",
    credentialsFailed: "Failed to send credentials",
    app: "Student Application",
    student: "Student Details",
    guardian: "Guardian Details",
    adminRemarks: "Admin Remarks",
    enterCorrection: "Enter correction reason...",
    enterRejection: "Enter rejection reason...",
    approve: "Approve",
    correction: "Correction",
    reject: "Reject",
    processing: "Processing...",
    confirm: "Confirm",
    cancel: "Cancel",
    editApp: "Edit Student Application",
    addApp: "Add Student Application",
    lblAppId: "Application ID",
    lblStatus: "Status",
    lblName: "Student Name",
    lblFatherName: "Father's Name",
    lblMobile: "Mobile",
    lblEmail: "Email",
    lblDob: "Date of Birth",
    lblGender: "Gender",
    lblCourse: "Course / Class",
    lblInstitution: "Institution",
    lblYear: "Academic Year",
    lblGuardianName: "Guardian Name",
    lblGuardianMobile: "Guardian Mobile",
    lblAddress: "Address",
    lblCity: "City",
    lblDistrict: "District",
    lblState: "State",
    lblPincode: "Pincode",
    lblRemarks: "Admin Remarks",
    saving: "Saving...",
    updateApp: "Update Application",
    reqFields: "Application ID, student name and mobile are required",
    updated: "Application updated",
    added: "Application added",
    saveFailed: "Save failed",
    deleted: "Application deleted",
    delFailed: "Delete failed",
    confirmDel: "Delete student application",
    remarksReq: "Remarks are required",
    approvedToast: "Student Approved",
    stuIdGenerated: "Student Member ID generated. Login invite sent to student's email.",
    correctionRequested: "Correction requested",
    rejectedToast: "Application rejected",
    actionFailed: "Action failed",
    notifApprovedTitle: "Student Registration Approved!",
    notifApprovedMsg: "Your student registration has been approved. Your Student Member ID is",
    notifApprovedMsg2: "You can now log in to the member portal.",
    notifCorrectionTitle: "Correction Required",
    notifCorrectionMsg: "Your student application needs correction:",
    notifRejectedTitle: "Student Application Rejected",
    notifRejectedMsg: "Your student application has been rejected:",
  },
  hi: {
    title: "स्टूडेंट मैनेजमेंट",
    sub: "स्टूडेंट रजिस्ट्रेशन समीक्षित, स्वीकृत और प्रबंधित करें।",
    add: "स्टूडेंट आवेदन जोड़ें",
    thAppId: "आवेदन आईडी",
    thStudent: "स्टूडेंट",
    thCourse: "कोर्स",
    thSubmitted: "जमा",
    thStatus: "स्थिति",
    thActions: "क्रियाएँ",
    review: "समीक्षा",
    empty: "अभी कोई स्टूडेंट आवेदन नहीं।",
    searchPh: "आवेदन आईडी, स्टूडेंट या कोर्स से खोजें...",
    resendCreds: "लॉगिन जानकारी पुनः भेजें",
    noEmailOnFile: "इस स्टूडेंट का कोई ईमेल दर्ज नहीं है।",
    credentialsSent: "लॉगिन जानकारी भेज दी गई",
    credentialsFailed: "जानकारी भेजने में विफल",
    app: "स्टूडेंट आवेदन",
    student: "स्टूडेंट विवरण",
    guardian: "अभिभावक विवरण",
    adminRemarks: "एडमिन टिप्पणियाँ",
    enterCorrection: "सुधार का कारण दर्ज करें...",
    enterRejection: "अस्वीकरण का कारण दर्ज करें...",
    approve: "स्वीकृत करें",
    correction: "सुधार",
    reject: "अस्वीकृत करें",
    processing: "प्रसंस्करण...",
    confirm: "पुष्टि करें",
    cancel: "रद्द करें",
    editApp: "स्टूडेंट आवेदन संपादित करें",
    addApp: "स्टूडेंट आवेदन जोड़ें",
    lblAppId: "आवेदन आईडी",
    lblStatus: "स्थिति",
    lblName: "स्टूडेंट नाम",
    lblFatherName: "पिता का नाम",
    lblMobile: "मोबाइल",
    lblEmail: "ईमेल",
    lblDob: "जन्म तिथि",
    lblGender: "लिंग",
    lblCourse: "कोर्स / कक्षा",
    lblInstitution: "संस्थान",
    lblYear: "शैक्षणिक वर्ष",
    lblGuardianName: "अभिभावक नाम",
    lblGuardianMobile: "अभिभावक मोबाइल",
    lblAddress: "पता",
    lblCity: "शहर",
    lblDistrict: "ज़िला",
    lblState: "राज्य",
    lblPincode: "पिनकोड",
    lblRemarks: "एडमिन टिप्पणियाँ",
    saving: "सहेजा जा रहा है...",
    updateApp: "आवेदन अपडेट करें",
    reqFields: "आवेदन आईडी, स्टूडेंट नाम और मोबाइल आवश्यक हैं",
    updated: "आवेदन अपडेट हुआ",
    added: "आवेदन जोड़ा गया",
    saveFailed: "सहेजने में विफल",
    deleted: "आवेदन हटाया गया",
    delFailed: "हटाने में विफल",
    confirmDel: "स्टूडेंट आवेदन हटाएँ",
    remarksReq: "टिप्पणियाँ आवश्यक हैं",
    approvedToast: "स्टूडेंट स्वीकृत",
    stuIdGenerated: "स्टूडेंट मेंबर आईडी बनाई गई। लॉगिन निमंत्रण स्टूडेंट के ईमेल पर भेजा गया।",
    correctionRequested: "सुधार का अनुरोध किया गया",
    rejectedToast: "आवेदन अस्वीकृत",
    actionFailed: "क्रिया विफल",
    notifApprovedTitle: "स्टूडेंट रजिस्ट्रेशन स्वीकृत!",
    notifApprovedMsg: "आपकी स्टूडेंट रजिस्ट्रेशन स्वीकृत हो गई है। आपका स्टूडेंट मेंबर आईडी है",
    notifApprovedMsg2: "अब आप सदस्य पोर्टल में लॉगिन कर सकते हैं।",
    notifCorrectionTitle: "सुधार आवश्यक",
    notifCorrectionMsg: "आपके स्टूडेंट आवेदन में सुधार आवश्यक है:",
    notifRejectedTitle: "स्टूडेंट आवेदन अस्वीकृत",
    notifRejectedMsg: "आपका स्टूडेंट आवेदन अस्वीकृत किया गया है:",
  },
};

const emptyForm = () => ({
  application_id: "", status: "SUBMITTED", student_name: "", mobile: "", email: "", dob: "", gender: "",
  course: "", institution: "", academic_year: "", guardian_name: "", guardian_mobile: "",
  address: "", city: "", district: "", state: "", pincode: "", admin_remarks: "",
});

export default function AdminStudents() {
  const { lang } = useLang();
  const t = L[lang];
  const { toast } = useToast();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [processing, setProcessing] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [resendingId, setResendingId] = useState(null);

  const resendCredentials = async (a) => {
    if (!a.email) {
      toast({ title: t.noEmailOnFile, variant: "destructive" });
      return;
    }
    setResendingId(a.id);
    try {
      const result = await base44.users.inviteUser(a.email, "user", {
        full_name: a.student_name,
        phone: a.mobile || a.guardian_mobile,
      });
      toast({ title: t.credentialsSent, description: `${a.email} · ${result.password}` });
    } catch (e) {
      toast({ title: t.credentialsFailed, description: e.message, variant: "destructive" });
    } finally {
      setResendingId(null);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.StudentApplication.list("-submitted_date", 100);
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
        const newStudent = await base44.entities.Student.create({
          student_name: selected.student_name,
          father_name: selected.father_name,
          status: "ACTIVE",
          mobile: selected.mobile,
          email: selected.email,
          dob: selected.dob,
          gender: selected.gender,
          course: selected.course,
          institution: selected.institution,
          academic_year: selected.academic_year,
          guardian_name: selected.guardian_name,
          guardian_mobile: selected.guardian_mobile,
          address: selected.address,
          city: selected.city,
          district: selected.district,
          state: selected.state,
          pincode: selected.pincode,
          photo_url: selected.photo_url,
          registration_date: new Date().toISOString(),
          application_id: selected.application_id,
        });
        const stuId = newStudent.student_id;
        await base44.entities.StudentApplication.update(selected.id, {
          status: "APPROVED",
          reviewed_date: new Date().toISOString(),
          resulting_student_id: stuId,
        });
        await base44.entities.Notification.create({
          title: t.notifApprovedTitle,
          message: `${t.notifApprovedMsg} ${stuId}. ${t.notifApprovedMsg2}`,
          type: "Approval",
          recipient_family_id: stuId,
          date: new Date().toISOString(),
        });
        try {
          if (selected.email) {
            await base44.users.inviteUser(selected.email, "user", {
              full_name: selected.student_name,
              phone: selected.mobile || selected.guardian_mobile,
            });
          }
        } catch (e) { /* already invited */ }
        toast({ title: t.approvedToast, description: t.stuIdGenerated });
      } else if (action === "correction") {
        await base44.entities.StudentApplication.update(selected.id, {
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
        await base44.entities.StudentApplication.update(selected.id, {
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

  const openNew = () => setEditing(emptyForm());

  const openEdit = (a) => setEditing({ ...a });

  const saveEdit = async () => {
    if ((editing.id && !editing.application_id) || !editing.student_name || !editing.mobile) {
      toast({ title: t.reqFields, variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        application_id: editing.application_id,
        status: editing.status || "SUBMITTED",
        student_name: editing.student_name,
        father_name: editing.father_name || "",
        mobile: editing.mobile,
        email: editing.email || "",
        dob: editing.dob || "",
        gender: editing.gender || "",
        course: editing.course || "",
        institution: editing.institution || "",
        academic_year: editing.academic_year || "",
        guardian_name: editing.guardian_name || "",
        guardian_mobile: editing.guardian_mobile || "",
        address: editing.address || "",
        city: editing.city || "",
        district: editing.district || "",
        state: editing.state || "",
        pincode: editing.pincode || "",
        admin_remarks: editing.admin_remarks || "",
        submitted_date: editing.submitted_date || new Date().toISOString(),
      };
      if (editing.id) {
        await base44.entities.StudentApplication.update(editing.id, payload);
        toast({ title: t.updated });
      } else {
        await base44.entities.StudentApplication.create(payload);
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
      await base44.entities.StudentApplication.delete(a.id);
      await load();
      toast({ title: t.deleted });
    } catch (e) {
      toast({ title: t.delFailed, description: e.message, variant: "destructive" });
    }
  };

  const { search, setSearch, page, setPage, totalPages, totalItems, startIndex, pageSize, pageItems, filtered, dateFrom, setDateFrom, dateTo, setDateTo } = useTableControls(apps, {
    searchFields: ["application_id", "student_name", "course", "mobile"],
    dateField: "submitted_date",
  });

  const exportColumns = [
    { key: "application_id", label: t.thAppId },
    { key: "student_name", label: t.thStudent },
    { key: "course", label: t.thCourse },
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
          <ExportMenu filename="students" title={t.title} columns={exportColumns} rows={filtered} />
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
              <th className="px-4 py-3">{t.thStudent}</th>
              <th className="px-4 py-3">{t.thCourse}</th>
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
                <td className="px-4 py-3">{a.student_name}</td>
                <td className="px-4 py-3">{a.course || "—"}<span className="block text-xs text-muted-foreground">{a.institution || ""}</span></td>
                <td className="px-4 py-3 text-muted-foreground">{a.submitted_date ? new Date(a.submitted_date).toLocaleDateString(locale) : "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <button onClick={() => setSelected(a)} className="inline-flex items-center gap-1 rounded-full border border-gold/40 px-3 py-1.5 text-xs font-semibold text-maroon hover:bg-gold/10">
                      <Eye className="h-3.5 w-3.5" /> {t.review}
                    </button>
                    {a.status === "APPROVED" && (
                      <button onClick={() => resendCredentials(a)} disabled={resendingId === a.id} title={t.resendCreds} className="rounded-full p-1.5 text-maroon hover:bg-maroon/10 disabled:opacity-60">
                        {resendingId === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
                      </button>
                    )}
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
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-maroon"><GraduationCap className="h-4 w-4" /> {t.student}</div>
                <div className="mt-2 text-sm font-medium text-foreground">{selected.student_name}</div>
                <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="col-span-2">{t.lblFatherName}: {selected.father_name || "—"}</div>
                  <div>{selected.mobile}</div>
                  <div>{selected.email || "—"}</div>
                  <div>{selected.gender || "—"}{selected.dob ? ` · ${selected.dob}` : ""}</div>
                  <div>{selected.course || "—"}</div>
                  <div className="col-span-2">{selected.institution}{selected.academic_year ? ` · ${selected.academic_year}` : ""}</div>
                </div>
              </div>
              <div className="rounded-xl border border-gold/30 bg-cream p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-maroon">{t.guardian}</div>
                <div className="mt-2 text-sm font-medium text-foreground">{selected.guardian_name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{selected.guardian_mobile}</div>
                <div className="mt-1 text-xs text-muted-foreground">{selected.address}, {selected.city}, {selected.state} {selected.pincode}</div>
              </div>
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
              <div className="sm:col-span-2"><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblName} *</label><input value={editing.student_name} onChange={(e) => setEditing({ ...editing, student_name: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblFatherName}</label><input value={editing.father_name || ""} onChange={(e) => setEditing({ ...editing, father_name: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblMobile} *</label><input value={editing.mobile} onChange={(e) => setEditing({ ...editing, mobile: sanitizeMobile(e.target.value) })} inputMode="numeric" maxLength={10} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblEmail}</label><input value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblDob}</label><input type="date" value={editing.dob} onChange={(e) => setEditing({ ...editing, dob: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblGender}</label><input value={editing.gender} onChange={(e) => setEditing({ ...editing, gender: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblCourse}</label><input value={editing.course} onChange={(e) => setEditing({ ...editing, course: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblInstitution}</label><input value={editing.institution} onChange={(e) => setEditing({ ...editing, institution: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblYear}</label><input value={editing.academic_year} onChange={(e) => setEditing({ ...editing, academic_year: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblGuardianName}</label><input value={editing.guardian_name} onChange={(e) => setEditing({ ...editing, guardian_name: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblGuardianMobile}</label><input value={editing.guardian_mobile} onChange={(e) => setEditing({ ...editing, guardian_mobile: sanitizeMobile(e.target.value) })} inputMode="numeric" maxLength={10} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div className="sm:col-span-2"><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblAddress}</label><input value={editing.address} onChange={(e) => setEditing({ ...editing, address: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblCity}</label><input value={editing.city} onChange={(e) => setEditing({ ...editing, city: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblDistrict}</label><input value={editing.district} onChange={(e) => setEditing({ ...editing, district: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblState}</label><input value={editing.state} onChange={(e) => setEditing({ ...editing, state: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblPincode}</label><input value={editing.pincode} onChange={(e) => setEditing({ ...editing, pincode: sanitizePincode(e.target.value) })} inputMode="numeric" maxLength={6} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
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
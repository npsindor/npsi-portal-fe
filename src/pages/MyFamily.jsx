import React, { useEffect, useState } from "react";
import { Users, UserPlus, Pencil, Trash2, X, Mail, Phone, MapPin, GraduationCap, Briefcase, ArrowRightLeft } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import RequestTransferModal from "@/components/RequestTransferModal";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useLang } from "@/lib/i18n";
import { useT } from "@/lib/i18n";
import { resolveMyFamily } from "@/lib/resolveMyFamily";

const relationships = ["Spouse", "Son", "Daughter", "Father", "Mother", "Brother", "Sister", "Other"];
const genders = ["Male", "Female", "Other"];

const relLabels = {
  Spouse: { en: "Spouse", hi: "जीवनसाथी" },
  Son: { en: "Son", hi: "पुत्र" },
  Daughter: { en: "Daughter", hi: "पुत्री" },
  Father: { en: "Father", hi: "पिता" },
  Mother: { en: "Mother", hi: "माता" },
  Brother: { en: "Brother", hi: "भाई" },
  Sister: { en: "Sister", hi: "बहन" },
  Other: { en: "Other", hi: "अन्य" },
  Head: { en: "Head", hi: "मुखिया" },
};
const genderLabels = {
  Male: { en: "Male", hi: "पुरुष" },
  Female: { en: "Female", hi: "महिला" },
  Other: { en: "Other", hi: "अन्य" },
};

const L = {
  en: {
    family: "Family",
    title: "My Family",
    addMember: "Add Member",
    edit: "Edit",
    remove: "Remove",
    noMembers: "No members yet",
    noMembersSub: "Add your first family member to get started.",
    editMember: "Edit Member",
    addFamilyMember: "Add Family Member",
    editSub: "Update member details",
    addSub: "Fill in the member details",
    name: "Name",
    namePh: "Full name",
    relationship: "Relationship",
    gender: "Gender",
    dob: "Date of Birth",
    dobNote: "4-digit year only · no future dates",
    mobile: "Mobile (10 digits)",
    email: "Email",
    education: "Education",
    occupation: "Occupation",
    address: "Address",
    select: "Select...",
    cancel: "Cancel",
    updateMember: "Update Member",
    saving: "Saving...",
    removeTitle: "Remove Member?",
    removeConfirm: "Are you sure you want to remove",
    removeConfirm2: "from your family? This cannot be undone.",
    removing: "Removing...",
    reqNameRel: "Name and relationship are required",
    dupName: "Duplicate name",
    dupDesc: "A member with this name already exists in your family.",
    invalidDob: "Invalid date of birth",
    year4: "Year must be 4 digits.",
    badDate: "Invalid date of birth.",
    futureDob: "Date of birth cannot be in the future.",
    invalidMobile: "Invalid mobile",
    mobile10: "Mobile number must be 10 digits.",
    updated: "Member updated",
    updatedDesc: "updated.",
    added: "Member added",
    addedDesc: "added to your family.",
    failUpdate: "Failed to update member",
    failAdd: "Failed to add member",
    removed: "Member removed",
    removedDesc: "removed from your family.",
    failRemove: "Failed to remove member",
    requestTransfer: "Transfer to another family",
  },
  hi: {
    family: "परिवार",
    title: "मेरा परिवार",
    addMember: "सदस्य जोड़ें",
    edit: "संपादित करें",
    remove: "हटाएँ",
    noMembers: "अभी कोई सदस्य नहीं",
    noMembersSub: "शुरू करने के लिए अपना पहला परिवार सदस्य जोड़ें।",
    editMember: "सदस्य संपादित करें",
    addFamilyMember: "परिवार सदस्य जोड़ें",
    editSub: "सदस्य विवरण अपडेट करें",
    addSub: "सदस्य विवरण भरें",
    name: "नाम",
    namePh: "पूरा नाम",
    relationship: "रिश्ता",
    gender: "लिंग",
    dob: "जन्म तिथि",
    dobNote: "केवल 4 अंकों का वर्ष · भविष्य की तिथि नहीं",
    mobile: "मोबाइल (10 अंक)",
    email: "ईमेल",
    education: "शिक्षा",
    occupation: "व्यवसाय",
    address: "पता",
    select: "चुनें...",
    cancel: "रद्द करें",
    updateMember: "सदस्य अपडेट करें",
    saving: "सहेजा जा रहा है...",
    removeTitle: "सदस्य हटाएँ?",
    removeConfirm: "क्या आप वाकई",
    removeConfirm2: "को अपने परिवार से हटाना चाहते हैं? यह वापस नहीं हो सकता।",
    removing: "हटाया जा रहा है...",
    reqNameRel: "नाम और रिश्ता आवश्यक है",
    dupName: "नाम दोहराया गया",
    dupDesc: "इस नाम का सदस्य आपके परिवार में पहले से मौजूद है।",
    invalidDob: "अमान्य जन्म तिथि",
    year4: "वर्ष 4 अंकों का होना चाहिए।",
    badDate: "अमान्य जन्म तिथि।",
    futureDob: "जन्म तिथि भविष्य में नहीं हो सकती।",
    invalidMobile: "अमान्य मोबाइल",
    mobile10: "मोबाइल नंबर 10 अंकों का होना चाहिए।",
    updated: "सदस्य अपडेट हुआ",
    updatedDesc: "अपडेट हुआ।",
    added: "सदस्य जोड़ा गया",
    addedDesc: "आपके परिवार में जोड़ा गया।",
    failUpdate: "सदस्य अपडेट करने में विफल",
    failAdd: "सदस्य जोड़ने में विफल",
    removed: "सदस्य हटाया गया",
    removedDesc: "आपके परिवार से हटाया गया।",
    failRemove: "सदस्य हटाने में विफल",
    requestTransfer: "दूसरे परिवार में ट्रांसफर",
  },
};

const emptyForm = { name: "", relationship: "", gender: "", dob: "", mobile: "", email: "", education: "", occupation: "", address: "" };

function isDuplicateName(name, members, exceptId = null) {
  const key = name.trim().toLowerCase();
  return members.some((m) => m.id !== exceptId && m.name && m.name.trim().toLowerCase() === key);
}

function validDob(dob, t) {
  if (!dob) return { ok: true };
  const parts = dob.split("-");
  if (parts[0].length !== 4) return { ok: false, msg: t.year4 };
  const d = new Date(dob);
  if (isNaN(d.getTime())) return { ok: false, msg: t.badDate };
  if (d > new Date()) return { ok: false, msg: t.futureDob };
  return { ok: true };
}

export default function MyFamily() {
  const { user } = useAuth();
  const { lang } = useLang();
  const t = L[lang];
  const { toast } = useToast();
  const [family, setFamily] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showTransfer, setShowTransfer] = useState(false);
  const tt = useT();

  const relLabel = (r) => (r && relLabels[r] ? relLabels[r][lang] : r) || "";
  const genderLabel = (g) => (g && genderLabels[g] ? genderLabels[g][lang] : g) || "";

  const load = async () => {
    try {
      const { family: mine, members: mems } = await resolveMyFamily(user);
      setFamily(mine);
      setMembers(mems);
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (m) => {
    setEditing(m);
    setForm({
      name: m.name || "", relationship: m.relationship || "", gender: m.gender || "",
      dob: m.dob || "", mobile: m.mobile || "", email: m.email || "",
      education: m.education || "", occupation: m.occupation || "", address: m.address || "",
    });
    setShowForm(true);
  };

  const sanitizeMobile = (v) => v.replace(/\D/g, "").slice(0, 10);

  const submit = async () => {
    if (!form.name || !form.relationship) {
      toast({ title: t.reqNameRel, variant: "destructive" });
      return;
    }
    if (isDuplicateName(form.name, members, editing?.id)) {
      toast({ title: t.dupName, description: t.dupDesc, variant: "destructive" });
      return;
    }
    const dobCheck = validDob(form.dob, t);
    if (!dobCheck.ok) {
      toast({ title: t.invalidDob, description: dobCheck.msg, variant: "destructive" });
      return;
    }
    if (form.mobile && sanitizeMobile(form.mobile).length < 10) {
      toast({ title: t.invalidMobile, description: t.mobile10, variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        relationship: form.relationship,
        gender: form.gender,
        dob: form.dob,
        mobile: sanitizeMobile(form.mobile),
        email: form.email.trim(),
        education: form.education,
        occupation: form.occupation,
        address: form.address,
        status: "ACTIVE",
      };
      if (editing) {
        await base44.entities.FamilyMember.update(editing.id, payload);
        toast({ title: t.updated, description: `${payload.name} ${t.updatedDesc}` });
      } else {
        // The server keeps the family's member count.
        await base44.entities.FamilyMember.create({ ...payload, familyId: family.familyId });
        toast({ title: t.added, description: `${payload.name} ${t.addedDesc}` });
      }
      setForm(emptyForm);
      setEditing(null);
      setShowForm(false);
      load();
    } catch (err) {
      toast({ title: editing ? t.failUpdate : t.failAdd, description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const removeMember = async () => {
    const m = confirmRemove;
    if (!m) return;
    setSubmitting(true);
    try {
      await base44.entities.FamilyMember.delete(m.id);
      toast({ title: t.removed, description: `${m.name} ${t.removedDesc}` });
      setConfirmRemove(null);
      load();
    } catch (err) {
      toast({ title: t.failRemove, description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gold/30 border-t-maroon" /></div>;

  const locale = lang === "hi" ? "hi-IN" : "en-IN";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            {family?.familyName || t.family}
          </div>
          <h1 className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-maroon">{t.title}</h1>
          {family && <p className="mt-1 text-sm text-muted-foreground">{family.familyName} · {family.familyId}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={openAdd} className="inline-flex items-center justify-center gap-1.5 rounded-full bg-maroon px-5 py-2.5 text-sm font-semibold text-cream shadow-sm transition hover:bg-maroon-dark">
            <UserPlus className="h-4 w-4" /> {t.addMember}
          </button>
          <button onClick={() => setShowTransfer(true)} className="inline-flex items-center justify-center gap-1.5 rounded-full border border-gold/50 px-5 py-2.5 text-sm font-semibold text-maroon transition hover:bg-gold/10">
            <ArrowRightLeft className="h-4 w-4" /> {t.requestTransfer}
          </button>
        </div>
      </div>

      {/* Member grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => (
          <div key={m.id} className="premium-card group p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-start gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-maroon/10 ring-1 ring-gold/20">
                <Users className="h-6 w-6 text-maroon" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-foreground">{m.name}</div>
                <div className="text-xs text-muted-foreground">{relLabel(m.relationship)}{m.gender ? ` · ${genderLabel(m.gender)}` : ""}</div>
                {m.membershipId && <div className="mt-0.5 font-mono text-[0.65rem] font-medium text-maroon">{m.membershipId}</div>}
              </div>
              <StatusBadge status={m.status} />
            </div>
            <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
              {m.dob && <div className="flex items-center gap-1.5"><span className="font-medium text-foreground/70">{t.dob}:</span> {new Date(m.dob).toLocaleDateString(locale)}</div>}
              {m.mobile && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-gold" /> {m.mobile}</div>}
              {m.email && <div className="flex items-center gap-1.5 truncate"><Mail className="h-3 w-3 shrink-0 text-gold" /> <span className="truncate">{m.email}</span></div>}
              {m.education && <div className="flex items-center gap-1.5"><GraduationCap className="h-3 w-3 text-gold" /> {m.education}</div>}
              {m.occupation && <div className="flex items-center gap-1.5"><Briefcase className="h-3 w-3 text-gold" /> {m.occupation}</div>}
              {m.address && <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-gold" /> {m.address}</div>}
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => openEdit(m)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-gold/40 px-3 py-1.5 text-xs font-semibold text-maroon transition hover:bg-gold/10">
                <Pencil className="h-3 w-3" /> {t.edit}
              </button>
              <button onClick={() => setConfirmRemove(m)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive transition hover:bg-destructive/5">
                <Trash2 className="h-3 w-3" /> {t.remove}
              </button>
            </div>
          </div>
        ))}
        {members.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-maroon/5">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="mt-3 text-sm font-semibold text-foreground">{t.noMembers}</div>
            <p className="mt-1 text-xs text-muted-foreground">{t.noMembersSub}</p>
            <button onClick={openAdd} className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-maroon px-4 py-2 text-xs font-semibold text-cream hover:bg-maroon-dark">
              <UserPlus className="h-3.5 w-3.5" /> {t.addMember}
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-maroon/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setShowForm(false)}>
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-gold/40 bg-card shadow-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 flex items-center justify-between border-b border-gold/20 bg-card px-6 py-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-maroon">{editing ? t.editMember : t.addFamilyMember}</h2>
                <p className="text-xs text-muted-foreground">{editing ? t.editSub : t.addSub}</p>
              </div>
              <button onClick={() => setShowForm(false)} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-3 px-6 py-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.name} *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t.namePh} className="mt-1.5 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon focus:ring-1 focus:ring-maroon" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.relationship} *</label>
                <select value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon">
                  <option value="">{t.select}</option>
                  {relationships.map((r) => <option key={r} value={r}>{relLabel(r)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.gender}</label>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon">
                  <option value="">{t.select}</option>
                  {genders.map((g) => <option key={g} value={g}>{genderLabel(g)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.dob}</label>
                <input type="date" max={new Date().toISOString().split("T")[0]} value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon focus:ring-1 focus:ring-maroon" />
                <p className="mt-1 text-[0.65rem] text-muted-foreground">{t.dobNote}</p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.mobile}</label>
                <input type="tel" inputMode="numeric" maxLength={10} value={form.mobile} onChange={(e) => setForm({ ...form, mobile: sanitizeMobile(e.target.value) })} placeholder="9876543210" className="mt-1.5 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon focus:ring-1 focus:ring-maroon" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.email}</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" className="mt-1.5 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon focus:ring-1 focus:ring-maroon" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.education}</label>
                <input value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon focus:ring-1 focus:ring-maroon" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.occupation}</label>
                <input value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon focus:ring-1 focus:ring-maroon" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.address}</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon focus:ring-1 focus:ring-maroon" />
              </div>
            </div>
            <div className="sticky bottom-0 flex gap-2 border-t border-gold/20 bg-card px-6 py-4">
              <button onClick={() => setShowForm(false)} className="flex-1 rounded-full border border-gold/40 px-4 py-2.5 text-sm font-semibold text-maroon hover:bg-gold/10">{t.cancel}</button>
              <button onClick={submit} disabled={submitting} className="flex-1 rounded-full bg-maroon px-4 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark disabled:opacity-60">
                {submitting ? t.saving : editing ? t.updateMember : t.addMember}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove confirm */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-maroon/60 p-4 backdrop-blur-sm" onClick={() => setConfirmRemove(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-gold/40 bg-card p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold text-maroon">{t.removeTitle}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t.removeConfirm} <span className="font-semibold text-foreground">{confirmRemove.name}</span> {t.removeConfirm2}</p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setConfirmRemove(null)} className="flex-1 rounded-full border border-gold/40 px-4 py-2.5 text-sm font-semibold text-maroon hover:bg-gold/10">{t.cancel}</button>
              <button onClick={removeMember} disabled={submitting} className="flex-1 rounded-full bg-destructive px-4 py-2.5 text-sm font-semibold text-cream hover:bg-destructive/90 disabled:opacity-60">
                {submitting ? t.removing : t.remove}
              </button>
            </div>
          </div>
        </div>
      )}
      <RequestTransferModal
        open={showTransfer}
        onClose={() => setShowTransfer(false)}
        family={family}
        membershipId={members.find((m) => m.relationship === "Head")?.membershipId || members[0]?.membershipId}
        memberName={members.find((m) => m.relationship === "Head")?.name || members[0]?.name}
      />
    </div>
  );
}
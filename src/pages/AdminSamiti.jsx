import React, { useEffect, useState } from "react";
import { Search, Users, X, Plus, Pencil, Trash2, Loader2, Landmark, Phone, Mail } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useLang } from "@/lib/i18n";
import { sanitizeMobile } from "@/lib/utils";
import { useTableControls } from "@/lib/useTableControls";
import TablePagination from "@/components/admin/TablePagination";

const EMPTY = { name: "", description: "", formedDate: "", status: "Active" };
const EMPTY_MEM = { name: "", position: "", mobile: "", email: "", status: "Active" };

const L = {
  en: {
    title: "Samiti Management",
    sub: "Create committees and manage their core members.",
    add: "Add Samiti",
    searchPh: "Search samiti by name...",
    members: "Members",
    coreMembers: "core members",
    noSamitis: "No samitis yet",
    noSamitisSub: "Create your first committee to get started.",
    samiti: "Samiti",
    formed: "Formed",
    coreMembersLabel: "Core Members",
    addMember: "Add Member",
    noCoreMembers: "No core members added yet.",
    editSamiti: "Edit Samiti",
    addSamiti: "Add Samiti",
    samitiName: "Samiti Name",
    formedDate: "Formed Date",
    status: "Status",
    active: "Active",
    archived: "Archived",
    description: "Description",
    saving: "Saving...",
    updateSamiti: "Update Samiti",
    nameReq: "Samiti name is required",
    updated: "Samiti updated",
    added: "Samiti added",
    saveFailed: "Save failed",
    confirmDel: "Delete samiti",
    delSub: "This also removes its core members.",
    deleted: "Samiti deleted",
    delFailed: "Delete failed",
    editMember: "Edit Member",
    addCoreMember: "Add Core Member",
    memberName: "Name",
    position: "Position / Role",
    posPh: "e.g. President, Secretary",
    mobile: "Mobile",
    email: "Email",
    memberStatus: "Status",
    inactive: "Inactive",
    updateMember: "Update Member",
    nameReqMem: "Member name is required",
    memUpdated: "Member updated",
    memAdded: "Member added",
    memRemoved: "Member removed",
    confirmRemoveMem: "Remove",
    confirmRemoveMem2: "from this samiti?",
    removeFailed: "Remove failed",
  },
  hi: {
    title: "समिति प्रबंधन",
    sub: "समिति बनाएँ और उनके मुख्य सदस्य प्रबंधित करें।",
    add: "समिति जोड़ें",
    searchPh: "नाम से समिति खोजें...",
    members: "सदस्य",
    coreMembers: "मुख्य सदस्य",
    noSamitis: "अभी कोई समिति नहीं",
    noSamitisSub: "शुरू करने के लिए अपनी पहली समिति बनाएँ।",
    samiti: "समिति",
    formed: "गठन",
    coreMembersLabel: "मुख्य सदस्य",
    addMember: "सदस्य जोड़ें",
    noCoreMembers: "अभी कोई मुख्य सदस्य नहीं जोड़ा गया।",
    editSamiti: "समिति संपादित करें",
    addSamiti: "समिति जोड़ें",
    samitiName: "समिति का नाम",
    formedDate: "गठन तिथि",
    status: "स्थिति",
    active: "सक्रिय",
    archived: "संग्रहीत",
    description: "विवरण",
    saving: "सहेजा जा रहा है...",
    updateSamiti: "समिति अपडेट करें",
    nameReq: "समिति का नाम आवश्यक है",
    updated: "समिति अपडेट हुई",
    added: "समिति जोड़ी गई",
    saveFailed: "सहेजने में विफल",
    confirmDel: "समिति हटाएँ",
    delSub: "इससे इसके मुख्य सदस्य भी हट जाएँगे।",
    deleted: "समिति हटाई गई",
    delFailed: "हटाने में विफल",
    editMember: "सदस्य संपादित करें",
    addCoreMember: "मुख्य सदस्य जोड़ें",
    memberName: "नाम",
    position: "पद / भूमिका",
    posPh: "जैसे अध्यक्ष, सचिव",
    mobile: "मोबाइल",
    email: "ईमेल",
    memberStatus: "स्थिति",
    inactive: "निष्क्रिय",
    updateMember: "सदस्य अपडेट करें",
    nameReqMem: "सदस्य का नाम आवश्यक है",
    memUpdated: "सदस्य अपडेट हुआ",
    memAdded: "सदस्य जोड़ा गया",
    memRemoved: "सदस्य हटाया गया",
    confirmRemoveMem: "हटाएँ",
    confirmRemoveMem2: "इस समिति से?",
    removeFailed: "हटाने में विफल",
  },
};

export default function AdminSamiti() {
  const { lang } = useLang();
  const t = L[lang];
  const { toast } = useToast();
  const [samitis, setSamitis] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [memEditing, setMemEditing] = useState(null);
  const [memSaving, setMemSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [sams, mems] = await Promise.all([
        base44.entities.Samiti.listAll(),
        base44.entities.SamitiMember.listAll(),
      ]);
      setSamitis(sams);
      setAllMembers(mems);
    } catch (e) {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const countFor = (id) => allMembers.filter((m) => m.samitiId === id).length;
  const membersFor = (id) => allMembers.filter((m) => m.samitiId === id);

  const openNew = () => setEditing({ ...EMPTY });
  const openEdit = (s) => setEditing({ ...s });

  const save = async () => {
    if (!editing.name) { toast({ title: t.nameReq, variant: "destructive" }); return; }
    setSaving(true);
    try {
      const payload = {
        name: editing.name.trim(),
        description: editing.description || "",
        formedDate: editing.formedDate || "",
        status: editing.status || "Active",
      };
      if (editing.id) {
        await base44.entities.Samiti.update(editing.id, payload);
        toast({ title: t.updated });
      } else {
        await base44.entities.Samiti.create(payload);
        toast({ title: t.added });
      }
      setEditing(null);
      await load();
    } catch (e) {
      toast({ title: t.saveFailed, description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const remove = async (s) => {
    if (!window.confirm(`${t.confirmDel} "${s.name}"? ${t.delSub}`)) return;
    try {
      const mems = membersFor(s.id);
      if (mems.length > 0) await base44.entities.SamitiMember.deleteMany({ samitiId: s.id });
      await base44.entities.Samiti.delete(s.id);
      if (selected?.id === s.id) setSelected(null);
      await load();
      toast({ title: t.deleted });
    } catch (e) {
      toast({ title: t.delFailed, description: e.message, variant: "destructive" });
    }
  };

  const viewSamiti = (s) => setSelected(s);

  const openMemNew = () => setMemEditing({ ...EMPTY_MEM });
  const openMemEdit = (m) => setMemEditing({ ...m });

  const refreshMembers = async (id) => {
    const mems = await base44.entities.SamitiMember.filter({ samitiId: id });
    setAllMembers((prev) => {
      const rest = prev.filter((m) => m.samitiId !== id);
      return [...rest, ...mems];
    });
  };

  const saveMember = async () => {
    if (!memEditing.name) { toast({ title: t.nameReqMem, variant: "destructive" }); return; }
    if (!selected) return;
    setMemSaving(true);
    try {
      const payload = {
        samitiId: selected.id,
        name: memEditing.name.trim(),
        position: memEditing.position || "",
        mobile: memEditing.mobile || "",
        email: memEditing.email || "",
        status: memEditing.status || "Active",
      };
      if (memEditing.id) {
        await base44.entities.SamitiMember.update(memEditing.id, payload);
        toast({ title: t.memUpdated });
      } else {
        await base44.entities.SamitiMember.create(payload);
        toast({ title: t.memAdded });
      }
      setMemEditing(null);
      await refreshMembers(selected.id);
    } catch (e) {
      toast({ title: t.saveFailed, description: e.message, variant: "destructive" });
    } finally { setMemSaving(false); }
  };

  const removeMember = async (m) => {
    if (!window.confirm(`${t.confirmRemoveMem} ${m.name} ${t.confirmRemoveMem2}`)) return;
    try {
      await base44.entities.SamitiMember.delete(m.id);
      await refreshMembers(selected.id);
      toast({ title: t.memRemoved });
    } catch (e) {
      toast({ title: t.removeFailed, description: e.message, variant: "destructive" });
    }
  };

  const { search, setSearch, page, setPage, totalPages, totalItems, pageSize, pageItems: filtered } = useTableControls(samitis, {
    searchFields: ["name"],
    pageSize: 9,
  });

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gold/30 border-t-maroon" /></div>;

  const locale = lang === "hi" ? "hi-IN" : "en-IN";
  const selectedMembers = selected ? membersFor(selected.id) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-maroon">{t.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.sub}</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-1.5 rounded-full bg-maroon px-5 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark">
          <Plus className="h-4 w-4" /> {t.add}
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.searchPh}
          className="w-full rounded-full border border-gold/40 bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:border-maroon"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => (
          <div key={s.id} className="premium-card flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-maroon/10 ring-1 ring-gold/20">
                <Landmark className="h-5 w-5 text-maroon" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-base font-semibold text-maroon">{s.name}</div>
                <div className="text-xs text-muted-foreground">{s.formedDate ? new Date(s.formedDate).toLocaleDateString(locale) : "—"}</div>
              </div>
              <StatusBadge status={s.status} />
            </div>
            {s.description && <p className="mt-3 text-xs leading-relaxed text-muted-foreground line-clamp-2">{s.description}</p>}
            <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-maroon">
              <Users className="h-3.5 w-3.5 text-gold" /> {countFor(s.id)} {t.coreMembers}
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => viewSamiti(s)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-gold/40 px-3 py-1.5 text-xs font-semibold text-maroon hover:bg-gold/10">
                <Users className="h-3.5 w-3.5" /> {t.members}
              </button>
              <button onClick={() => openEdit(s)} className="rounded-full p-1.5 text-maroon hover:bg-maroon/10"><Pencil className="h-3.5 w-3.5" /></button>
              <button onClick={() => remove(s)} className="rounded-full p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-14 text-center">
            <Landmark className="h-8 w-8 text-muted-foreground" />
            <div className="mt-3 text-sm font-semibold text-foreground">{t.noSamitis}</div>
            <p className="mt-1 text-xs text-muted-foreground">{t.noSamitisSub}</p>
          </div>
        )}
      </div>
      <div className="rounded-2xl border border-gold/30 bg-card">
        <TablePagination page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
      </div>

      {/* Samiti members side panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setSelected(null)}>
          <div className="h-full w-full max-w-md overflow-y-auto bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gold/15 bg-card px-6 py-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.samiti}</div>
                <div className="font-display text-lg font-bold text-maroon">{selected.name}</div>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-full p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="px-6 py-5">
              {selected.description && <p className="text-sm text-muted-foreground">{selected.description}</p>}
              <div className="mt-2 text-xs text-muted-foreground">{t.formed}: {selected.formedDate ? new Date(selected.formedDate).toLocaleDateString(locale) : "—"}</div>

              <div className="mt-5 flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wide text-maroon">{t.coreMembersLabel} ({selectedMembers.length})</div>
                <button onClick={openMemNew} className="inline-flex items-center gap-1 rounded-full bg-maroon px-3 py-1.5 text-xs font-semibold text-cream hover:bg-maroon-dark">
                  <Plus className="h-3 w-3" /> {t.addMember}
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {selectedMembers.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-maroon/10"><Users className="h-4 w-4 text-maroon" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.position || t.members}</div>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[0.65rem] text-muted-foreground">
                        {m.mobile && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {m.mobile}</span>}
                        {m.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {m.email}</span>}
                      </div>
                    </div>
                    <StatusBadge status={m.status} />
                    <div className="flex flex-col gap-1">
                      <button onClick={() => openMemEdit(m)} className="rounded-full p-1 text-maroon hover:bg-maroon/10"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => removeMember(m)} className="rounded-full p-1 text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ))}
                {selectedMembers.length === 0 && <p className="text-xs text-muted-foreground">{t.noCoreMembers}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Samiti add/edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={() => setEditing(null)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-gold/40 bg-card p-6 shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-maroon">{editing.id ? t.editSamiti : t.addSamiti}</h2>
              <button onClick={() => setEditing(null)} className="rounded-full p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.samitiName} *</label><input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.formedDate}</label><input type="date" value={editing.formedDate || ""} onChange={(e) => setEditing({ ...editing, formedDate: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.status}</label>
                <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon">
                  <option>Active</option><option>Archived</option>
                </select>
              </div>
              <div className="sm:col-span-2"><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.description}</label><textarea rows={3} value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
            </div>
            <button onClick={save} disabled={saving} className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-maroon py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? t.saving : (editing.id ? t.updateSamiti : t.add)}
            </button>
          </div>
        </div>
      )}

      {/* Member add/edit modal */}
      {memEditing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={() => setMemEditing(null)}>
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-gold/40 bg-card p-6 shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-maroon">{memEditing.id ? t.editMember : t.addCoreMember}</h2>
              <button onClick={() => setMemEditing(null)} className="rounded-full p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.memberName} *</label><input value={memEditing.name} onChange={(e) => setMemEditing({ ...memEditing, name: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.position}</label><input value={memEditing.position} onChange={(e) => setMemEditing({ ...memEditing, position: e.target.value })} placeholder={t.posPh} className="mt-1.5 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.memberStatus}</label>
                <select value={memEditing.status} onChange={(e) => setMemEditing({ ...memEditing, status: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon">
                  <option>Active</option><option>Inactive</option>
                </select>
              </div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.mobile}</label><input value={memEditing.mobile} onChange={(e) => setMemEditing({ ...memEditing, mobile: sanitizeMobile(e.target.value) })} inputMode="numeric" maxLength={10} className="mt-1.5 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.email}</label><input value={memEditing.email} onChange={(e) => setMemEditing({ ...memEditing, email: e.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
            </div>
            <button onClick={saveMember} disabled={memSaving} className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-maroon py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark disabled:opacity-60">
              {memSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {memSaving ? t.saving : (memEditing.id ? t.updateMember : t.addMember)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
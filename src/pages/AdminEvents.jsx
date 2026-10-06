import React, { useEffect, useState } from "react";
import { Plus, CalendarDays, X, Pencil, Copy, Trash2, Loader2, ImagePlus } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useLang } from "@/lib/i18n";
import { useTableControls } from "@/lib/useTableControls";
import SearchBox from "@/components/admin/SearchBox";
import TablePagination from "@/components/admin/TablePagination";
import { localizedText } from "@/lib/utils";

const EMPTY_FORM = {
  title: "", titleHi: "", description: "", descriptionHi: "", date: "", startTime: "", endTime: "",
  venue: "", mapLocation: "", organizer: "", contact: "", fee: 0,
  capacity: "", registrationOpen: "", registrationClose: "", rules: "", terms: "", status: "PUBLISHED",
  bannerUrl: "",
};

const L = {
  en: {
    title: "Events",
    sub: "Create and manage Sangathan events.",
    create: "Create Event",
    edit: "Edit",
    duplicate: "Duplicate",
    empty: "No events yet.",
    searchPh: "Search events by title or venue...",
    editEvent: "Edit Event",
    createEvent: "Create Event",
    eventTitle: "Event Title (English)",
    eventTitleHi: "Event Title (Hindi)",
    description: "Description (English)",
    descriptionHi: "Description (Hindi)",
    date: "Date",
    status: "Status",
    published: "Published",
    draft: "Draft",
    archived: "Archived",
    startTime: "Start Time",
    endTime: "End Time",
    venue: "Venue",
    mapLocation: "Map Location",
    organizer: "Organizer",
    contact: "Contact",
    fee: "Fee (₹)",
    capacity: "Capacity",
    regOpen: "Reg. Open",
    regClose: "Reg. Close",
    rules: "Rules",
    saving: "Saving...",
    updateEvent: "Update Event",
    reqFields: "Title, date and venue are required",
    updated: "Event updated",
    created: "Event created",
    saveFailed: "Failed to save event",
    duplicated: "Event duplicated",
    dupFailed: "Duplicate failed",
    deleted: "Event deleted",
    delFailed: "Delete failed",
    confirmDel: "Delete event",
    photo: "Event Photo",
    uploadPhoto: "Upload Photo",
    changePhoto: "Change Photo",
    removePhoto: "Remove",
    uploading: "Uploading...",
    photoUploaded: "Photo uploaded",
    uploadFailed: "Upload failed",
  },
  hi: {
    title: "कार्यक्रम",
    sub: "संगठन कार्यक्रम बनाएँ और प्रबंधित करें।",
    create: "कार्यक्रम बनाएँ",
    edit: "संपादित करें",
    duplicate: "प्रतिलिपि",
    empty: "अभी कोई कार्यक्रम नहीं।",
    searchPh: "शीर्षक या स्थान से कार्यक्रम खोजें...",
    editEvent: "कार्यक्रम संपादित करें",
    createEvent: "कार्यक्रम बनाएँ",
    eventTitle: "कार्यक्रम शीर्षक (अंग्रेज़ी)",
    eventTitleHi: "कार्यक्रम शीर्षक (हिंदी)",
    description: "विवरण (अंग्रेज़ी)",
    descriptionHi: "विवरण (हिंदी)",
    date: "तिथि",
    status: "स्थिति",
    published: "प्रकाशित",
    draft: "ड्राफ़्ट",
    archived: "संग्रहीत",
    startTime: "आरंभ समय",
    endTime: "समाप्ति समय",
    venue: "स्थान",
    mapLocation: "मानचित्र स्थान",
    organizer: "आयोजक",
    contact: "संपर्क",
    fee: "शुल्क (₹)",
    capacity: "क्षमता",
    regOpen: "रजिस्ट्रेशन शुरू",
    regClose: "रजिस्ट्रेशन बंद",
    rules: "नियम",
    saving: "सहेजा जा रहा है...",
    updateEvent: "कार्यक्रम अपडेट करें",
    reqFields: "शीर्षक, तिथि और स्थान आवश्यक हैं",
    updated: "कार्यक्रम अपडेट हुआ",
    created: "कार्यक्रम बनाया गया",
    saveFailed: "कार्यक्रम सहेजने में विफल",
    duplicated: "कार्यक्रम की प्रतिलिपि बनाई गई",
    dupFailed: "प्रतिलिपि बनाने में विफल",
    deleted: "कार्यक्रम हटाया गया",
    delFailed: "हटाने में विफल",
    confirmDel: "कार्यक्रम हटाएँ",
    photo: "कार्यक्रम फ़ोटो",
    uploadPhoto: "फ़ोटो अपलोड करें",
    changePhoto: "फ़ोटो बदलें",
    removePhoto: "हटाएँ",
    uploading: "अपलोड हो रहा है...",
    photoUploaded: "फ़ोटो अपलोड हो गई",
    uploadFailed: "अपलोड विफल",
  },
};

export default function AdminEvents() {
  const { lang } = useLang();
  const t = L[lang];
  const { toast } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  const load = async () => {
    try { setEvents(await base44.entities.Event.list("-date", 100)); }
    catch (e) {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(null); };

  const openNew = () => { resetForm(); setShowForm(true); };
  const openEdit = (ev) => {
    setForm({
      title: ev.title || "", titleHi: ev.titleHi || "", description: ev.description || "", descriptionHi: ev.descriptionHi || "", date: ev.date || "", startTime: ev.startTime || "",
      endTime: ev.endTime || "", venue: ev.venue || "", mapLocation: ev.mapLocation || "", organizer: ev.organizer || "",
      contact: ev.contact || "", fee: ev.fee || 0, capacity: ev.capacity || "", registrationOpen: ev.registrationOpen || "",
      registrationClose: ev.registrationClose || "", rules: ev.rules || "", terms: ev.terms || "", status: ev.status || "PUBLISHED",
      bannerUrl: ev.bannerUrl || "",
    });
    setEditingId(ev.id);
    setShowForm(true);
  };

  const onPhoto = async (file) => {
    if (!file) return;
    setPhotoUploading(true);
    try {
      const { fileUrl } = await base44.integrations.Core.UploadPublicFile({ file });
      setForm((f) => ({ ...f, bannerUrl: fileUrl }));
      toast({ title: t.photoUploaded });
    } catch (err) {
      toast({ title: t.uploadFailed, description: err.message, variant: "destructive" });
    } finally {
      setPhotoUploading(false);
    }
  };

  const save = async () => {
    if (!form.title || !form.date || !form.venue) {
      toast({ title: t.reqFields, variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        slug: form.title.toLowerCase().replace(/\s+/g, "-"),
        fee: Number(form.fee) || 0,
        capacity: Number(form.capacity) || 0,
      };
      if (editingId) {
        await base44.entities.Event.update(editingId, payload);
        toast({ title: t.updated, description: form.title });
      } else {
        await base44.entities.Event.create(payload);
        toast({ title: t.created, description: form.title });
      }
      setShowForm(false);
      resetForm();
      await load();
    } catch (err) {
      toast({ title: t.saveFailed, description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const duplicate = async (ev) => {
    try {
      const { id, createdAt, updatedAt, created_by_id, ...rest } = ev;
      await base44.entities.Event.create({ ...rest, title: `${ev.title} (Copy)`, slug: `${ev.slug || ""}-copy` });
      toast({ title: t.duplicated });
      await load();
    } catch (err) {
      toast({ title: t.dupFailed, description: err.message, variant: "destructive" });
    }
  };

  const remove = async (ev) => {
    if (!window.confirm(`${t.confirmDel} "${ev.title}"?`)) return;
    try {
      await base44.entities.Event.delete(ev.id);
      toast({ title: t.deleted });
      await load();
    } catch (err) {
      toast({ title: t.delFailed, description: err.message, variant: "destructive" });
    }
  };

  const { search, setSearch, page, setPage, totalPages, totalItems, pageSize, pageItems } = useTableControls(events, {
    searchFields: ["title", "venue"],
    pageSize: 9,
  });

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gold/30 border-t-maroon" /></div>;

  const locale = lang === "hi" ? "hi-IN" : "en-IN";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-maroon">{t.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t.sub}</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-1.5 rounded-full bg-maroon px-5 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark">
          <Plus className="h-4 w-4" /> {t.create}
        </button>
      </div>

      <SearchBox value={search} onChange={setSearch} placeholder={t.searchPh} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pageItems.map((ev) => (
          <div key={ev.id} className="overflow-hidden rounded-2xl border border-gold/30 bg-card shadow-sm">
            <div className="h-28 bg-gradient-to-br from-maroon to-maroon-dark">
              {ev.bannerUrl && <img src={ev.bannerUrl} alt={ev.title} loading="lazy" decoding="async" className="h-full w-full object-cover" />}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {ev.date ? new Date(ev.date).toLocaleDateString(locale) : "—"}
                </div>
                <StatusBadge status={ev.status} />
              </div>
              <h3 className="mt-1 font-display text-base font-semibold text-maroon">{localizedText(ev, "title", lang)}</h3>
              <p className="text-xs text-muted-foreground">{ev.venue}</p>
              {ev.fee > 0 && <div className="mt-1 text-xs font-semibold text-maroon">₹{ev.fee}</div>}
              <div className="mt-3 flex items-center gap-2">
                <button onClick={() => openEdit(ev)} className="inline-flex items-center gap-1 rounded-full border border-gold/40 px-3 py-1.5 text-xs font-semibold text-maroon hover:bg-gold/10"><Pencil className="h-3 w-3" /> {t.edit}</button>
                <button onClick={() => duplicate(ev)} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"><Copy className="h-3 w-3" /> {t.duplicate}</button>
                <button onClick={() => remove(ev)} className="ml-auto rounded-full p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
        {totalItems === 0 && <div className="col-span-full rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{t.empty}</div>}
      </div>
      <div className="rounded-2xl border border-gold/30 bg-card">
        <TablePagination page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={() => { setShowForm(false); resetForm(); }}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-gold/40 bg-card p-6 shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-maroon">{editingId ? t.editEvent : t.createEvent}</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="rounded-full p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.eventTitle} *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.eventTitleHi}</label>
                <input value={form.titleHi} onChange={(e) => setForm({ ...form, titleHi: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.photo}</label>
                <div className="mt-1 flex items-center gap-3">
                  <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                    {form.bannerUrl ? (
                      <img src={form.bannerUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImagePlus className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-gold/40 px-3 py-1.5 text-xs font-semibold text-maroon hover:bg-gold/10">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} disabled={photoUploading} />
                    {photoUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                    {photoUploading ? t.uploading : (form.bannerUrl ? t.changePhoto : t.uploadPhoto)}
                  </label>
                  {form.bannerUrl && !photoUploading && (
                    <button type="button" onClick={() => setForm((f) => ({ ...f, bannerUrl: "" }))} className="text-xs font-semibold text-destructive hover:underline">
                      {t.removePhoto}
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.description}</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.descriptionHi}</label>
                <textarea value={form.descriptionHi} onChange={(e) => setForm({ ...form, descriptionHi: e.target.value })} rows={2} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" />
              </div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.date} *</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.status}</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon">
                  <option value="PUBLISHED">{t.published}</option>
                  <option value="DRAFT">{t.draft}</option>
                  <option value="ARCHIVED">{t.archived}</option>
                </select>
              </div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.startTime}</label><input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.endTime}</label><input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.venue} *</label><input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.mapLocation}</label><input value={form.mapLocation} onChange={(e) => setForm({ ...form, mapLocation: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.organizer}</label><input value={form.organizer} onChange={(e) => setForm({ ...form, organizer: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.contact}</label><input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.fee}</label><input type="number" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.capacity}</label><input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.regOpen}</label><input type="date" value={form.registrationOpen} onChange={(e) => setForm({ ...form, registrationOpen: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.regClose}</label><input type="date" value={form.registrationClose} onChange={(e) => setForm({ ...form, registrationClose: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
              <div className="sm:col-span-2"><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.rules}</label><textarea value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} rows={2} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" /></div>
            </div>
            <button onClick={save} disabled={saving} className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-maroon py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? t.saving : (editingId ? t.updateEvent : t.create)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
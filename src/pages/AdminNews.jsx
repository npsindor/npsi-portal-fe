import React, { useEffect, useMemo, useState } from "react";
import { Bell, Eye, EyeOff, ImagePlus, Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useLang } from "@/lib/i18n";
import { useTableControls } from "@/lib/useTableControls";
import SearchBox from "@/components/admin/SearchBox";
import TablePagination from "@/components/admin/TablePagination";
import { localizedText } from "@/lib/utils";
import { categoryLabel, SANDESH_CATEGORIES } from "@/lib/sandesh";

const emptyNews = () => ({ title: "", titleHi: "", body: "", bodyHi: "", date: new Date().toISOString(), type: "Notice", status: "Draft", category: "", imageUrl: "", publishAt: "" });
// Each type places the item in a section of the public Sandesh page.
const types = [
  ["Notice", "Important Notice", "महत्वपूर्ण सूचना"],
  ["Urgent", "Important Notice — Urgent", "महत्वपूर्ण सूचना — अत्यावश्यक"],
  ["News", "Community News", "सामुदायिक समाचार"],
  ["Festival", "Festival Greeting", "त्योहार शुभकामना"],
  ["General", "General (shown under Important Notices)", "सामान्य (महत्वपूर्ण सूचनाओं में)"],
  ["Event", "Event news (shown under Community News)", "कार्यक्रम समाचार (सामुदायिक समाचार में)"],
];
const typeLabel = (type, lang) => { const found = types.find(([value]) => value === type); return found ? found[lang === "hi" ? 2 : 1] : type || ""; };
// <input type="datetime-local"> works in local time; the API stores ISO (UTC).
const toLocalInput = (iso) => { if (!iso) return ""; const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
const fromLocalInput = (value) => (value ? new Date(value).toISOString() : null);
const scheduled = (item) => item.status === "Active" && item.publishAt && new Date(item.publishAt) > new Date();
const field = "mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2.5 text-sm font-normal outline-none focus:border-maroon";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-muted-foreground";

const words = {
  en: { title: "Sandesh / News Management", sub: "Write, preview, schedule, publish or unpublish news and official announcements. Only published items appear on the public Sandesh page.", add: "Add News", edit: "Edit News", empty: "No news yet.", titleLabel: "Title (English)", titleHiLabel: "Title (Hindi)", bodyLabel: "Description (English)", bodyHiLabel: "Description (Hindi)", typeLabel: "Section on the Sandesh page", categoryLabel: "Category", noCategory: "— None —", statusLabel: "Status", publishAtLabel: "Publish at (optional, for scheduling)", dateLabel: "News date", image: "Featured image (optional)", upload: "Upload image", replace: "Replace", removeImage: "Remove", uploading: "Uploading…", save: "Save", cancel: "Cancel", preview: "Preview", backToEdit: "Back to edit", required: "Title and description are required", saved: "News saved", deleted: "News deleted", failed: "Action failed", confirm: "Delete this news item permanently?", searchPh: "Search news by title...", publish: "Publish", unpublish: "Unpublish", published: "Published", draft: "Draft", archived: "Unpublished", scheduledFor: "Scheduled for", all: "All", by: "by" },
  hi: { title: "संदेश / समाचार प्रबंधन", sub: "समाचार और आधिकारिक घोषणाएँ लिखें, पूर्वावलोकन करें, शेड्यूल करें, प्रकाशित या अप्रकाशित करें। केवल प्रकाशित समाचार सार्वजनिक संदेश पेज पर दिखते हैं।", add: "समाचार जोड़ें", edit: "समाचार संपादित करें", empty: "अभी कोई समाचार नहीं।", titleLabel: "शीर्षक (अंग्रेज़ी)", titleHiLabel: "शीर्षक (हिंदी)", bodyLabel: "विवरण (अंग्रेज़ी)", bodyHiLabel: "विवरण (हिंदी)", typeLabel: "संदेश पेज का भाग", categoryLabel: "श्रेणी", noCategory: "— कोई नहीं —", statusLabel: "स्थिति", publishAtLabel: "प्रकाशन समय (वैकल्पिक, शेड्यूल हेतु)", dateLabel: "समाचार तिथि", image: "मुख्य चित्र (वैकल्पिक)", upload: "चित्र अपलोड करें", replace: "बदलें", removeImage: "हटाएँ", uploading: "अपलोड हो रहा है…", save: "सहेजें", cancel: "रद्द करें", preview: "पूर्वावलोकन", backToEdit: "संपादन पर लौटें", required: "शीर्षक और विवरण आवश्यक हैं", saved: "समाचार सहेजा गया", deleted: "समाचार हटाया गया", failed: "कार्रवाई विफल", confirm: "यह समाचार स्थायी रूप से हटाएँ?", searchPh: "शीर्षक से समाचार खोजें...", publish: "प्रकाशित करें", unpublish: "अप्रकाशित करें", published: "प्रकाशित", draft: "ड्राफ्ट", archived: "अप्रकाशित", scheduledFor: "निर्धारित समय", all: "सभी", by: "द्वारा" },
};

export default function AdminNews() {
  const { lang, t } = useLang();
  const { toast } = useToast();
  const copy = words[lang] || words.en;
  const [news, setNews] = useState([]);
  const [editing, setEditing] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const visible = useMemo(() => news.filter((item) => (!statusFilter || item.status === statusFilter) && (!categoryFilter || item.category === categoryFilter)), [news, statusFilter, categoryFilter]);
  const { search, setSearch, page, setPage, totalPages, totalItems, pageSize, pageItems } = useTableControls(visible, { searchFields: ["title", "titleHi", "body"] });
  const statusText = (item) => (scheduled(item) ? `${copy.scheduledFor} ${new Date(item.publishAt).toLocaleString(lang === "hi" ? "hi-IN" : "en-IN")}` : item.status === "Active" ? copy.published : item.status === "Draft" ? copy.draft : copy.archived);
  const fail = (error) => toast({ title: copy.failed, description: error.message, variant: "destructive" });

  const load = async () => { setLoading(true); try { setNews(await base44.entities.Announcement.listAll("-date")); } catch (error) { fail(error); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const open = (item) => { setPreviewing(false); setEditing(item ? { ...emptyNews(), ...item, category: item.category || "", imageUrl: item.imageUrl || "", publishAt: toLocalInput(item.publishAt) } : emptyNews()); };
  const save = async (status = editing.status) => {
    if (!editing.title.trim() || !editing.body.trim()) return toast({ title: copy.required, variant: "destructive" });
    setSaving(true);
    try {
      const payload = { title: editing.title, titleHi: editing.titleHi || null, body: editing.body, bodyHi: editing.bodyHi || null, date: editing.date || new Date().toISOString(), type: editing.type || "Notice", status, category: editing.category || null, imageUrl: editing.imageUrl || null, publishAt: fromLocalInput(editing.publishAt) };
      if (editing.id) await base44.entities.Announcement.update(editing.id, payload); else await base44.entities.Announcement.create(payload);
      setEditing(null); await load(); toast({ title: copy.saved });
    } catch (error) { fail(error); } finally { setSaving(false); }
  };
  const togglePublish = async (item) => { try { await base44.entities.Announcement.update(item.id, { status: item.status === "Active" ? "Archived" : "Active" }); await load(); } catch (error) { fail(error); } };
  const remove = async (item) => { if (!window.confirm(copy.confirm)) return; try { await base44.entities.Announcement.delete(item.id); await load(); toast({ title: copy.deleted }); } catch (error) { fail(error); } };
  const upload = async (file) => {
    if (!file) return;
    if (!/^image\/(jpe?g|png|webp)$/i.test(file.type) || file.size > 5 * 1024 * 1024) return toast({ title: copy.failed, description: lang === "hi" ? "जेपीजी/पीएनजी/वेबपी, अधिकतम 5 एमबी।" : "JPG/PNG/WebP up to 5 MB.", variant: "destructive" });
    setUploading(true);
    try { const { fileUrl } = await base44.integrations.Core.UploadPublicFile({ file }); setEditing((current) => ({ ...current, imageUrl: fileUrl })); } catch (error) { fail(error); } finally { setUploading(false); }
  };

  return <div><div className="flex items-center justify-between gap-4"><div><span className="gold-badge"><Bell className="h-3.5 w-3.5" />{t("news.badge")}</span><h1 className="mt-2 font-display text-2xl font-semibold text-maroon">{copy.title}</h1><p className="mt-1 text-sm text-muted-foreground">{copy.sub}</p></div><button onClick={() => open(null)} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-maroon px-4 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark"><Plus className="h-4 w-4" />{copy.add}</button></div>
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {[["", copy.all], ["Active", copy.published], ["Draft", copy.draft], ["Archived", copy.archived]].map(([value, text]) => <button key={value || "all"} type="button" aria-pressed={statusFilter === value} onClick={() => setStatusFilter(value)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusFilter === value ? "border-maroon bg-maroon text-cream" : "border-border hover:bg-muted"}`}>{text}</button>)}
        <select aria-label={copy.categoryLabel} value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="h-8 rounded-full border border-border bg-card px-3 text-xs"><option value="">{copy.categoryLabel}: {copy.all}</option>{Object.keys(SANDESH_CATEGORIES).map((key) => <option key={key} value={key}>{categoryLabel(key, lang)}</option>)}</select>
        <div className="min-w-[14rem] flex-1"><SearchBox value={search} onChange={setSearch} placeholder={copy.searchPh} /></div>
      </div>
      {loading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div> : totalItems === 0 ? <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{copy.empty}</div> : pageItems.map((item) => <div key={item.id} className="rounded-2xl border border-gold/30 bg-card p-4"><div className="flex items-start gap-3">
        {item.imageUrl && <img src={item.imageUrl} alt="" className="hidden h-16 w-24 shrink-0 rounded-lg object-cover sm:block" />}
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-maroon">{localizedText(item, "title", lang)}</h2><span className="gold-badge text-[0.6rem]">{typeLabel(item.type, lang)}</span>{item.category && <span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem]">{categoryLabel(item.category, lang)}</span>}</div><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{localizedText(item, "body", lang)}</p><div className="mt-2 text-xs text-muted-foreground"><span className={item.status === "Active" && !scheduled(item) ? "font-semibold text-emerald-700" : ""}>{statusText(item)}</span> · {item.date ? new Date(item.date).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN") : ""}{item.author ? ` · ${copy.by} ${item.author}` : ""}</div></div>
        <div className="flex shrink-0 gap-1"><button onClick={() => togglePublish(item)} className="rounded-full p-2 text-maroon hover:bg-maroon/10" aria-label={item.status === "Active" ? copy.unpublish : copy.publish} title={item.status === "Active" ? copy.unpublish : copy.publish}>{item.status === "Active" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button><button onClick={() => open(item)} className="rounded-full p-2 text-maroon hover:bg-maroon/10" aria-label={copy.edit}><Pencil className="h-4 w-4" /></button><button onClick={() => remove(item)} className="rounded-full p-2 text-destructive hover:bg-destructive/10" aria-label={copy.deleted}><Trash2 className="h-4 w-4" /></button></div>
      </div></div>)}
      {!loading && totalItems > 0 && <div className="rounded-2xl border border-gold/30 bg-card"><TablePagination page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} /></div>}
    </div>
    {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div role="dialog" aria-modal="true" aria-label={editing.id ? copy.edit : copy.add} className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gold/40 bg-card p-6 shadow-xl"><div className="flex items-center justify-between"><h2 className="font-display text-lg font-semibold text-maroon">{previewing ? copy.preview : editing.id ? copy.edit : copy.add}</h2><button onClick={() => setEditing(null)} aria-label={copy.cancel}><X className="h-4 w-4" /></button></div>
      {previewing ? <article className="mt-4 space-y-3">
        {editing.imageUrl && <img src={editing.imageUrl} alt="" className="w-full rounded-xl object-cover" />}
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-dark">{typeLabel(editing.type, lang)}{editing.category ? ` · ${categoryLabel(editing.category, lang)}` : ""}</p>
        <h3 className="font-display text-2xl font-semibold text-maroon">{lang === "hi" ? editing.titleHi || editing.title : editing.title}</h3>
        <p className="whitespace-pre-line text-sm leading-relaxed">{lang === "hi" ? editing.bodyHi || editing.body : editing.body}</p>
      </article> : <div className="mt-4 space-y-3">
        <label className={labelClass}>{copy.titleLabel} *<input value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} className={field} /></label>
        <label className={labelClass}>{copy.titleHiLabel}<input value={editing.titleHi || ""} onChange={(event) => setEditing({ ...editing, titleHi: event.target.value })} className={field} /></label>
        <label className={labelClass}>{copy.bodyLabel} *<textarea rows={4} value={editing.body} onChange={(event) => setEditing({ ...editing, body: event.target.value })} className={field} /></label>
        <label className={labelClass}>{copy.bodyHiLabel}<textarea rows={4} value={editing.bodyHi || ""} onChange={(event) => setEditing({ ...editing, bodyHi: event.target.value })} className={field} /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>{copy.typeLabel}<select value={editing.type} onChange={(event) => setEditing({ ...editing, type: event.target.value })} className={field}>{types.map(([value, en, hi]) => <option key={value} value={value}>{lang === "hi" ? hi : en}</option>)}</select></label>
          <label className={labelClass}>{copy.categoryLabel}<select value={editing.category} onChange={(event) => setEditing({ ...editing, category: event.target.value })} className={field}><option value="">{copy.noCategory}</option>{Object.keys(SANDESH_CATEGORIES).map((key) => <option key={key} value={key}>{categoryLabel(key, lang)}</option>)}</select></label>
          <label className={labelClass}>{copy.statusLabel}<select value={editing.status} onChange={(event) => setEditing({ ...editing, status: event.target.value })} className={field}><option value="Draft">{copy.draft}</option><option value="Active">{copy.published}</option><option value="Archived">{copy.archived}</option></select></label>
          <label className={labelClass}>{copy.publishAtLabel}<input type="datetime-local" value={editing.publishAt} onChange={(event) => setEditing({ ...editing, publishAt: event.target.value })} className={field} /></label>
          <label className={labelClass}>{copy.dateLabel}<input type="date" value={(editing.date || "").slice(0, 10)} onChange={(event) => setEditing({ ...editing, date: event.target.value ? new Date(`${event.target.value}T00:00:00Z`).toISOString() : null })} className={field} /></label>
        </div>
        <div><span className={labelClass}>{copy.image}</span><div className="mt-2 flex flex-wrap items-center gap-3">{editing.imageUrl ? <img src={editing.imageUrl} alt="" className="h-20 w-32 rounded-lg border border-border object-cover" /> : <div className="flex h-20 w-32 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground"><ImagePlus className="h-6 w-6" /></div>}<label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">{uploading ? <><Loader2 className="h-4 w-4 animate-spin" />{copy.uploading}</> : editing.imageUrl ? copy.replace : copy.upload}<input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; upload(file); }} /></label>{editing.imageUrl && <button type="button" onClick={() => setEditing({ ...editing, imageUrl: "" })} className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">{copy.removeImage}</button>}</div></div>
      </div>}
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button onClick={() => setPreviewing(!previewing)} className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold"><Eye className="h-4 w-4" />{previewing ? copy.backToEdit : copy.preview}</button>
        <button onClick={() => setEditing(null)} className="rounded-full border border-border px-4 py-2 text-sm font-semibold">{copy.cancel}</button>
        <button onClick={() => save()} disabled={saving || uploading} className="inline-flex items-center gap-1.5 rounded-full border border-maroon px-4 py-2 text-sm font-semibold text-maroon disabled:opacity-50"><Save className="h-4 w-4" />{copy.save}</button>
        {editing.status !== "Active" && <button onClick={() => save("Active")} disabled={saving || uploading} className="inline-flex items-center gap-1.5 rounded-full bg-maroon px-5 py-2 text-sm font-semibold text-cream disabled:opacity-50">{saving ? "..." : copy.publish}</button>}
      </div>
    </div></div>}
  </div>;
}

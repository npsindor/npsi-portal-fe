import React, { useEffect, useState } from "react";
import { Droplet, HandHeart, ImageIcon, LifeBuoy, Loader2, Pencil, Phone, Plus, Star, Trash2, Upload, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

const SECTIONS = [
  ["BLOOD_DONATION", Droplet],
  ["EMERGENCY_HELP", LifeBuoy],
  ["SOCIAL_WELFARE", HandHeart],
];
const words = {
  en: {
    title: "Community Services", sub: "Posts shown on the public Community Services page, in three sections.", add: "Add post", edit: "Edit post", save: "Save", cancel: "Cancel", saved: "Saved.", remove: "Delete", confirm: "Delete this post?",
    BLOOD_DONATION: "Blood Donation", EMERGENCY_HELP: "Emergency Help", SOCIAL_WELFARE: "Social Welfare", section: "Section",
    hints: { BLOOD_DONATION: "Camps, donor drives and urgent blood requirements.", EMERGENCY_HELP: "Community helplines and contacts (national numbers 112/108/100/101 are always shown).", SOCIAL_WELFARE: "Education, health and support initiatives." },
    empty: "No posts in this section yet.", titleEn: "Title (English) *", titleHi: "Title (Hindi)", body: "Details (English)", bodyHi: "Details (Hindi)",
    image: "Photo (optional)", upload: "Upload photo", uploading: "Uploading…", orUrl: "or paste an image URL", removeImage: "Remove photo",
    date: "Date (camp / programme)", location: "Location (English)", locationHi: "Location (Hindi)", contactName: "Contact person", contactPhone: "Phone / helpline",
    cta: "Button text (English)", ctaHi: "Button text (Hindi)", link: "Button link", linkHint: "A page on this site (/register) or a full https:// address.",
    featured: "Featured (shown first, larger)", order: "Order", active: "Active", activate: "Activate", deactivate: "Deactivate", inactive: "Inactive",
  },
  hi: {
    title: "सामुदायिक सेवाएँ", sub: "सार्वजनिक सामुदायिक सेवाएँ पेज के तीन भागों में दिखने वाली पोस्ट।", add: "पोस्ट जोड़ें", edit: "पोस्ट बदलें", save: "सहेजें", cancel: "रद्द करें", saved: "सहेजा गया।", remove: "हटाएँ", confirm: "यह पोस्ट हटाएँ?",
    BLOOD_DONATION: "रक्तदान", EMERGENCY_HELP: "आपातकालीन सहायता", SOCIAL_WELFARE: "समाज कल्याण", section: "भाग",
    hints: { BLOOD_DONATION: "शिविर, दाता अभियान और तत्काल रक्त आवश्यकताएँ।", EMERGENCY_HELP: "सामुदायिक हेल्पलाइन और संपर्क (राष्ट्रीय नंबर 112/108/100/101 हमेशा दिखते हैं)।", SOCIAL_WELFARE: "शिक्षा, स्वास्थ्य और सहायता की पहलें।" },
    empty: "इस भाग में अभी कोई पोस्ट नहीं।", titleEn: "शीर्षक (अंग्रेज़ी) *", titleHi: "शीर्षक (हिंदी)", body: "विवरण (अंग्रेज़ी)", bodyHi: "विवरण (हिंदी)",
    image: "फोटो (वैकल्पिक)", upload: "फोटो अपलोड करें", uploading: "अपलोड हो रहा है…", orUrl: "या इमेज का URL डालें", removeImage: "फोटो हटाएँ",
    date: "तारीख (शिविर / कार्यक्रम)", location: "स्थान (अंग्रेज़ी)", locationHi: "स्थान (हिंदी)", contactName: "संपर्क व्यक्ति", contactPhone: "फ़ोन / हेल्पलाइन",
    cta: "बटन टेक्स्ट (अंग्रेज़ी)", ctaHi: "बटन टेक्स्ट (हिंदी)", link: "बटन लिंक", linkHint: "इस साइट का पेज (/register) या पूरा https:// पता।",
    featured: "मुख्य (सबसे पहले, बड़ा दिखेगा)", order: "क्रम", active: "सक्रिय", activate: "सक्रिय करें", deactivate: "निष्क्रिय करें", inactive: "निष्क्रिय",
  },
};
const EMPTY = { title: "", titleHi: "", body: "", bodyHi: "", imageUrl: "", eventDate: "", location: "", locationHi: "", contactName: "", contactPhone: "", linkUrl: "", ctaLabel: "", ctaLabelHi: "", featured: false, sortOrder: 0, active: true };
const input = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary";

function Field({ label, hint, wide, children }) {
  return (
    <div className={`space-y-1.5 ${wide ? "md:col-span-2" : ""}`}>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">{label}</span>
        {children}
      </label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function AdminCommunityServices() {
  const { lang } = useLang();
  const t = words[lang] || words.en;
  const [rows, setRows] = useState([]);
  const [section, setSection] = useState("BLOOD_DONATION");
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    try { setRows(await base44.communityPosts.list()); } catch (e) { setError(e.message); }
  };
  useEffect(() => { load(); }, []);

  const visible = rows.filter((row) => row.section === section);
  const set = (key) => (event) => setEditing((current) => ({ ...current, [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));
  const save = async (event) => {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    const { id, createdAt: _c, updatedAt: _u, ...fields } = editing;
    const body = { ...fields, sortOrder: Number(fields.sortOrder) || 0, eventDate: fields.eventDate || null };
    try {
      if (id) await base44.communityPosts.update(id, body);
      else await base44.communityPosts.create({ ...body, section });
      if (body.section && body.section !== section) setSection(body.section);
      setEditing(null); setNotice(t.saved); await load();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const patch = async (row, change) => {
    setError(""); setNotice("");
    try { await base44.communityPosts.update(row.id, change); await load(); } catch (e) { setError(e.message); }
  };
  const remove = async (row) => {
    if (!window.confirm(`${t.confirm}\n${row.title}`)) return;
    try { await base44.communityPosts.remove(row.id); await load(); } catch (e) { setError(e.message); }
  };
  const upload = async (file) => {
    if (!file) return;
    setUploading(true); setError("");
    try { const { fileUrl } = await base44.integrations.Core.UploadPublicFile({ file }); setEditing((current) => ({ ...current, imageUrl: fileUrl })); }
    catch (e) { setError(e.message); } finally { setUploading(false); }
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t.sub}</p>
        </div>
        {!editing && <Button onClick={() => { setNotice(""); setEditing({ ...EMPTY, sortOrder: visible.length + 1 }); }}><Plus className="mr-1 h-4 w-4" />{t.add}</Button>}
      </header>

      <div role="tablist" className="flex flex-wrap gap-1 rounded-xl border bg-card p-1 sm:inline-flex">
        {SECTIONS.map(([key, Icon]) => (
          <button key={key} type="button" role="tab" aria-selected={section === key} onClick={() => { setSection(key); setEditing(null); }} className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium transition ${section === key ? "bg-maroon text-cream" : "text-muted-foreground hover:text-foreground"}`}>
            <Icon className="h-4 w-4" />{t[key]} <span className="opacity-70">({rows.filter((row) => row.section === key).length})</span>
          </button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{t.hints[section]}</p>

      {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">{notice}</p>}

      {editing && (
        <form onSubmit={save} aria-label={editing.id ? t.edit : t.add} className="space-y-5 rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{editing.id ? t.edit : t.add} · {t[editing.section || section]}</h2>
            <button type="button" aria-label={t.cancel} onClick={() => setEditing(null)} className="rounded-full p-2 hover:bg-muted"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {editing.id && (
              <Field label={t.section}>
                <select className={input} value={editing.section} onChange={set("section")}>{SECTIONS.map(([key]) => <option key={key} value={key}>{t[key]}</option>)}</select>
              </Field>
            )}
            <Field label={t.titleEn}><input required maxLength={200} className={input} value={editing.title} onChange={set("title")} /></Field>
            <Field label={t.titleHi}><input maxLength={200} className={input} value={editing.titleHi || ""} onChange={set("titleHi")} /></Field>
            <Field label={t.body}><textarea rows={4} maxLength={1500} className={`${input} h-auto py-2`} value={editing.body || ""} onChange={set("body")} /></Field>
            <Field label={t.bodyHi}><textarea rows={4} maxLength={1500} className={`${input} h-auto py-2`} value={editing.bodyHi || ""} onChange={set("bodyHi")} /></Field>
            <Field label={t.image} wide>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                {editing.imageUrl && <img src={editing.imageUrl} alt="" className="aspect-video w-full rounded-lg border object-cover sm:w-56" />}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <input id="community-upload" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { upload(event.target.files?.[0]); event.target.value = ""; }} />
                    <label htmlFor="community-upload" className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium hover:bg-muted">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} {uploading ? t.uploading : t.upload}
                    </label>
                    {editing.imageUrl && <button type="button" onClick={() => setEditing((current) => ({ ...current, imageUrl: "" }))} className="min-h-10 rounded-lg px-3 text-sm text-destructive hover:bg-destructive/10">{t.removeImage}</button>}
                  </div>
                  <input className={input} placeholder={t.orUrl} value={editing.imageUrl || ""} onChange={set("imageUrl")} />
                </div>
              </div>
            </Field>
            <Field label={t.date}><input type="date" className={input} value={editing.eventDate || ""} onChange={set("eventDate")} /></Field>
            <Field label={t.contactPhone}><input type="tel" maxLength={20} className={input} placeholder="+91 98765 43210" value={editing.contactPhone || ""} onChange={set("contactPhone")} /></Field>
            <Field label={t.location}><input maxLength={200} className={input} value={editing.location || ""} onChange={set("location")} /></Field>
            <Field label={t.locationHi}><input maxLength={200} className={input} value={editing.locationHi || ""} onChange={set("locationHi")} /></Field>
            <Field label={t.contactName}><input maxLength={120} className={input} value={editing.contactName || ""} onChange={set("contactName")} /></Field>
            <Field label={t.link} hint={t.linkHint}><input maxLength={500} className={input} placeholder="/register" value={editing.linkUrl || ""} onChange={set("linkUrl")} /></Field>
            <Field label={t.cta}><input maxLength={80} className={input} value={editing.ctaLabel || ""} onChange={set("ctaLabel")} /></Field>
            <Field label={t.ctaHi}><input maxLength={80} className={input} value={editing.ctaLabelHi || ""} onChange={set("ctaLabelHi")} /></Field>
            <Field label={t.order}><input type="number" min={0} className={input} value={editing.sortOrder} onChange={set("sortOrder")} /></Field>
            <div className="flex flex-col justify-end gap-2 pb-1 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={editing.featured} onChange={set("featured")} className="h-4 w-4" /> {t.featured}</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={editing.active} onChange={set("active")} className="h-4 w-4" /> {t.active}</label>
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>{t.cancel}</Button>
            <Button type="submit" disabled={busy || uploading}>{busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}{t.save}</Button>
          </div>
        </form>
      )}

      {!visible.length ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">{t.empty}</p>
      ) : (
        <ul className="grid gap-3">
          {visible.map((row) => (
            <li key={row.id} className={`flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center ${row.active ? "" : "opacity-60"}`}>
              <div className="flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted sm:w-32">
                {row.imageUrl ? <img src={row.imageUrl} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-6 w-6 text-muted-foreground" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="rounded-full bg-muted px-2 py-0.5 font-medium">#{row.sortOrder}</span>
                  {row.featured && <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2 py-0.5 font-semibold text-amber-800 dark:text-gold"><Star className="h-3 w-3" />{t.featured.split(" (")[0]}</span>}
                  {!row.active && <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-destructive">{t.inactive}</span>}
                  {row.eventDate && <span className="text-muted-foreground">{row.eventDate}</span>}
                  {row.contactPhone && <span className="inline-flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" />{row.contactPhone}</span>}
                </div>
                <p className="mt-1 truncate font-semibold">{lang === "hi" && row.titleHi ? row.titleHi : row.title}</p>
                {row.body && <p className="line-clamp-1 text-sm text-muted-foreground">{lang === "hi" && row.bodyHi ? row.bodyHi : row.body}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => { setNotice(""); setEditing({ ...EMPTY, ...Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value ?? ""])) }); window.scrollTo({ top: 0, behavior: "smooth" }); }}><Pencil className="mr-1 h-3.5 w-3.5" />{t.edit}</Button>
                <Button size="sm" variant="outline" onClick={() => patch(row, { active: !row.active })}>{row.active ? t.deactivate : t.activate}</Button>
                <Button size="sm" variant="outline" className="text-destructive" aria-label={`${t.remove}: ${row.title}`} onClick={() => remove(row)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

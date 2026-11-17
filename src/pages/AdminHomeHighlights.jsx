import React, { useEffect, useState } from "react";
import { Image as ImageIcon, Loader2, Megaphone, Pencil, Plus, Trash2, Type, Upload, Video, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import ADVERTISING_IMAGES from "virtual:advertising";

const words = {
  en: {
    title: "Community highlights", sub: "Manage the homepage “Community highlights” section: the text slider on the left and the image / video / ad slider on the right.",
    textTab: "Text slider (left)", mediaTab: "Media slider (right)", add: "Add slide", edit: "Edit slide", save: "Save", cancel: "Cancel", remove: "Delete", empty: "No slides yet — the homepage shows the default slides until you add one.",
    type: "Slide type", IMAGE: "Image", VIDEO: "Video", TEXT: "Text", sponsored: "Advertisement / sponsored (shows an “Ad” label)",
    image: "Image", upload: "Upload image", uploading: "Uploading…", orUrl: "or paste an image URL", imageHint: "JPG, PNG or WebP, up to 5 MB. Wide images (16:9) look best.", fromFolder: "Or choose an image from the advertising folder (public/advertising):", folderNote: "Images in that folder already run in the homepage ad slider on their own; choose one here only to add a title, text or a link to it.",
    video: "Video link", videoHint: "A YouTube link (youtube.com / youtu.be) or a direct .mp4 / .webm URL.",
    eyebrow: "Small heading", titleEn: "Title (English) *", titleHi: "Title (Hindi)", body: "Text (English)", bodyHi: "Text (Hindi)", eyebrowHi: "Small heading (Hindi)",
    cta: "Button text (English)", ctaHi: "Button text (Hindi)", link: "Button link", linkHint: "A page on this site (/events) or a full https:// address.",
    start: "Show from", end: "Show until", dateHint: "Leave empty to show it all the time.", order: "Order", active: "Active",
    activate: "Activate", deactivate: "Deactivate", inactive: "Inactive", scheduled: "Scheduled", expired: "Expired", ad: "Ad", confirm: "Delete this slide?", saved: "Saved.",
  },
  hi: {
    title: "समाज की झलक", sub: "होमपेज के “समाज की झलक” भाग को संभालें: बाईं ओर टेक्स्ट स्लाइडर और दाईं ओर इमेज / वीडियो / विज्ञापन स्लाइडर।",
    textTab: "टेक्स्ट स्लाइडर (बायाँ)", mediaTab: "मीडिया स्लाइडर (दायाँ)", add: "स्लाइड जोड़ें", edit: "स्लाइड बदलें", save: "सहेजें", cancel: "रद्द करें", remove: "हटाएँ", empty: "अभी कोई स्लाइड नहीं — जब तक आप स्लाइड नहीं जोड़ते, होमपेज पर डिफ़ॉल्ट स्लाइड दिखेंगी।",
    type: "स्लाइड का प्रकार", IMAGE: "इमेज", VIDEO: "वीडियो", TEXT: "टेक्स्ट", sponsored: "विज्ञापन / प्रायोजित (“विज्ञापन” लेबल दिखेगा)",
    image: "इमेज", upload: "इमेज अपलोड करें", uploading: "अपलोड हो रहा है…", orUrl: "या इमेज का URL डालें", imageHint: "JPG, PNG या WebP, अधिकतम 5 MB। चौड़ी (16:9) इमेज सबसे अच्छी दिखती है।", fromFolder: "या विज्ञापन फ़ोल्डर (public/advertising) से इमेज चुनें:", folderNote: "उस फ़ोल्डर की इमेज होमपेज के विज्ञापन स्लाइडर में अपने आप चलती हैं; शीर्षक, विवरण या लिंक जोड़ना हो तभी यहाँ चुनें।",
    video: "वीडियो लिंक", videoHint: "YouTube लिंक (youtube.com / youtu.be) या सीधा .mp4 / .webm URL।",
    eyebrow: "छोटा शीर्षक (अंग्रेज़ी)", titleEn: "शीर्षक (अंग्रेज़ी) *", titleHi: "शीर्षक (हिंदी)", body: "विवरण (अंग्रेज़ी)", bodyHi: "विवरण (हिंदी)", eyebrowHi: "छोटा शीर्षक (हिंदी)",
    cta: "बटन टेक्स्ट (अंग्रेज़ी)", ctaHi: "बटन टेक्स्ट (हिंदी)", link: "बटन लिंक", linkHint: "इस साइट का पेज (/events) या पूरा https:// पता।",
    start: "कब से दिखाएँ", end: "कब तक दिखाएँ", dateHint: "हमेशा दिखाने के लिए खाली छोड़ें।", order: "क्रम", active: "सक्रिय",
    activate: "सक्रिय करें", deactivate: "निष्क्रिय करें", inactive: "निष्क्रिय", scheduled: "निर्धारित", expired: "समाप्त", ad: "विज्ञापन", confirm: "यह स्लाइड हटाएँ?", saved: "सहेजा गया।",
  },
};

const EMPTY = { mediaType: "IMAGE", sponsored: false, eyebrow: "", eyebrowHi: "", title: "", titleHi: "", body: "", bodyHi: "", mediaUrl: "", linkUrl: "", ctaLabel: "", ctaLabelHi: "", startDate: "", endDate: "", sortOrder: 0, active: true };
const today = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
const youtubeId = (url) => url?.match(/^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/i)?.[1] || null;
const input = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary";

function Field({ label, hint, children, wide }) {
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

function Thumb({ row }) {
  const [failed, setFailed] = useState(false);
  if (row.slider === "MEDIA" && row.mediaType === "IMAGE" && row.mediaUrl && !failed) return <img src={row.mediaUrl} alt="" onError={() => setFailed(true)} className="h-full w-full object-cover" />;
  if (row.slider === "MEDIA" && row.mediaType === "IMAGE") return <ImageIcon className="h-7 w-7 text-cream/80" />;
  if (row.slider === "MEDIA" && row.mediaType === "VIDEO") {
    const id = youtubeId(row.mediaUrl);
    return id && !failed ? <img src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`} alt="" onError={() => setFailed(true)} className="h-full w-full object-cover" /> : <Video className="h-7 w-7 text-cream/80" />;
  }
  return <Type className="h-7 w-7 text-gold" />;
}

export default function AdminHomeHighlights() {
  const { lang } = useLang();
  const t = words[lang] || words.en;
  const [rows, setRows] = useState([]);
  const [slider, setSlider] = useState("TEXT");
  const [editing, setEditing] = useState(null); // null | { id?, ...fields }
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    try { setRows(await base44.homeHighlights.list()); } catch (e) { setError(e.message); }
  };
  useEffect(() => { load(); }, []);

  const visible = rows.filter((row) => row.slider === slider).sort((a, b) => a.sortOrder - b.sortOrder);
  const set = (key) => (event) => setEditing((current) => ({ ...current, [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));
  const isMedia = slider === "MEDIA";
  const status = (row) => (!row.active ? t.inactive : row.startDate && row.startDate > today() ? t.scheduled : row.endDate && row.endDate < today() ? t.expired : null);

  const save = async (event) => {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    const { id, slider: _slider, createdAt: _c, updatedAt: _u, ...fields } = editing;
    const body = { ...fields, sortOrder: Number(fields.sortOrder) || 0, mediaType: isMedia ? fields.mediaType : undefined, sponsored: isMedia ? fields.sponsored : false, mediaUrl: isMedia && fields.mediaType !== "TEXT" ? fields.mediaUrl : null };
    for (const key of ["startDate", "endDate"]) if (!body[key]) body[key] = null;
    try {
      if (id) await base44.homeHighlights.update(id, body);
      else await base44.homeHighlights.create({ ...body, slider });
      setEditing(null); setNotice(t.saved); await load();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const patch = async (row, change) => {
    setError(""); setNotice("");
    try { await base44.homeHighlights.update(row.id, change); await load(); } catch (e) { setError(e.message); }
  };
  const remove = async (row) => {
    if (!window.confirm(`${t.confirm}\n${row.title}`)) return;
    try { await base44.homeHighlights.remove(row.id); await load(); } catch (e) { setError(e.message); }
  };
  const upload = async (file) => {
    if (!file) return;
    setUploading(true); setError("");
    try { const { fileUrl } = await base44.integrations.Core.UploadPublicFile({ file }); setEditing((current) => ({ ...current, mediaUrl: fileUrl })); }
    catch (e) { setError(e.message); } finally { setUploading(false); }
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t.sub}</p>
        </div>
        {!editing && <Button onClick={() => { setNotice(""); setEditing({ ...EMPTY, mediaType: isMedia ? "IMAGE" : "TEXT", sortOrder: visible.length + 1 }); }}><Plus className="mr-1 h-4 w-4" />{t.add}</Button>}
      </header>

      <div role="tablist" className="inline-flex rounded-xl border bg-card p-1">
        {[["TEXT", t.textTab], ["MEDIA", t.mediaTab]].map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={slider === key} onClick={() => { setSlider(key); setEditing(null); }} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${slider === key ? "bg-maroon text-cream" : "text-muted-foreground hover:text-foreground"}`}>
            {label} <span className="ml-1 opacity-70">({rows.filter((row) => row.slider === key).length})</span>
          </button>
        ))}
      </div>

      {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">{notice}</p>}

      {editing && (
        <form onSubmit={save} className="space-y-5 rounded-2xl border bg-card p-4 shadow-sm sm:p-6" aria-label={editing.id ? t.edit : t.add}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{editing.id ? t.edit : t.add} · {isMedia ? t.mediaTab : t.textTab}</h2>
            <button type="button" aria-label={t.cancel} onClick={() => setEditing(null)} className="rounded-full p-2 hover:bg-muted"><X className="h-4 w-4" /></button>
          </div>

          {isMedia && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={t.type}>
                <div className="flex flex-wrap gap-2">
                  {[["IMAGE", ImageIcon], ["VIDEO", Video], ["TEXT", Type]].map(([key, Icon]) => (
                    <label key={key} className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm ${editing.mediaType === key ? "border-maroon bg-maroon/5 font-semibold" : ""}`}>
                      <input type="radio" name="mediaType" value={key} checked={editing.mediaType === key} onChange={set("mediaType")} className="sr-only" />
                      <Icon className="h-4 w-4" /> {t[key]}
                    </label>
                  ))}
                </div>
              </Field>
              <label className="flex items-center gap-2 self-end pb-2 text-sm">
                <input type="checkbox" checked={editing.sponsored} onChange={set("sponsored")} className="h-4 w-4" />
                <Megaphone className="h-4 w-4 text-gold" /> {t.sponsored}
              </label>
              {editing.mediaType === "IMAGE" && (
                <Field label={t.image} hint={t.imageHint} wide>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    {editing.mediaUrl && <img src={editing.mediaUrl} alt="" className="aspect-video w-full rounded-lg border object-cover sm:w-56" />}
                    <div className="flex-1 space-y-2">
                      <span className="inline-flex">
                        <input id="highlight-upload" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { upload(event.target.files?.[0]); event.target.value = ""; }} />
                        <label htmlFor="highlight-upload" className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium hover:bg-muted">
                          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} {uploading ? t.uploading : t.upload}
                        </label>
                      </span>
                      <input className={input} placeholder={t.orUrl} value={editing.mediaUrl || ""} onChange={set("mediaUrl")} />
                      {ADVERTISING_IMAGES.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <p className="text-xs font-medium">{t.fromFolder}</p>
                          <div role="radiogroup" aria-label={t.fromFolder} className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                            {ADVERTISING_IMAGES.map((src) => (
                              <button key={src} type="button" role="radio" aria-checked={editing.mediaUrl === src} aria-label={decodeURIComponent(src.split("/").pop())} onClick={() => setEditing((current) => ({ ...current, mediaUrl: src, sponsored: true }))} className={`overflow-hidden rounded-lg border-2 ${editing.mediaUrl === src ? "border-maroon ring-2 ring-maroon/30" : "border-transparent hover:border-gold"}`}>
                                <img src={src} alt="" loading="lazy" className="aspect-video w-full object-cover" />
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">{t.folderNote}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Field>
              )}
              {editing.mediaType === "VIDEO" && (
                <Field label={t.video} hint={t.videoHint} wide>
                  <input className={input} placeholder="https://youtu.be/…" value={editing.mediaUrl || ""} onChange={set("mediaUrl")} />
                </Field>
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t.titleEn}><input required maxLength={200} className={input} value={editing.title} onChange={set("title")} /></Field>
            <Field label={t.titleHi}><input maxLength={200} className={input} value={editing.titleHi || ""} onChange={set("titleHi")} /></Field>
            <Field label={t.eyebrow}><input maxLength={80} className={input} value={editing.eyebrow || ""} onChange={set("eyebrow")} /></Field>
            <Field label={t.eyebrowHi}><input maxLength={80} className={input} value={editing.eyebrowHi || ""} onChange={set("eyebrowHi")} /></Field>
            <Field label={t.body}><textarea rows={3} maxLength={600} className={`${input} h-auto py-2`} value={editing.body || ""} onChange={set("body")} /></Field>
            <Field label={t.bodyHi}><textarea rows={3} maxLength={600} className={`${input} h-auto py-2`} value={editing.bodyHi || ""} onChange={set("bodyHi")} /></Field>
            <Field label={t.cta}><input maxLength={80} className={input} value={editing.ctaLabel || ""} onChange={set("ctaLabel")} /></Field>
            <Field label={t.ctaHi}><input maxLength={80} className={input} value={editing.ctaLabelHi || ""} onChange={set("ctaLabelHi")} /></Field>
            <Field label={t.link} hint={t.linkHint} wide><input maxLength={500} className={input} placeholder="/events" value={editing.linkUrl || ""} onChange={set("linkUrl")} /></Field>
            <Field label={t.start} hint={t.dateHint}><input type="date" className={input} value={editing.startDate || ""} onChange={set("startDate")} /></Field>
            <Field label={t.end}><input type="date" className={input} value={editing.endDate || ""} onChange={set("endDate")} /></Field>
            <Field label={t.order}><input type="number" min={0} className={input} value={editing.sortOrder} onChange={set("sortOrder")} /></Field>
            <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" checked={editing.active} onChange={set("active")} className="h-4 w-4" /> {t.active}</label>
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
              <div className="flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-maroon sm:w-36"><Thumb row={row} /></div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="rounded-full bg-muted px-2 py-0.5 font-medium">#{row.sortOrder}</span>
                  {row.slider === "MEDIA" && <span className="rounded-full bg-muted px-2 py-0.5">{t[row.mediaType]}</span>}
                  {row.sponsored && <span className="rounded-full bg-gold/20 px-2 py-0.5 font-semibold text-amber-800 dark:text-gold">{t.ad}</span>}
                  {status(row) && <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-destructive">{status(row)}</span>}
                  {(row.startDate || row.endDate) && <span className="text-muted-foreground">{row.startDate || "…"} → {row.endDate || "…"}</span>}
                </div>
                <p className="mt-1 truncate font-semibold">{lang === "hi" && row.titleHi ? row.titleHi : row.title}</p>
                {(row.body || row.bodyHi) && <p className="line-clamp-1 text-sm text-muted-foreground">{lang === "hi" && row.bodyHi ? row.bodyHi : row.body}</p>}
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

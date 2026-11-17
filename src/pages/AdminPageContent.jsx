import React, { useEffect, useState } from "react";
import { ExternalLink, Image as ImageIcon, Loader2, Pencil, Plus, Trash2, Type, Upload, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { PAGE_CONTENT, youtubeId } from "@/lib/page-content";

const words = {
  en: {
    title: "Page Content", sub: "Edit the text, images and videos of every public menu page. Anything left empty shows the built-in content.",
    page: "Page", view: "View page", intro: "Section heading & text", introHint: "Overrides the section's built-in heading, text and media.", setIntro: "Customise", editIntro: "Edit", custom: "Customised", builtIn: "Built-in",
    entries: "Entries", addEntry: "Add entry", noEntries: "No entries — the built-in content is shown.", save: "Save", cancel: "Cancel", saved: "Saved.", confirm: "Delete this content?",
    titleEn: "Title (English)", titleHi: "Title (Hindi)", subtitle: "Small line under the title (English)", subtitleHi: "Small line (Hindi)", subtitleHint: "Designation, company, location, category…", tagline: "Banner tagline (English)", taglineHi: "Banner tagline (Hindi)", taglineHint: "The small line shown with the banner heading. Leave empty to keep the default.",
    body: "Text (English)", bodyHi: "Text (Hindi)", media: "Image / video", NONE: "None", IMAGE: "Image", VIDEO: "Video", upload: "Upload image", uploading: "Uploading…", imageUrl: "or paste an image URL", videoUrl: "YouTube link or .mp4 URL",
    link: "Button link", linkHint: "A page on this site (/register) or a full https:// address.", cta: "Button text (English)", ctaHi: "Button text (Hindi)", order: "Order", active: "Active", hidden: "Hidden", show: "Show", hide: "Hide", remove: "Delete",
  },
  hi: {
    title: "पेज सामग्री", sub: "हर सार्वजनिक मेनू पेज का टेक्स्ट, इमेज और वीडियो बदलें। जो खाली छोड़ेंगे वहाँ मूल सामग्री दिखेगी।",
    page: "पेज", view: "पेज देखें", intro: "भाग का शीर्षक और विवरण", introHint: "भाग के मूल शीर्षक, विवरण और मीडिया की जगह दिखेगा।", setIntro: "बदलें", editIntro: "संपादित करें", custom: "बदला गया", builtIn: "मूल",
    entries: "प्रविष्टियाँ", addEntry: "प्रविष्टि जोड़ें", noEntries: "कोई प्रविष्टि नहीं — मूल सामग्री दिख रही है।", save: "सहेजें", cancel: "रद्द करें", saved: "सहेजा गया।", confirm: "यह सामग्री हटाएँ?",
    titleEn: "शीर्षक (अंग्रेज़ी)", titleHi: "शीर्षक (हिंदी)", subtitle: "शीर्षक के नीचे छोटी पंक्ति (अंग्रेज़ी)", subtitleHi: "छोटी पंक्ति (हिंदी)", subtitleHint: "पद, कंपनी, स्थान, श्रेणी…", tagline: "बैनर टैगलाइन (अंग्रेज़ी)", taglineHi: "बैनर टैगलाइन (हिंदी)", taglineHint: "बैनर शीर्षक के साथ दिखने वाली छोटी पंक्ति। डिफ़ॉल्ट रखने के लिए खाली छोड़ें।",
    body: "विवरण (अंग्रेज़ी)", bodyHi: "विवरण (हिंदी)", media: "इमेज / वीडियो", NONE: "कोई नहीं", IMAGE: "इमेज", VIDEO: "वीडियो", upload: "इमेज अपलोड करें", uploading: "अपलोड हो रहा है…", imageUrl: "या इमेज का URL डालें", videoUrl: "YouTube लिंक या .mp4 URL",
    link: "बटन लिंक", linkHint: "इस साइट का पेज (/register) या पूरा https:// पता।", cta: "बटन टेक्स्ट (अंग्रेज़ी)", ctaHi: "बटन टेक्स्ट (हिंदी)", order: "क्रम", active: "सक्रिय", hidden: "छिपा हुआ", show: "दिखाएँ", hide: "छिपाएँ", remove: "हटाएँ",
  },
};
const EMPTY = { title: "", titleHi: "", subtitle: "", subtitleHi: "", body: "", bodyHi: "", mediaType: "NONE", mediaUrl: "", linkUrl: "", ctaLabel: "", ctaLabelHi: "", sortOrder: 0, active: true };
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

function Thumb({ block }) {
  const [failed, setFailed] = useState(false);
  if (block.mediaType === "IMAGE" && block.mediaUrl && !failed) return <img src={block.mediaUrl} alt="" onError={() => setFailed(true)} className="h-full w-full object-cover" />;
  if (block.mediaType === "VIDEO") {
    const id = youtubeId(block.mediaUrl);
    return id && !failed ? <img src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`} alt="" onError={() => setFailed(true)} className="h-full w-full object-cover" /> : <Video className="h-6 w-6 text-muted-foreground" />;
  }
  return block.mediaType === "IMAGE" ? <ImageIcon className="h-6 w-6 text-muted-foreground" /> : <Type className="h-6 w-6 text-muted-foreground" />;
}

function BlockForm({ value, t, onCancel, onSave, busy, setError, isIntro, isHero = false }) {
  const [form, setForm] = useState(value);
  const [uploading, setUploading] = useState(false);
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));
  const upload = async (file) => {
    if (!file) return;
    setUploading(true); setError("");
    try { const { fileUrl } = await base44.integrations.Core.UploadPublicFile({ file }); setForm((current) => ({ ...current, mediaType: "IMAGE", mediaUrl: fileUrl })); }
    catch (e) { setError(e.message); } finally { setUploading(false); }
  };
  return (
    <form onSubmit={(event) => { event.preventDefault(); onSave(form); }} className="space-y-4 rounded-xl border border-gold/40 bg-background p-4 sm:p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t.titleEn}><input maxLength={200} className={input} value={form.title || ""} onChange={set("title")} /></Field>
        <Field label={t.titleHi}><input maxLength={200} className={input} value={form.titleHi || ""} onChange={set("titleHi")} /></Field>
        {(!isIntro || isHero) && <Field label={isHero ? t.tagline : t.subtitle} hint={isHero ? t.taglineHint : t.subtitleHint}><input maxLength={200} className={input} value={form.subtitle || ""} onChange={set("subtitle")} /></Field>}
        {(!isIntro || isHero) && <Field label={isHero ? t.taglineHi : t.subtitleHi}><input maxLength={200} className={input} value={form.subtitleHi || ""} onChange={set("subtitleHi")} /></Field>}
        <Field label={t.body}><textarea rows={5} className={`${input} h-auto py-2`} value={form.body || ""} onChange={set("body")} /></Field>
        <Field label={t.bodyHi}><textarea rows={5} className={`${input} h-auto py-2`} value={form.bodyHi || ""} onChange={set("bodyHi")} /></Field>
        <Field label={t.media} wide>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t.media}>
              {["NONE", "IMAGE", "VIDEO"].map((type) => (
                <label key={type} className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm ${form.mediaType === type ? "border-maroon bg-maroon/5 font-semibold" : ""}`}>
                  <input type="radio" name="mediaType" value={type} checked={form.mediaType === type} onChange={set("mediaType")} className="sr-only" />{t[type]}
                </label>
              ))}
            </div>
            {form.mediaType === "IMAGE" && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                {form.mediaUrl && <img src={form.mediaUrl} alt="" className="aspect-video w-full rounded-lg border object-cover sm:w-56" />}
                <div className="flex-1 space-y-2">
                  <input id="page-content-upload" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { upload(event.target.files?.[0]); event.target.value = ""; }} />
                  <label htmlFor="page-content-upload" className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border bg-card px-4 text-sm font-medium hover:bg-muted">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{uploading ? t.uploading : t.upload}</label>
                  <input className={input} placeholder={t.imageUrl} value={form.mediaUrl || ""} onChange={set("mediaUrl")} />
                </div>
              </div>
            )}
            {form.mediaType === "VIDEO" && <input className={input} placeholder={t.videoUrl} aria-label={t.videoUrl} value={form.mediaUrl || ""} onChange={set("mediaUrl")} />}
          </div>
        </Field>
        <Field label={t.link} hint={t.linkHint} wide><input maxLength={500} className={input} placeholder="/register" value={form.linkUrl || ""} onChange={set("linkUrl")} /></Field>
        <Field label={t.cta}><input maxLength={80} className={input} value={form.ctaLabel || ""} onChange={set("ctaLabel")} /></Field>
        <Field label={t.ctaHi}><input maxLength={80} className={input} value={form.ctaLabelHi || ""} onChange={set("ctaLabelHi")} /></Field>
        {!isIntro && <Field label={t.order}><input type="number" min={0} className={input} value={form.sortOrder} onChange={set("sortOrder")} /></Field>}
        <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" checked={form.active} onChange={set("active")} className="h-4 w-4" /> {t.active}</label>
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>{t.cancel}</Button>
        <Button type="submit" disabled={busy || uploading}>{busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}{t.save}</Button>
      </div>
    </form>
  );
}

export default function AdminPageContent() {
  const { lang } = useLang();
  const t = words[lang] || words.en;
  const label = (pair) => pair[lang === "hi" ? 1 : 0];
  const [page, setPage] = useState("about");
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null); // { section, role, block? }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    try { setRows(await base44.pageBlocks.list()); } catch (e) { setError(e.message); }
  };
  useEffect(() => { load(); }, []);

  const config = PAGE_CONTENT[page];
  const blocks = rows.filter((row) => row.page === page);
  const save = async (form) => {
    setBusy(true); setError(""); setNotice("");
    const { id, page: _p, section: _s, createdAt: _c, updatedAt: _u, ...fields } = form;
    const body = { ...fields, role: editing.role, sortOrder: Number(fields.sortOrder) || 0, mediaUrl: fields.mediaType === "NONE" ? null : fields.mediaUrl };
    try {
      if (id) await base44.pageBlocks.update(id, body);
      else await base44.pageBlocks.create({ ...body, page, section: editing.section });
      setEditing(null); setNotice(t.saved); await load();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const patch = async (block, change) => {
    setError(""); setNotice("");
    try { await base44.pageBlocks.update(block.id, change); await load(); } catch (e) { setError(e.message); }
  };
  const remove = async (block) => {
    if (!window.confirm(`${t.confirm}\n${block.title || block.section}`)) return;
    try { await base44.pageBlocks.remove(block.id); await load(); } catch (e) { setError(e.message); }
  };
  const toForm = (block) => ({ ...EMPTY, ...Object.fromEntries(Object.entries(block || {}).map(([key, value]) => [key, value ?? ""])) });
  const isEditing = (section, role, block) => editing && editing.section === section && editing.role === role && (editing.block?.id || null) === (block?.id || null);

  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t.sub}</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-12">
        <nav aria-label={t.page} className="min-w-0 lg:col-span-3">
          <ul className="flex gap-1 overflow-x-auto rounded-xl border bg-card p-1 lg:flex-col lg:overflow-visible">
            {Object.entries(PAGE_CONTENT).map(([key, value]) => {
              const count = rows.filter((row) => row.page === key).length;
              return (
                <li key={key} className="shrink-0">
                  <button type="button" aria-current={page === key ? "page" : undefined} onClick={() => { setPage(key); setEditing(null); setNotice(""); }} className={`flex min-h-10 w-full items-center justify-between gap-3 whitespace-nowrap rounded-lg px-3 text-left text-sm font-medium transition ${page === key ? "bg-maroon text-cream" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                    {label(value.label)}{count > 0 && <span className={`rounded-full px-1.5 text-xs ${page === key ? "bg-cream/20" : "bg-muted"}`}>{count}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0 space-y-4 lg:col-span-9">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{label(config.label)}</h2>
            <Link to={config.path} target="_blank" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-maroon hover:underline">{t.view} <ExternalLink className="h-4 w-4" /></Link>
          </div>
          {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          {notice && <p role="status" className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">{notice}</p>}

          {Object.entries(config.sections).map(([section, [en, hi, kind]]) => {
            const intro = blocks.find((row) => row.section === section && row.role === "INTRO");
            const items = blocks.filter((row) => row.section === section && row.role === "ITEM").sort((a, b) => a.sortOrder - b.sortOrder);
            return (
              <article key={section} aria-label={lang === "hi" ? hi : en} className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{lang === "hi" ? hi : en}</h3>
                    <p className="text-xs text-muted-foreground">#{section}</p>
                  </div>
                  {kind === "items" && !isEditing(section, "ITEM", null) && <Button size="sm" onClick={() => { setNotice(""); setEditing({ section, role: "ITEM", block: null }); }}><Plus className="mr-1 h-4 w-4" />{t.addEntry}</Button>}
                </div>

                <div className="mt-4 rounded-xl bg-muted/40 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{t.intro} <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${intro ? "bg-gold/20 text-amber-800 dark:text-gold" : "bg-muted text-muted-foreground"}`}>{intro ? t.custom : t.builtIn}</span>{intro && !intro.active && <span className="ml-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">{t.hidden}</span>}</p>
                      <p className="truncate text-xs text-muted-foreground">{intro ? (lang === "hi" && intro.titleHi) || intro.title || intro.body : t.introHint}</p>
                    </div>
                    {!isEditing(section, "INTRO", intro) && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setNotice(""); setEditing({ section, role: "INTRO", block: intro || null }); }}><Pencil className="mr-1 h-3.5 w-3.5" />{intro ? t.editIntro : t.setIntro}</Button>
                        {intro && <Button size="sm" variant="outline" className="text-destructive" aria-label={`${t.remove}: ${t.intro}`} onClick={() => remove(intro)}><Trash2 className="h-3.5 w-3.5" /></Button>}
                      </div>
                    )}
                  </div>
                  {isEditing(section, "INTRO", intro) && <div className="mt-3"><BlockForm value={toForm(intro)} t={t} isIntro isHero={section === "hero"} busy={busy} setError={setError} onCancel={() => setEditing(null)} onSave={save} /></div>}
                </div>

                {kind === "items" && (
                  <div className="mt-4 space-y-2">
                    {isEditing(section, "ITEM", null) && <BlockForm value={{ ...EMPTY, sortOrder: items.length + 1 }} t={t} busy={busy} setError={setError} onCancel={() => setEditing(null)} onSave={save} />}
                    {items.length === 0 && !isEditing(section, "ITEM", null) && <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">{t.noEntries}</p>}
                    {items.map((block) => isEditing(section, "ITEM", block) ? (
                      <BlockForm key={block.id} value={toForm(block)} t={t} busy={busy} setError={setError} onCancel={() => setEditing(null)} onSave={save} />
                    ) : (
                      <div key={block.id} className={`flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center ${block.active ? "" : "opacity-60"}`}>
                        <div className="flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted sm:w-28"><Thumb block={block} /></div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">#{block.sortOrder}{!block.active && <span className="ml-2 text-destructive">{t.hidden}</span>}</p>
                          <p className="truncate font-medium">{(lang === "hi" && block.titleHi) || block.title || block.body}</p>
                          {block.subtitle && <p className="truncate text-sm text-muted-foreground">{(lang === "hi" && block.subtitleHi) || block.subtitle}</p>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => { setNotice(""); setEditing({ section, role: "ITEM", block }); }}><Pencil className="mr-1 h-3.5 w-3.5" />{t.editIntro}</Button>
                          <Button size="sm" variant="outline" onClick={() => patch(block, { active: !block.active })}>{block.active ? t.hide : t.show}</Button>
                          <Button size="sm" variant="outline" className="text-destructive" aria-label={`${t.remove}: ${block.title || ""}`} onClick={() => remove(block)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

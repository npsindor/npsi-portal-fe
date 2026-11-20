import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, ExternalLink, Loader2, RotateCcw, Save } from 'lucide-react';
import { API } from '@/api/endpoints';
import { API_BASE_URL } from '@/api/apiBaseUrl';
import { apiFetch } from '@/api/base44Client';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useLang } from '@/lib/i18n';
import { HOME_SECTIONS, pageKey, SITE_PAGES, sectionKey, useSiteVisibility } from '@/lib/site-visibility';

const COPY = {
  en: {
    title: 'Page visibility',
    sub: 'Choose which pages and homepage sections the public website shows. A page that is switched off leaves the menu, footer, homepage and search, and visitors who open its link see “not available”. You still see it, with a notice.',
    pages: 'Pages',
    sections: 'Homepage sections',
    shown: 'Shown',
    hidden: 'Hidden',
    open: 'Open',
    save: 'Save changes',
    reset: 'Undo changes',
    saved: 'Visibility saved',
    failed: 'Could not save',
    changes: (n) => `${n} unsaved change${n === 1 ? '' : 's'}`,
    summary: (pages, sections) => `${pages} page(s) and ${sections} homepage section(s) hidden`,
    homeAlways: 'The homepage itself is always shown.',
  },
  hi: {
    title: 'पेज दृश्यता',
    sub: 'चुनें कि सार्वजनिक वेबसाइट पर कौन-से पेज और होमपेज सेक्शन दिखें। बंद किया गया पेज मेन्यू, फुटर, होमपेज और खोज से हट जाता है, और उसका लिंक खोलने वालों को “उपलब्ध नहीं” दिखता है। आपको वह पेज सूचना के साथ दिखता रहेगा।',
    pages: 'पेज',
    sections: 'होमपेज सेक्शन',
    shown: 'दिख रहा है',
    hidden: 'छिपा है',
    open: 'खोलें',
    save: 'बदलाव सहेजें',
    reset: 'बदलाव रद्द करें',
    saved: 'दृश्यता सहेजी गई',
    failed: 'सहेजा नहीं जा सका',
    changes: (n) => `${n} बदलाव सहेजना बाकी`,
    summary: (pages, sections) => `${pages} पेज और ${sections} होमपेज सेक्शन छिपे हैं`,
    homeAlways: 'होमपेज हमेशा दिखता है।',
  },
};

export default function AdminSiteVisibility() {
  const { lang } = useLang();
  const t = COPY[lang] || COPY.en;
  const { toast } = useToast();
  const { hidden, loaded, refresh, setHidden } = useSiteVisibility();
  const [draft, setDraft] = useState(() => new Set(hidden));
  const [saving, setSaving] = useState(false);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { setDraft(new Set(hidden)); }, [hidden]);

  const changed = useMemo(() => [...new Set([...hidden, ...draft])].filter((key) => hidden.has(key) !== draft.has(key)), [hidden, draft]);
  const toggle = (key, visible) => setDraft((current) => {
    const next = new Set(current);
    if (visible) next.delete(key); else next.add(key);
    return next;
  });
  const save = async () => {
    setSaving(true);
    try {
      const response = await apiFetch(`${API_BASE_URL}${API.siteVisibility}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: changed.map((key) => ({ key, visible: !draft.has(key) })) }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
      setHidden(new Set(body.hidden || []));
      toast({ title: t.saved });
    } catch (error) {
      toast({ title: t.failed, description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const pagesHidden = SITE_PAGES.filter((page) => draft.has(pageKey(page.path))).length;
  const sectionsHidden = HOME_SECTIONS.filter((section) => draft.has(sectionKey(section.key))).length;
  const row = (key, label, link) => {
    const visible = !draft.has(key);
    const id = `vis-${key.replace(/[^a-z0-9]+/gi, '-')}`;
    return (
      <li key={key} className="flex items-center justify-between gap-3 px-4 py-3">
        <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
          <span className="block text-sm font-medium text-foreground">{label}</span>
          <span className={`mt-0.5 inline-flex items-center gap-1 text-xs font-semibold ${visible ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
            {visible ? <Eye className="h-3.5 w-3.5" aria-hidden="true" /> : <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />}
            {visible ? t.shown : t.hidden}
          </span>
        </label>
        {link && <Link to={link} target="_blank" className="hidden items-center gap-1 text-xs text-muted-foreground hover:text-maroon sm:inline-flex">{t.open}<ExternalLink className="h-3 w-3" aria-hidden="true" /></Link>}
        <Switch id={id} checked={visible} onCheckedChange={(value) => toggle(key, value)} aria-label={label} />
      </li>
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-maroon">{t.title}</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t.sub}</p>
          <p className="mt-2 text-xs font-semibold text-muted-foreground">{t.summary(pagesHidden, sectionsHidden)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {changed.length > 0 && <span role="status" className="text-xs font-semibold text-amber-700">{t.changes(changed.length)}</span>}
          <button type="button" disabled={!changed.length || saving} onClick={() => setDraft(new Set(hidden))} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold disabled:opacity-50"><RotateCcw className="h-4 w-4" />{t.reset}</button>
          <button type="button" disabled={!changed.length || saving} onClick={save} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-maroon px-5 text-sm font-semibold text-cream disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{t.save}</button>
        </div>
      </header>
      {!loaded ? <Loader2 className="h-6 w-6 animate-spin text-maroon" /> : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section aria-labelledby="vis-pages" className="rounded-2xl border border-border bg-card">
            <h2 id="vis-pages" className="border-b border-border px-4 py-3 font-semibold text-maroon">{t.pages}</h2>
            <ul className="divide-y divide-border">{SITE_PAGES.map((page) => row(pageKey(page.path), lang === 'hi' ? page.hi : page.en, page.path))}</ul>
          </section>
          <section aria-labelledby="vis-sections" className="rounded-2xl border border-border bg-card">
            <h2 id="vis-sections" className="border-b border-border px-4 py-3 font-semibold text-maroon">{t.sections}</h2>
            <p className="px-4 pt-3 text-xs text-muted-foreground">{t.homeAlways}</p>
            <ul className="divide-y divide-border">{HOME_SECTIONS.map((section) => row(sectionKey(section.key), lang === 'hi' ? section.hi : section.en, null))}</ul>
          </section>
        </div>
      )}
    </div>
  );
}

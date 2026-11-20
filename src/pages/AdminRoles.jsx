import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, Pencil, Search, ShieldCheck, Trash2, UserCog, UserPlus, XCircle } from 'lucide-react';
import { adminApi } from '@/api/adminApi';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { ADMIN_AREAS, areaLabel } from '@/lib/admin-access';
import { useLang } from '@/lib/i18n';
import { translateError } from '@/lib/registration-copy';
import { useVillageOptions } from '@/lib/villages';

const COPY = {
  en: {
    title: 'Assign roles (sub-admins)',
    sub: 'Give a registered family member part of the admin work: approving family or student registrations, registration payments, or new family members, only for the villages you choose. They open it from “Admin panel” in their member portal. Creating, editing and deleting records stays with you (super admin).',
    give: 'Give admin access',
    none: 'No sub-admins yet. Use “Give admin access” to add one.',
    cols: ['Member', 'Family', 'Admin work', 'Villages', 'Status', 'Given by', ''],
    all: 'All villages',
    active: 'Active',
    inactive: 'Switched off',
    edit: 'Edit',
    remove: 'Remove',
    removeTitle: 'Remove admin access?',
    removeBody: (name) => `${name} will no longer see the admin panel. Their family membership and login stay as they are.`,
    cancel: 'Cancel',
    confirm: 'Remove access',
    find: 'Find the member (name, email or mobile)',
    findHint: 'Only active, registered family members can be given admin access.',
    notEligible: 'Not a registered family member',
    hasAccess: 'Already has access',
    choose: 'Choose',
    selected: 'Member',
    change: 'Change',
    work: 'Admin work (choose one or more)',
    villages: 'Villages',
    allVillages: 'All villages',
    allHint: 'Needed for student registrations, which carry no village.',
    pickVillages: 'Search villages…',
    chosen: (n) => `${n} village(s) chosen`,
    note: 'Note (optional, e.g. “Rampura coordinator”)',
    on: 'Access is on',
    save: 'Save access',
    saved: 'Admin access saved',
    removed: 'Admin access removed',
    needMember: 'Choose a registered family member.',
    needWork: 'Choose at least one admin work.',
    needVillages: 'Choose the villages, or all villages.',
    studentNeedsAll: 'Student registration approval needs “All villages”.',
    failed: 'Could not save',
  },
  hi: {
    title: 'रोल असाइन करें (उप-एडमिन)',
    sub: 'किसी पंजीकृत परिवार सदस्य को एडमिन का कुछ काम दें: परिवार या विद्यार्थी पंजीकरण, पंजीकरण भुगतान, या नए परिवार सदस्यों की स्वीकृति, केवल आपके चुने गाँवों के लिए। वे इसे अपने सदस्य पोर्टल में “एडमिन पैनल” से खोलेंगे। रिकॉर्ड बनाना, बदलना और हटाना आपके (सुपर एडमिन) पास ही रहेगा।',
    give: 'एडमिन पहुँच दें',
    none: 'अभी कोई उप-एडमिन नहीं है। “एडमिन पहुँच दें” से जोड़ें।',
    cols: ['सदस्य', 'परिवार', 'एडमिन काम', 'गाँव', 'स्थिति', 'किसने दिया', ''],
    all: 'सभी गाँव',
    active: 'चालू',
    inactive: 'बंद',
    edit: 'बदलें',
    remove: 'हटाएँ',
    removeTitle: 'एडमिन पहुँच हटाएँ?',
    removeBody: (name) => `${name} को एडमिन पैनल नहीं दिखेगा। उनकी परिवार सदस्यता और लॉगिन जैसे हैं वैसे रहेंगे।`,
    cancel: 'रद्द करें',
    confirm: 'पहुँच हटाएँ',
    find: 'सदस्य खोजें (नाम, ईमेल या मोबाइल)',
    findHint: 'केवल सक्रिय, पंजीकृत परिवार सदस्यों को एडमिन पहुँच दी जा सकती है।',
    notEligible: 'पंजीकृत परिवार सदस्य नहीं',
    hasAccess: 'पहले से पहुँच है',
    choose: 'चुनें',
    selected: 'सदस्य',
    change: 'बदलें',
    work: 'एडमिन काम (एक या अधिक चुनें)',
    villages: 'गाँव',
    allVillages: 'सभी गाँव',
    allHint: 'विद्यार्थी पंजीकरण के लिए ज़रूरी है, क्योंकि उनमें गाँव नहीं होता।',
    pickVillages: 'गाँव खोजें…',
    chosen: (n) => `${n} गाँव चुने गए`,
    note: 'नोट (वैकल्पिक, जैसे “रामपुरा समन्वयक”)',
    on: 'पहुँच चालू है',
    save: 'पहुँच सहेजें',
    saved: 'एडमिन पहुँच सहेजी गई',
    removed: 'एडमिन पहुँच हटाई गई',
    needMember: 'एक पंजीकृत परिवार सदस्य चुनें।',
    needWork: 'कम से कम एक एडमिन काम चुनें।',
    needVillages: 'गाँव चुनें, या सभी गाँव।',
    studentNeedsAll: 'विद्यार्थी पंजीकरण स्वीकृति के लिए “सभी गाँव” ज़रूरी है।',
    failed: 'सहेजा नहीं जा सका',
  },
};

export default function AdminRoles() {
  const { lang } = useLang();
  const t = COPY[lang] || COPY.en;
  const { toast } = useToast();
  const [rows, setRows] = useState(null);
  const [editing, setEditing] = useState(null); // { row? } — null closed
  const [removing, setRemoving] = useState(null);
  const load = useCallback(async () => {
    try { setRows(await adminApi.access.list()); } catch (error) { setRows([]); toast({ title: error.message, variant: 'destructive' }); }
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  const remove = async () => {
    try {
      await adminApi.access.remove(removing.userId);
      toast({ title: t.removed, description: removing.name || removing.email });
      setRemoving(null);
      load();
    } catch (error) { toast({ title: t.failed, description: error.message, variant: 'destructive' }); }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-maroon p-2.5 text-gold"><UserCog className="h-6 w-6" aria-hidden="true" /></span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-maroon">{t.title}</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{t.sub}</p>
          </div>
        </div>
        <button type="button" onClick={() => setEditing({})} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-maroon px-5 text-sm font-semibold text-cream shadow-sm"><UserPlus className="h-4 w-4" />{t.give}</button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ADMIN_AREAS.map((area) => (
          <div key={area.key} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-maroon"><ShieldCheck className="h-4 w-4 text-gold" />{lang === 'hi' ? area.hi : area.en}</div>
            <p className="mt-1 text-xs text-muted-foreground">{lang === 'hi' ? area.descHi : area.descEn}</p>
            <p className="mt-2 text-xs font-semibold">{(rows || []).filter((row) => row.active && row.areas.includes(area.key)).length} {lang === 'hi' ? 'उप-एडमिन' : 'sub-admin(s)'}</p>
          </div>
        ))}
      </div>

      {rows === null ? <Loader2 className="h-6 w-6 animate-spin text-maroon" /> : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{t.none}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[56rem] text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr>{t.cols.map((col, index) => <th key={index} className="px-3 py-2 font-semibold">{col}</th>)}</tr></thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.userId} className="align-top">
                  <td className="px-3 py-3"><span className="block font-semibold">{row.name || '—'}</span><span className="block text-xs text-muted-foreground">{[row.email, row.phone].filter(Boolean).join(' · ')}</span>{row.note && <span className="mt-1 block text-xs italic text-muted-foreground">{row.note}</span>}</td>
                  <td className="px-3 py-3 text-xs">{row.familyId || '—'}{row.village && <span className="block text-muted-foreground">{row.village}</span>}</td>
                  <td className="px-3 py-3"><div className="flex flex-wrap gap-1">{row.areas.map((area) => <span key={area} className="rounded-full bg-maroon/10 px-2 py-0.5 text-xs font-semibold text-maroon">{areaLabel(area, lang)}</span>)}</div></td>
                  <td className="px-3 py-3 text-xs">{row.allVillages ? <span className="font-semibold">{t.all}</span> : row.villages.join(', ')}</td>
                  <td className="px-3 py-3">{row.active ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />{t.active}</span> : <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground"><XCircle className="h-3.5 w-3.5" />{t.inactive}</span>}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{row.grantedBy || '—'}<span className="block">{new Date(row.updatedAt).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN')}</span></td>
                  <td className="px-3 py-3"><div className="flex gap-1.5">
                    <button type="button" onClick={() => setEditing({ row })} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold"><Pencil className="h-3.5 w-3.5" />{t.edit}</button>
                    <button type="button" onClick={() => setRemoving(row)} className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-2.5 py-1 text-xs font-semibold text-red-800"><Trash2 className="h-3.5 w-3.5" />{t.remove}</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && <AccessDialog t={t} lang={lang} row={editing.row} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      <AlertDialog open={Boolean(removing)} onOpenChange={(open) => { if (!open) setRemoving(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t.removeTitle}</AlertDialogTitle><AlertDialogDescription>{removing && t.removeBody(removing.name || removing.email)}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t.cancel}</AlertDialogCancel><AlertDialogAction onClick={remove}>{t.confirm}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AccessDialog({ t, lang, row, onClose, onSaved }) {
  const { toast } = useToast();
  const villageOptions = useVillageOptions();
  const [person, setPerson] = useState(row ? { userId: row.userId, name: row.name, email: row.email, phone: row.phone, familyId: row.familyId, village: row.village, eligible: true } : null);
  const [q, setQ] = useState('');
  const [found, setFound] = useState([]);
  const [areas, setAreas] = useState(row?.areas || []);
  const [allVillages, setAllVillages] = useState(row?.allVillages ?? false);
  const [villages, setVillages] = useState(row?.villages || []);
  const [villageQuery, setVillageQuery] = useState('');
  const [note, setNote] = useState(row?.note || '');
  const [active, setActive] = useState(row?.active ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (person || q.trim().length < 2) { setFound([]); return undefined; }
    const timer = setTimeout(() => adminApi.access.candidates(q.trim()).then(setFound).catch(() => setFound([])), 300);
    return () => clearTimeout(timer);
  }, [q, person]);

  const villageList = useMemo(() => {
    const needle = villageQuery.trim().toLowerCase();
    const names = [...new Set([...villageOptions.map((option) => option.value), ...villages])];
    return names.filter((name) => !needle || name.toLowerCase().includes(needle) || villageOptions.find((option) => option.value === name)?.hi?.includes(villageQuery.trim()));
  }, [villageOptions, villages, villageQuery]);
  const hiName = (name) => villageOptions.find((option) => option.value === name)?.hi;

  const toggleArea = (key) => setAreas((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  const toggleVillage = (name) => setVillages((current) => (current.includes(name) ? current.filter((item) => item !== name) : [...current, name]));

  const save = async () => {
    setError('');
    if (!person?.userId) return setError(t.needMember);
    if (!areas.length) return setError(t.needWork);
    if (!allVillages && !villages.length) return setError(t.needVillages);
    if (areas.includes('STUDENT_REGISTRATIONS') && !allVillages) return setError(t.studentNeedsAll);
    setBusy(true);
    try {
      await adminApi.access.save(person.userId, { areas, allVillages, villages: allVillages ? [] : villages, active, note: note.trim() || undefined });
      toast({ title: t.saved, description: person.name || person.email });
      onSaved();
    } catch (cause) { setError(translateError(cause.message, lang)); } finally { setBusy(false); }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto rounded-2xl">
        <DialogHeader className="text-left"><DialogTitle>{row ? `${t.edit}: ${row.name || row.email}` : t.give}</DialogTitle><DialogDescription>{t.findHint}</DialogDescription></DialogHeader>

        <section className="space-y-2 text-sm">
          {person ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50/60 p-3 dark:bg-emerald-950/30">
              <div><span className="text-xs text-muted-foreground">{t.selected}</span><span className="block font-semibold">{person.name || person.email}</span><span className="block text-xs text-muted-foreground">{[person.familyId, person.village, person.email, person.phone].filter(Boolean).join(' · ')}</span></div>
              {!row && <button type="button" onClick={() => { setPerson(null); setQ(''); }} className="text-xs font-semibold underline">{t.change}</button>}
            </div>
          ) : (
            <>
              <label htmlFor="role-find" className="block font-semibold">{t.find}</label>
              <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><input id="role-find" autoFocus value={q} onChange={(e) => setQ(e.target.value)} className="h-11 w-full rounded-lg border border-input bg-background pl-9 pr-3" /></div>
              <ul className="divide-y divide-border rounded-xl border border-border">{found.map((candidate) => (
                <li key={candidate.userId} className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="min-w-0"><span className="block font-semibold">{candidate.name || candidate.email}</span><span className="block text-xs text-muted-foreground">{[candidate.familyId, candidate.village, candidate.email, candidate.phone].filter(Boolean).join(' · ')}</span></span>
                  {!candidate.eligible ? <span className="text-xs text-muted-foreground">{t.notEligible}</span>
                    : candidate.hasAccess ? <span className="text-xs text-muted-foreground">{t.hasAccess}</span>
                      : <button type="button" onClick={() => setPerson(candidate)} className="rounded-lg bg-maroon px-3 py-1 text-xs font-semibold text-cream">{t.choose}</button>}
                </li>
              ))}</ul>
            </>
          )}
        </section>

        <fieldset className="space-y-2 text-sm">
          <legend className="font-semibold">{t.work}</legend>
          {ADMIN_AREAS.map((area) => (
            <label key={area.key} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${areas.includes(area.key) ? 'border-maroon bg-maroon/5' : 'border-border'}`}>
              <input type="checkbox" className="mt-1 h-4 w-4 accent-[rgb(var(--brand-maroon))]" checked={areas.includes(area.key)} onChange={() => toggleArea(area.key)} />
              <span><span className="block font-semibold">{lang === 'hi' ? area.hi : area.en}</span><span className="block text-xs text-muted-foreground">{lang === 'hi' ? area.descHi : area.descEn}</span></span>
            </label>
          ))}
        </fieldset>

        <fieldset className="space-y-2 text-sm">
          <legend className="font-semibold">{t.villages}</legend>
          <label className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
            <span><span className="block font-semibold">{t.allVillages}</span><span className="block text-xs text-muted-foreground">{t.allHint}</span></span>
            <Switch checked={allVillages} onCheckedChange={setAllVillages} aria-label={t.allVillages} />
          </label>
          {!allVillages && (
            <div className="rounded-xl border border-border p-3">
              <div className="flex items-center justify-between gap-2"><input value={villageQuery} onChange={(e) => setVillageQuery(e.target.value)} placeholder={t.pickVillages} aria-label={t.pickVillages} className="h-10 flex-1 rounded-lg border border-input bg-background px-3" /><span role="status" className="text-xs font-semibold">{t.chosen(villages.length)}</span></div>
              <div className="mt-2 grid max-h-56 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2">{villageList.map((name) => (
                <label key={name} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted">
                  <input type="checkbox" className="h-4 w-4" checked={villages.includes(name)} onChange={() => toggleVillage(name)} />
                  <span>{name}{hiName(name) && <span className="text-muted-foreground"> · {hiName(name)}</span>}</span>
                </label>
              ))}</div>
            </div>
          )}
        </fieldset>

        <label className="block text-sm font-semibold">{t.note}<input value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 font-normal" /></label>
        <label className="flex items-center justify-between gap-3 text-sm font-semibold">{t.on}<Switch checked={active} onCheckedChange={setActive} aria-label={t.on} /></label>

        {error && <p role="alert" className="rounded-lg bg-destructive/10 p-2 text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <button type="button" disabled={busy} onClick={save} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-maroon px-4 font-semibold text-cream disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{t.save}</button>
          <button type="button" onClick={onClose} className="min-h-10 rounded-lg border border-border px-4 font-semibold">{t.cancel}</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

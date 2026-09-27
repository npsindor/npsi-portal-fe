import React, { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Save, Trash2, X, ScrollText } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useLang } from "@/lib/i18n";
import { useTableControls } from "@/lib/useTableControls";
import SearchBox from "@/components/admin/SearchBox";
import TablePagination from "@/components/admin/TablePagination";

export default function AdminPrinciples() {
  const { t } = useLang();
  const { toast } = useToast();
  const [principles, setPrinciples] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setPrinciples(await base44.entities.Principle.list("section_number"));
    } catch (error) {
      toast({ title: t("principlesAdmin.loadFailed"), description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing.title_en || !editing.title_hi || !editing.content_en || !editing.content_hi) {
      toast({ title: t("principlesAdmin.required"), variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        section_number: Number(editing.section_number) || 0,
        title_en: editing.title_en,
        title_hi: editing.title_hi,
        content_en: editing.content_en,
        content_hi: editing.content_hi,
        status: editing.status || "Active",
      };
      if (editing.id) await base44.entities.Principle.update(editing.id, payload);
      else await base44.entities.Principle.create(payload);
      setEditing(null);
      await load();
      toast({ title: t("principlesAdmin.saved") });
    } catch (error) {
      toast({ title: t("principlesAdmin.saveFailed"), description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (principle) => {
    if (!window.confirm(t("principlesAdmin.confirmDelete"))) return;
    try {
      await base44.entities.Principle.delete(principle.id);
      await load();
      toast({ title: t("principlesAdmin.deleted") });
    } catch (error) {
      toast({ title: t("principlesAdmin.deleteFailed"), description: error.message, variant: "destructive" });
    }
  };

  const { search, setSearch, page, setPage, totalPages, totalItems, pageSize, pageItems } = useTableControls(principles, {
    searchFields: ["title_en", "title_hi"],
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="gold-badge">{t("principles.badge")}</span>
          <h1 className="mt-2 font-display text-2xl font-semibold text-maroon">{t("principlesAdmin.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("principlesAdmin.sub")}</p>
        </div>
        <button onClick={() => setEditing({ section_number: principles.length + 1, status: "Active" })} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-maroon px-4 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark">
          <Plus className="h-4 w-4" /> {t("principlesAdmin.add")}
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {!loading && principles.length > 0 && <SearchBox value={search} onChange={setSearch} placeholder={t("principlesAdmin.searchPh")} />}
        {loading ? <div className="flex justify-center py-16 text-muted-foreground"><Loader2 className="mr-2 h-6 w-6 animate-spin" />{t("principles.loading")}</div> : totalItems === 0 ? <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{t("principles.empty")}</div> : pageItems.map((principle) => (
          <div key={principle.id} className="rounded-2xl border border-gold/30 bg-card p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-maroon/10"><ScrollText className="h-5 w-5 text-maroon" /></div>
              <div className="min-w-0 flex-1"><div className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">{t("principles.section")} {principle.section_number} · {principle.status}</div><div className="font-display text-base font-semibold text-maroon">{principle.title_en}</div><div className="text-sm font-medium text-foreground/80">{principle.title_hi}</div><p className="mt-1 text-xs text-muted-foreground line-clamp-2">{principle.content_en}</p></div>
              <div className="flex shrink-0 gap-1.5"><button onClick={() => setEditing({ ...principle })} className="rounded-full p-2 text-maroon hover:bg-maroon/10" aria-label={t("principlesAdmin.edit")}><Pencil className="h-4 w-4" /></button><button onClick={() => remove(principle)} className="rounded-full p-2 text-destructive hover:bg-destructive/10" aria-label={t("principlesAdmin.delete")}><Trash2 className="h-4 w-4" /></button></div>
            </div>
          </div>
        ))}
        {!loading && totalItems > 0 && (
          <div className="rounded-2xl border border-gold/30 bg-card">
            <TablePagination page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
          </div>
        )}
      </div>

      {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gold/40 bg-card p-6 shadow-xl"><div className="flex items-center justify-between border-b border-gold/20 pb-3"><h2 className="font-display text-lg font-semibold text-maroon">{editing.id ? t("principlesAdmin.editTitle") : t("principlesAdmin.newTitle")}</h2><button onClick={() => setEditing(null)} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted" aria-label={t("principlesAdmin.close")}><X className="h-4 w-4" /></button></div><div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("principlesAdmin.number")}<input type="number" value={editing.section_number ?? ""} onChange={(event) => setEditing({ ...editing, section_number: event.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm font-normal outline-none focus:border-maroon" /></label>
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("principlesAdmin.status")}<select value={editing.status || "Active"} onChange={(event) => setEditing({ ...editing, status: event.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm font-normal outline-none focus:border-maroon"><option value="Active">{t("principlesAdmin.active")}</option><option value="Archived">{t("principlesAdmin.archived")}</option></select></label>
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("principlesAdmin.titleEn")}<input value={editing.title_en || ""} onChange={(event) => setEditing({ ...editing, title_en: event.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm font-normal outline-none focus:border-maroon" /></label>
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("principlesAdmin.titleHi")}<input value={editing.title_hi || ""} onChange={(event) => setEditing({ ...editing, title_hi: event.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm font-normal outline-none focus:border-maroon" /></label>
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:col-span-2">{t("principlesAdmin.contentEn")}<textarea rows={4} value={editing.content_en || ""} onChange={(event) => setEditing({ ...editing, content_en: event.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm font-normal outline-none focus:border-maroon" /></label>
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:col-span-2">{t("principlesAdmin.contentHi")}<textarea rows={4} value={editing.content_hi || ""} onChange={(event) => setEditing({ ...editing, content_hi: event.target.value })} className="mt-1.5 w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm font-normal outline-none focus:border-maroon" /></label>
      </div><div className="mt-5 flex justify-end gap-2"><button onClick={() => setEditing(null)} className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground">{t("principlesAdmin.cancel")}</button><button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 rounded-full bg-maroon px-5 py-2 text-sm font-semibold text-cream disabled:opacity-50"><Save className="h-4 w-4" />{saving ? t("principlesAdmin.saving") : t("principlesAdmin.save")}</button></div></div></div>}
    </div>
  );
}

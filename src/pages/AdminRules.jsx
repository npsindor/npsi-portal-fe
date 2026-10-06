import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Save, Loader2, ScrollText } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useLang } from "@/lib/i18n";
import { useTableControls } from "@/lib/useTableControls";
import SearchBox from "@/components/admin/SearchBox";
import TablePagination from "@/components/admin/TablePagination";

export default function AdminRules() {
  const { t } = useLang();
  const { toast } = useToast();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // rule being edited or {} for new
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Rule.listAll("sectionNumber");
      setRules(data);
    } catch (e) {
      toast({ title: "Failed to load rules", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => setEditing({ sectionNumber: rules.length + 1, status: "Active" });
  const openEdit = (r) => setEditing({ ...r });

  const { search, setSearch, page, setPage, totalPages, totalItems, pageSize, pageItems } = useTableControls(rules, {
    searchFields: ["titleEn", "titleHi"],
  });

  const save = async () => {
    if (!editing.titleEn || !editing.titleHi || !editing.contentEn || !editing.contentHi) {
      toast({ title: "All four fields are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        sectionNumber: Number(editing.sectionNumber) || 0,
        titleEn: editing.titleEn,
        titleHi: editing.titleHi,
        contentEn: editing.contentEn,
        contentHi: editing.contentHi,
        status: editing.status || "Active",
      };
      if (editing.id) {
        await base44.entities.Rule.update(editing.id, payload);
      } else {
        await base44.entities.Rule.create(payload);
      }
      setEditing(null);
      await load();
      toast({ title: "Section saved" });
    } catch (e) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r) => {
    if (!window.confirm(t("rulesAdmin.confirmDelete"))) return;
    try {
      await base44.entities.Rule.delete(r.id);
      await load();
      toast({ title: "Section deleted" });
    } catch (e) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <span className="gold-badge">{t("rules.badge")}</span>
          <h1 className="mt-2 font-display text-2xl font-semibold text-maroon">{t("rulesAdmin.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("rulesAdmin.sub")}</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-1.5 rounded-full bg-maroon px-5 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark"
        >
          <Plus className="h-4 w-4" /> {t("rulesAdmin.add")}
        </button>
      </div>

      <div className="mt-6">
        {!loading && rules.length > 0 && <SearchBox value={search} onChange={setSearch} placeholder={t("rulesAdmin.searchPh")} className="mb-4" />}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> {t("rules.loading")}
          </div>
        ) : totalItems === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            {t("rules.empty")}
          </div>
        ) : (
          <div className="space-y-3">
            {pageItems.map((r) => (
              <div key={r.id} className="rounded-2xl border border-gold/30 bg-card p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-maroon/10">
                    <ScrollText className="h-5 w-5 text-maroon" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                      {t("rules.section")} {r.sectionNumber} · {r.status}
                    </div>
                    <div className="font-display text-base font-semibold text-maroon">{r.titleEn}</div>
                    <div className="text-sm font-medium text-foreground/80">{r.titleHi}</div>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{r.contentEn}</p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button onClick={() => openEdit(r)} className="rounded-full p-2 text-maroon hover:bg-maroon/10">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => remove(r)} className="rounded-full p-2 text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && totalItems > 0 && (
          <div className="mt-4 rounded-2xl border border-gold/30 bg-card">
            <TablePagination page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Edit / new modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gold/40 bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-gold/20 pb-3">
              <h2 className="font-display text-lg font-semibold text-maroon">
                {editing.id ? t("rulesAdmin.edit") : t("rulesAdmin.new")}
              </h2>
              <button onClick={() => setEditing(null)} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("rulesAdmin.sectionNo")}</label>
                <input
                  type="number"
                  value={editing.sectionNumber ?? ""}
                  onChange={(e) => setEditing({ ...editing, sectionNumber: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm outline-none focus:border-maroon focus:ring-1 focus:ring-maroon"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("rulesAdmin.status")}</label>
                <select
                  value={editing.status || "Active"}
                  onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm outline-none focus:border-maroon focus:ring-1 focus:ring-maroon"
                >
                  <option value="Active">{t("rulesAdmin.active")}</option>
                  <option value="Archived">{t("rulesAdmin.archived")}</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("rulesAdmin.titleEn")}</label>
                <input
                  value={editing.titleEn || ""}
                  onChange={(e) => setEditing({ ...editing, titleEn: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm outline-none focus:border-maroon focus:ring-1 focus:ring-maroon"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("rulesAdmin.titleHi")}</label>
                <input
                  value={editing.titleHi || ""}
                  onChange={(e) => setEditing({ ...editing, titleHi: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm outline-none focus:border-maroon focus:ring-1 focus:ring-maroon"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("rulesAdmin.contentEn")}</label>
                <textarea
                  rows={5}
                  value={editing.contentEn || ""}
                  onChange={(e) => setEditing({ ...editing, contentEn: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm outline-none focus:border-maroon focus:ring-1 focus:ring-maroon"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("rulesAdmin.contentHi")}</label>
                <textarea
                  rows={5}
                  value={editing.contentHi || ""}
                  onChange={(e) => setEditing({ ...editing, contentHi: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm outline-none focus:border-maroon focus:ring-1 focus:ring-maroon"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="rounded-full border border-gold/50 px-5 py-2.5 text-sm font-semibold text-maroon hover:bg-gold/10">
                {t("reg.back")}
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-full bg-maroon px-6 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? t("rulesAdmin.saving") : t("rulesAdmin.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
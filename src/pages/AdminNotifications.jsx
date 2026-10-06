import React, { useEffect, useState } from "react";
import { Plus, Send, X, Pencil, Trash2, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useLang } from "@/lib/i18n";
import { useTableControls } from "@/lib/useTableControls";
import SearchBox from "@/components/admin/SearchBox";
import TablePagination from "@/components/admin/TablePagination";

const TYPES = ["Announcement", "Event", "Registration", "Approval", "Correction", "Payment", "Campaign"];

const EMPTY = { title: "", message: "", type: "Announcement", recipientFamilyId: "", deepLink: "" };

const L = {
  en: {
    title: "Notifications",
    sub: "Send announcements and view notification history.",
    newNotif: "New Notification",
    empty: "No notifications sent yet.",
    searchPh: "Search by title or message...",
    editNotif: "Edit Notification",
    lblTitle: "Title",
    lblMessage: "Message",
    lblType: "Type",
    lblRecipient: "Recipient Family ID (optional)",
    saving: "Saving...",
    update: "Update",
    sendAll: "Send to All Members",
    titleMsgReq: "Title and message required",
    updated: "Notification updated",
    sent: "Notification sent",
    failed: "Failed to save",
    deleted: "Notification deleted",
    delFailed: "Delete failed",
    confirmDel: "Delete this notification?",
  },
  hi: {
    title: "सूचनाएँ",
    sub: "घोषणाएँ भेजें और सूचना इतिहास देखें।",
    newNotif: "नई सूचना",
    empty: "अभी कोई सूचना नहीं भेजी गई।",
    searchPh: "शीर्षक या संदेश से खोजें...",
    editNotif: "सूचना संपादित करें",
    lblTitle: "शीर्षक",
    lblMessage: "संदेश",
    lblType: "प्रकार",
    lblRecipient: "प्राप्तकर्ता परिवार आईडी (वैकल्पिक)",
    saving: "सहेजा जा रहा है...",
    update: "अपडेट करें",
    sendAll: "सभी सदस्यों को भेजें",
    titleMsgReq: "शीर्षक और संदेश आवश्यक",
    updated: "सूचना अपडेट हुई",
    sent: "सूचना भेजी गई",
    failed: "सहेजने में विफल",
    deleted: "सूचना हटाई गई",
    delFailed: "हटाने में विफल",
    confirmDel: "इस सूचना को हटाएँ?",
  },
};

export default function AdminNotifications() {
  const { lang } = useLang();
  const t = L[lang];
  const { toast } = useToast();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setNotifs(await base44.entities.Notification.listAll("-date")); }
    catch (e) {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => setEditing({ ...EMPTY });
  const openEdit = (n) => setEditing({ ...n });

  const save = async () => {
    if (!editing.title || !editing.message) {
      toast({ title: t.titleMsgReq, variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: editing.title,
        message: editing.message,
        type: editing.type,
        recipientFamilyId: editing.recipientFamilyId || "",
        deepLink: editing.deepLink || "",
        read: editing.read ?? false,
        date: editing.date || new Date().toISOString(),
      };
      if (editing.id) {
        await base44.entities.Notification.update(editing.id, payload);
        toast({ title: t.updated });
      } else {
        await base44.entities.Notification.create(payload);
        await base44.entities.Announcement.create({ title: payload.title, body: payload.message, date: payload.date, type: "General", status: "Active" });
        toast({ title: t.sent, description: payload.title });
      }
      setEditing(null);
      await load();
    } catch (err) {
      toast({ title: t.failed, description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const remove = async (n) => {
    if (!window.confirm(t.confirmDel)) return;
    try {
      await base44.entities.Notification.delete(n.id);
      await load();
      toast({ title: t.deleted });
    } catch (e) {
      toast({ title: t.delFailed, description: e.message, variant: "destructive" });
    }
  };

  const { search, setSearch, page, setPage, totalPages, totalItems, pageSize, pageItems } = useTableControls(notifs, {
    searchFields: ["title", "message"],
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
          <Plus className="h-4 w-4" /> {t.newNotif}
        </button>
      </div>

      <SearchBox value={search} onChange={setSearch} placeholder={t.searchPh} />

      <div className="space-y-3">
        {pageItems.map((n) => (
          <div key={n.id} className="rounded-2xl border border-gold/30 bg-card p-4">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-foreground">{n.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="text-right">
                  <span className="gold-badge text-[0.6rem]">{n.type}</span>
                  <div className="mt-1 text-xs text-muted-foreground">{n.date ? new Date(n.date).toLocaleDateString(locale) : ""}</div>
                </div>
                <button onClick={() => openEdit(n)} className="rounded-full p-1.5 text-maroon hover:bg-maroon/10"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => remove(n)} className="rounded-full p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
        {totalItems === 0 && <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{t.empty}</div>}
      </div>
      <div className="rounded-2xl border border-gold/30 bg-card">
        <TablePagination page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-md rounded-t-2xl border border-gold/40 bg-card p-6 shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-maroon">{editing.id ? t.editNotif : t.newNotif}</h2>
              <button onClick={() => setEditing(null)} className="rounded-full p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblTitle}</label>
                <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblMessage}</label>
                <textarea value={editing.message} onChange={(e) => setEditing({ ...editing, message: e.target.value })} rows={3} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblType}</label>
                <select value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon">
                  {TYPES.map((tp) => <option key={tp}>{tp}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.lblRecipient}</label>
                <input value={editing.recipientFamilyId} onChange={(e) => setEditing({ ...editing, recipientFamilyId: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" />
              </div>
            </div>
            <button onClick={save} disabled={saving} className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-maroon py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {saving ? t.saving : (editing.id ? t.update : t.sendAll)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
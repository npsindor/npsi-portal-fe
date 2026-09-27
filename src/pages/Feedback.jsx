import React, { useEffect, useState } from "react";
import { MessageSquare, Send, Loader2, Paperclip, X, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useT, useLang } from "@/lib/i18n";
import StatusBadge from "@/components/StatusBadge";

const TYPES = ["General", "Suggestion", "Complaint", "Appreciation", "Bug", "Other"];

export default function Feedback() {
  const t = useT();
  const { lang } = useLang();
  const { user } = useAuth();
  const { toast } = useToast();
  const locale = lang === "hi" ? "hi-IN" : "en-IN";

  const [type, setType] = useState("General");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState(null);
  const [list, setList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const load = async () => {
    setLoadingList(true);
    try {
      setList(await base44.me.feedback());
    } catch (e) {} finally { setLoadingList(false); }
  };
  useEffect(() => { load(); }, [user]);

  const onAttach = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setAttachment(file_url);
    } catch (e) {
      toast({ title: t("fb.submitted"), description: e.message, variant: "destructive" });
    } finally { setUploading(false); }
  };

  const submit = async () => {
    if (!message.trim()) {
      toast({ title: t("fb.messageReq"), variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const created = await base44.entities.Feedback.create({
        member_name: user?.full_name || "Member",
        email: user?.email || "",
        feedback_type: type,
        subject: subject.trim(),
        message: message.trim(),
        attachment_url: attachment,
        status: "Submitted",
        submitted_date: new Date().toISOString(),
      });
      setSubmittedId(created.feedback_id);
      setSubject(""); setMessage(""); setAttachment(""); setType("General");
      toast({ title: t("fb.submitted"), description: t("fb.submittedDesc") });
      load();
    } catch (e) {
      toast({ title: t("fb.submitted"), description: e.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-maroon">{t("fb.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("fb.sub")}</p>
      </div>

      {submittedId && (
        <div className="flex items-start gap-3 rounded-2xl border border-green-300 bg-green-50 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-green-800">{t("fb.submitted")}</div>
            <div className="mt-0.5 text-xs text-green-700">{t("fb.submittedDesc")}</div>
            <div className="mt-2 text-xs text-green-700">{t("fb.feedbackId")}: <span className="font-mono font-semibold">{submittedId}</span></div>
          </div>
          <button onClick={() => setSubmittedId(null)} className="rounded-full p-1 text-green-700 hover:bg-green-100"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Form */}
      <div className="rounded-2xl border border-gold/30 bg-card p-5 sm:p-6">
        <div className="grid gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("fb.type")} <span className="text-muted-foreground/60">({t("fb.typeOpt")})</span></label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1.5 w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm outline-none focus:border-maroon focus:ring-1 focus:ring-maroon">
              {TYPES.map((ty) => <option key={ty} value={ty}>{t(`fb.types.${ty}`)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("fb.subject")} <span className="text-muted-foreground/60">({t("fb.typeOpt")})</span></label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t("fb.subjectPh")} className="mt-1.5 w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm outline-none focus:border-maroon focus:ring-1 focus:ring-maroon" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("fb.message")} <span className="text-maroon">*</span></label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} placeholder={t("fb.messagePh")} className="mt-1.5 w-full resize-none rounded-xl border border-border bg-cream px-4 py-2.5 text-sm outline-none focus:border-maroon focus:ring-1 focus:ring-maroon" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("fb.attachment")} <span className="text-muted-foreground/60">({t("fb.attachHint")})</span></label>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-gold/50 px-4 py-2 text-xs font-semibold text-maroon hover:bg-gold/10">
                <Paperclip className="h-3.5 w-3.5" /> {uploading ? t("fb.submitting") : t("fb.attachment")}
                <input type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={(e) => onAttach(e.target.files?.[0])} disabled={uploading} />
              </label>
              {attachment && (
                <button onClick={() => setAttachment("")} className="inline-flex items-center gap-1 rounded-full border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/5">
                  <X className="h-3 w-3" /> {t("fb.attachment")}
                </button>
              )}
            </div>
          </div>
          <button onClick={submit} disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-full bg-maroon px-6 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark disabled:opacity-60">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitting ? t("fb.submitting") : t("fb.submit")}
          </button>
        </div>
      </div>

      {/* My feedback history */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-maroon" />
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-maroon">{t("fb.myFeedback")}</h2>
        </div>
        {loadingList ? (
          <div className="flex h-24 items-center justify-center rounded-2xl border border-gold/30 bg-card"><div className="h-6 w-6 animate-spin rounded-full border-4 border-gold/30 border-t-maroon" /></div>
        ) : list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{t("fb.noFeedback")}</div>
        ) : (
          <div className="space-y-3">
            {list.map((f) => (
              <div key={f.id} className="rounded-2xl border border-gold/30 bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-maroon">{f.feedback_id || "—"}</span>
                    {f.feedback_type && <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[0.6rem] font-semibold text-maroon">{t(`fb.types.${f.feedback_type}`)}</span>}
                  </div>
                  <StatusBadge status={f.status} />
                </div>
                {f.subject && <div className="mt-2 text-sm font-semibold text-foreground">{f.subject}</div>}
                <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{f.message}</p>
                <div className="mt-1 text-xs text-muted-foreground">{f.submitted_date ? new Date(f.submitted_date).toLocaleDateString(locale) : ""}</div>
                {f.reply && (
                  <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3">
                    <div className="text-xs font-semibold text-green-700">{t("fb.reply")}</div>
                    <p className="mt-1 text-sm text-green-800">{f.reply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
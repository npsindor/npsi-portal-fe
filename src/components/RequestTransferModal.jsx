import React, { useState } from "react";
import { X, Loader2, ArrowRightLeft, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useT } from "@/lib/i18n";

// props: open, onClose
// student: the logged-in user's Student record (for student_to_family)
// family + membershipId + memberName: for family_to_family
export default function RequestTransferModal({ open, onClose, student, family, membershipId, memberName }) {
  const t = useT();
  const { user } = useAuth();
  const { toast } = useToast();
  const [targetFamilyId, setTargetFamilyId] = useState("");
  const [targetName, setTargetName] = useState("");
  const [reason, setReason] = useState("");
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const isStudent = !!student;
  const sourceLabel = isStudent
    ? `${t("tr.studentId")}: ${student.student_id || "—"}`
    : `${t("tr.memberId")}: ${membershipId || "—"}`;

  const lookupTarget = async () => {
    if (!targetFamilyId.trim()) return;
    setChecking(true);
    setTargetName("");
    try {
      const { family: fam } = await base44.verifyFamily(targetFamilyId.trim());
      if (fam?.status === "ACTIVE") setTargetName(fam.family_name || "—");
      else toast({ title: t("tr.targetNotFound"), variant: "destructive" });
    } catch (e) {
      toast({ title: t("tr.targetNotFound"), description: e.message, variant: "destructive" });
    } finally { setChecking(false); }
  };

  const submit = async () => {
    if (!targetFamilyId.trim()) {
      toast({ title: t("tr.targetRequired"), variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      // validate target
      let target = null;
      try {
        const { family: fam } = await base44.verifyFamily(targetFamilyId.trim());
        if (fam?.status === "ACTIVE") target = fam;
      } catch (e) { /* not found */ }
      if (!target) {
        toast({ title: t("tr.targetNotFound"), variant: "destructive" });
        setSubmitting(false);
        return;
      }

      const created = await base44.entities.TransferRequest.create({
        request_type: isStudent ? "student_to_family" : "family_to_family",
        status: "PENDING",
        requester_name: isStudent ? student.student_name : (memberName || user?.full_name || "Member"),
        requester_email: user?.email || "",
        requester_mobile: isStudent ? student.mobile : "",
        source_student_id: isStudent ? student.student_id : "",
        source_membership_id: isStudent ? "" : membershipId,
        source_family_id: isStudent ? "" : family?.family_id,
        target_family_id: target.family_id,
        target_family_name: target.family_name,
        reason: reason.trim(),
        requester_id: user?.id,
        requested_date: new Date().toISOString(),
      });

      await base44.entities.Notification.create({
        title: t("tr.notifTitle"),
        message: t("tr.notifMsg", { id: created.request_id }),
        type: "Approval",
        recipient_family_id: target.family_id,
        date: new Date().toISOString(),
      });

      toast({ title: t("tr.submitted"), description: created.request_id });
      onClose();
      setTargetFamilyId(""); setTargetName(""); setReason("");
    } catch (e) {
      toast({ title: t("tr.submitFailed"), description: e.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-maroon/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-gold/40 bg-card shadow-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between border-b border-gold/20 bg-card px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-maroon">{t("tr.title")}</h2>
            <p className="text-xs text-muted-foreground">{isStudent ? t("tr.subStudent") : t("tr.subFamily")}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-xl border border-gold/30 bg-cream p-3 text-xs">
            <div className="font-semibold text-maroon">{sourceLabel}</div>
            <div className="mt-1 text-muted-foreground">{isStudent ? t("tr.fromStudent") : t("tr.fromFamily")}: {family?.family_name || "—"}</div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("tr.targetFamilyId")} *</label>
            <div className="mt-1.5 flex gap-2">
              <input value={targetFamilyId} onChange={(e) => { setTargetFamilyId(e.target.value); setTargetName(""); }} placeholder="NPSI-FAM-000001" className="flex-1 rounded-xl border border-border bg-cream px-4 py-2.5 text-sm outline-none focus:border-maroon focus:ring-1 focus:ring-maroon" />
              <button onClick={lookupTarget} disabled={checking} className="inline-flex items-center gap-1 rounded-xl border border-gold/50 px-3 py-2.5 text-xs font-semibold text-maroon hover:bg-gold/10 disabled:opacity-60">
                {checking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />} {t("tr.check")}
              </button>
            </div>
            {targetName && <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-green-300 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">✓ {targetName}</div>}
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("tr.reason")}</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder={t("tr.reasonPh")} className="mt-1.5 w-full resize-none rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-maroon" />
          </div>
        </div>

        <div className="sticky bottom-0 flex gap-2 border-t border-gold/20 bg-card px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-full border border-gold/40 px-4 py-2.5 text-sm font-semibold text-maroon hover:bg-gold/10">{t("tr.cancel")}</button>
          <button onClick={submit} disabled={submitting} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-maroon px-4 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark disabled:opacity-60">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
            {submitting ? t("tr.submitting") : t("tr.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
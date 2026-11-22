import { statusLabel } from "@/components/StatusBadge";
import React, { useCallback, useEffect, useState } from "react";
import { Check, ExternalLink, Loader2, RefreshCw, RotateCcw, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import ExportMenu from "@/components/ExportMenu";
import { revenueOf } from "@/lib/revenue";
import { useLang } from "@/lib/i18n";

const copy = {
  en: { title: "Registration payments", sub: "Check UPI proofs before approving family or student applications.", all: "All", pending: "Awaiting review", verified: "Verified", rejected: "Rejected", refundRequested: "Refund requested", refundProcessing: "Refund processing", refunded: "Refunded", refundRejected: "Refund rejected", loading: "Loading payments…", empty: "No payments in this view.", applicant: "Applicant", amount: "Amount", application: "Application", proof: "Payment proof", utr: "UTR", status: "Status", actions: "Review", verify: "Verify payment", reject: "Reject payment", requestRefund: "Start refund", processing: "Mark processing", refund: "Confirm refund sent", refundAmount: "Refund amount (₹)", refundReference: "Refund UPI / bank reference", reason: "Reason / refund remarks", required: "A reason is required.", refundRequired: "Enter the actual refund amount and transaction reference to confirm completion.", error: "Could not complete this action.", refresh: "Refresh", remarks: "Remarks", reviewedBy: "Approved by", notReviewed: "Not reviewed yet", count: "{n} payments", countOne: "1 payment", total: "Received", transaction: "Transaction", type: "Type", family: "Family", student: "Student", mobile: "Mobile", email: "Email", date: "Date", reviewedAt: "Reviewed on", refundAmount2: "Refund amount", refundRef2: "Refund reference", exportTitle: "Registration payments", exportLabels: { export: "Export", csv: "CSV", excel: "Excel (.xlsx)", pdf: "PDF" } },
  hi: { title: "रजिस्ट्रेशन भुगतान", sub: "परिवार या विद्यार्थी आवेदन स्वीकृत करने से पहले UPI प्रमाण जाँचें।", all: "सभी", pending: "समीक्षा बाकी", verified: "सत्यापित", rejected: "अस्वीकृत", refundRequested: "रिफंड अनुरोधित", refundProcessing: "रिफंड प्रक्रिया में", refunded: "रिफंड पूरा", refundRejected: "रिफंड अस्वीकृत", loading: "भुगतान लोड हो रहे हैं…", empty: "इस सूची में भुगतान नहीं हैं।", applicant: "आवेदक", amount: "राशि", application: "आवेदन", proof: "भुगतान प्रमाण", utr: "UTR", status: "स्थिति", actions: "समीक्षा", verify: "भुगतान सत्यापित करें", reject: "भुगतान अस्वीकार करें", requestRefund: "रिफंड शुरू करें", processing: "प्रक्रिया में करें", refund: "रिफंड भेजने की पुष्टि करें", refundAmount: "रिफंड राशि (₹)", refundReference: "रिफंड UPI / बैंक संदर्भ", reason: "कारण / रिफंड टिप्पणी", required: "कारण आवश्यक है।", refundRequired: "रिफंड पूरा करने के लिए वास्तविक राशि और लेनदेन संदर्भ दर्ज करें।", error: "कार्रवाई पूरी नहीं हुई।", refresh: "रीफ्रेश", remarks: "टिप्पणी", reviewedBy: "स्वीकृतकर्ता", notReviewed: "अभी समीक्षा नहीं हुई", count: "{n} भुगतान", countOne: "1 भुगतान", total: "प्राप्त", transaction: "लेनदेन", type: "प्रकार", family: "परिवार", student: "विद्यार्थी", mobile: "मोबाइल", email: "ईमेल", date: "तारीख", reviewedAt: "समीक्षा तिथि", refundAmount2: "रिफंड राशि", refundRef2: "रिफंड संदर्भ", exportTitle: "रजिस्ट्रेशन भुगतान", exportLabels: { export: "एक्सपोर्ट", csv: "CSV", excel: "Excel (.xlsx)", pdf: "PDF" } },
};
const filters = ["", "SUBMITTED", "VERIFIED", "REJECTED", "REFUND_REQUESTED", "REFUND_PROCESSING", "REFUNDED", "REFUND_REJECTED"];
const label = (status, t) => ({ SUBMITTED: t.pending, VERIFIED: t.verified, REJECTED: t.rejected, REFUND_REQUESTED: t.refundRequested, REFUND_PROCESSING: t.refundProcessing, REFUNDED: t.refunded, REFUND_REJECTED: t.refundRejected })[status] || (status ? statusLabel(status, t === copy.hi ? "hi" : "en") : t.all);

export default function AdminRegistrationPayments() {
  const { lang } = useLang();
  const t = copy[lang] || copy.en;
  const [filter, setFilter] = useState("");
  const [rows, setRows] = useState([]);
  const [reason, setReason] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReference, setRefundReference] = useState("");
  const [target, setTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setRows(await base44.registrations.payments(filter, 500)); }
    catch (err) { setError(err.message || t.error); }
    finally { setLoading(false); }
  }, [filter, t.error]);
  useEffect(() => { load(); }, [load]);
  const openProof = async (row) => {
    const preview = window.open("about:blank", "_blank");
    try {
      const url = URL.createObjectURL(await base44.registrations.screenshot(row.id));
      if (preview) preview.location.href = url;
      else { const link = document.createElement("a"); link.href = url; link.target = "_blank"; link.rel = "noopener"; link.click(); }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) { preview?.close(); setError(err.message || t.error); }
  };
  const decide = async (decision) => {
    if (!target) return;
    if (decision !== "VERIFIED" && !reason.trim()) { setError(t.required); return; }
    if (decision === "REFUNDED" && (!refundReference.trim() || !Number(refundAmount) || Number(refundAmount) > Number(target.amount))) { setError(t.refundRequired); return; }
    setBusy(true); setError("");
    try { await base44.registrations.reviewPayment(target.id, { decision, remarks: reason.trim() || undefined, refundAmount: decision === "REFUNDED" ? Number(refundAmount) : undefined, refundReference: decision === "REFUNDED" ? refundReference.trim() : undefined, lang }); setTarget(null); setReason(""); setRefundAmount(""); setRefundReference(""); await load(); }
    catch (err) { setError(err.message || t.error); }
    finally { setBusy(false); }
  };
  // The rows in the chosen filter: how many, their total, and the same rows as a file (CSV / Excel / PDF).
  const locale = lang === "hi" ? "hi-IN" : "en-IN";
  const rupees = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
  // Money actually received in this view (verified / settled, less refunds sent): the same rule and figure as
  // "Registration fees received" on Admin → Transactions, so the two pages tally.
  const totalAmount = revenueOf(rows);
  const when = (value) => (value ? new Date(value).toLocaleString(locale, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "");
  const exportColumns = [
    { key: "transactionId", label: t.transaction },
    { key: "date", label: t.date },
    { key: "applicant", label: t.applicant },
    { key: "mobile", label: t.mobile },
    { key: "email", label: t.email },
    { key: "type", label: t.type },
    { key: "application", label: t.application },
    { key: "amount", label: t.amount },
    { key: "utr", label: t.utr },
    { key: "status", label: t.status },
    { key: "remarks", label: t.remarks },
    { key: "reviewedBy", label: t.reviewedBy },
    { key: "reviewedAt", label: t.reviewedAt },
    { key: "refundAmount", label: t.refundAmount2 },
    { key: "refundReference", label: t.refundRef2 },
  ];
  const exportRows = rows.map((row) => ({
    transactionId: row.transactionId || "",
    date: when(row.date || row.createdAt),
    applicant: row.applicant?.name || "",
    mobile: row.applicant?.mobile || "",
    email: row.applicant?.email || "",
    type: row.applicant?.type === "STUDENT" ? t.student : row.applicant ? t.family : "",
    application: row.referenceId || "",
    amount: Number(row.amount || 0),
    utr: row.utr || "",
    status: label(row.paymentStatus, t),
    remarks: row.adminRemarks || "",
    reviewedBy: row.reviewer?.name || "",
    reviewedAt: when(row.reviewedAt),
    refundAmount: row.refundAmount ?? "",
    refundReference: row.refundReference || "",
  }));
  const fileName = `registration-payments${filter ? `-${filter.toLowerCase()}` : ""}`;
  return <section className="space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">{t.title}</h1><p className="mt-1 text-sm text-muted-foreground">{t.sub}</p></div><div className="flex flex-wrap items-center gap-2">{!loading && <span role="status" aria-label={`${rows.length === 1 ? t.countOne : t.count.replace("{n}", rows.length.toLocaleString(locale))} · ${t.total} ${rupees(totalAmount)}`} className="rounded-full border bg-muted/40 px-3 py-1.5 text-sm"><strong>{rows.length === 1 ? t.countOne : t.count.replace("{n}", rows.length.toLocaleString(locale))}</strong><span className="text-muted-foreground"> · {t.total} </span><strong>{rupees(totalAmount)}</strong></span>}<ExportMenu filename={fileName} title={filter ? `${t.exportTitle} · ${label(filter, t)}` : t.exportTitle} columns={exportColumns} rows={exportRows} labels={t.exportLabels} /><Button variant="outline" onClick={load}><RefreshCw className="mr-2 h-4 w-4"/>{t.refresh}</Button></div></header>
    <div className="flex flex-wrap gap-2">{filters.map((status) => <button key={status} onClick={() => setFilter(status)} className={`rounded-full border px-4 py-2 text-sm ${filter === status ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{status ? label(status, t) : t.all}</button>)}</div>
    {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    {loading ? <p className="py-12 text-center text-muted-foreground">{t.loading}</p> : rows.length === 0 ? <p className="rounded-xl border p-10 text-center text-muted-foreground">{t.empty}</p> : <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[1100px] text-left text-sm"><thead className="bg-muted/50"><tr>{[t.applicant,t.amount,t.application,t.proof,t.status,t.remarks,t.reviewedBy,t.actions].map(x=><th key={x} className="whitespace-nowrap px-4 py-3 font-semibold">{x}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.id} className="border-t"><td className="min-w-40 px-4 py-3"><strong>{row.applicant?.name || "—"}</strong><div className="whitespace-nowrap text-xs text-muted-foreground">{row.applicant?.mobile || row.applicant?.email || ""}</div>{row.utr && <div className="mt-1 text-xs">{t.utr}: {row.utr}</div>}</td><td className="whitespace-nowrap px-4 py-3 font-semibold">₹{Number(row.amount).toLocaleString("en-IN")}</td><td className="px-4 py-3"><div>{row.referenceId || "—"}</div><div className="text-xs text-muted-foreground">{row.applicant?.type === "STUDENT" ? (lang === "hi" ? "विद्यार्थी" : "Student") : (lang === "hi" ? "परिवार" : "Family")} · {row.applicant?.status ? statusLabel(row.applicant.status, lang) : ""}</div></td><td className="px-4 py-3">{row.hasScreenshot ? <button className="inline-flex items-center gap-1 text-primary underline" onClick={() => openProof(row)}>{t.proof}<ExternalLink className="h-3 w-3"/></button> : "—"}</td><td className="px-4 py-3"><span className="whitespace-nowrap rounded-full bg-muted px-2.5 py-1 text-xs">{label(row.paymentStatus,t)}</span>{row.refundReference && <div className="mt-1 max-w-40 text-xs text-muted-foreground">₹{row.refundAmount} · {row.refundReference}</div>}</td><td className="px-4 py-3"><p className="max-w-56 whitespace-pre-line break-words text-xs leading-relaxed">{row.adminRemarks || "—"}</p></td><td className="px-4 py-3">{row.reviewer ? <><div className="font-medium">{row.reviewer.name || "—"}</div>{row.reviewedAt && <div className="whitespace-nowrap text-xs text-muted-foreground">{new Date(row.reviewedAt).toLocaleString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>}</> : <span className="text-xs text-muted-foreground">{t.notReviewed}</span>}</td><td className="px-4 py-3"><Button size="sm" variant="outline" onClick={()=>{setTarget(row);setReason("");setRefundAmount(String(row.amount));setRefundReference("");setError("")}}>{t.actions}</Button></td></tr>)}</tbody></table></div>}
    {target && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={t.actions}><div className="w-full max-w-md space-y-4 rounded-2xl bg-card p-5 shadow-xl"><div className="flex items-start justify-between"><div><h2 className="text-lg font-semibold">{target.applicant?.name || target.referenceId}</h2><p className="text-sm text-muted-foreground">₹{Number(target.amount).toLocaleString("en-IN")} · {label(target.paymentStatus,t)}</p></div><button onClick={()=>setTarget(null)} aria-label="Close"><X className="h-5 w-5"/></button></div><label className="block space-y-2 text-sm">{t.reason}<textarea className="min-h-20 w-full rounded-lg border bg-background p-3" value={reason} onChange={e=>setReason(e.target.value)} maxLength={1000}/></label>{["REFUND_REQUESTED","REFUND_PROCESSING"].includes(target.paymentStatus) && <div className="grid gap-3 sm:grid-cols-2"><label className="space-y-2 text-sm">{t.refundAmount}<input type="number" min="0.01" max={target.amount} step="0.01" className="w-full rounded-lg border bg-background p-2" value={refundAmount} onChange={e=>setRefundAmount(e.target.value)}/></label><label className="space-y-2 text-sm">{t.refundReference}<input className="w-full rounded-lg border bg-background p-2" value={refundReference} onChange={e=>setRefundReference(e.target.value)} maxLength={120}/></label></div>}<div className="grid gap-2 sm:grid-cols-2">{["SUBMITTED","PENDING","REJECTED"].includes(target.paymentStatus) && <Button disabled={busy} onClick={()=>decide("VERIFIED")}><Check className="mr-1 h-4 w-4"/>{t.verify}</Button>}{["SUBMITTED","PENDING","VERIFIED"].includes(target.paymentStatus) && <Button disabled={busy} variant="destructive" onClick={()=>decide("REJECTED")}><X className="mr-1 h-4 w-4"/>{t.reject}</Button>}{["VERIFIED","SUCCESS"].includes(target.paymentStatus) && <Button disabled={busy} variant="outline" onClick={()=>decide("REFUND_REQUESTED")}><RotateCcw className="mr-1 h-4 w-4"/>{t.requestRefund}</Button>}{target.paymentStatus === "REFUND_REQUESTED" && <Button disabled={busy} variant="outline" onClick={()=>decide("REFUND_PROCESSING")}>{t.processing}</Button>}{["REFUND_REQUESTED","REFUND_PROCESSING"].includes(target.paymentStatus) && <Button disabled={busy} onClick={()=>decide("REFUNDED")}><Check className="mr-1 h-4 w-4"/>{t.refund}</Button>}{["REFUND_REQUESTED","REFUND_PROCESSING"].includes(target.paymentStatus) && <Button disabled={busy} variant="destructive" onClick={()=>decide("REFUND_REJECTED")}><X className="mr-1 h-4 w-4"/>{t.refundRejected}</Button>}</div>{busy&&<p className="text-center text-xs text-muted-foreground"><Loader2 className="mr-1 inline h-3 w-3 animate-spin"/>…</p>}</div></div>}
  </section>;
}

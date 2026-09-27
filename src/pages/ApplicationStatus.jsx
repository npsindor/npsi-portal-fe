import React, { useState } from "react";
import { Search, FileText, Clock, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import PublicNav from "@/components/PublicNav";
import StatusBadge from "@/components/StatusBadge";
import { base44 } from "@/api/base44Client";
import { useT } from "@/lib/i18n";

export default function ApplicationStatus() {
  const t = useT();
  const [applicationId, setApplicationId] = useState("");
  const [mobile, setMobile] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    try {
      const app = await base44.trackApplication(applicationId.trim(), mobile.trim());
      setResult(app || null);
    } catch (err) {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <section className="border-b border-gold/30 bg-cream/50">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <span className="gold-badge">{t("status.badge")}</span>
          <h1 className="mt-4 font-display text-4xl font-semibold text-maroon">{t("status.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("status.sub")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <form onSubmit={handleSearch} className="rounded-2xl border border-gold/30 bg-card p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("status.appId")}</label>
              <input
                value={applicationId}
                onChange={(e) => setApplicationId(e.target.value)}
                placeholder="NPSI-APP-2026-000125"
                required
                className="mt-1.5 w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm outline-none focus:border-maroon focus:ring-1 focus:ring-maroon"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("status.mobile")}</label>
              <input
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="9876543210"
                required
                className="mt-1.5 w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm outline-none focus:border-maroon focus:ring-1 focus:ring-maroon"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-maroon px-6 py-3 text-sm font-semibold text-cream transition hover:bg-maroon-dark disabled:opacity-60"
          >
            <Search className="h-4 w-4" />
            {loading ? t("status.checking") : t("status.check")}
          </button>
        </form>

        {searched && !loading && (
          <div className="mt-6">
            {result ? (
              <div className="rounded-2xl border border-gold/30 bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-gold/20 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-maroon/10">
                      <FileText className="h-5 w-5 text-maroon" />
                    </div>
                    <div>
                      <div className="font-display text-lg font-semibold text-maroon">{result.application_id}</div>
                      <div className="text-xs text-muted-foreground">{result.family_head_name}</div>
                    </div>
                  </div>
                  <StatusBadge status={result.status} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">{t("status.familyName")}</div>
                    <div className="text-sm font-medium text-foreground">{result.family_name}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">{t("status.submittedOn")}</div>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      {result.submitted_date ? new Date(result.submitted_date).toLocaleDateString("en-IN") : "—"}
                    </div>
                  </div>
                </div>
                {result.status === "APPROVED" && result.resulting_family_id && (
                  <div className="mt-4 rounded-xl border border-green-300 bg-green-50 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-green-800">
                      <CheckCircle2 className="h-4 w-4" />
                      {t("status.approved")}
                    </div>
                    <p className="mt-1 text-sm text-green-700">
                      {t("status.approvedD", { id: result.resulting_family_id })}
                    </p>
                  </div>
                )}
                {result.status === "CORRECTION_REQUIRED" && (
                  <div className="mt-4 rounded-xl border border-orange-300 bg-orange-50 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-orange-800">
                      <AlertCircle className="h-4 w-4" />
                      {t("status.correction")}
                    </div>
                    <p className="mt-1 text-sm text-orange-700">{result.admin_remarks || t("status.correctionD")}</p>
                  </div>
                )}
                {result.status === "REJECTED" && (
                  <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-red-800">
                      <XCircle className="h-4 w-4" />
                      {t("status.rejected")}
                    </div>
                    <p className="mt-1 text-sm text-red-700">{result.admin_remarks || t("status.rejectedD")}</p>
                  </div>
                )}
                {result.status === "PENDING_VERIFICATION" && (
                  <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                      <Clock className="h-4 w-4" />
                      {t("status.underVerification")}
                    </div>
                    <p className="mt-1 text-sm text-amber-700">{t("status.underVerificationD")}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                <p className="text-sm text-muted-foreground">{t("status.notFound")}</p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
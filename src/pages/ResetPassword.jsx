import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { useT } from "@/lib/i18n";

export default function ResetPassword() {
  const t = useT();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    // Fall back to the actual DOM values: browser/OS password managers can
    // fill these fields directly without firing React's onChange, leaving
    // state empty even though the inputs visibly show a value.
    const formValues = new FormData(e.currentTarget);
    const effectiveNewPassword = String(formValues.get("password") || newPassword || "");
    const effectiveConfirmPassword = String(formValues.get("confirm") || confirmPassword || "");
    if (effectiveNewPassword.length < 6) {
      setError(t("auth.pwdMinLength"));
      return;
    }
    if (effectiveNewPassword !== effectiveConfirmPassword) {
      setError(t("auth.pwdNoMatch"));
      return;
    }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken, newPassword: effectiveNewPassword });
      window.location.href = "/login";
    } catch (err) {
      setError(err.message || t("auth.resetFailed"));
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title={t("auth.invalidTitle")}
        subtitle={t("auth.invalidSub")}
        footer={
          <Link to="/forgot-password" className="text-primary font-medium hover:underline">
            {t("auth.requestNew")}
          </Link>
        }
      >
        <p className="text-sm text-foreground text-center">{t("auth.invalidMsg")}</p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Lock}
      title={t("auth.newTitle")}
      subtitle={t("auth.newSub")}
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">{t("auth.newPassword")}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              autoFocus
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">{t("auth.confirm")}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <PasswordInput
              id="confirm"
              name="confirm"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("auth.resetting")}
            </>
          ) : (
            t("auth.resetBtn")
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
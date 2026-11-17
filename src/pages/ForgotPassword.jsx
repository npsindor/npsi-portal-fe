import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, KeyRound, Loader2, Lock, Mail } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AuthLayout from "@/components/AuthLayout";
import MobileOtpForm from "@/components/MobileOtpForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useLang, useT } from "@/lib/i18n";
import { regCopy, translateError } from "@/lib/registration-copy";

// Reset by mobile (code on WhatsApp / SMS, then a new password here) or by email (reset link).
export default function ForgotPassword() {
  const tt = useT();
  const { lang } = useLang();
  const t = regCopy[lang];
  const [mode, setMode] = useState("MOBILE");
  const [verified, setVerified] = useState(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (work) => {
    setError("");
    setBusy(true);
    try {
      await work();
    } catch (err) {
      setError(translateError(err.message, lang));
    } finally {
      setBusy(false);
    }
  };

  const saveMobilePassword = (e) => {
    e.preventDefault();
    if (password.length < 8) return setError(translateError("Password must be at least 8 characters.", lang));
    if (password !== confirm) return setError(t.passwordsDiffer);
    return run(async () => {
      await base44.auth.resetPassword({ phone: verified.mobile, verificationToken: verified.verificationToken, newPassword: password });
      setDone(t.resetDone);
    });
  };

  const sendLink = (e) => {
    e.preventDefault();
    return run(async () => {
      await base44.auth.resetPasswordRequest(email.trim());
      setDone(t.resetMailSent);
    });
  };

  return (
    <AuthLayout
      icon={KeyRound}
      title={t.forgotTitle}
      subtitle={t.forgotSub}
      footer={
        <Link to="/login" className="inline-flex items-center gap-1 text-primary font-medium hover:underline">
          <ArrowLeft className="w-4 h-4" />
          {t.login}
        </Link>
      }
    >
      {done ? (
        <div className="space-y-4 text-center">
          <p role="status" className="p-3 rounded-lg bg-primary/10 text-sm">
            {done}
          </p>
          <Button asChild className="w-full h-12">
            <Link to="/login">{t.login}</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-muted p-1" role="tablist">
            {[
              ["MOBILE", t.byMobile],
              ["EMAIL", t.byEmail],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={mode === key}
                className={`rounded-lg py-2 text-sm font-medium ${mode === key ? "bg-card shadow-sm" : "text-muted-foreground"}`}
                onClick={() => {
                  setMode(key);
                  setError("");
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {error && (
            <div role="alert" className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
          {mode === "MOBILE" && !verified && <MobileOtpForm purpose="RESET" onVerified={setVerified} onUnsupported={() => {
            setMode("EMAIL");
            setError(lang === "hi"
              ? "इस सर्वर पर मोबाइल OTP रीसेट उपलब्ध नहीं है। पासवर्ड रीसेट करने के लिए अपना पंजीकृत ईमेल दर्ज करें।"
              : "Mobile OTP reset is not available on this server yet. Enter your registered email to reset your password.");
          }} />}
          {mode === "MOBILE" && verified && (
            <form onSubmit={saveMobilePassword} className="space-y-4">
              <p className="text-sm text-muted-foreground">+91 {verified.mobile} ✓</p>
              {[
                ["fp-new", t.newPassword, password, setPassword],
                ["fp-confirm", t.confirmPassword, confirm, setConfirm],
              ].map(([id, label, value, set]) => (
                <div key={id} className="space-y-2">
                  <Label htmlFor={id}>{label}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <PasswordInput id={id} autoComplete="new-password" value={value} onChange={(e) => set(e.target.value)} className="pl-10 h-12" required minLength={8} />
                  </div>
                </div>
              ))}
              <Button type="submit" className="w-full h-12" disabled={busy}>
                {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {t.savePassword}
              </Button>
            </form>
          )}
          {mode === "EMAIL" && (
            <form onSubmit={sendLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fp-email">{tt("auth.emailAddress")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  <Input id="fp-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" required />
                </div>
              </div>
              <Button type="submit" className="w-full h-12" disabled={busy}>
                {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {t.sendLink}
              </Button>
            </form>
          )}
        </>
      )}
    </AuthLayout>
  );
}

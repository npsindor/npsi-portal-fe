import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Lock, UserPlus, User, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AuthLayout from "@/components/AuthLayout";
import MobileOtpForm from "@/components/MobileOtpForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { safeReturnTo } from "@/lib/authReturnTo";
import { useLang, useT } from "@/lib/i18n";
import { regCopy, translateError } from "@/lib/registration-copy";
import { getRecaptchaToken } from "@/lib/recaptcha";

// Account-first registration: mobile → code on WhatsApp → password. The new account is logged in and
// goes straight to the registration form (family ₹500 / student ₹100).
export default function Register() {
  const tt = useT();
  const { lang } = useLang();
  const t = regCopy[lang];
  const [verified, setVerified] = useState(null); // { mobile, email, verificationToken }
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [legacyContact, setLegacyContact] = useState(null);
  const [legacyCode, setLegacyCode] = useState("");
  const returnTo = safeReturnTo();
  const step = verified ? 2 : 0;

  const create = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError(translateError("Password must be at least 6 characters.", lang));
    if (password !== confirm) return setError(t.passwordsDiffer);
    setBusy(true);
    try {
      await base44.auth.registerWithMobile({
        phone: verified.mobile,
        verificationToken: verified.verificationToken,
        password,
        email: verified.email || undefined,
        fullName: fullName.trim() || undefined,
      });
      window.location.href = returnTo !== "/" ? returnTo : "/portal/registration";
    } catch (err) {
      const message = translateError(err.message, lang);
      // An expired verification can only be fixed by verifying again.
      if (/verification has expired|सत्यापन की अवधि/.test(message)) setVerified(null);
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const legacyCreate = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError(translateError("Password must be at least 6 characters.", lang));
    if (password !== confirm) return setError(t.passwordsDiffer);
    setBusy(true);
    try {
      const recaptchaToken = await getRecaptchaToken("register");
      await base44.auth.register({
        email: legacyContact.email,
        phone: legacyContact.mobile,
        fullName: fullName.trim() || undefined,
        password,
        recaptchaToken,
      });
      setLegacyContact((current) => ({ ...current, awaitingEmailCode: true }));
    } catch (err) {
      setError(translateError(err.message, lang));
    } finally {
      setBusy(false);
    }
  };

  const legacyVerify = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await base44.auth.verifyOtp({ email: legacyContact.email, otpCode: legacyCode });
      window.location.href = returnTo !== "/" ? returnTo : "/portal/registration";
      return result;
    } catch (err) {
      setError(translateError(err.message, lang));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      icon={UserPlus}
      title={t.accountTitle}
      subtitle={t.accountSub}
      footer={
        <>
          {t.haveAccount}{" "}
          <Link to={"/login" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")} className="text-primary font-medium hover:underline">
            {t.login}
          </Link>
        </>
      }
    >
      <ol className="mb-6 flex items-center gap-2 text-xs font-medium" aria-label={t.accountTitle}>
        {[t.stepMobile, t.stepOtp, t.stepPassword].map((label, index) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${index <= (verified ? 2 : step) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              aria-current={index === (verified ? 2 : 0) ? "step" : undefined}
            >
              {index + 1}
            </span>
            <span className="truncate">{label}</span>
          </li>
        ))}
      </ol>

      {!verified && !legacyContact ? (
        <MobileOtpForm purpose="REGISTER" askEmail onVerified={setVerified} onUnsupported={setLegacyContact} />
      ) : legacyContact?.awaitingEmailCode ? (
        <form onSubmit={legacyVerify} className="space-y-4">
          <p role="status" className="rounded-lg bg-primary/10 p-3 text-sm">
            {lang === "hi" ? `हमने ${legacyContact.email} पर OTP भेजा है।` : `We sent a verification code to ${legacyContact.email}.`}
          </p>
          {error && <div role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          <Label htmlFor="legacy-register-code">{t.enterCode}</Label>
          <div className="relative">
            <ShieldCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="legacy-register-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={legacyCode} onChange={(event) => setLegacyCode(event.target.value.replace(/\D/g, "").slice(0, 6))} className="h-12 pl-10 tracking-[0.5em]" required />
          </div>
          <Button type="submit" className="h-12 w-full" disabled={busy || legacyCode.length !== 6}>{busy ? t.verifying : t.verify}</Button>
          <button type="button" className="text-sm text-primary hover:underline disabled:opacity-50" disabled={busy} onClick={async () => {
            setBusy(true); setError("");
            try { await base44.auth.resendOtp(legacyContact.email); }
            catch (err) { setError(translateError(err.message, lang)); }
            finally { setBusy(false); }
          }}>{t.resend}</button>
        </form>
      ) : legacyContact ? (
        <form onSubmit={legacyCreate} className="space-y-4">
          <p role="status" className="rounded-lg bg-primary/10 p-3 text-sm">
            {lang === "hi" ? "इस सर्वर पर मोबाइल OTP उपलब्ध नहीं है। SMS शुल्क से बचने के लिए ईमेल पर निःशुल्क सत्यापन कोड भेजा जाएगा।" : "Mobile OTP is not available on this server yet. We’ll use an email verification code so you won’t incur SMS charges."}
          </p>
          {error && <div role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          <p className="text-sm text-muted-foreground">+91 {legacyContact.mobile}</p>
          <div className="space-y-2"><Label htmlFor="legacy-register-email">{lang === "hi" ? "ईमेल" : "Email"}</Label><Input id="legacy-register-email" type="email" autoComplete="email" value={legacyContact.email} onChange={(event) => setLegacyContact((current) => ({ ...current, email: event.target.value }))} required /></div>
          <div className="space-y-2"><Label htmlFor="reg-name">{t.fullName}</Label><Input id="reg-name" autoComplete="name" maxLength={255} value={fullName} onChange={(event) => setFullName(event.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="reg-password">{t.createPassword}</Label><PasswordInput id="reg-password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12" required minLength={6} /></div>
          <div className="space-y-2"><Label htmlFor="reg-confirm">{t.confirmPassword}</Label><PasswordInput id="reg-confirm" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} className="h-12" required minLength={6} /></div>
          <Button type="submit" className="h-12 w-full" disabled={busy}>{busy ? t.creating : t.createAccount}</Button>
        </form>
      ) : (
        <form onSubmit={create} className="space-y-4">
          {error && (
            <div role="alert" className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
          <p className="text-sm text-muted-foreground">+91 {verified.mobile} ✓</p>
          <div className="space-y-2">
            <Label htmlFor="reg-name">{t.fullName}</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input id="reg-name" autoComplete="name" maxLength={255} value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10 h-12" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-password">{t.createPassword}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <PasswordInput id="reg-password" autoComplete="new-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-12" required minLength={6} />
            </div>
            <p className="text-xs text-muted-foreground">{t.passwordRule}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-confirm">{t.confirmPassword}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <PasswordInput id="reg-confirm" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="pl-10 h-12" required minLength={6} />
            </div>
          </div>
          <Button type="submit" className="w-full h-12" disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {busy ? t.creating : t.createAccount}
          </Button>
        </form>
      )}
      <Link to="/" className="mt-6 inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary">
        <ArrowLeft className="h-4 w-4" />
        {tt("common.backToWebsite")}
      </Link>
    </AuthLayout>
  );
}

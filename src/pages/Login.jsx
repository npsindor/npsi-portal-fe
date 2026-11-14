import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, GraduationCap, LogIn, Mail, Lock, Loader2, ShieldCheck } from "lucide-react";
import { isStudentReturn } from "@/lib/student-flow";
import AuthLayout from "@/components/AuthLayout";
import { safeReturnTo } from "@/lib/authReturnTo";
import { useLang, useT } from "@/lib/i18n";
import { regCopy, translateError } from "@/lib/registration-copy";

export default function Login() {
  const t = useT();
  const { lang } = useLang();
  const rt = regCopy[lang];
  const [email, setEmail] = useState("");
  // Unverified account: the server just emailed a fresh code; verify it here.
  const [needsCode, setNeedsCode] = useState(false);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const returnTo = safeReturnTo();
  // Arriving from "Student Login": same login, then the student registration (₹100).
  const student = isStudentReturn(returnTo);

  const goOn = (result) => {
    // If the user landed on /login directly (no returnTo from a protected
    // route), send them to their portal instead of the public homepage.
    window.location.href = returnTo !== "/" ? returnTo : result?.user?.role === "admin" ? "/admin" : "/portal";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const identifier = email.trim();
      // A mobile number is sent as its 10 digits ("+91 98765-43210" → "9876543210").
      const digits = identifier.replace(/\D/g, "");
      const loginId = identifier.includes("@") ? identifier : digits.length >= 10 ? digits.slice(-10) : identifier;
      goOn(await base44.auth.loginViaEmailPassword(loginId, password));
    } catch (err) {
      if (err.status === 403 && email.includes("@")) setNeedsCode(true);
      setError(err.status === 403 ? rt.notVerified : translateError(err.message || "Invalid email/phone or password.", lang));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      goOn(await base44.auth.verifyOtp({ email: email.trim(), otpCode: code }));
    } catch (err) {
      setError(translateError(err.message, lang));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={student ? GraduationCap : LogIn}
      title={student ? (lang === "hi" ? "विद्यार्थी लॉगिन" : "Student Login") : t("auth.loginTitle")}
      subtitle={student ? (lang === "hi" ? "लॉगिन करें या नया खाता बनाएँ, फिर ₹100 शुल्क के साथ विद्यार्थी पंजीकरण पूरा करें।" : "Log in or create an account, then complete your student registration (₹100 fee).") : t("auth.loginSub")}
      footer={
        <>
          {t("auth.noAccount")}{" "}
          <Link
            to={"/register-account" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")}
            className="text-primary font-medium hover:underline"
          >
            {t("auth.createOne")}
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {needsCode && (
        <form onSubmit={verifyCode} className="space-y-3 mb-6">
          <Label htmlFor="login-code">{rt.enterCode}</Label>
          <div className="relative">
            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="login-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="pl-10 h-12 tracking-[0.5em]"
              required
            />
          </div>
          <Button type="submit" className="w-full h-12" disabled={loading}>
            {rt.verify}
          </Button>
        </form>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{rt.identifier}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="text"
              inputMode="email"
              autoComplete="username"
              autoFocus
              placeholder="98765 43210 / you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              {t("auth.forgot")}
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <PasswordInput
              id="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("auth.loggingIn")}
            </>
          ) : (
            t("auth.loginBtn")
          )}
        </Button>
      </form>
      <Link
        to="/"
        className="mt-6 inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("common.backToWebsite")}
      </Link>
    </AuthLayout>
  );
}
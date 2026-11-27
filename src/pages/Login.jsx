import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, GraduationCap, Info, LogIn, Mail, MailCheck, Lock, Loader2, ShieldCheck } from "lucide-react";
import { isFamilyOnlyPath, isStudentReturn, STUDENT_REGISTRATION_PATH, USE_FAMILY_LOGIN, USE_STUDENT_LOGIN } from "@/lib/student-flow";
import AuthLayout from "@/components/AuthLayout";
import { safeReturnTo } from "@/lib/authReturnTo";
import { useLang, useT } from "@/lib/i18n";
import { fill, regCopy, translateError } from "@/lib/registration-copy";

const NOT_VERIFIED = "Please verify your account before logging in.";
// Administrators: after the password, a sign-in code is emailed; the same code step finishes the login.
const ADMIN_CODE_REQUIRED = "Enter the sign-in code sent to your email to finish logging in.";
// Seconds before another code can be requested.
const RESEND_WAIT = 30;
// "vinay.patidar@gmail.com" → "v•••••@gmail.com": enough to recognise the inbox without showing the whole address.
const maskEmail = (value) => {
  const [local, domain] = value.split("@");
  return `${local.slice(0, 1)}${"•".repeat(Math.min(Math.max(local.length - 1, 3), 5))}@${domain}`;
};
// A mobile number is sent as its 10 digits ("+91 98765-43210" → "9876543210").
const toLoginId = (value) => {
  const identifier = value.trim();
  const digits = identifier.replace(/\D/g, "");
  return identifier.includes("@") ? identifier : digits.length >= 10 ? digits.slice(-10) : identifier;
};
const PORTALS = {
  FAMILY: { en: "Family Member Login", hi: "परिवार सदस्य लॉगिन", icon: LogIn },
  STUDENT: { en: "Student Login", hi: "विद्यार्थी लॉगिन", icon: GraduationCap },
};

export default function Login() {
  const t = useT();
  const { lang } = useLang();
  const rt = regCopy[lang];
  const [email, setEmail] = useState("");
  // Second step (an administrator, or an account not verified yet): the server just emailed a code; verify it here.
  const [needsCode, setNeedsCode] = useState(false);
  const [code, setCode] = useState("");
  const [wait, setWait] = useState(0);
  const [resent, setResent] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (wait <= 0) return undefined;
    const timer = setTimeout(() => setWait((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);
  const returnTo = safeReturnTo();
  // Family Member Login or Student Login. The choice is sent to the server, which checks it against the account's own
  // registration records and refuses the other portal; nothing here decides what the account is.
  const [portal, setPortal] = useState(() =>
    new URLSearchParams(window.location.search).get("portal") === "student" || isStudentReturn(returnTo) ? "STUDENT" : "FAMILY",
  );
  const student = portal === "STUDENT";
  // The server said this account belongs to the other portal: offer to switch.
  const [otherPortal, setOtherPortal] = useState(null);
  const choosePortal = (next) => {
    setPortal(next);
    setOtherPortal(null);
    setError("");
    setNeedsCode(false);
  };

  // Where to go, from the account type the server returned.
  const goOn = (result) => {
    const account = result?.account || {};
    let next = returnTo;
    if (account.type === "ADMIN" || result?.user?.role === "admin") next = returnTo !== "/" ? returnTo : "/admin";
    else if (account.type === "STUDENT")
      next = isFamilyOnlyPath(returnTo) || returnTo === "/" ? "/portal" : isStudentReturn(returnTo) && account.status === "ACTIVE" ? "/portal" : returnTo;
    else if (account.type === "FAMILY") next = returnTo === "/" || isStudentReturn(returnTo) ? "/portal" : returnTo;
    // A new account with no registration yet: Student Login starts the student registration.
    else next = student && (returnTo === "/" || isFamilyOnlyPath(returnTo)) ? STUDENT_REGISTRATION_PATH : returnTo !== "/" ? returnTo : "/portal";
    window.location.href = next;
  };
  const showError = (err) => {
    const message = err.message || "Invalid email/phone or password.";
    setOtherPortal(message === USE_FAMILY_LOGIN ? "FAMILY" : message === USE_STUDENT_LOGIN ? "STUDENT" : null);
    setError(message === NOT_VERIFIED ? rt.notVerified : translateError(message, lang));
  };
  // The password step answered "a code was emailed" (403): show the code step, not an error.
  const codeSent = (err) => err.status === 403 && (err.message === ADMIN_CODE_REQUIRED || (err.message === NOT_VERIFIED && email.includes("@")));
  const openCodeStep = () => {
    setCode("");
    setError("");
    setOtherPortal(null);
    setNeedsCode(true);
    setWait(RESEND_WAIT);
  };
  const leaveCodeStep = () => {
    setNeedsCode(false);
    setCode("");
    setError("");
    setResent(false);
    setWait(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setResent(false);
    try {
      goOn(await base44.auth.loginViaEmailPassword(toLoginId(email), password, portal));
    } catch (err) {
      // Only an administrator or an unverified account gets the emailed-code step; other 403s are portal or status messages.
      if (codeSent(err)) openCodeStep();
      else showError(err);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // An administrator may have logged in with their mobile: the server accepts that in place of the email.
      goOn(
        await base44.auth.verifyOtp({
          email: toLoginId(email),
          otpCode: code,
          portal,
        }),
      );
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  // A new code: the same password step again (the server emails a fresh code and answers 403 as before).
  const resendCode = async () => {
    setError("");
    setResent(false);
    setLoading(true);
    try {
      goOn(await base44.auth.loginViaEmailPassword(toLoginId(email), password, portal));
    } catch (err) {
      if (codeSent(err)) {
        setCode("");
        setResent(true);
        setWait(RESEND_WAIT);
      } else showError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={student ? GraduationCap : LogIn}
      title={PORTALS[portal][lang === "hi" ? "hi" : "en"]}
      subtitle={
        student
          ? lang === "hi"
            ? "पंजीकृत विद्यार्थी यहाँ लॉगिन करें। नए विद्यार्थी खाता बनाकर ₹100 शुल्क के साथ विद्यार्थी पंजीकरण पूरा करें।"
            : "Registered students sign in here. New students: create an account, then complete the student registration (₹100 fee)."
          : lang === "hi"
            ? "पंजीकृत परिवार सदस्य और प्रशासक यहाँ लॉगिन करें।"
            : "Registered family members and administrators sign in here."
      }
      footer={
        <>
          {t("auth.noAccount")}{" "}
          <Link
            to={(() => {
              const after = returnTo !== "/" ? returnTo : student ? STUDENT_REGISTRATION_PATH : "/";
              return "/register-account" + (after !== "/" ? "?returnTo=" + encodeURIComponent(after) : "");
            })()}
            className="text-primary font-medium hover:underline"
          >
            {t("auth.createOne")}
          </Link>
        </>
      }
    >
      {!needsCode && (
        <div role="group" aria-label={lang === "hi" ? "लॉगिन प्रकार" : "Login type"} className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
          {Object.entries(PORTALS).map(([key, item]) => {
            const Icon = item.icon;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={portal === key}
                onClick={() => choosePortal(key)}
                className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-semibold transition ${portal === key ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {item[lang === "hi" ? "hi" : "en"]}
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <div role="alert" className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
          {otherPortal && (
            <button type="button" onClick={() => choosePortal(otherPortal)} className="mt-2 block font-semibold underline underline-offset-2">
              {lang === "hi" ? `${PORTALS[otherPortal].hi} पर जाएँ` : `Go to ${PORTALS[otherPortal].en}`}
            </button>
          )}
        </div>
      )}

      {needsCode ? (
        <form onSubmit={verifyCode} className="space-y-4">
          <div role="status" className="flex gap-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-950 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100">
            <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-semibold">{rt.loginCodeTitle}</p>
              <p>
                {email.includes("@") ? fill(rt.loginCodeSentTo, { email: maskEmail(email.trim()) }) : rt.loginCodeSentRegistered}
              </p>
              <p className="flex gap-1.5 text-sky-800/90 dark:text-sky-200/80">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{rt.loginCodeHint}</span>
              </p>
              {resent && <p className="font-medium text-sky-700 dark:text-sky-300">{rt.loginCodeResent}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-code">{rt.enterCode}</Label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="login-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={6}
                placeholder="••••••"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="pl-10 h-12 tracking-[0.5em] text-lg"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-12 font-medium" disabled={loading || code.length !== 6}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {loading ? rt.verifying : rt.verify}
          </Button>
          <div className="flex flex-wrap justify-between gap-2 text-sm">
            <button
              type="button"
              className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
              disabled={wait > 0 || loading}
              onClick={resendCode}
            >
              {wait > 0 ? fill(rt.resendIn, { s: wait }) : rt.resend}
            </button>
            <button type="button" className="text-muted-foreground hover:text-primary" onClick={leaveCodeStep}>
              {rt.useOtherAccount}
            </button>
          </div>
        </form>
      ) : (
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
      )}
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

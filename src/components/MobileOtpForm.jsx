import React, { useEffect, useState } from "react";
import { Loader2, Mail, Phone, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLang } from "@/lib/i18n";
import { getRecaptchaToken } from "@/lib/recaptcha";
import { fill, regCopy, translateError } from "@/lib/registration-copy";

const RESEND_SECONDS = 30;

// Mobile number → 6-digit code (WhatsApp / SMS / email fallback) → verified. Calls
// onVerified({ mobile, email, verificationToken }); the caller decides what comes next
// (create a password for a new account, or set a new one).
// The +91 prefix is shown beside the field, so it holds the 10-digit number only: a pasted "+91 98765 43210"
// or "098765 43210" keeps its last 10 digits, and typing stops at 10.
const tenDigits = (value) => {
  let digits = value.replace(/\D/g, "");
  if (digits.length > 10 && /^(91|0)/.test(digits)) digits = digits.replace(/^(91|0)/, "");
  return digits.slice(0, 10);
};

export default function MobileOtpForm({ purpose = "REGISTER", askEmail = false, initialMobile = "", autoFocus = true, onVerified, onUnsupported }) {
  const { lang } = useLang();
  const t = regCopy[lang];
  const [mobile, setMobile] = useState(() => tenDigits(String(initialMobile || "")));
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(null); // { channel }
  const [wait, setWait] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (wait <= 0) return undefined;
    const timer = setTimeout(() => setWait((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const digits = mobile;

  const send = async (e) => {
    e?.preventDefault();
    setError("");
    if (!/^[6-9]\d{9}$/.test(digits)) return setError(translateError("A valid 10-digit mobile number is required.", lang));
    setBusy(true);
    try {
      const recaptchaToken = await getRecaptchaToken(purpose === "REGISTER" ? "mobile_otp" : "mobile_reset");
      const result = await base44.auth.requestMobileOtp({ mobile: digits, purpose, email: email.trim() || undefined, recaptchaToken });
      setSent({ channel: result.channel });
      setCode("");
      setWait(RESEND_SECONDS);
    } catch (err) {
      if (purpose === "RESET" && err.status === 404 && onUnsupported) {
        onUnsupported();
        return;
      }
      if (purpose === "REGISTER" && err.status === 404 && onUnsupported) {
        onUnsupported({ mobile: digits, email: email.trim() });
        return;
      }
      setError(translateError(err.message, lang));
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(code)) return setError(translateError("A valid 6-digit verification code is required.", lang));
    setBusy(true);
    try {
      const { verificationToken } = await base44.auth.verifyMobileOtp({ mobile: digits, purpose, code });
      onVerified({ mobile: digits, email: email.trim(), verificationToken });
    } catch (err) {
      setError(translateError(err.message, lang));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div role="alert" className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
      {!sent ? (
        <form onSubmit={send} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp-mobile">{t.mobile}</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <span className="absolute left-9 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">+91</span>
              <Input
                id="otp-mobile"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                autoFocus={autoFocus}
                placeholder="9876543210"
                value={mobile}
                onChange={(e) => setMobile(tenDigits(e.target.value))}
                pattern="[6-9][0-9]{9}"
                title={t.mobileTenDigits}
                className="pl-[4.5rem] h-12"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">{askEmail ? t.mobileHintEmail : t.mobileHint}</p>
          </div>
          {askEmail && (
            <div className="space-y-2">
              <Label htmlFor="otp-email">{askEmail ? t.emailForOtp : t.emailOptional}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Input id="otp-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" required={askEmail} />
              </div>
              <p className="text-xs text-muted-foreground">{t.emailHint}</p>
            </div>
          )}
          <Button type="submit" className="w-full h-12" disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {busy ? t.sending : t.sendCode}
          </Button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-4">
          <p role="status" className="text-sm text-muted-foreground">
            {fill(t.codeSentTo, { mobile: `+91 ${digits}`, channel: t[sent.channel] || sent.channel })}
            {purpose === "RESET" && sent.channel !== "EMAIL" && <span className="mt-1 block">{t.resetCodeEmailCopy}</span>}
            {purpose === "REGISTER" && sent.channel === "EMAIL" && <span className="mt-1 block">{t.emailedMobileUnverified}</span>}
          </p>
          <div className="space-y-2">
            <Label htmlFor="otp-code">{t.enterCode}</Label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="otp-code"
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
          <Button type="submit" className="w-full h-12" disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {busy ? t.verifying : t.verify}
          </Button>
          <div className="flex flex-wrap justify-between gap-2 text-sm">
            <button type="button" className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline" disabled={wait > 0 || busy} onClick={send}>
              {wait > 0 ? fill(t.resendIn, { s: wait }) : t.resend}
            </button>
            <button
              type="button"
              className="text-muted-foreground hover:text-primary"
              onClick={() => {
                setSent(null);
                setError("");
              }}
            >
              {t.changeMobile}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

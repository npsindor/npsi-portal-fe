import React, { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from "@/components/ui/use-toast";
import { useLang } from "@/lib/i18n";

const COPY = {
  en: {
    title: "Account email",
    none: "No email on this account",
    hint: "Password reset links go to this email. If it isn't yours, change it now: whoever holds it could reset your password.",
    change: "Change email",
    newEmail: "New email",
    password: "Current password",
    send: "Send code",
    codeSent: (email) => `We sent a 6-digit code to ${email}. Enter it to finish.`,
    code: "Code from the new email",
    confirm: "Confirm new email",
    cancel: "Cancel",
    done: "Email changed. Other devices were signed out.",
    errors: {
      "A valid email address is required.": "Enter a valid email address.",
      "This is already your account email.": "This is already your account email.",
      "Current password is incorrect.": "The current password is incorrect.",
      "An account with this email already exists.": "Another account already uses this email.",
      "The code is incorrect.": "The code is incorrect.",
      "This code has expired. Ask for a new one.": "This code has expired. Ask for a new one.",
    },
  },
  hi: {
    title: "खाते का ईमेल",
    none: "इस खाते में कोई ईमेल नहीं है",
    hint: "पासवर्ड रीसेट लिंक इसी ईमेल पर जाते हैं। यदि यह आपका नहीं है, तो अभी बदलें: जिसके पास यह ईमेल है वह आपका पासवर्ड बदल सकता है।",
    change: "ईमेल बदलें",
    newEmail: "नया ईमेल",
    password: "वर्तमान पासवर्ड",
    send: "कोड भेजें",
    codeSent: (email) => `हमने ${email} पर 6 अंकों का कोड भेजा है। पूरा करने के लिए उसे दर्ज करें।`,
    code: "नए ईमेल पर आया कोड",
    confirm: "नया ईमेल पक्का करें",
    cancel: "रद्द करें",
    done: "ईमेल बदल गया। बाकी डिवाइस से लॉग आउट कर दिया गया।",
    errors: {
      "A valid email address is required.": "सही ईमेल पता दर्ज करें।",
      "This is already your account email.": "यह पहले से आपके खाते का ईमेल है।",
      "Current password is incorrect.": "वर्तमान पासवर्ड गलत है।",
      "An account with this email already exists.": "यह ईमेल किसी दूसरे खाते में है।",
      "The code is incorrect.": "कोड गलत है।",
      "This code has expired. Ask for a new one.": "कोड की समय-सीमा खत्म हो गई। नया कोड मंगाएँ।",
    },
  },
};

const field = "mt-1.5 w-full rounded-xl border border-border bg-cream px-3 py-2.5 text-sm outline-none focus:border-maroon focus:ring-1 focus:ring-maroon";

// Settings → "Account email": shows the email on file and changes it (current password, then a code sent to the new
// address). The old address stops working for sign-in and password resets (security finding 34).
export default function ChangeEmailCard({ user, onChanged }) {
  const { lang } = useLang();
  const t = COPY[lang] || COPY.en;
  const { toast } = useToast();
  const [step, setStep] = useState("idle");
  const [form, setForm] = useState({ email: "", currentPassword: "", code: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const message = (cause) => t.errors[cause?.message] || cause?.message || "";

  const reset = () => { setStep("idle"); setForm({ email: "", currentPassword: "", code: "" }); setError(""); };

  const send = async (event) => {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      await base44.auth.requestEmailChange({ email: form.email.trim(), currentPassword: form.currentPassword });
      setStep("code");
    } catch (cause) { setError(message(cause)); } finally { setBusy(false); }
  };

  const confirm = async (event) => {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      await base44.auth.confirmEmailChange({ code: form.code.trim() });
      toast({ title: t.done });
      reset();
      onChanged?.();
    } catch (cause) { setError(message(cause)); } finally { setBusy(false); }
  };

  return (
    <section id="email" aria-labelledby="account-email-title" className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <Mail className="mt-0.5 h-5 w-5 shrink-0 text-maroon" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 id="account-email-title" className="font-semibold text-foreground">{t.title}</h2>
          <p className="break-all text-sm text-foreground">{user?.email || t.none}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t.hint}</p>
        </div>
        {step === "idle" && <Button type="button" variant="outline" size="sm" onClick={() => setStep("email")}>{t.change}</Button>}
      </div>
      {step === "email" && (
        <form onSubmit={send} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="new-email">{t.newEmail}</Label>
            <input id="new-email" type="email" autoComplete="email" required maxLength={254} className={field} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="email-change-password">{t.password}</Label>
            <PasswordInput id="email-change-password" autoComplete="current-password" required className="mt-1.5" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
          </div>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button type="submit" disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}{t.send}</Button>
            <Button type="button" variant="ghost" onClick={reset}>{t.cancel}</Button>
          </div>
        </form>
      )}
      {step === "code" && (
        <form onSubmit={confirm} className="mt-4 space-y-3">
          <p role="status" className="text-sm text-foreground">{t.codeSent(form.email.trim())}</p>
          <div className="max-w-xs">
            <Label htmlFor="email-change-code">{t.code}</Label>
            <input id="email-change-code" inputMode="numeric" autoComplete="one-time-code" required maxLength={10} className={field} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.replace(/\D/g, "").slice(0, 6) })} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy || form.code.length !== 6}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}{t.confirm}</Button>
            <Button type="button" variant="ghost" onClick={reset}>{t.cancel}</Button>
          </div>
        </form>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    </section>
  );
}

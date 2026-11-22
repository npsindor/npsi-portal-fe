import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { CheckCircle2, Smartphone } from "lucide-react";
import { base44 } from "@/api/base44Client";
import MobileOtpForm from "@/components/MobileOtpForm";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useLang } from "@/lib/i18n";
import { translateError } from "@/lib/registration-copy";

const COPY = {
  en: {
    title: "Verify your mobile number",
    text: "Your mobile number isn't verified yet. We'll send a 6-digit code to it by WhatsApp or SMS; enter it here.",
    start: "Verify mobile",
    verified: "Mobile number verified",
    stillEmail: "The code came by email, which doesn't prove the mobile number. Please try again once the code can be sent to the mobile.",
  },
  hi: {
    title: "अपना मोबाइल नंबर सत्यापित करें",
    text: "आपका मोबाइल नंबर अभी सत्यापित नहीं है। हम उस पर WhatsApp या SMS से 6 अंकों का कोड भेजेंगे; उसे यहाँ दर्ज करें।",
    start: "मोबाइल सत्यापित करें",
    verified: "मोबाइल नंबर सत्यापित हो गया",
    stillEmail: "कोड ईमेल से आया, जिससे मोबाइल नंबर सत्यापित नहीं होता। कोड मोबाइल पर भेजा जा सके तब फिर से प्रयास करें।",
  },
};

// Settings → "Verify your mobile number": shown while the account's mobile isn't proven (e.g. the account was made while
// the code could only go by email). The profile-completion step "Mobile verified" links here (#mobile).
export default function VerifyMobileCard({ user, onVerified }) {
  const { lang } = useLang();
  const t = COPY[lang] || COPY.en;
  const { toast } = useToast();
  const { hash } = useLocation();
  const ref = useRef(null);
  const [open, setOpen] = useState(hash === "#mobile");
  const [error, setError] = useState("");

  useEffect(() => {
    if (hash === "#mobile") ref.current?.scrollIntoView({ block: "center" });
  }, [hash]);

  if (!user || user.phoneVerified !== false) return null;

  const verified = async ({ mobile, verificationToken }) => {
    setError("");
    try {
      const me = await base44.auth.updateMe({ phone: mobile, phoneVerificationToken: verificationToken });
      if (!me?.phoneVerified) return setError(t.stillEmail);
      toast({ title: t.verified });
      setOpen(false);
      await onVerified?.();
    } catch (err) {
      setError(translateError(err.message, lang));
    }
  };

  return (
    <section id="mobile" ref={ref} aria-labelledby="verify-mobile-title" className="rounded-2xl border border-amber-300 bg-amber-50/60 p-5 dark:border-amber-700 dark:bg-amber-950/30">
      <div className="flex items-start gap-3">
        <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-maroon" aria-hidden="true" />
        <div className="flex-1">
          <h2 id="verify-mobile-title" className="text-sm font-semibold text-foreground">{t.title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t.text}</p>
        </div>
      </div>
      {error && (
        <div role="alert" className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {open ? (
        <div className="mt-4">
          <MobileOtpForm initialMobile={user.phone || ""} autoFocus={false} onVerified={verified} />
        </div>
      ) : (
        <Button type="button" className="mt-4" onClick={() => setOpen(true)}>
          <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
          {t.start}
        </Button>
      )}
    </section>
  );
}

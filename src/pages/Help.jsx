import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  HelpCircle, UserPlus, ShieldCheck, FileCheck, IdCard, Users, Bell,
  CalendarDays, CreditCard, Settings, ChevronDown, ArrowRight, Info,
} from "lucide-react";
import PublicNav from "@/components/PublicNav";
import { useLang } from "@/lib/i18n";

export default function Help() {
  const { lang } = useLang();
  const en = lang === "en";

  const steps = en ? [
    {
      icon: UserPlus,
      title: "Step 1 — Register Your Family",
      desc: "Visit the Family Registration page and fill in your family head details, contact number, email, address, and gotra. Verify your mobile via OTP.",
      cta: "Go to Registration",
      to: "/register",
    },
    {
      icon: FileCheck,
      title: "Step 2 — Application Submitted",
      desc: "After submission, your application gets a unique Application ID (e.g. NPSI-APP-2026-000125) and status becomes PENDING_VERIFICATION. You can track it anytime.",
      cta: "Check Application Status",
      to: "/application-status",
    },
    {
      icon: ShieldCheck,
      title: "Step 3 — Super Admin Review",
      desc: "The Super Admin reviews your application in the Admin Portal. They may approve it, request corrections, or reject it with remarks.",
      cta: "Track Status",
      to: "/application-status",
    },
    {
      icon: IdCard,
      title: "Step 4 — Approval & Member ID Generation",
      desc: "Once approved, the system auto-generates a permanent Family ID (NPSI-FAM-000125) and Member IDs (NPSI-MEM-000125). A login invitation email is sent to you.",
      cta: "Check Application Status",
      to: "/application-status",
    },
    {
      icon: Users,
      title: "Step 5 — Login & Add Family Members",
      desc: "Use the invitation to set your password and log into the Member Portal. Open My Family to add, edit, or remove members (spouse, children, parents, siblings).",
      cta: "Open Member Portal",
      to: "/portal",
    },
    {
      icon: Bell,
      title: "Step 6 — Stay Updated",
      desc: "Receive notifications about approvals, corrections, payments, and announcements in the Notifications section.",
      cta: "View Notifications",
      to: "/portal/notifications",
    },
    {
      icon: CalendarDays,
      title: "Step 7 — Participate in Events",
      desc: "Browse upcoming community events (Navratri, Diwali, Holi, Samaj meetings) and register directly from the Member Portal.",
      cta: "Browse Events",
      to: "/portal/events",
    },
    {
      icon: CreditCard,
      title: "Step 8 — Payments & Transactions",
      desc: "Registration and event fees are tracked as transactions. View your payment history and receipts in your portal.",
      cta: "Open Member Portal",
      to: "/portal",
    },
    {
      icon: Settings,
      title: "Step 9 — Manage Your Profile",
      desc: "Update your profile photo, view your digital membership card, and manage language preferences from Settings.",
      cta: "Open Settings",
      to: "/portal/settings",
    },
  ] : [
    {
      icon: UserPlus,
      title: "चरण 1 — अपना परिवार रजिस्टर करें",
      desc: "परिवार रजिस्ट्रेशन पेज पर जाएँ और परिवार के मुखिया का विवरण, संपर्क नंबर, ईमेल, पता और गोत्र भरें। OTP से अपना मोबाइल वेरीफाई करें।",
      cta: "रजिस्ट्रेशन पर जाएँ",
      to: "/register",
    },
    {
      icon: FileCheck,
      title: "चरण 2 — आवेदन जमा होना",
      desc: "जमा करने के बाद आपके आवेदन को एक विशेष आवेदन आईडी (जैसे NPSI-APP-2026-000125) मिलती है और स्थिति PENDING_VERIFICATION हो जाती है। आप इसे कभी भी ट्रैक कर सकते हैं।",
      cta: "आवेदन स्थिति देखें",
      to: "/application-status",
    },
    {
      icon: ShieldCheck,
      title: "चरण 3 — सुपर एडमिन समीक्षा",
      desc: "सुपर एडमिन एडमिन पोर्टल में आपके आवेदन की समीक्षा करता है। वे इसे स्वीकृत कर सकते हैं, सुधार माँग सकते हैं, या टिप्पणी के साथ अस्वीकार कर सकते हैं।",
      cta: "स्थिति देखें",
      to: "/application-status",
    },
    {
      icon: IdCard,
      title: "चरण 4 — स्वीकृति और सदस्य आईडी जनरेशन",
      desc: "स्वीकृत होने पर सिस्टम स्वतः स्थायी परिवार आईडी (NPSI-FAM-000125) और सदस्य आईडी (NPSI-MEM-000125) बनाता है। आपको लॉगिन निमंत्रण ईमेल भेजा जाता है।",
      cta: "आवेदन स्थिति देखें",
      to: "/application-status",
    },
    {
      icon: Users,
      title: "चरण 5 — लॉगिन और परिवार के सदस्य जोड़ें",
      desc: "निमंत्रण से अपना पासवर्ड सेट करें और सदस्य पोर्टल में लॉगिन करें। My Family खोलकर सदस्य जोड़ें, संपादित करें या हटाएँ (पति/पत्नी, बच्चे, माता-पिता, भाई-बहन)।",
      cta: "सदस्य पोर्टल खोलें",
      to: "/portal",
    },
    {
      icon: Bell,
      title: "चरण 6 — अपडेट रहें",
      desc: "स्वीकृति, सुधार, भुगतान और घोषणाओं से संबंधित सूचनाएँ Notifications अनुभाग में प्राप्त करें।",
      cta: "सूचनाएँ देखें",
      to: "/portal/notifications",
    },
    {
      icon: CalendarDays,
      title: "चरण 7 — कार्यक्रमों में भाग लें",
      desc: "आगामी सामुदायिक कार्यक्रम (नवरात्रि, दिवाली, होली, समाज बैठकें) देखें और सीधे सदस्य पोर्टल से रजिस्टर करें।",
      cta: "कार्यक्रम देखें",
      to: "/portal/events",
    },
    {
      icon: CreditCard,
      title: "चरण 8 — भुगतान और लेन-देन",
      desc: "रजिस्ट्रेशन और कार्यक्रम शुल्क लेन-देन के रूप में ट्रैक होते हैं। अपना भुगतान इतिहास और रसीदें पोर्टल में देखें।",
      cta: "सदस्य पोर्टल खोलें",
      to: "/portal",
    },
    {
      icon: Settings,
      title: "चरण 9 — अपनी प्रोफ़ाइल प्रबंधित करें",
      desc: "Settings से अपनी प्रोफ़ाइल फ़ोटो अपडेट करें, डिजिटल सदस्यता कार्ड देखें और भाषा प्राथमिकताएँ प्रबंधित करें।",
      cta: "सेटिंग्स खोलें",
      to: "/portal/settings",
    },
  ];

  const faqs = en ? [
    { q: "How long does admin approval take?", a: "Typically 1–3 business days. You'll get a notification and email once approved." },
    { q: "Can I edit my application after submission?", a: "If the admin requests corrections, you'll be notified with remarks. You can then update and resubmit." },
    { q: "How do I get my Member ID?", a: "Member IDs are auto-generated after admin approval and visible in your Member Portal under My Family." },
    { q: "What if I forget my login password?", a: "Use the Forgot Password link on the login page to reset it via email." },
    { q: "Can I add or remove family members later?", a: "Yes. In the Member Portal → My Family, you can add, edit, or remove members anytime." },
  ] : [
    { q: "एडमिन स्वीकृति में कितना समय लगता है?", a: "आमतौर पर 1–3 कार्य दिवस। स्वीकृत होने पर आपको सूचना और ईमेल मिलेगा।" },
    { q: "क्या जमा के बाद मैं अपना आवेदन संपादित कर सकता हूँ?", a: "यदि एडमिन सुधार माँगता है, तो आपको टिप्पणी के साथ सूचित किया जाएगा। फिर आप अपडेट करके पुनः जमा कर सकते हैं।" },
    { q: "मुझे अपनी सदस्य आईडी कैसे मिलेगी?", a: "सदस्य आईडी एडमिन स्वीकृति के बाद स्वतः बनती है और सदस्य पोर्टल के My Family में दिखती है।" },
    { q: "यदि मैं लॉगिन पासवर्ड भूल जाऊँ तो?", a: "लॉगिन पेज के Forgot Password लिंक से ईमेल द्वारा रीसेट करें।" },
    { q: "क्या बाद में परिवार के सदस्य जोड़/हटा सकता हूँ?", a: "हाँ। सदस्य पोर्टल → My Family में कभी भी सदस्य जोड़ें, संपादित करें या हटाएँ।" },
  ];

  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      {/* Hero */}
      <section className="relative overflow-hidden hero-band text-cream">
        <div className="absolute inset-0 shell-grid opacity-[0.06]" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold tracking-wide text-gold">
              <HelpCircle className="h-3.5 w-3.5" />
              {en ? "Help & Guide" : "सहायता और गाइड"}
            </span>
            <h1 className="mt-5 font-display text-3xl font-semibold leading-tight text-cream sm:text-4xl">
              {en ? "How the Patidar Samaj Portal Works" : "पाटीदार समाज पोर्टल कैसे काम करता है"}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-cream/75">
              {en
                ? "A complete step-by-step guide — from family registration to admin approval, member ID generation, and adding family members."
                : "एक संपूर्ण चरण-दर-चरण गाइड — परिवार रजिस्ट्रेशन से लेकर एडमिन स्वीकृति, सदस्य आईडी जनरेशन और परिवार के सदस्य जोड़ने तक।"}
            </p>
          </div>
        </div>
      </section>

      {/* Overview banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="-mt-8 rounded-2xl border border-gold/30 bg-card p-5 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-maroon/10 ring-1 ring-gold/20">
              <Info className="h-5 w-5 text-maroon" />
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold text-maroon">{en ? "Quick Overview" : "संक्षिप्त अवलोकन"}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {en
                  ? "Register → Admin Review → Approval → Member ID → Login → Add Family Members → Events & Payments."
                  : "रजिस्टर करें → एडमिन समीक्षा → स्वीकृति → सदस्य आईडी → लॉगिन → परिवार के सदस्य जोड़ें → कार्यक्रम और भुगतान।"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="text-center">
          <div className="mx-auto h-1 w-12 rounded-full bg-gold/60" />
          <h2 className="mt-4 section-title">{en ? "Step-by-Step Process" : "चरण-दर-चरण प्रक्रिया"}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{en ? "Follow these steps to complete your membership" : "अपनी सदस्यता पूरी करने के लिए ये चरण अपनाएँ"}</p>
        </div>

        <div className="mt-10 relative">
          {/* vertical line */}
          <div className="absolute left-[27px] top-2 bottom-2 hidden w-px bg-gold/30 sm:block" />
          <div className="space-y-4">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="relative flex gap-4">
                  <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-gold/30 bg-card shadow-sm">
                    <Icon className="h-6 w-6 text-maroon" />
                  </div>
                  <div className="premium-card flex-1 p-5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-maroon text-[0.7rem] font-bold text-gold">{i + 1}</span>
                      <h3 className="font-display text-base font-semibold text-maroon">{s.title}</h3>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                    {s.cta && (
                      <Link to={s.to} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-maroon hover:gap-2">
                        {s.cta} <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-y border-gold/20 bg-cream/60">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <div className="text-center">
            <div className="mx-auto h-1 w-12 rounded-full bg-gold/60" />
            <h2 className="mt-4 section-title">{en ? "Frequently Asked Questions" : "अक्सर पूछे जाने वाले प्रश्न"}</h2>
          </div>
          <div className="mt-8 space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="premium-card overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
                  <span className="text-sm font-semibold text-foreground">{f.q}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-maroon transition ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="border-t border-border px-5 py-3 text-sm leading-relaxed text-muted-foreground">{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="rounded-2xl border border-gold/30 bg-card p-8 text-center">
          <h3 className="font-display text-xl font-semibold text-maroon">{en ? "Ready to begin?" : "शुरू करने के लिए तैयार?"}</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{en ? "Register your family today and become part of the Patidar Samaj Sangathan community." : "आज ही अपना परिवार रजिस्टर करें और पाटीदार समाज संगठन सामुदायिक परिवार का हिस्सा बनें।"}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-maroon px-6 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark">
              <UserPlus className="h-4 w-4" /> {en ? "Register Now" : "अभी रजिस्टर करें"}
            </Link>
            <Link to="/application-status" className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-6 py-2.5 text-sm font-semibold text-maroon hover:bg-gold/10">
              {en ? "Track Application" : "आवेदन ट्रैक करें"}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-maroon text-cream">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center sm:px-6">
          <div className="border-t border-gold/20 pt-5 text-xs text-cream/60">
            © {new Date().getFullYear()} Patidar Samaj Sangathan – Indore (Nimar). {en ? "All rights reserved." : "सर्वाधिकार सुरक्षित।"}
          </div>
        </div>
      </footer>
    </div>
  );
}
import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap, House, LogIn } from "lucide-react";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { useAuth } from "@/lib/AuthContext";
import { useLang } from "@/lib/i18n";
import { FEES } from "@/lib/registration-copy";
import { useSiteVisibility } from "@/lib/site-visibility";
import { STUDENT_REGISTRATION_PATH, studentLoginPath } from "@/lib/student-flow";

const FAMILY_FORM = "/portal/registration";
const COPY = {
  en: {
    badge: "Join the Sangathan",
    title: "How would you like to join?",
    sub: "Choose one. Both start with a login account (mobile + one-time code), then the registration form, the fee by UPI and approval by the Sangathan.",
    familyTitle: "Register as a Family",
    familyText: "For a family of the Nimar Patidar community: the head registers the family and its members.",
    studentTitle: "Register as a Student",
    studentText: "For a student who wants an individual student membership. Family membership is not needed.",
    fee: (amount) => `Registration fee ₹${amount}`,
    start: "Start registration",
    continue: "Continue to the form",
    haveFamily: "Already registered? Family Member Login",
    haveStudent: "Already registered? Student Login",
    status: "Already applied? Check application status",
    none: "Registration is closed right now. Please check again later.",
  },
  hi: {
    badge: "संगठन से जुड़ें",
    title: "आप किस रूप में जुड़ना चाहते हैं?",
    sub: "एक चुनें। दोनों में पहले लॉगिन खाता (मोबाइल + एक बार का कोड), फिर पंजीकरण फ़ॉर्म, UPI से शुल्क और संगठन की स्वीकृति।",
    familyTitle: "परिवार के रूप में पंजीकरण",
    familyText: "निमाड़ पाटीदार समाज के परिवार के लिए: मुखिया परिवार और उसके सदस्यों का पंजीकरण करते हैं।",
    studentTitle: "विद्यार्थी के रूप में पंजीकरण",
    studentText: "उस विद्यार्थी के लिए जो अपनी अलग विद्यार्थी सदस्यता चाहता है। परिवार सदस्यता आवश्यक नहीं है।",
    fee: (amount) => `पंजीकरण शुल्क ₹${amount}`,
    start: "पंजीकरण शुरू करें",
    continue: "फ़ॉर्म पर जाएँ",
    haveFamily: "पहले से पंजीकृत? परिवार सदस्य लॉगिन",
    haveStudent: "पहले से पंजीकृत? विद्यार्थी लॉगिन",
    status: "आवेदन कर चुके हैं? आवेदन की स्थिति देखें",
    none: "अभी पंजीकरण बंद है। कृपया बाद में देखें।",
  },
};

// "Join the Sangathan": the choice between registering a family and registering a student, so neither visitors
// nor logged-in users are sent to the family form by default.
export default function JoinSangathan() {
  const { lang } = useLang();
  const t = COPY[lang] || COPY.en;
  const { isAuthenticated } = useAuth();
  const { isPageVisible } = useSiteVisibility();
  // A visitor first makes a login account; the account page then opens the right registration form.
  const startFor = (form) => (isAuthenticated ? form : `/register-account?returnTo=${encodeURIComponent(form)}`);
  const options = [
    isPageVisible("/register") && {
      key: "family", Icon: House, title: t.familyTitle, text: t.familyText, fee: FEES.FAMILY,
      to: startFor(FAMILY_FORM), login: { to: "/login", label: t.haveFamily },
    },
    isPageVisible("/student-register") && {
      key: "student", Icon: GraduationCap, title: t.studentTitle, text: t.studentText, fee: FEES.STUDENT,
      to: startFor(STUDENT_REGISTRATION_PATH), login: { to: studentLoginPath(), label: t.haveStudent },
    },
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <main>
        <section className="border-b border-gold/30 bg-cream/50">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
            <span className="gold-badge">{t.badge}</span>
            <h1 className="mt-4 font-display text-3xl font-semibold text-maroon sm:text-4xl">{t.title}</h1>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground sm:text-base">{t.sub}</p>
          </div>
        </section>
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          {options.length === 0 ? <p className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">{t.none}</p> : (
            <div className={`grid gap-5 ${options.length > 1 ? "md:grid-cols-2" : "max-w-xl"}`}>
              {options.map(({ key, Icon, title, text, fee, to, login }) => (
                <article key={key} aria-labelledby={`join-${key}`} className="flex flex-col rounded-2xl border border-gold/40 bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-maroon/10 text-maroon"><Icon className="h-6 w-6" aria-hidden="true" /></span>
                  <h2 id={`join-${key}`} className="mt-4 font-display text-2xl font-semibold text-maroon">{title}</h2>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{text}</p>
                  <p className="mt-4 text-sm font-semibold text-foreground">{t.fee(fee)}</p>
                  <Link to={to} className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-maroon px-5 text-sm font-semibold text-cream hover:bg-maroon-dark">
                    {isAuthenticated ? t.continue : t.start}<ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  {!isAuthenticated && (
                    <Link to={login.to} className="mt-3 inline-flex items-center justify-center gap-2 text-sm font-medium text-maroon hover:underline">
                      <LogIn className="h-4 w-4" aria-hidden="true" />{login.label}
                    </Link>
                  )}
                </article>
              ))}
            </div>
          )}
          {isPageVisible("/application-status") && (
            <p className="mt-8 text-center text-sm"><Link to="/application-status" className="font-medium text-maroon hover:underline">{t.status}</Link></p>
          )}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

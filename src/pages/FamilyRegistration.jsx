import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, UserPlus, Trash2, Users, ShieldCheck, Copy, Share2, PartyPopper, Camera, Upload, X, User } from "lucide-react";
import PublicNav from "@/components/PublicNav";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useLang, useT } from "@/lib/i18n";
import { sanitizeMobile, sanitizePincode } from "@/lib/utils";
import { getRecaptchaToken } from "@/lib/recaptcha";

const relationships = ["Head", "Spouse", "Son", "Daughter", "Father", "Mother", "Brother", "Sister", "Other"];

// Keeps the in-progress wizard alive across an accidental refresh/tab close —
// otherwise a verified mobile + everything typed so far is lost, forcing the
// applicant back to square one. Cleared once the application is submitted.
const DRAFT_KEY = "nps_family_reg_draft";
const loadDraft = () => {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const genders = ["Male", "Female", "Other"];
const normalizeMobile = (value) => String(value || "").replace(/\D/g, "").slice(-10);

function Field({ label, value, onChange, placeholder, type = "text", required, maxLength, inputMode }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}{required && <span className="text-maroon"> *</span>}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        className="mt-1.5 w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm outline-none focus:border-maroon focus:ring-1 focus:ring-maroon"
      />
    </div>
  );
}

function SelectBox({ label, value, onChange, options, required, placeholder }) {
  const t = useT();
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}{required && <span className="text-maroon"> *</span>}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm outline-none focus:border-maroon focus:ring-1 focus:ring-maroon"
      >
        <option value="">{placeholder || t("reg.selectOpt")}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export default function FamilyRegistration() {
  const t = useT();
  const { lang } = useLang();
  const navigate = useNavigate();
  const { toast } = useToast();
  const draft = loadDraft();
  const [step, setStep] = useState(draft?.step ?? 0);
  const [submitting, setSubmitting] = useState(false);
  const [submittedApp, setSubmittedApp] = useState(null);

  const steps = [t("reg.stepMobile"), t("reg.stepHead"), t("reg.stepFamily"), t("reg.stepMembers"), t("reg.stepReview")];

  const [mobile, setMobile] = useState(draft?.mobile ?? "");
  const [otpSent, setOtpSent] = useState(draft?.otpSent ?? false);
  const [otp, setOtp] = useState(draft?.otp ?? "");
  const [otpVerified, setOtpVerified] = useState(draft?.otpVerified ?? false);

  const [head, setHead] = useState(draft?.head ?? {
    firstName: "", middleName: "", lastName: "", altMobile: "", email: "",
    gender: "", dob: "", occupation: "", education: "", address: "", city: "",
    district: "", state: "Madhya Pradesh", country: "India", pincode: "",
  });
  const [headPhoto, setHeadPhoto] = useState(draft?.headPhoto ?? "");
  const [photoUploading, setPhotoUploading] = useState(false);

  const onPhoto = async (file) => {
    if (!file) return;
    setPhotoUploading(true);
    try {
      const { fileUrl } = await base44.integrations.Core.UploadPublicFile({ file });
      setHeadPhoto(fileUrl);
      toast({ title: t("reg.photoAdded") });
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setPhotoUploading(false);
    }
  };
  const [family, setFamily] = useState(draft?.family ?? {
    familyName: "", address: "", city: "", district: "", state: "Madhya Pradesh",
    pincode: "", nativePlace: "", village: "", gotra: "", contactNumber: "",
  });
  const [members, setMembers] = useState(draft?.members ?? []);
  const [newMember, setNewMember] = useState({
    name: "", relationship: "", gender: "", dob: "", mobile: "", email: "",
    education: "", occupation: "", address: "",
  });

  useEffect(() => {
    if (submittedApp) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ step, mobile, otpSent, otp, otpVerified, head, headPhoto, family, members }));
    } catch {
      // ignore storage errors (private browsing etc.)
    }
  }, [step, mobile, otpSent, otp, otpVerified, head, headPhoto, family, members, submittedApp]);

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

  const validateStep = async (currentStep) => {
    if (currentStep === 1) {
      if (!head.firstName.trim() || !head.lastName.trim()) {
        toast({ title: t("reg.headRequired"), variant: "destructive" });
        return false;
      }
      if (!head.gender || !isValidEmail(head.email) || !head.address.trim() || !head.city.trim() || !head.district.trim()) {
        toast({ title: t("reg.headDetailsRequired"), variant: "destructive" });
        return false;
      }
      try {
        const { taken } = await base44.checkEmailTaken(head.email);
        if (taken) {
          toast({ title: t("reg.alreadyRegistered"), description: t("reg.emailAlreadyRegisteredDesc"), variant: "destructive" });
          return false;
        }
      } catch (e) {
        /* proceed if check fails */
      }
    }
    if (currentStep === 2 && !family.familyName.trim()) {
      toast({ title: t("reg.familyNameRequired"), variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleContinue = async () => {
    if (!(await validateStep(step))) return;
    next();
  };

  const sendOtp = async () => {
    if (mobile.length < 10) {
      toast({ title: t("reg.mobileLabel"), description: "Enter a valid mobile number", variant: "destructive" });
      return;
    }
    try {
      const { taken } = await base44.checkMobileTaken(mobile);
      if (taken) {
        toast({
          title: t("reg.alreadyRegistered"),
          description: t("reg.alreadyRegisteredDesc"),
          variant: "destructive",
        });
        return;
      }
    } catch (e) {
      /* proceed if check fails */
    }
    setOtpSent(true);
    toast({ title: "OTP Sent", description: "Your demo OTP is 1234." });
  };

  const verifyOtp = () => {
    if (otp.length < 4) {
      toast({ title: "Enter the 4-digit OTP", variant: "destructive" });
      return;
    }
    if (otp !== "1234") {
      toast({ title: "Invalid OTP", description: "Use the demo OTP: 1234", variant: "destructive" });
      return;
    }
    setOtpVerified(true);
    toast({ title: t("reg.mobileVerified") });
  };

  const addMember = () => {
    if (!newMember.name || !newMember.relationship) {
      toast({ title: "Name and relationship are required", variant: "destructive" });
      return;
    }
    setMembers([...members, { ...newMember, id: Date.now() }]);
    setNewMember({ name: "", relationship: "", gender: "", dob: "", mobile: "", email: "", education: "", occupation: "", address: "" });
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const recaptchaToken = await getRecaptchaToken("family_register");
      const headName = `${head.firstName} ${head.middleName} ${head.lastName}`.trim() || t("reg.notProvided");
      const familyName = family.familyName.trim() || t("reg.notProvided");
      const allMembers = [
        {
          name: headName,
          relationship: "Head",
          gender: head.gender,
          dob: head.dob,
          mobile,
          email: head.email,
          education: head.education,
          occupation: head.occupation,
          address: head.address,
          photoUrl: headPhoto,
        },
        ...members.map((m) => ({ name: m.name, relationship: m.relationship, gender: m.gender, dob: m.dob, mobile: m.mobile, email: m.email, education: m.education, occupation: m.occupation, address: m.address })),
      ];

      const app = await base44.entities.Application.create({
        status: "PENDING_VERIFICATION",
        familyHeadName: headName,
        mobile,
        email: head.email,
        familyName: familyName,
        address: family.address || head.address,
        city: family.city || head.city,
        district: family.district || head.district,
        state: family.state || head.state,
        pincode: family.pincode || head.pincode,
        gotra: family.gotra,
        nativePlace: family.nativePlace,
        village: family.village,
        membersData: allMembers,
        submittedDate: new Date().toISOString(),
        recaptchaToken,
        // The server also records the registration fee and the "submitted" notification.
        lang,
      });

      try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
      setSubmittedApp(app);
    } catch (err) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedApp) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNav />
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <div className="rounded-2xl border-2 border-gold/50 bg-card p-8 text-center shadow-lg">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <PartyPopper className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="mt-5 font-display text-3xl font-semibold text-maroon">{t("reg.successTitle")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("reg.successSub")}</p>
            <div className="mt-6 rounded-2xl border border-gold/40 bg-cream p-5">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{t("reg.appId")}</div>
              <div className="mt-1 font-display text-3xl font-bold tracking-wide text-maroon">{submittedApp.applicationId}</div>
              <div className="mt-3 flex justify-center gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(submittedApp.applicationId)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gold/50 px-4 py-2 text-xs font-semibold text-maroon hover:bg-gold/10"
                >
                  <Copy className="h-3.5 w-3.5" /> {t("reg.copy")}
                </button>
                <button
                  onClick={() => {
                    if (navigator.share) navigator.share({ title: "Application ID", text: submittedApp.applicationId });
                    else navigator.clipboard.writeText(submittedApp.applicationId);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gold/50 px-4 py-2 text-xs font-semibold text-maroon hover:bg-gold/10"
                >
                  <Share2 className="h-3.5 w-3.5" /> {t("reg.share")}
                </button>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                onClick={() => navigate(`/application-status`)}
                className="rounded-full bg-maroon px-6 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark"
              >
                {t("reg.viewStatus")}
              </button>
              <button
                onClick={() => navigate("/")}
                className="rounded-full border border-gold/50 px-6 py-2.5 text-sm font-semibold text-maroon hover:bg-gold/10"
              >
                {t("reg.backHome")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicNav />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <span className="gold-badge">{t("reg.badge")}</span>
        <h1 className="mt-3 font-display text-3xl font-semibold text-maroon">{t("reg.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("reg.sub")}</p>

        {/* Stepper */}
        <div className="mt-6 flex items-center gap-1.5">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-1.5">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                i < step ? "bg-green-600 text-white" : i === step ? "bg-maroon text-cream" : "bg-muted text-muted-foreground"
              }`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`hidden text-xs font-medium sm:block ${i === step ? "text-maroon" : "text-muted-foreground"}`}>{s}</span>
              {i < steps.length - 1 && <div className={`h-0.5 flex-1 rounded ${i < step ? "bg-green-500" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-gold/30 bg-card p-6 shadow-sm">
          {/* Step 0: Mobile + OTP */}
          {step === 0 && (
            <div>
              <h2 className="font-display text-lg font-semibold text-maroon">{t("reg.mobileTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("reg.mobileSub")}</p>
              <div className="mt-5">
                <Field label={t("reg.mobileLabel")} value={mobile} onChange={(v) => { setMobile(sanitizeMobile(v)); setOtpSent(false); setOtpVerified(false); }} placeholder="9876543210" type="tel" inputMode="numeric" maxLength={10} required />
              </div>
              {!otpSent && (
                <button onClick={sendOtp} className="mt-4 rounded-full bg-maroon px-6 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark">
                  {t("reg.sendOtp")}
                </button>
              )}
              {otpSent && !otpVerified && (
                <div className="mt-4">
                  <Field label={t("reg.otpLabel")} value={otp} onChange={(v) => setOtp(v.replace(/\D/g, "").slice(0, 4))} placeholder="1234" type="tel" inputMode="numeric" maxLength={4} required />
                  <p className="mt-1.5 text-xs font-medium text-blue-600">{t("reg.demoOtpHint")}</p>
                  <div className="mt-4 flex gap-2">
                    <button onClick={verifyOtp} className="rounded-full bg-maroon px-6 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark">
                      {t("reg.verifyOtp")}
                    </button>
                    <button onClick={sendOtp} className="rounded-full border border-gold/50 px-4 py-2.5 text-sm font-semibold text-maroon hover:bg-gold/10">
                      {t("reg.resend")}
                    </button>
                  </div>
                </div>
              )}
              {otpVerified && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-green-300 bg-green-50 p-3 text-sm text-green-700">
                  <Check className="h-4 w-4" /> {t("reg.mobileVerified")}
                </div>
              )}
            </div>
          )}

          {/* Step 1: Family Head */}
          {step === 1 && (
            <div>
              <h2 className="font-display text-lg font-semibold text-maroon">{t("reg.headTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("reg.headSub")}</p>

              {/* Photo upload (optional, skippable) */}
              <div className="mt-5 flex items-center gap-4 rounded-xl border border-gold/30 bg-cream p-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-gold/50 bg-card">
                  {headPhoto ? (
                    <img src={headPhoto} alt="head" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-maroon">{t("reg.photoTitle")}</div>
                  <div className="text-xs text-muted-foreground">{t("reg.photoSub")}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-maroon px-4 py-2 text-xs font-semibold text-cream hover:bg-maroon-dark">
                      <Upload className="h-3.5 w-3.5" /> {t("reg.upload")}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} disabled={photoUploading} />
                    </label>
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-gold/50 px-4 py-2 text-xs font-semibold text-maroon hover:bg-gold/10">
                      <Camera className="h-3.5 w-3.5" /> {t("reg.takePhoto")}
                      <input type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} disabled={photoUploading} />
                    </label>
                    {headPhoto && (
                      <button onClick={() => setHeadPhoto("")} className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/5">
                        <X className="h-3.5 w-3.5" /> {t("reg.remove")}
                      </button>
                    )}
                    {photoUploading && <span className="text-xs text-maroon">Uploading...</span>}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label={t("reg.firstName")} value={head.firstName} onChange={(v) => setHead({ ...head, firstName: v })} required />
                <Field label={t("reg.middleName")} value={head.middleName} onChange={(v) => setHead({ ...head, middleName: v })} />
                <Field label={t("reg.lastName")} value={head.lastName} onChange={(v) => setHead({ ...head, lastName: v })} required />
                <SelectBox label={t("reg.gender")} value={head.gender} onChange={(v) => setHead({ ...head, gender: v })} options={genders} required />
                <Field label={t("reg.dob")} value={head.dob} onChange={(v) => setHead({ ...head, dob: v })} type="date" />
                <Field label={t("reg.altMobile")} value={head.altMobile} onChange={(v) => setHead({ ...head, altMobile: sanitizeMobile(v) })} type="tel" inputMode="numeric" maxLength={10} />
                <Field label={t("reg.email")} value={head.email} onChange={(v) => setHead({ ...head, email: v })} type="email" required />
                <Field label={t("reg.occupation")} value={head.occupation} onChange={(v) => setHead({ ...head, occupation: v })} />
                <Field label={t("reg.education")} value={head.education} onChange={(v) => setHead({ ...head, education: v })} />
                <Field label={t("reg.pincode")} value={head.pincode} onChange={(v) => setHead({ ...head, pincode: sanitizePincode(v) })} type="tel" inputMode="numeric" maxLength={6} />
                <div className="sm:col-span-2">
                  <Field label={t("reg.address")} value={head.address} onChange={(v) => setHead({ ...head, address: v })} required />
                </div>
                <Field label={t("reg.city")} value={head.city} onChange={(v) => setHead({ ...head, city: v })} required />
                <Field label={t("reg.district")} value={head.district} onChange={(v) => setHead({ ...head, district: v })} required />
                <Field label={t("reg.state")} value={head.state} onChange={(v) => setHead({ ...head, state: v })} />
                <Field label={t("reg.country")} value={head.country} onChange={(v) => setHead({ ...head, country: v })} />
              </div>
            </div>
          )}

          {/* Step 2: Family Details */}
          {step === 2 && (
            <div>
              <h2 className="font-display text-lg font-semibold text-maroon">{t("reg.familyTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("reg.familySub")}</p>

              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-gold/30 bg-gold/5 p-3">
                <p className="text-xs text-maroon">{t("reg.familyDetailsOptionalNote")}</p>
                <button onClick={() => setStep(3)} className="shrink-0 rounded-full border border-gold/50 px-4 py-1.5 text-xs font-semibold text-maroon hover:bg-gold/10">
                  {t("reg.skipFamilyDetails")} →
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label={t("reg.familyName")} value={family.familyName} onChange={(v) => setFamily({ ...family, familyName: v })} required />
                <Field label={t("reg.gotra")} value={family.gotra} onChange={(v) => setFamily({ ...family, gotra: v })} />
                <Field label={t("reg.nativePlace")} value={family.nativePlace} onChange={(v) => setFamily({ ...family, nativePlace: v })} />
                <Field label={t("reg.village")} value={family.village} onChange={(v) => setFamily({ ...family, village: v })} />
                <Field label={t("reg.familyContact")} value={family.contactNumber} onChange={(v) => setFamily({ ...family, contactNumber: sanitizeMobile(v) })} type="tel" inputMode="numeric" maxLength={10} />
                <div className="sm:col-span-2">
                  <Field label={t("reg.familyAddress")} value={family.address} onChange={(v) => setFamily({ ...family, address: v })} />
                </div>
                <Field label={t("reg.city")} value={family.city} onChange={(v) => setFamily({ ...family, city: v })} />
                <Field label={t("reg.district")} value={family.district} onChange={(v) => setFamily({ ...family, district: v })} />
                <Field label={t("reg.state")} value={family.state} onChange={(v) => setFamily({ ...family, state: v })} />
                <Field label={t("reg.pincode")} value={family.pincode} onChange={(v) => setFamily({ ...family, pincode: sanitizePincode(v) })} type="tel" inputMode="numeric" maxLength={6} />
              </div>
            </div>
          )}

          {/* Step 3: Members */}
          {step === 3 && (
            <div>
              <h2 className="font-display text-lg font-semibold text-maroon">{t("reg.membersTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("reg.membersSub")}</p>

              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-gold/30 bg-gold/5 p-3">
                <p className="text-xs text-maroon">{t("reg.membersOptionalNote")}</p>
                <button onClick={() => setStep(4)} className="shrink-0 rounded-full border border-gold/50 px-4 py-1.5 text-xs font-semibold text-maroon hover:bg-gold/10">
                  {t("reg.skipToReview")} →
                </button>
              </div>

              <div className="mt-5 rounded-xl border border-gold/30 bg-cream p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={t("reg.name")} value={newMember.name} onChange={(v) => setNewMember({ ...newMember, name: v })} required />
                  <SelectBox label={t("reg.relationship")} value={newMember.relationship} onChange={(v) => setNewMember({ ...newMember, relationship: v })} options={relationships.filter((r) => r !== "Head")} required />
                  <SelectBox label={t("reg.gender")} value={newMember.gender} onChange={(v) => setNewMember({ ...newMember, gender: v })} options={genders} />
                  <Field label={t("reg.dob")} value={newMember.dob} onChange={(v) => setNewMember({ ...newMember, dob: v })} type="date" />
                  <Field label={t("reg.mobileLabel")} value={newMember.mobile} onChange={(v) => setNewMember({ ...newMember, mobile: sanitizeMobile(v) })} type="tel" inputMode="numeric" maxLength={10} />
                  <Field label={t("reg.email")} value={newMember.email} onChange={(v) => setNewMember({ ...newMember, email: v })} type="email" />
                  <Field label={t("reg.education")} value={newMember.education} onChange={(v) => setNewMember({ ...newMember, education: v })} />
                  <Field label={t("reg.occupation")} value={newMember.occupation} onChange={(v) => setNewMember({ ...newMember, occupation: v })} />
                </div>
                <button onClick={addMember} className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-maroon px-5 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark">
                  <UserPlus className="h-4 w-4" /> {t("reg.addMember")}
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {/* Head card */}
                <div className="flex items-center gap-3 rounded-xl border border-gold/40 bg-cream p-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-maroon/10">
                    <Users className="h-5 w-5 text-maroon" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground">{`${head.firstName} ${head.lastName}`.trim() || t("reg.headTag")}</div>
                    <div className="text-xs text-muted-foreground">{t("reg.headTag")} · {head.gender || "—"}</div>
                  </div>
                  <span className="gold-badge text-[0.6rem]">{t("reg.headTag")}</span>
                </div>
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-foreground">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.relationship} · {m.gender || "—"}</div>
                    </div>
                    <button onClick={() => setMembers(members.filter((x) => x.id !== m.id))} className="rounded-full p-2 text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {members.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground">{t("reg.noMembers")}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div>
              <h2 className="font-display text-lg font-semibold text-maroon">{t("reg.reviewTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("reg.reviewSub")}</p>

              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-gold/30 bg-cream p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-maroon"><ShieldCheck className="h-4 w-4" /> {t("reg.reviewHead")}</div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">{t("reg.name")}:</span> {`${head.firstName} ${head.lastName}`.trim() || t("reg.notProvided")}</div>
                    <div><span className="text-muted-foreground">{t("reg.mobileLabel")}:</span> {mobile}</div>
                    <div><span className="text-muted-foreground">{t("reg.email")}:</span> {head.email || "—"}</div>
                    <div><span className="text-muted-foreground">{t("reg.gender")}:</span> {head.gender || "—"}</div>
                  </div>
                </div>
                <div className="rounded-xl border border-gold/30 bg-cream p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-maroon"><Users className="h-4 w-4" /> {t("reg.reviewFamily")}</div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">{t("reg.familyName")}:</span> {family.familyName || t("reg.notProvided")}</div>
                    <div><span className="text-muted-foreground">{t("reg.gotra")}:</span> {family.gotra || "—"}</div>
                    <div><span className="text-muted-foreground">{t("reg.nativePlace")}:</span> {family.nativePlace || "—"}</div>
                    <div><span className="text-muted-foreground">{t("reg.city")}:</span> {family.city || head.city}</div>
                  </div>
                </div>
                <div className="rounded-xl border border-gold/30 bg-cream p-4">
                  <div className="text-sm font-semibold text-maroon">{t("reg.reviewMembers")} ({members.length + 1})</div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {t("reg.reviewMembersDesc", { n: members.length })}
                  </div>
                </div>
                <div className="rounded-xl border border-gold/40 bg-gold/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-maroon">{t("reg.feeTitle")}</div>
                    <div className="font-display text-lg font-bold text-maroon">₹500</div>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{t("reg.feeNote")}</p>
                </div>
              </div>
            </div>
          )}

          {/* Nav buttons */}
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={back}
              disabled={step === 0}
              className="inline-flex items-center gap-1.5 rounded-full border border-gold/50 px-5 py-2.5 text-sm font-semibold text-maroon hover:bg-gold/10 disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" /> {t("reg.back")}
            </button>
            {step < steps.length - 1 ? (
              <button
                onClick={handleContinue}
                disabled={step === 0 && !otpVerified}
                className="inline-flex items-center gap-1.5 rounded-full bg-maroon px-6 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark disabled:opacity-40"
              >
                {t("reg.continue")} <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
              >
                {submitting ? t("reg.submitting") : t("reg.submit")} <Check className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
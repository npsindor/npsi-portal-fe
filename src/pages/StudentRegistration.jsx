import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Copy, Share2, PartyPopper, Camera, Upload, X, User, GraduationCap } from "lucide-react";
import PublicNav from "@/components/PublicNav";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useT } from "@/lib/i18n";
import { sanitizeMobile, sanitizePincode } from "@/lib/utils";
import { getRecaptchaToken } from "@/lib/recaptcha";

const genders = ["Male", "Female", "Other"];

// Keeps the in-progress wizard alive across an accidental refresh/tab close —
// otherwise a verified mobile + everything typed so far is lost, forcing the
// applicant back to square one. Cleared once the application is submitted.
const DRAFT_KEY = "nps_student_reg_draft";
const loadDraft = () => {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

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

function SelectBox({ label, value, onChange, options, required, placeholder, t }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}{required && <span className="text-maroon"> *</span>}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-border bg-cream px-4 py-2.5 text-sm outline-none focus:border-maroon focus:ring-1 focus:ring-maroon"
      >
        <option value="">{placeholder || t("stu.selectOpt")}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export default function StudentRegistration() {
  const t = useT();
  const navigate = useNavigate();
  const { toast } = useToast();
  const draft = loadDraft();
  const [step, setStep] = useState(draft?.step ?? 0);
  const [submitting, setSubmitting] = useState(false);
  const [submittedApp, setSubmittedApp] = useState(null);

  const steps = [t("stu.stepMobile"), t("stu.stepStudent"), t("stu.stepGuardian"), t("stu.stepReview")];

  const [mobile, setMobile] = useState(draft?.mobile ?? "");
  const [otpSent, setOtpSent] = useState(draft?.otpSent ?? false);
  const [otp, setOtp] = useState(draft?.otp ?? "");
  const [otpVerified, setOtpVerified] = useState(draft?.otpVerified ?? false);

  const [stu, setStu] = useState(draft?.stu ?? {
    name: "", fatherName: "", email: "", gender: "", dob: "", course: "", institution: "", academicYear: "",
  });
  const [photo, setPhoto] = useState(draft?.photo ?? "");
  const [photoUploading, setPhotoUploading] = useState(false);

  const [guardian, setGuardian] = useState(draft?.guardian ?? {
    guardianName: "", guardianMobile: "", address: "", city: "", district: "", state: "Madhya Pradesh", pincode: "",
  });

  useEffect(() => {
    if (submittedApp) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ step, mobile, otpSent, otp, otpVerified, stu, photo, guardian }));
    } catch {
      // ignore storage errors (private browsing etc.)
    }
  }, [step, mobile, otpSent, otp, otpVerified, stu, photo, guardian, submittedApp]);

  const onPhoto = async (file) => {
    if (!file) return;
    setPhotoUploading(true);
    try {
      const { fileUrl } = await base44.integrations.Core.UploadPublicFile({ file });
      setPhoto(fileUrl);
      toast({ title: t("stu.photoAdded") });
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setPhotoUploading(false);
    }
  };

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

  const validateStep = async (currentStep) => {
    if (currentStep === 1) {
      if (!stu.name.trim() || !stu.fatherName.trim() || !stu.gender || !isValidEmail(stu.email) || !stu.course.trim() || !stu.academicYear.trim()) {
        toast({ title: t("stu.detailsRequired"), variant: "destructive" });
        return false;
      }
      try {
        const { taken } = await base44.checkEmailTaken(stu.email);
        if (taken) {
          toast({ title: t("stu.alreadyRegistered"), description: t("stu.emailAlreadyRegisteredDesc"), variant: "destructive" });
          return false;
        }
      } catch (e) {
        /* proceed if check fails */
      }
    }
    return true;
  };

  const handleContinue = async () => {
    if (!(await validateStep(step))) return;
    next();
  };

  const sendOtp = async () => {
    if (mobile.length < 10) {
      toast({ title: t("stu.mobileLabel"), description: "Enter a valid mobile number", variant: "destructive" });
      return;
    }
    try {
      const { taken } = await base44.checkMobileTaken(mobile);
      if (taken) {
        toast({ title: t("stu.alreadyRegistered"), description: t("stu.alreadyRegisteredDesc"), variant: "destructive" });
        return;
      }
    } catch (e) { /* proceed if check fails */ }
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
    toast({ title: t("stu.mobileVerified") });
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const recaptchaToken = await getRecaptchaToken("student_register");
      const app = await base44.entities.StudentApplication.create({
        status: "PENDING_VERIFICATION",
        recaptchaToken,
        studentName: stu.name,
        fatherName: stu.fatherName,
        mobile,
        email: stu.email,
        dob: stu.dob,
        gender: stu.gender,
        course: stu.course,
        institution: stu.institution,
        academicYear: stu.academicYear,
        guardianName: guardian.guardianName,
        guardianMobile: guardian.guardianMobile,
        address: guardian.address,
        city: guardian.city,
        district: guardian.district,
        state: guardian.state,
        pincode: guardian.pincode,
        photoUrl: photo,
        submittedDate: new Date().toISOString(),
      });

      await base44.entities.Notification.create({
        title: "Student Application Submitted",
        message: `Your student registration application ${app.applicationId} has been submitted and is pending verification.`,
        type: "Registration",
        recipientFamilyId: app.applicationId,
        date: new Date().toISOString(),
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
            <h1 className="mt-5 font-display text-3xl font-semibold text-maroon">{t("stu.successTitle")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("stu.successSub")}</p>
            <div className="mt-6 rounded-2xl border border-gold/40 bg-cream p-5">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{t("stu.appId")}</div>
              <div className="mt-1 font-display text-3xl font-bold tracking-wide text-maroon">{submittedApp.applicationId}</div>
              <div className="mt-3 flex justify-center gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(submittedApp.applicationId)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gold/50 px-4 py-2 text-xs font-semibold text-maroon hover:bg-gold/10"
                >
                  <Copy className="h-3.5 w-3.5" /> {t("stu.copy")}
                </button>
                <button
                  onClick={() => {
                    if (navigator.share) navigator.share({ title: "Application ID", text: submittedApp.applicationId });
                    else navigator.clipboard.writeText(submittedApp.applicationId);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gold/50 px-4 py-2 text-xs font-semibold text-maroon hover:bg-gold/10"
                >
                  <Share2 className="h-3.5 w-3.5" /> {t("stu.share")}
                </button>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button onClick={() => navigate(`/application-status`)} className="rounded-full bg-maroon px-6 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark">
                {t("stu.viewStatus")}
              </button>
              <button onClick={() => navigate("/")} className="rounded-full border border-gold/50 px-6 py-2.5 text-sm font-semibold text-maroon hover:bg-gold/10">
                {t("stu.backHome")}
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
        <span className="gold-badge"><GraduationCap className="h-3.5 w-3.5" /> {t("stu.badge")}</span>
        <h1 className="mt-3 font-display text-3xl font-semibold text-maroon">{t("stu.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("stu.sub")}</p>

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
              <h2 className="font-display text-lg font-semibold text-maroon">{t("stu.mobileTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("stu.mobileSub")}</p>
              <div className="mt-5">
                <Field label={t("stu.mobileLabel")} value={mobile} onChange={(v) => { setMobile(sanitizeMobile(v)); setOtpSent(false); setOtpVerified(false); }} placeholder="9876543210" type="tel" inputMode="numeric" maxLength={10} required />
              </div>
              {!otpSent && (
                <button onClick={sendOtp} className="mt-4 rounded-full bg-maroon px-6 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark">
                  {t("stu.sendOtp")}
                </button>
              )}
              {otpSent && !otpVerified && (
                <div className="mt-4">
                  <Field label={t("stu.otpLabel")} value={otp} onChange={(v) => setOtp(v.replace(/\D/g, "").slice(0, 4))} placeholder="1234" type="tel" inputMode="numeric" maxLength={4} required />
                  <p className="mt-1.5 text-xs font-medium text-blue-600">{t("reg.demoOtpHint")}</p>
                  <div className="mt-4 flex gap-2">
                    <button onClick={verifyOtp} className="rounded-full bg-maroon px-6 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark">
                      {t("stu.verifyOtp")}
                    </button>
                    <button onClick={sendOtp} className="rounded-full border border-gold/50 px-4 py-2.5 text-sm font-semibold text-maroon hover:bg-gold/10">
                      {t("stu.resend")}
                    </button>
                  </div>
                </div>
              )}
              {otpVerified && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-green-300 bg-green-50 p-3 text-sm text-green-700">
                  <Check className="h-4 w-4" /> {t("stu.mobileVerified")}
                </div>
              )}
            </div>
          )}

          {/* Step 1: Student Details */}
          {step === 1 && (
            <div>
              <h2 className="font-display text-lg font-semibold text-maroon">{t("stu.studentTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("stu.studentSub")}</p>

              <div className="mt-5 flex items-center gap-4 rounded-xl border border-gold/30 bg-cream p-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-gold/50 bg-card">
                  {photo ? (
                    <img src={photo} alt="student" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-maroon">{t("stu.photoTitle")}</div>
                  <div className="text-xs text-muted-foreground">{t("stu.photoSub")}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-maroon px-4 py-2 text-xs font-semibold text-cream hover:bg-maroon-dark">
                      <Upload className="h-3.5 w-3.5" /> {t("stu.upload")}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} disabled={photoUploading} />
                    </label>
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-gold/50 px-4 py-2 text-xs font-semibold text-maroon hover:bg-gold/10">
                      <Camera className="h-3.5 w-3.5" /> {t("stu.takePhoto")}
                      <input type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} disabled={photoUploading} />
                    </label>
                    {photo && (
                      <button onClick={() => setPhoto("")} className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/5">
                        <X className="h-3.5 w-3.5" /> {t("stu.remove")}
                      </button>
                    )}
                    {photoUploading && <span className="text-xs text-maroon">Uploading...</span>}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label={t("stu.name")} value={stu.name} onChange={(v) => setStu({ ...stu, name: v })} required />
                <Field label={t("stu.fatherName")} value={stu.fatherName} onChange={(v) => setStu({ ...stu, fatherName: v })} required />
                <SelectBox label={t("stu.gender")} value={stu.gender} onChange={(v) => setStu({ ...stu, gender: v })} options={genders} t={t} required />
                <Field label={t("stu.dob")} value={stu.dob} onChange={(v) => setStu({ ...stu, dob: v })} type="date" />
                <Field label={t("stu.email")} value={stu.email} onChange={(v) => setStu({ ...stu, email: v })} type="email" required />
                <Field label={t("stu.course")} value={stu.course} onChange={(v) => setStu({ ...stu, course: v })} required />
                <Field label={t("stu.institution")} value={stu.institution} onChange={(v) => setStu({ ...stu, institution: v })} />
                <Field label={t("stu.academicYear")} value={stu.academicYear} onChange={(v) => setStu({ ...stu, academicYear: v })} placeholder="2026-2027" required />
              </div>
            </div>
          )}

          {/* Step 2: Guardian & Address */}
          {step === 2 && (
            <div>
              <h2 className="font-display text-lg font-semibold text-maroon">{t("stu.guardianTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("stu.guardianSub")}</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label={t("stu.guardianName")} value={guardian.guardianName} onChange={(v) => setGuardian({ ...guardian, guardianName: v })} required />
                <Field label={t("stu.guardianMobile")} value={guardian.guardianMobile} onChange={(v) => setGuardian({ ...guardian, guardianMobile: sanitizeMobile(v) })} type="tel" inputMode="numeric" maxLength={10} required />
                <div className="sm:col-span-2">
                  <Field label={t("stu.address")} value={guardian.address} onChange={(v) => setGuardian({ ...guardian, address: v })} />
                </div>
                <Field label={t("stu.city")} value={guardian.city} onChange={(v) => setGuardian({ ...guardian, city: v })} />
                <Field label={t("stu.district")} value={guardian.district} onChange={(v) => setGuardian({ ...guardian, district: v })} />
                <Field label={t("stu.state")} value={guardian.state} onChange={(v) => setGuardian({ ...guardian, state: v })} />
                <Field label={t("stu.pincode")} value={guardian.pincode} onChange={(v) => setGuardian({ ...guardian, pincode: sanitizePincode(v) })} type="tel" inputMode="numeric" maxLength={6} />
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div>
              <h2 className="font-display text-lg font-semibold text-maroon">{t("stu.reviewTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("stu.reviewSub")}</p>
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-gold/30 bg-cream p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-maroon"><GraduationCap className="h-4 w-4" /> {t("stu.reviewStudent")}</div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">{t("stu.name")}:</span> {stu.name}</div>
                    <div><span className="text-muted-foreground">{t("stu.fatherName")}:</span> {stu.fatherName}</div>
                    <div><span className="text-muted-foreground">{t("stu.mobileLabel")}:</span> {mobile}</div>
                    <div><span className="text-muted-foreground">{t("stu.email")}:</span> {stu.email || "—"}</div>
                    <div><span className="text-muted-foreground">{t("stu.gender")}:</span> {stu.gender || "—"}</div>
                    <div><span className="text-muted-foreground">{t("stu.course")}:</span> {stu.course}</div>
                    <div><span className="text-muted-foreground">{t("stu.institution")}:</span> {stu.institution || "—"}</div>
                  </div>
                </div>
                <div className="rounded-xl border border-gold/30 bg-cream p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-maroon"><User className="h-4 w-4" /> {t("stu.reviewGuardian")}</div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">{t("stu.guardianName")}:</span> {guardian.guardianName}</div>
                    <div><span className="text-muted-foreground">{t("stu.guardianMobile")}:</span> {guardian.guardianMobile}</div>
                    <div className="col-span-2"><span className="text-muted-foreground">{t("stu.address")}:</span> {guardian.address}, {guardian.city}, {guardian.state} {guardian.pincode}</div>
                  </div>
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
              <ArrowLeft className="h-4 w-4" /> {t("stu.back")}
            </button>
            {step < steps.length - 1 ? (
              <button
                onClick={handleContinue}
                disabled={step === 0 && !otpVerified}
                className="inline-flex items-center gap-1.5 rounded-full bg-maroon px-6 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark disabled:opacity-40"
              >
                {t("stu.continue")} <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
              >
                {submitting ? t("stu.submitting") : t("stu.submit")} <Check className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
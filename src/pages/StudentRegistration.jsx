import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpenCheck, CheckCircle2, GraduationCap, Loader2 } from "lucide-react";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { getRecaptchaToken } from "@/lib/recaptcha";
import { useAuth } from "@/lib/AuthContext";
import { useLang } from "@/lib/i18n";
import { translateError } from "@/lib/registration-copy";

const COPY = {
  en: {
    title: "Independent Student Registration", subtitle: "Apply for a student profile. Family membership is not required.",
    section: "Student details", name: "Student name", mobile: "Mobile number", email: "Email address", dob: "Date of birth", gender: "Gender", male: "Male", female: "Female", other: "Other", father: "Father’s name", guardian: "Guardian name", guardianMobile: "Guardian mobile", address: "Current address", city: "City / Village", district: "District", state: "State", pincode: "PIN code", education: "Current education level", levelSchool: "School", levelCollege: "Undergraduate / College", levelPostgrad: "Postgraduate", levelDiploma: "Diploma / ITI / Professional course", levelResearch: "PhD / Research", levelOther: "Other", course: "Class / Course / Program", institution: "School / College / Institute", year: "Academic year", useFamily: "Use my verified family details", pickMember: "Select a family member to prefill", familyAvailable: "Your verified family details are available. You can use them to prefill this form.", familyError: "Could not load family information. You can still apply independently.", submit: "Submit student application", submitting: "Submitting…", success: "Student application submitted", successText: "Your application {id} is waiting for admin review. Your student ID will be issued after approval.", back: "Back to website", required: "Please complete all required fields.", select: "Select", noFamily: "No verified family membership is linked to this account. You can continue independently.", loginHint: "Already a family member? Log in first to use your saved details; student registration remains separate.", appError: "Could not submit your student application. Please try again.", otherDetail: "Additional details",
  },
  hi: {
    title: "स्वतंत्र विद्यार्थी पंजीकरण", subtitle: "विद्यार्थी प्रोफ़ाइल हेतु आवेदन करें। परिवार सदस्यता आवश्यक नहीं है।",
    section: "विद्यार्थी विवरण", name: "विद्यार्थी का नाम", mobile: "मोबाइल नंबर", email: "ईमेल पता", dob: "जन्म तिथि", gender: "लिंग", male: "पुरुष", female: "महिला", other: "अन्य", father: "पिता का नाम", guardian: "अभिभावक का नाम", guardianMobile: "अभिभावक मोबाइल", address: "वर्तमान पता", city: "शहर / गाँव", district: "ज़िला", state: "राज्य", pincode: "पिन कोड", education: "वर्तमान शिक्षा स्तर", levelSchool: "स्कूल", levelCollege: "स्नातक / कॉलेज", levelPostgrad: "स्नातकोत्तर", levelDiploma: "डिप्लोमा / ITI / व्यावसायिक पाठ्यक्रम", levelResearch: "PhD / शोध", levelOther: "अन्य", course: "कक्षा / कोर्स / कार्यक्रम", institution: "स्कूल / कॉलेज / संस्थान", year: "शैक्षणिक वर्ष", useFamily: "मेरे सत्यापित परिवार विवरण उपयोग करें", pickMember: "जानकारी भरने के लिए परिवार सदस्य चुनें", familyAvailable: "आपके सत्यापित परिवार विवरण उपलब्ध हैं। आप उनसे यह फ़ॉर्म भर सकते हैं।", familyError: "परिवार की जानकारी लोड नहीं हुई। आप स्वतंत्र रूप से आवेदन कर सकते हैं।", submit: "विद्यार्थी आवेदन जमा करें", submitting: "जमा हो रहा है…", success: "विद्यार्थी आवेदन जमा हो गया", successText: "आपका आवेदन {id} एडमिन समीक्षा की प्रतीक्षा में है। स्वीकृति के बाद विद्यार्थी आईडी जारी होगी।", back: "वेबसाइट पर वापस जाएँ", required: "कृपया सभी आवश्यक जानकारी भरें।", select: "चुनें", noFamily: "इस खाते से सत्यापित परिवार सदस्यता जुड़ी नहीं है। आप स्वतंत्र रूप से आवेदन कर सकते हैं।", loginHint: "पहले से परिवार सदस्य हैं? सहेजी जानकारी उपयोग करने के लिए लॉगिन करें; विद्यार्थी पंजीकरण अलग रहेगा।", appError: "विद्यार्थी आवेदन जमा नहीं हो सका। कृपया फिर प्रयास करें।", otherDetail: "अतिरिक्त विवरण",
  },
};

const levels = ["School", "Undergraduate / College", "Postgraduate", "Diploma / ITI / Professional course", "PhD / Research", "Other"];
const empty = { studentName: "", mobile: "", email: "", dob: "", gender: "", fatherName: "", guardianName: "", guardianMobile: "", address: "", city: "", district: "Khargone", state: "Madhya Pradesh", pincode: "", course: "", institution: "", academicYear: "" };
const field = "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm";

export default function StudentRegistration() {
  const { lang } = useLang();
  const { isAuthenticated, isLoadingAuth, user } = useAuth();
  const t = COPY[lang] || COPY.en;
  const [form, setForm] = useState(empty);
  const [family, setFamily] = useState(null);
  const [familyLoading, setFamilyLoading] = useState(false);
  const [familyError, setFamilyError] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [useFamily, setUseFamily] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(null);
  const [level, setLevel] = useState("");
  const members = useMemo(() => family?.members || [], [family]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    setFamilyLoading(true);
    base44.me.family().then((data) => { if (active) setFamily(data); }).catch(() => { if (active) setFamilyError(true); }).finally(() => { if (active) setFamilyLoading(false); });
    return () => { active = false; };
  }, [isAuthenticated]);

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const applyMember = (id) => {
    const member = members.find((item) => item.id === id);
    if (!member) return;
    setMemberId(id);
    setForm((current) => ({
      ...current,
      studentName: member.name || current.studentName,
      mobile: member.mobile || user?.phone || current.mobile,
      email: member.email || user?.email || current.email,
      dob: member.dob ? String(member.dob).slice(0, 10) : current.dob,
      gender: member.gender || current.gender,
      address: member.address || family?.family?.address || current.address,
      city: family?.family?.city || current.city,
      district: family?.family?.district || current.district,
      pincode: family?.family?.pincode || current.pincode,
      fatherName: family?.family?.familyHeadName || current.fatherName,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.studentName.trim() || !/^[6-9]\d{9}$/.test(form.mobile.replace(/\D/g, "").slice(-10)) || !form.email.trim() || !form.gender || !form.fatherName.trim() || !form.academicYear.trim()) {
      setError(t.required);
      return;
    }
    setBusy(true);
    try {
      const recaptchaToken = await getRecaptchaToken("student_registration");
      const result = await base44.entities.StudentApplication.create({
        ...form,
        mobile: form.mobile.replace(/\D/g, "").slice(-10),
        memberId: memberId || undefined,
        recaptchaToken,
        lang,
      });
      setSubmitted(result);
    } catch (err) {
      setError(translateError(err.message || t.appError, lang));
    } finally {
      setBusy(false);
    }
  };

  const levelLabel = (item) => ({ "School": t.levelSchool, "Undergraduate / College": t.levelCollege, "Postgraduate": t.levelPostgrad, "Diploma / ITI / Professional course": t.levelDiploma, "PhD / Research": t.levelResearch, "Other": t.levelOther })[item];

  return <>
    <PublicNav />
    <main className="mx-auto min-h-[70vh] max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
      <header className="mx-auto mb-7 max-w-3xl text-center"><div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><GraduationCap className="h-7 w-7"/></div><h1 className="text-3xl font-bold text-foreground sm:text-4xl">{t.title}</h1><p className="mt-2 text-muted-foreground">{t.subtitle}</p></header>
      <section className="mx-auto max-w-3xl rounded-2xl border bg-card p-5 shadow-sm sm:p-8">
        {submitted ? <div className="py-8 text-center" role="status"><CheckCircle2 className="mx-auto h-12 w-12 text-green-600"/><h2 className="mt-4 text-xl font-semibold">{t.success}</h2><p className="mt-2 text-sm text-muted-foreground">{t.successText.replace("{id}", submitted.applicationId)}</p><Link className="mt-6 inline-flex text-primary underline" to="/">{t.back}</Link></div> : <>
          {isAuthenticated && <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm"><p>{familyLoading ? "…" : family?.family && members.length ? t.familyAvailable : familyError ? t.familyError : t.noFamily}</p>{family?.family && members.length>0 && <div className="mt-3 space-y-3"><label className="flex items-start gap-3"><input className="mt-1 h-4 w-4" type="checkbox" checked={useFamily} onChange={(e)=>{setUseFamily(e.target.checked);if(!e.target.checked){setMemberId("");setForm(empty);}}}/><span>{t.useFamily}</span></label>{useFamily&&<select className={field} aria-label={t.pickMember} value={memberId} onChange={(e)=>applyMember(e.target.value)}><option value="">{t.pickMember}</option>{members.filter(m=>m.status==='ACTIVE').map(m=><option key={m.id} value={m.id}>{m.name} · {m.membershipId||family.family.familyId}</option>)}</select>}</div>}</div>}
          {!isAuthenticated&&!isLoadingAuth&&<p className="mb-5 rounded-xl bg-muted p-3 text-sm text-muted-foreground">{t.loginHint} <Link className="text-primary underline" to={`/login?returnTo=${encodeURIComponent('/student-register')}`}>Login</Link></p>}
          <form onSubmit={submit} className="space-y-6">
            <fieldset className="grid gap-4 sm:grid-cols-2"><legend className="mb-3 text-lg font-semibold">{t.section}</legend>
              {[["studentName",t.name,"text"],["mobile",t.mobile,"tel"],["email",t.email,"email"],["dob",t.dob,"date"],[["fatherName"],t.father,"text"]].map(([key,label,type])=>{const name=Array.isArray(key)?key[0]:key;return <div key={name} className="space-y-2"><Label htmlFor={`student-${name}`}>{label}{["studentName","mobile","email","fatherName"].includes(name)?" *":""}</Label><Input id={`student-${name}`} className="h-11" type={type} value={form[name]} onChange={update(name)} required={["studentName","mobile","email","fatherName"].includes(name)} maxLength={name==="mobile"?10:255}/></div>;})}
              <div className="space-y-2"><Label htmlFor="student-gender">{t.gender} *</Label><select id="student-gender" className={field} value={form.gender} onChange={update("gender")} required><option value="">{t.select}</option>{[["Male",t.male],["Female",t.female],["Other",t.other]].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
              <div className="space-y-2"><Label htmlFor="student-guardian">{t.guardian}</Label><Input id="student-guardian" className="h-11" value={form.guardianName} onChange={update("guardianName")}/></div><div className="space-y-2"><Label htmlFor="student-guardian-mobile">{t.guardianMobile}</Label><Input id="student-guardian-mobile" className="h-11" type="tel" value={form.guardianMobile} onChange={update("guardianMobile")}/></div>
              {[["address",t.address], ["city",t.city], ["district",t.district], ["state",t.state], ["pincode",t.pincode]].map(([key,label])=><div key={key} className="space-y-2"><Label htmlFor={`student-${key}`}>{label}</Label><Input id={`student-${key}`} className="h-11" value={form[key]} onChange={update(key)} maxLength={key==="pincode"?6:255}/></div>)}
            </fieldset>
            <fieldset className="grid gap-4 sm:grid-cols-2"><legend className="mb-3 text-lg font-semibold">{t.education}</legend><div className="space-y-2 sm:col-span-2"><Label htmlFor="education-level">{t.education} *</Label><select id="education-level" className={field} value={level} onChange={(e)=>setLevel(e.target.value)} required><option value="">{t.select}</option>{levels.map(item=><option value={item} key={item}>{levelLabel(item)}</option>)}</select></div>{level&&[["course",t.course],["institution",t.institution],["academicYear",t.year]].map(([key,label])=><div key={key} className="space-y-2"><Label htmlFor={`student-${key}`}>{label} *</Label><Input id={`student-${key}`} className="h-11" value={form[key]} onChange={update(key)} required maxLength={255}/></div>)}</fieldset>
            {error&&<p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={busy} className="h-12 w-full">{busy?<><Loader2 className="mr-2 h-4 w-4 animate-spin"/>{t.submitting}</>:<><BookOpenCheck className="mr-2 h-4 w-4"/>{t.submit}</>}</Button>
          </form>
        </>}
      </section>
    </main>
    <PublicFooter />
  </>;
}

import { useEffect, useState } from "react";
import { BedDouble, CheckCircle2, Hospital, Loader2, Phone, Send, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { bloodApi } from "@/api/bloodHelpApi";
import BloodGroupSelect from "@/components/blood/BloodGroupSelect";
import BloodLayout from "@/components/blood/BloodLayout";
import DonorSuggestions from "@/components/blood/DonorSuggestions";
import MembersOnly from "@/components/blood/MembersOnly";
import PageHeading from "@/components/blood/PageHeading";
import UnitsStepper from "@/components/blood/UnitsStepper";
import { BLOOD_PATHS, bloodError, useBloodCopy, validMobile } from "@/lib/blood-help";
import { sanitizeMobile } from "@/lib/utils";

const EMPTY = { patientName: "", bloodGroup: "", units: 1, hospital: "", city: "Indore", contactName: "", contactPhone: "" };
const input = "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-[#C8102E] focus:ring-2 focus:ring-[#C8102E]/20 aria-[invalid=true]:border-destructive";

function Field({ id, label, error, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label} <span className="text-[#C8102E]">*</span>
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

// Page 3: request blood for a patient, then pick from the eligible matching donors (WhatsApp or portal notification).
export default function BloodRequest() {
  const { t, lang } = useBloodCopy();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [result, setResult] = useState(null);
  const [members, setMembers] = useState(true);

  // The member's own name and mobile start the contact person (they can change it); non-members see why they can't.
  useEffect(() => {
    bloodApi
      .profile()
      .then((profile) => setForm((current) => ({ ...current, contactName: current.contactName || profile.name, contactPhone: current.contactPhone || profile.mobile, city: profile.city || current.city })))
      .catch((error) => error.status === 403 && setMembers(false));
  }, []);

  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));
  const text = (key) => (event) => set(key)(event.target.value);
  const validate = () => {
    const next = {};
    if (!form.patientName.trim()) next.patientName = t.required(t.patientName);
    if (!form.bloodGroup) next.bloodGroup = t.required(t.requiredGroup);
    if (!(form.units >= 1)) next.units = t.required(t.unitsRequired);
    if (!form.hospital.trim()) next.hospital = t.required(t.hospitalName);
    if (!form.city.trim()) next.city = t.required(t.city);
    if (!form.contactName.trim()) next.contactName = t.required(t.contactName);
    if (!validMobile(form.contactPhone)) next.contactPhone = t.badMobile;
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  const submit = async (event) => {
    event.preventDefault();
    setFailure("");
    if (!validate()) return;
    setBusy(true);
    try {
      setResult(await bloodApi.createRequest({ ...form, lang }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setFailure(bloodError(error, t));
    } finally {
      setBusy(false);
    }
  };
  const attrs = (key) => ({ id: `blood-${key}`, "aria-invalid": Boolean(errors[key]), "aria-describedby": errors[key] ? `blood-${key}-error` : undefined });

  return (
    <BloodLayout title={t.requestTitle}>
      <PageHeading icon={BedDouble} title={t.requestTitle} subtitle={t.requestSub} />
      <div className="mt-6">
        {!members ? (
          <MembersOnly />
        ) : result ? (
          <div className="space-y-5">
            <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-green-300 bg-green-50 p-5 text-green-900 dark:border-green-800 dark:bg-green-950/40 dark:text-green-100">
              <span className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                {t.requestSaved(result.request.reference)}
              </span>
              <span className="flex flex-wrap gap-2">
                <Link to={BLOOD_PATHS.requests} className="rounded-lg border border-green-700 px-3 py-1.5 text-sm font-semibold">
                  {t.viewMyRequests}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setForm((current) => ({ ...EMPTY, contactName: current.contactName, contactPhone: current.contactPhone, city: current.city }));
                  }}
                  className="rounded-lg border border-green-700 px-3 py-1.5 text-sm font-semibold"
                >
                  {t.newRequest}
                </button>
              </span>
            </div>
            <DonorSuggestions requestId={result.request.id} suggestions={result.suggestions} />
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[17rem_1fr]">
            <aside className="flex flex-col items-center rounded-2xl bg-[#C8102E]/5 p-6 text-center">
              <Hospital className="h-24 w-24 text-[#C8102E]" aria-hidden="true" />
              <p className="mt-4 font-display text-xl font-bold text-[#C8102E]">{t.sideTitle}</p>
              <ul className="mt-4 space-y-2 text-left text-sm">
                {t.sidePoints.map((point) => (
                  <li key={point} className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>
            </aside>
            <form onSubmit={submit} noValidate className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
              <fieldset className="space-y-4">
                <legend className="mb-3 flex w-full items-center gap-2 rounded-lg bg-[#C8102E]/5 px-4 py-2.5 font-semibold text-[#C8102E]">
                  <UserRound className="h-5 w-5" aria-hidden="true" />
                  {t.patientSection}
                </legend>
                <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
                  <Field id="blood-patientName" label={t.patientName} error={errors.patientName}>
                    <input {...attrs("patientName")} className={input} maxLength={150} value={form.patientName} onChange={text("patientName")} autoComplete="off" />
                  </Field>
                  <Field id="blood-bloodGroup" label={t.requiredGroup} error={errors.bloodGroup}>
                    <BloodGroupSelect {...attrs("bloodGroup")} value={form.bloodGroup} onChange={set("bloodGroup")} placeholder={t.selectGroup} required />
                  </Field>
                  <Field id="blood-units" label={t.unitsRequired} error={errors.units}>
                    <UnitsStepper id="blood-units" value={form.units} onChange={set("units")} />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="blood-hospital" label={t.hospitalName} error={errors.hospital}>
                    <input {...attrs("hospital")} className={input} maxLength={200} value={form.hospital} onChange={text("hospital")} />
                  </Field>
                  <Field id="blood-city" label={t.city} error={errors.city}>
                    <input {...attrs("city")} className={input} maxLength={150} value={form.city} onChange={text("city")} autoComplete="address-level2" />
                  </Field>
                </div>
              </fieldset>
              <fieldset className="space-y-4">
                <legend className="mb-3 flex w-full items-center gap-2 rounded-lg bg-[#C8102E]/5 px-4 py-2.5 font-semibold text-[#C8102E]">
                  <Phone className="h-5 w-5" aria-hidden="true" />
                  {t.contactSection} <span className="font-normal text-muted-foreground">{t.contactSectionHint}</span>
                </legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="blood-contactName" label={t.contactName} error={errors.contactName}>
                    <input {...attrs("contactName")} className={input} maxLength={150} value={form.contactName} onChange={text("contactName")} autoComplete="name" />
                  </Field>
                  <Field id="blood-contactPhone" label={t.contactMobile} error={errors.contactPhone}>
                    <input {...attrs("contactPhone")} className={input} inputMode="numeric" maxLength={16} value={form.contactPhone} onChange={(event) => set("contactPhone")(sanitizeMobile(event.target.value))} autoComplete="tel" />
                  </Field>
                </div>
              </fieldset>
              {failure && (
                <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {failure}
                </p>
              )}
              <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#C8102E] px-6 py-3 text-base font-semibold text-white shadow transition hover:bg-[#a50d26] disabled:opacity-60">
                {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Send className="h-5 w-5" aria-hidden="true" />}
                {busy ? t.submitting : t.submitRequest}
              </button>
            </form>
          </div>
        )}
      </div>
    </BloodLayout>
  );
}

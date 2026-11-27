import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Download, Loader2, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ProfileCompletionCard from "@/components/ProfileCompletionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/AuthContext";
import { FEES, fill, regCopy, translateError, UPI } from "@/lib/registration-copy";
import CreatableCombobox from "@/components/CreatableCombobox";
import { INDORE_AREAS, mergeOptions } from "@/lib/native-places";
import VillageCombobox from "@/components/VillageCombobox";
import { indiaToday } from "@/lib/dates";
import { isSchoolClass, MARITAL_STATUSES, optionLabel, STUDENT_COURSES } from "@/lib/member-options";
import BloodGroupSelect from "@/components/blood/BloodGroupSelect";

const CITIES = ["Indore", "Ujjain", "Dewas", "Other"];
// Student registration: the local address must be in Indore (district Indore), checked by the server too.
const STUDENT_CITY = "Indore";
const GENDERS = ["Male", "Female", "Other"];
const OTHER = "__other__";
const EMPTY = { firstName: "", lastName: "", gender: "", dob: "", maritalStatus: "", education: "", bloodGroup: "", city: "Indore", area: "", address: "", pincode: "", nativeVillage: "" };
const STEP_KEYS = ["stepDetails", "stepAddress", "stepPayment", "stepReview"];
const today = () => indiaToday();
// Same rules as the server: before today, at most 120 years ago, at least 18 years old (member and student:
// students register after 12th).
const MIN_AGE = { FAMILY: 18, STUDENT: 18 };
const yearsAgo = (years, from = today()) => `${String(Number(from.slice(0, 4)) - years).padStart(4, "0")}${from.slice(4)}`;
const validDob = (dob, type) => /^\d{4}-\d{2}-\d{2}$/.test(dob) && dob < today() && dob >= yearsAgo(120) && dob <= yearsAgo(MIN_AGE[type] ?? 0);

const field = "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary";

// Dropdown from the admin-managed list, with "Other" to type a value that isn't listed.
function ListOrText({ id, label, value, onChange, options, otherLabel, placeholder, lang, t, inputMode, maxLength, autoComplete = "off" }) {
  const listed = options.some((option) => option.value === value);
  const [typing, setTyping] = useState(Boolean(value) && !listed);
  useEffect(() => {
    if (value && options.length && !options.some((option) => option.value === value)) setTyping(true);
  }, [options, value]);
  const showText = typing || options.length === 0;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label} *</Label>
      {options.length > 0 && (
        <select
          id={id}
          className={field}
          autoComplete={autoComplete}
          value={showText ? OTHER : value}
          onChange={(e) => {
            const next = e.target.value;
            setTyping(next === OTHER);
            onChange(next === OTHER ? "" : next);
          }}
          required={!showText}
        >
          <option value="">{t.select}</option>
          {options.map((option) => (
            <option key={option.id} value={option.value}>
              {lang === "hi" && option.labelHi ? option.labelHi : option.value}
            </option>
          ))}
          <option value={OTHER}>{otherLabel}</option>
        </select>
      )}
      {showText && (
        <Input
          id={options.length ? `${id}-text` : id}
          aria-label={options.length ? placeholder : undefined}
          className="h-11"
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          inputMode={inputMode}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          required
        />
      )}
    </div>
  );
}

function Wizard({ initial, onDone, t, lang, regType = "FAMILY" }) {
  const editing = Boolean(initial?.id);
  // A resubmission keeps its own type; a new registration uses the page's type (?type=student → STUDENT, ₹100).
  const type = initial?.type || regType;
  const student = type === "STUDENT";
  const { refreshUser } = useAuth();
  // A student registers with their local Indore address (district Indore); an older one elsewhere is entered again.
  const [form, setForm] = useState(() => {
    const start = { ...EMPTY, ...(initial?.form || {}) };
    return student && start.city !== STUDENT_CITY ? { ...start, city: STUDENT_CITY, area: "", address: "", pincode: "" } : start;
  });
  const [step, setStep] = useState(0);
  const [areas, setAreas] = useState([]);
  const [pincodes, setPincodes] = useState([]);
  const [screenshot, setScreenshot] = useState(null); // { fileId, preview }
  const [utr, setUtr] = useState(initial?.payment?.utr || "");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const needsNewScreenshot = !editing || initial?.payment?.status === "REJECTED" || !initial?.payment;
  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    if (form.city === "Other") {
      setAreas([]);
      setPincodes([]);
      return;
    }
    base44.addressOptions.list("AREA", form.city).then(setAreas).catch(() => setAreas([]));
    base44.addressOptions.list("PINCODE", form.city).then(setPincodes).catch(() => setPincodes([]));
  }, [form.city]);
  useEffect(() => () => screenshot?.preview && URL.revokeObjectURL(screenshot.preview), [screenshot]);

  const amount = FEES[type] || 0;
  const validStep = (index) => {
    if (index === 0)
      return (
        form.firstName.trim() &&
        form.lastName.trim() &&
        form.gender &&
        validDob(form.dob, type) &&
        (type === "STUDENT" ? form.education.trim() && !isSchoolClass(form.education) : form.maritalStatus)
      );
    if (index === 1) return (student ? form.city === STUDENT_CITY : form.city) && form.area.trim() && form.address.trim() && /^[1-9]\d{5}$/.test(form.pincode) && form.nativeVillage.trim();
    if (index === 2) return !needsNewScreenshot || screenshot?.fileId;
    return agree;
  };

  const upload = async (file) => {
    if (!file) return;
    setError("");
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 5 * 1024 * 1024)
      return setError(translateError("Payment screenshot must be a JPG, PNG or WEBP image of at most 5 MB.", lang));
    setBusy(true);
    try {
      const { fileId } = await base44.registrations.uploadScreenshot(file);
      setScreenshot({ fileId, preview: URL.createObjectURL(file) });
    } catch (err) {
      setError(translateError(err.message, lang));
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { maritalStatus, education, ...rest } = form;
      const extra = type === "STUDENT" ? { education: education.trim() } : { maritalStatus };
      const body = { type, ...rest, ...extra, bloodGroup: rest.bloodGroup || undefined, screenshotFileId: screenshot?.fileId || undefined, utr: utr.trim() || undefined, lang };
      const result = editing ? await base44.registrations.resubmit(initial.id, body) : await base44.registrations.submit(body);
      setDone(result);
      // The account is now a Student / Family Member account: reload it so the menu shows that portal's pages.
      refreshUser?.();
    } catch (err) {
      setError(translateError(err.message, lang));
    } finally {
      setBusy(false);
    }
  };

  if (done)
    return (
      <section className="rounded-2xl border border-border bg-card p-6 text-center" role="status">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" aria-hidden="true" />
        <h2 className="mt-3 text-xl font-semibold">{t.submittedTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{fill(t.submittedText, { id: done.applicationId })}</p>
        <Button className="mt-5" onClick={onDone}>
          {t.continue}
        </Button>
      </section>
    );

  return (
    <form id="registration-wizard" onSubmit={submit} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">
          {t[type]} · ₹{amount}
        </h2>
      </div>
      <ol className="mt-4 grid grid-cols-4 gap-2 text-xs font-medium">
        {STEP_KEYS.map((key, index) => (
          <li key={key}>
            <div className={`h-1.5 rounded-full ${index <= step ? "bg-primary" : "bg-muted"}`} />
            <span className={`mt-1 block truncate ${index === step ? "text-primary" : "text-muted-foreground"}`} aria-current={index === step ? "step" : undefined}>
              {index + 1}. {t[key]}
            </span>
          </li>
        ))}
      </ol>
      {error && (
        <div role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mt-5 space-y-4">
        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reg-first">{t.firstName} *</Label>
              <Input id="reg-first" className="h-11" autoComplete="given-name" maxLength={100} value={form.firstName} onChange={(e) => set("firstName")(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-last">{t.lastName} *</Label>
              <Input id="reg-last" className="h-11" autoComplete="family-name" maxLength={100} value={form.lastName} onChange={(e) => set("lastName")(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-gender">{t.gender} *</Label>
              <select id="reg-gender" className={field} value={form.gender} onChange={(e) => set("gender")(e.target.value)} required>
                <option value="">{t.select}</option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {t[g]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-dob">{t.dob} *</Label>
              <Input
                id="reg-dob"
                type="date"
                className="h-11"
                max={yearsAgo(MIN_AGE[type] ?? 0)}
                min={yearsAgo(120)}
                value={form.dob}
                onChange={(e) => set("dob")(e.target.value)}
                aria-describedby="reg-dob-rule"
                required
              />
              <p id="reg-dob-rule" className={`text-xs ${form.dob && !validDob(form.dob, type) ? "text-destructive" : "text-muted-foreground"}`}>
                {t[`dobRule${type}`]}
              </p>
            </div>
            {type === "STUDENT" ? (
              <div className="sm:col-span-2">
                <CreatableCombobox
                  id="reg-education"
                  label={t.education}
                  value={form.education}
                  onChange={set("education")}
                  options={STUDENT_COURSES}
                  lang={lang}
                  t={t}
                />
                <p className={`mt-1 text-xs ${isSchoolClass(form.education) ? "text-destructive" : "text-muted-foreground"}`} role={isSchoolClass(form.education) ? "alert" : undefined}>
                  {isSchoolClass(form.education) ? t.educationAfter12 : t.educationHint}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="reg-marital">{t.maritalStatus} *</Label>
                <select id="reg-marital" className={field} value={form.maritalStatus} onChange={(e) => set("maritalStatus")(e.target.value)} required>
                  <option value="">{t.select}</option>
                  {MARITAL_STATUSES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {lang === "hi" ? o.hi : o.en}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="reg-blood">{t.bloodGroup}</Label>
              <BloodGroupSelect id="reg-blood" value={form.bloodGroup || ""} onChange={set("bloodGroup")} placeholder={t.bloodGroupUnknown} aria-describedby="reg-blood-hint" className="rounded-xl" />
              <p id="reg-blood-hint" className="text-xs text-muted-foreground">{t.bloodGroupHint}</p>
            </div>
          </div>
        )}

        {step === 1 && (
          <>
            <h3 className="font-semibold">{student ? t.localAddressIndore : t.currentAddress}</h3>
            {student && <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">{t.studentIndoreHint}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reg-city">{t.city} *</Label>
                <select
                  id="reg-city"
                  className={field}
                  autoComplete="address-level2"
                  value={form.city}
                  onChange={(e) => setForm((current) => ({ ...current, city: e.target.value, area: "", pincode: "" }))}
                  disabled={student}
                  required
                >
                  {(student ? [STUDENT_CITY] : CITIES).map((city) => (
                    <option key={city} value={city}>
                      {city === "Other" ? t.OtherCity : t[city]}
                    </option>
                  ))}
                </select>
              </div>
              <CreatableCombobox
                key={`area-${form.city}`}
                id="reg-area"
                label={t.area}
                value={form.area}
                onChange={set("area")}
                options={mergeOptions(areas, form.city === "Indore" ? INDORE_AREAS : [])}
                lang={lang}
                t={t}
                autoComplete="address-level3"
              />
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="reg-address">{t.address} *</Label>
                <Input id="reg-address" className="h-11" autoComplete="street-address" maxLength={500} value={form.address} onChange={(e) => set("address")(e.target.value)} required />
              </div>
              <ListOrText
                key={`pin-${form.city}`}
                id="reg-pincode"
                label={t.pincode}
                value={form.pincode}
                onChange={(value) => set("pincode")(value.replace(/\D/g, "").slice(0, 6))}
                options={pincodes}
                otherLabel={t.areaOther}
                placeholder={t.typePincode}
                lang={lang}
                t={t}
                inputMode="numeric"
                maxLength={6}
                autoComplete="postal-code"
              />
            </div>
            <h3 className="pt-2 font-semibold">{t.nativeAddress}</h3>
            <VillageCombobox id="reg-village" label={t.nativeVillage} value={form.nativeVillage} onChange={set("nativeVillage")} lang={lang} required />
          </>
        )}

        {step === 2 && (
          <div className="grid gap-5 md:grid-cols-2">
            <div className="text-center">
              <h3 className="font-semibold">{fill(t.payTitle, { amount })}</h3>
              <img src="/upi-qr.png" alt={`UPI QR — ${UPI.payee} — ${UPI.id}`} className="mx-auto mt-3 w-full max-w-[260px] rounded-xl border border-border" width="447" height="566" />
              <p className="mt-2 text-sm">
                {t.payee}: <strong>{UPI.payee}</strong>
                <br />
                {t.upiId}: <strong className="select-all">{UPI.id}</strong>
              </p>
              <a href="/upi-qr.png" download="NPS-Indore-UPI-QR.png" className="mt-3 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-primary">
                <Download className="h-4 w-4" aria-hidden="true" />
                {t.downloadQr}
              </a>
            </div>
            <div className="space-y-4">
              <p className="rounded-xl bg-primary/5 p-3 text-sm">{fill(t.payHow, { amount })}</p>
              {editing && !needsNewScreenshot && <p className="text-sm text-muted-foreground">{t.uploaded} ✓</p>}
              <div className="space-y-2">
                <Label htmlFor="reg-screenshot">
                  {t.screenshot} {needsNewScreenshot ? "*" : ""}
                </Label>
                <label
                  htmlFor="reg-screenshot"
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-4 text-center text-sm hover:border-primary"
                >
                  {screenshot ? (
                    <img src={screenshot.preview} alt={t.uploaded} className="max-h-48 rounded-lg" />
                  ) : (
                    <Upload className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                  )}
                  <span>{busy ? t.uploading : screenshot ? `${t.uploaded} · ${t.replace}` : t.screenshotHint}</span>
                </label>
                <input id="reg-screenshot" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={(e) => upload(e.target.files?.[0])} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-utr">{t.utr}</Label>
                <Input id="reg-utr" className="h-11" maxLength={40} value={utr} onChange={(e) => setUtr(e.target.value.replace(/[^0-9A-Za-z]/g, ""))} />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <h3 className="font-semibold">{t.reviewTitle}</h3>
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {[
                [t.application, t[type]],
                [t.firstName, `${form.firstName} ${form.lastName}`],
                [t.gender, t[form.gender]],
                [t.dob, form.dob],
                type === "STUDENT" ? [t.education, form.education] : [t.maritalStatus, optionLabel(MARITAL_STATUSES, form.maritalStatus, lang)],
                [t.bloodGroup, form.bloodGroup || t.bloodGroupUnknown],
                [t.currentAddress, `${form.address}, ${form.area}, ${form.city === "Other" ? t.OtherCity : t[form.city]} - ${form.pincode}`],
                [t.nativeVillage, form.nativeVillage],
                [t.payment, `₹${amount}${utr ? ` · UTR ${utr}` : ""}`],
              ].map(([label, value]) => (
                <div key={label} className="border-b border-border pb-2">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium break-words">{value}</dd>
                </div>
              ))}
            </dl>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1" checked={agree} onChange={(e) => setAgree(e.target.checked)} required />
              <span>{t.declaration}</span>
            </label>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap justify-between gap-3">
        <Button type="button" variant="outline" disabled={step === 0 || busy} onClick={() => setStep((s) => s - 1)}>
          {t.back}
        </Button>
        {step < 3 ? (
          <Button
            type="button"
            disabled={busy}
            onClick={() => {
              setError("");
              if (validStep(step)) return setStep((s) => s + 1);
              const invalid = document.querySelector("#registration-wizard :invalid");
              if (invalid) invalid.reportValidity();
              else setError(step === 2 ? t.screenshotNeeded : t.fillRequired);
            }}
          >
            {t.next}
          </Button>
        ) : (
          <Button type="submit" disabled={busy || !agree}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {busy ? t.submitting : editing ? t.resubmit : t.submit}
          </Button>
        )}
      </div>
    </form>
  );
}

function StatusCard({ registration, t, onResubmit }) {
  const [shot, setShot] = useState("");
  const payment = registration.payment;
  const paymentLabel = payment ? (payment.status === "REJECTED" ? t.PAY_REJECTED : t[payment.status] || payment.status) : "—";
  const tone = (status) =>
    ["APPROVED", "VERIFIED", "SUCCESS"].includes(status)
      ? "bg-green-100 text-green-800"
      : ["REJECTED", "CORRECTION_REQUIRED"].includes(status)
        ? "bg-red-100 text-red-800"
        : status === "REFUNDED"
          ? "bg-slate-200 text-slate-800"
          : "bg-amber-100 text-amber-900";
  useEffect(() => () => shot && URL.revokeObjectURL(shot), [shot]);
  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">
          {t[registration.type]} · {registration.applicationId}
        </h2>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone(registration.status)}`}>{t[registration.status] || registration.status}</span>
      </div>
      {registration.resultId && <p className="mt-2 text-sm font-medium">{fill(t.approvedId, { id: registration.resultId })}</p>}
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">{t.payment}</dt>
          <dd>
            ₹{payment?.amount ?? FEES[registration.type]} · <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tone(payment?.status)}`}>{paymentLabel}</span>
          </dd>
        </div>
        {(registration.adminRemarks || payment?.adminRemarks) && (
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">{t.remarks}</dt>
            <dd className="whitespace-pre-line break-words">{[payment?.adminRemarks, registration.adminRemarks].filter(Boolean).join("\n")}</dd>
          </div>
        )}
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        {registration.canResubmit && <Button onClick={() => onResubmit(registration)}>{t.fixAndResubmit}</Button>}
        {payment?.hasScreenshot && (
          <Button
            variant="outline"
            onClick={() =>
              base44.registrations
                .screenshot(payment.id)
                .then((blob) => setShot(URL.createObjectURL(blob)))
                .catch(() => undefined)
            }
          >
            {t.viewScreenshot}
          </Button>
        )}
      </div>
      {shot && <img src={shot} alt={t.screenshot} className="mt-3 max-h-80 rounded-lg border border-border" />}
    </article>
  );
}

export default function PortalRegistration() {
  const { lang } = useLang();
  const t = regCopy[lang];
  const [state, setState] = useState({ loading: true, data: null, error: "" });
  const [editing, setEditing] = useState(null); // null: not open, {} new, or a registration to fix
  const [params] = useSearchParams();
  const regType = params.get("type") === "student" ? "STUDENT" : "FAMILY";
  const fromStudent = params.get("from") === "student";

  const load = useCallback(() => {
    setState((current) => ({ ...current, loading: true }));
    base44.registrations
      .mine()
      .then((data) => setState({ loading: false, data, error: "" }))
      .catch((err) => setState({ loading: false, data: null, error: translateError(err.message, lang) }));
  }, [lang]);
  useEffect(load, [load]);

  const registrations = useMemo(() => state.data?.registrations ?? [], [state.data]);
  const familyRegistrations = registrations.filter((r) => r.type === regType);
  const open = familyRegistrations.filter((r) => r.status !== "REJECTED");
  const showWizard = editing !== null || (!state.loading && !state.error && open.length === 0);
  // A student becomes a member by registering (₹500) with their student details filled in; after approval
  // the server moves the student record into the new family.
  const studentRegistration = registrations.find((r) => r.type === "STUDENT" && r.status !== "REJECTED");
  const hasMemberRegistration = registrations.some((r) => r.type === "FAMILY" && r.status !== "REJECTED");
  const canBecomeMember = studentRegistration?.status === "APPROVED" && !hasMemberRegistration;
  const studentPrefill = regType === "FAMILY" && fromStudent && studentRegistration ? { type: "FAMILY", form: studentRegistration.form } : null;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{regType === "STUDENT" ? t.STUDENT : t.regTitle}</h1>
        <p className="text-sm text-muted-foreground">{t.regSub}</p>
      </div>
      {state.data?.completion && <ProfileCompletionCard completion={state.data.completion} compact />}
      {state.loading && <p role="status">{t.loading}</p>}
      {state.error && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {!showWizard &&
        familyRegistrations.map((registration) => (
          <StatusCard key={registration.id} registration={registration} t={t} onResubmit={(r) => setEditing(r)} />
        ))}
      {regType === "STUDENT" && canBecomeMember && (
        <section className="rounded-2xl border border-gold/50 bg-gold/10 p-5">
          <h2 className="font-semibold">{t.becomeMemberTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{fill(t.becomeMemberText, { amount: FEES.FAMILY })}</p>
          <Button asChild className="mt-3">
            <Link to="/portal/registration?type=family&from=student">{t.becomeMember}</Link>
          </Button>
        </section>
      )}
      {showWizard && studentPrefill && !editing && (
        <p role="status" className="rounded-xl bg-primary/5 p-3 text-sm">
          {fill(t.fromStudentNote, { amount: FEES.FAMILY })}
        </p>
      )}
      {showWizard && (
        <Wizard
          key={editing?.id || editing?.type || `new-${regType}`}
          regType={regType}
          initial={editing?.id ? editing : editing?.type ? { type: editing.type } : studentPrefill}
          t={t}
          lang={lang}
          onDone={() => {
            setEditing(null);
            load();
          }}
        />
      )}
      <Link to="/portal" className="inline-block text-sm text-muted-foreground hover:text-primary">
        ← {t.back}
      </Link>
    </div>
  );
}

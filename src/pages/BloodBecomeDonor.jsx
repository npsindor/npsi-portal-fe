import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, Droplet, HandHeart, Loader2, Plus, UserRound, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { bloodApi } from "@/api/bloodHelpApi";
import BloodGroupSelect from "@/components/blood/BloodGroupSelect";
import BloodLayout from "@/components/blood/BloodLayout";
import MembersOnly from "@/components/blood/MembersOnly";
import PageHeading from "@/components/blood/PageHeading";
import { bloodError, formatDay, useBloodCopy } from "@/lib/blood-help";
import { indiaToday } from "@/lib/dates";

const readOnly = "flex h-11 items-center rounded-lg bg-muted px-3 text-sm text-foreground";

// Page 2: register as a donor. Name, mobile and city come from the member's own records (read-only); the member only
// enters the blood group and the last donation date.
export default function BloodBecomeDonor() {
  const { t, lang } = useBloodCopy();
  const [profile, setProfile] = useState(null);
  const [state, setState] = useState("loading");
  const [form, setForm] = useState({ bloodGroup: "", lastDonationDate: "", available: true });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    bloodApi
      .profile()
      .then((data) => {
        setProfile(data);
        if (data.donor) setForm({ bloodGroup: data.donor.bloodGroup, lastDonationDate: data.donor.lastDonationDate || "", available: data.donor.available });
        setState("ready");
      })
      .catch((error) => setState(error.status === 403 ? "members" : "error"));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (!form.bloodGroup) return setMessage({ ok: false, text: t.required(t.bloodGroup) });
    setBusy(true);
    setMessage(null);
    try {
      const donor = await bloodApi.saveDonor({ bloodGroup: form.bloodGroup, lastDonationDate: form.lastDonationDate || undefined, available: form.available });
      const wasDonor = Boolean(profile?.donor);
      setProfile((current) => ({ ...current, donor }));
      setMessage({ ok: true, text: wasDonor ? t.donorUpdated : t.donorSaved });
    } catch (error) {
      setMessage({ ok: false, text: bloodError(error, t) });
    } finally {
      setBusy(false);
    }
  };

  const info = (label, value) => (
    <div className="space-y-1.5">
      <div className="text-sm font-semibold">{label}</div>
      <div className={readOnly}>{value || <span className="text-muted-foreground">{t.missing}</span>}</div>
    </div>
  );

  return (
    <BloodLayout title={t.donorTitle}>
      <PageHeading icon={UsersRound} title={t.donorTitle} subtitle={t.donorSub} />
      <div className="mt-6">
        {state === "loading" && <p className="py-12 text-center text-sm text-muted-foreground">{t.loading}</p>}
        {state === "members" && <MembersOnly />}
        {state === "error" && <p className="py-12 text-center text-sm text-destructive">{t.failed}</p>}
        {state === "ready" && (
          <div className="grid gap-5 lg:grid-cols-[17rem_1fr]">
            <aside className="flex flex-col items-center rounded-2xl bg-[#C8102E]/5 p-6 text-center">
              <span className="relative flex h-32 w-32 items-end justify-center" aria-hidden="true">
                <HandHeart className="absolute bottom-0 h-24 w-24 text-[#C8102E]/25" />
                <span className="relative mb-10 flex h-16 w-16 items-center justify-center">
                  <Droplet className="absolute h-16 w-16 fill-[#C8102E] text-[#C8102E]" />
                  <Plus className="relative mt-3 h-6 w-6 text-white" strokeWidth={3} />
                </span>
              </span>
              <p className="mt-3 font-display text-xl font-bold text-[#C8102E]">{t.thanks}</p>
              <ul className="mt-4 space-y-2 text-left text-sm">
                {t.donorPoints.map((point) => (
                  <li key={point} className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>
            </aside>
            <form onSubmit={submit} noValidate className="rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex items-center gap-2 rounded-t-2xl bg-[#C8102E]/5 px-5 py-3 font-semibold text-[#C8102E]">
                <UserRound className="h-5 w-5" aria-hidden="true" />
                {t.yourInfo} <span className="font-normal text-muted-foreground">{t.autoFilled}</span>
              </div>
              <div className="grid gap-4 p-5 sm:grid-cols-3">
                {info(t.name, profile.name)}
                {info(t.mobile, profile.mobile && `+91 ${profile.mobile.slice(0, 5)} ${profile.mobile.slice(5)}`)}
                {info(t.cityAddress, profile.city)}
              </div>
              {(!profile.name || !profile.mobile) && (
                <p className="px-5 text-xs text-muted-foreground">
                  <Link to="/portal/settings" className="font-semibold text-[#C8102E] underline">
                    {t.editProfile}
                  </Link>
                </p>
              )}
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="donor-group" className="text-sm font-semibold">
                    {t.bloodGroup} <span className="text-[#C8102E]">*</span>
                  </label>
                  <BloodGroupSelect id="donor-group" value={form.bloodGroup} onChange={(bloodGroup) => setForm({ ...form, bloodGroup })} placeholder={t.selectGroup} required />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="donor-last" className="flex items-center gap-1.5 text-sm font-semibold">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    {t.lastDonation}
                  </label>
                  <input
                    id="donor-last"
                    type="date"
                    max={indiaToday()}
                    value={form.lastDonationDate}
                    onChange={(event) => setForm({ ...form, lastDonationDate: event.target.value })}
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-[#C8102E] focus:ring-2 focus:ring-[#C8102E]/20"
                  />
                  <p className="text-xs text-muted-foreground">{t.lastDonationHint}</p>
                </div>
                <label className="flex items-start gap-2 text-sm sm:col-span-2">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#C8102E]" checked={form.available} onChange={(event) => setForm({ ...form, available: event.target.checked })} />
                  {t.available}
                </label>
              </div>
              <div className="space-y-3 px-5 pb-6">
                {message && (
                  <p role={message.ok ? "status" : "alert"} className={`rounded-lg p-3 text-sm ${message.ok ? "bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-200" : "bg-destructive/10 text-destructive"}`}>
                    {message.text}
                  </p>
                )}
                {profile.donor?.nextEligibleDate && <p className="text-xs text-muted-foreground">{t.nextEligible(formatDay(profile.donor.nextEligibleDate, lang))}</p>}
                <button type="submit" disabled={busy} className="mx-auto flex w-full max-w-sm items-center justify-center gap-2 rounded-lg bg-[#C8102E] px-6 py-3 text-base font-semibold text-white shadow transition hover:bg-[#a50d26] disabled:opacity-60">
                  {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
                  {profile.donor ? t.updateDonor : t.registerDonor}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </BloodLayout>
  );
}

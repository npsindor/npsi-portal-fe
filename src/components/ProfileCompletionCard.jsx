import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useLang } from "@/lib/i18n";
import { fill, regCopy } from "@/lib/registration-copy";

const NUDGE_KEY = "npsi_profile_nudge_shown";

// "Your profile is 60% complete — next: add your family members", like job-portal profiles.
// `completion` can be passed in (the registration page already has it); otherwise it is loaded.
// With `nudge`, a small reminder pops up once per browser session after login.
export default function ProfileCompletionCard({ completion: given = null, compact = false, nudge = false }) {
  const { lang } = useLang();
  const t = regCopy[lang];
  const [completion, setCompletion] = useState(given);
  const [showNudge, setShowNudge] = useState(false);

  useEffect(() => {
    if (given) return setCompletion(given);
    let alive = true;
    base44.registrations
      .completion()
      .then((data) => alive && setCompletion(data))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [given]);

  useEffect(() => {
    if (!nudge || !completion?.next) return;
    try {
      if (sessionStorage.getItem(NUDGE_KEY)) return;
      sessionStorage.setItem(NUDGE_KEY, "1");
    } catch {
      return;
    }
    setShowNudge(true);
  }, [nudge, completion]);

  if (!completion) return null;
  const { percent, steps, next } = completion;
  const stepLabel = (step) => t[`step_${step.key}`] || step.key;

  return (
    <>
      <section className="rounded-2xl border border-border bg-card p-5" aria-label={fill(t.completionTitle, { p: percent })}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">{next ? fill(t.completionTitle, { p: percent }) : t.completionDone}</h2>
          <span className="text-sm font-semibold text-primary">{percent}%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
        </div>
        {next && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>{fill(t.completionNext, { step: stepLabel(next) })}</span>
            <Link to={next.link} className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">
              {t.continue}
            </Link>
          </div>
        )}
        {!compact && (
          <ul className="mt-4 grid gap-1.5 text-sm sm:grid-cols-2">
            {steps.map((step) => (
              <li key={step.key} className={`flex items-center gap-2 ${step.done ? "text-muted-foreground" : ""}`}>
                {step.done ? <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" /> : <Circle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
                {step.done ? stepLabel(step) : <Link to={step.link} className="hover:text-primary hover:underline">{stepLabel(step)}</Link>}
              </li>
            ))}
          </ul>
        )}
      </section>
      {showNudge && next && (
        <div role="status" className="fixed bottom-4 right-4 left-4 z-50 mx-auto max-w-sm rounded-2xl border border-border bg-card p-4 shadow-lg sm:left-auto">
          <button type="button" className="absolute right-3 top-3 text-muted-foreground hover:text-foreground" aria-label={t.later} onClick={() => setShowNudge(false)}>
            <X className="h-4 w-4" />
          </button>
          <p className="pr-6 font-semibold">{fill(t.completionTitle, { p: percent })}</p>
          <p className="mt-1 text-sm text-muted-foreground">{fill(t.completionNext, { step: stepLabel(next) })}</p>
          <div className="mt-3 flex gap-2">
            <Link to={next.link} onClick={() => setShowNudge(false)} className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground">
              {t.continue}
            </Link>
            <button type="button" className="rounded-full border border-border px-4 py-1.5 text-sm" onClick={() => setShowNudge(false)}>
              {t.later}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

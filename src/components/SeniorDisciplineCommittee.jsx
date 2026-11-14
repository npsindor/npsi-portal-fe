import React, { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useLang } from "@/lib/i18n";

function MemberPlaceholder({ name }) {
  return <div role="img" aria-label={`${name} photograph coming soon`} className="absolute inset-0 flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_35%,#f8fafc_0%,#e8edf2_38%,#d7e0e8_100%)]">
    <div className="absolute inset-3 rounded-[1.15rem] border border-[#c6a45a]/60" />
    <div className="absolute -top-12 h-48 w-48 rounded-full border border-[#c6a45a]/25" />
    <div className="absolute -top-8 h-36 w-36 rounded-full border border-[#c6a45a]/30" />
    <div className="relative flex flex-col items-center text-center text-[#102A43]">
      <ShieldCheck className="h-10 w-10 text-[#c6a45a]" strokeWidth={1.2} aria-hidden="true" />
      <span className="mt-3 font-serif text-2xl font-semibold tracking-wide">NPS</span>
      <span className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-[#526579]">Indore</span>
    </div>
    <span className="absolute bottom-7 text-[0.62rem] font-medium uppercase tracking-[0.18em] text-[#526579]">Portrait pending</span>
  </div>;
}

export default function SeniorDisciplineCommittee() {
  const { lang } = useLang();
  const [members, setMembers] = useState([]);
  useEffect(() => {
    let active = true;
    base44.seniorDisciplineCommittee.list().then((rows) => active && setMembers(rows)).catch(() => active && setMembers([]));
    return () => { active = false; };
  }, []);

  return <section aria-labelledby="senior-discipline-title" className="mt-12 rounded-[2rem] border border-[#c6a45a]/35 bg-white px-4 py-8 shadow-[0_24px_70px_-48px_rgba(16,42,67,0.5)] sm:px-7 sm:py-10">
    <div className="mx-auto mb-8 max-w-2xl text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-[#c6a45a]/50 bg-[#c6a45a]/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#102A43]"><ShieldCheck className="h-4 w-4 text-[#ad8734]" aria-hidden="true"/> NPS Indore</span>
      <h2 id="senior-discipline-title" className="mt-4 font-display text-2xl font-semibold leading-tight text-[#102A43] sm:text-3xl">वरिष्ठजन एवं अनुशासन समिति</h2>
      <p className="mt-2 text-sm font-medium tracking-wide text-[#526579]">Senior Members &amp; Discipline Committee</p>
      <div className="mx-auto mt-4 h-px w-20 bg-gradient-to-r from-transparent via-[#c6a45a] to-transparent" />
    </div>
    {members.length > 0 ? <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">{members.map((member) => {
      const name = lang === "hi" ? member.nameHi : member.nameEn;
      const designation = lang === "hi" ? member.designationHi || member.designationEn : member.designationEn || member.designationHi;
      const introduction = lang === "hi" ? member.introductionHi || member.introductionEn : member.introductionEn || member.introductionHi;
      return <article key={member.id} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#102A43]/15 bg-white shadow-[0_8px_28px_-20px_rgba(16,42,67,0.6)] transition duration-300 hover:-translate-y-1 hover:border-[#c6a45a] hover:shadow-[0_18px_38px_-22px_rgba(16,42,67,0.42)]">
        <div className="relative aspect-[3/4] overflow-hidden border-b border-[#c6a45a]/50 bg-[#e8edf2]">{member.photoUrl ? <img src={member.photoUrl} alt={name} loading="lazy" className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.025]"/> : <MemberPlaceholder name={name}/>}</div>
        <div className="flex flex-1 flex-col items-center px-4 py-5 text-center"><h3 className="font-display text-lg font-semibold leading-snug text-[#102A43]">{name}</h3>{designation && <p className="mt-1 text-sm font-semibold text-[#ad8734]">{designation}</p>}{introduction && <p className="mt-3 text-sm leading-relaxed text-[#526579]">{introduction}</p>}</div>
      </article>;
    })}</div> : <p className="py-8 text-center text-sm text-[#526579]">{lang === "hi" ? "समिति सदस्यों की जानकारी शीघ्र उपलब्ध होगी।" : "Committee member details will be available soon."}</p>}
  </section>;
}

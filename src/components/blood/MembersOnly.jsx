import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useBloodCopy } from "@/lib/blood-help";

// Shown instead of a members-only part when the account isn't a registered community member.
export default function MembersOnly() {
  const { t } = useBloodCopy();
  return (
    <div role="status" className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#C8102E]/40 bg-card p-10 text-center">
      <ShieldCheck className="h-10 w-10 text-[#C8102E]" aria-hidden="true" />
      <p className="max-w-md text-sm text-muted-foreground">{t.membersOnly}</p>
      <Link to="/join" className="rounded-lg bg-[#C8102E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a50d26]">
        {t.register}
      </Link>
    </div>
  );
}

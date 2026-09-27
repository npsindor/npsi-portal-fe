import React, { useEffect, useState } from "react";
import { CalendarDays, MapPin, Clock, IndianRupee, ArrowRight, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useLang } from "@/lib/i18n";
import { localizedText } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import { resolveMyFamily } from "@/lib/resolveMyFamily";

const L = {
  en: {
    title: "Events",
    sub: "Register your family members for upcoming Sangathan events.",
    registerMembers: "Register Members",
    empty: "No events available.",
    registerFor: "Register for",
    selectMembers: "Select family members to register.",
    feePerMember: "per member",
    fee: "Fee",
    noMembers: "No family members found.",
    confirm: "Confirm Registration",
    selectOne: "Select at least one member",
    regTitle: "Event Registration Confirmed",
    regMsg: "You have been registered for",
    success: "Registered successfully!",
    successDesc: "member(s) registered for",
    payPending: "payment pending",
    regFailed: "Registration failed",
  },
  hi: {
    title: "कार्यक्रम",
    sub: "अपने परिवार के सदस्यों को आगामी संगठन कार्यक्रमों के लिए रजिस्टर करें।",
    registerMembers: "सदस्य रजिस्टर करें",
    empty: "कोई कार्यक्रम उपलब्ध नहीं।",
    registerFor: "इसके लिए रजिस्टर करें:",
    selectMembers: "रजिस्टर करने के लिए परिवार के सदस्य चुनें।",
    feePerMember: "प्रति सदस्य",
    fee: "शुल्क",
    noMembers: "कोई परिवार सदस्य नहीं मिला।",
    confirm: "रजिस्ट्रेशन की पुष्टि करें",
    selectOne: "कम से कम एक सदस्य चुनें",
    regTitle: "कार्यक्रम रजिस्ट्रेशन की पुष्टि",
    regMsg: "आपको इस कार्यक्रम के लिए रजिस्टर किया गया है:",
    success: "सफलतापूर्वक रजिस्टर हो गए!",
    successDesc: "सदस्य इस कार्यक्रम के लिए रजिस्टर हुए:",
    payPending: "भुगतान लंबित",
    regFailed: "रजिस्ट्रेशन विफल",
  },
};

export default function MemberEvents() {
  const { lang } = useLang();
  const t = L[lang];
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(null);
  const [family, setFamily] = useState(null);
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const evs = await base44.entities.Event.list("-date", 50);
        setEvents(evs.filter((e) => e.status === "PUBLISHED"));
        const { family: mine, members: mems } = await resolveMyFamily(user);
        setFamily(mine);
        setMembers(mems);
      } catch (e) {} finally { setLoading(false); }
    })();
  }, [user]);

  const register = async () => {
    if (selected.length === 0) {
      toast({ title: t.selectOne, variant: "destructive" });
      return;
    }
    try {
      const chosen = members.filter((m) => selected.includes(m.id));
      const feePer = registering.fee || 0;
      const total = feePer * chosen.length;
      const txnId = `TXN-${Date.now()}`;
      const regId = `EVT-REG-${Date.now()}`;
      const now = new Date().toISOString();
      const isFree = total === 0;

      await base44.entities.Transaction.create({
        transaction_id: txnId,
        type: "Event Registration",
        amount: total,
        payment_method: "UPI",
        payment_status: isFree ? "SUCCESS" : "PENDING",
        event_id: registering.id,
        family_id: family?.family_id,
        member_id: chosen[0]?.membership_id,
        reference_id: regId,
        date: now,
        remarks: `Event: ${registering.title} | Members: ${chosen.length}`,
      });

      await base44.entities.EventRegistration.create({
        registration_id: regId,
        event_id: registering.id,
        event_title: registering.title,
        family_id: family?.family_id,
        member_ids: chosen.map((m) => m.id),
        member_names: chosen.map((m) => m.name),
        count: chosen.length,
        fee_per_member: feePer,
        total_fee: total,
        payment_status: isFree ? "SUCCESS" : "PENDING",
        transaction_id: txnId,
        status: "REGISTERED",
        registered_by_id: user?.id,
        registered_date: now,
        registrant_name: user?.full_name || family?.head_name || "Member",
        registrant_email: user?.email || "",
      });

      await base44.entities.Notification.create({
        title: t.regTitle,
        message: `${t.regMsg} ${registering.title}.`,
        type: "Event",
        recipient_family_id: family?.family_id,
        date: now,
      });
      toast({ title: t.success, description: `${chosen.length} ${t.successDesc} ${registering.title}${isFree ? "" : ` — ${t.payPending}`}.` });
      setRegistering(null);
      setSelected([]);
    } catch (err) {
      toast({ title: t.regFailed, description: err.message, variant: "destructive" });
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gold/30 border-t-maroon" /></div>;

  const locale = lang === "hi" ? "hi-IN" : "en-IN";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-maroon">{t.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.sub}</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {events.map((ev) => (
          <div key={ev.id} className="overflow-hidden rounded-2xl border border-gold/30 bg-card shadow-sm">
            <div className="relative h-36 bg-gradient-to-br from-maroon to-maroon-dark">
              {ev.banner_url && <img src={ev.banner_url} alt={localizedText(ev, "title", lang)} loading="lazy" decoding="async" className="h-full w-full object-cover" />}
              {ev.fee > 0 && <span className="absolute right-3 top-3 rounded-full bg-gold px-2.5 py-1 text-xs font-bold text-maroon">₹{ev.fee}</span>}
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                {ev.date ? new Date(ev.date).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" }) : "—"}
                <Clock className="ml-1 h-3.5 w-3.5" /> {ev.start_time || ""}
              </div>
              <h3 className="mt-2 font-display text-lg font-semibold text-maroon">{localizedText(ev, "title", lang)}</h3>
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {ev.venue}</div>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{localizedText(ev, "description", lang)}</p>
              <button onClick={() => setRegistering(ev)} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-maroon px-4 py-2 text-xs font-semibold text-cream hover:bg-maroon-dark">
                {t.registerMembers} <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        {events.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{t.empty}</div>}
      </div>

      {registering && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={() => setRegistering(null)}>
          <div className="w-full max-w-md rounded-t-2xl border border-gold/40 bg-card p-6 shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-lg font-semibold text-maroon">{t.registerFor} {registering.title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{t.selectMembers}</p>
            {registering.fee > 0 && (
              <div className="mt-3 flex items-center gap-1.5 rounded-xl border border-gold/40 bg-gold/5 p-2.5 text-sm font-semibold text-maroon">
                <IndianRupee className="h-4 w-4" /> {t.fee}: ₹{registering.fee} {t.feePerMember}
              </div>
            )}
            <div className="mt-4 space-y-2">
              {members.map((m) => (
                <label key={m.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={selected.includes(m.id)}
                    onChange={(e) => setSelected(e.target.checked ? [...selected, m.id] : selected.filter((x) => x !== m.id))}
                    className="h-4 w-4 accent-maroon"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.relationship}</div>
                  </div>
                </label>
              ))}
              {members.length === 0 && <p className="text-xs text-muted-foreground">{t.noMembers}</p>}
            </div>
            <button onClick={register} className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700">
              <Check className="h-4 w-4" /> {t.confirm}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
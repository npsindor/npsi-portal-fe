import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Bell, Users, ArrowRight, UserPlus } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import MembershipPass from "@/components/MembershipPass";
import RequestTransferModal from "@/components/RequestTransferModal";
import { ArrowRightLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useLang } from "@/lib/i18n";
import { resolveMyFamily } from "@/lib/resolveMyFamily";
import { localizedText } from "@/lib/utils";

const L = {
  en: {
    greeting: "Namaste",
    welcome: "Welcome to your Patidar Samaj family dashboard.",
    familyMembers: "Family Members",
    viewAll: "View all",
    membersUnit: "members",
    addMember: "Add Member",
    recentNotif: "Recent Notifications",
    all: "All",
    noNotif: "No notifications.",
    noFamily: "No active family membership found linked to your account.",
    registerFamily: "Register Your Family",
    upcomingEvents: "Upcoming Events",
    noEvents: "No upcoming events.",
    viewEvent: "View Event",
    digitalCard: "Digital Membership Card",
    head: "Head",
    close: "Close",
    member: "Member",
    studentBadge: "Student ID",
    studentTransferHint: "You're registered as a student. Request to join a family to become a family member.",
    requestTransfer: "Request Family Transfer",
  },
  hi: {
    greeting: "नमस्ते",
    welcome: "पाटीदार समाज परिवार डैशबोर्ड में आपका स्वागत है।",
    familyMembers: "परिवार के सदस्य",
    viewAll: "सभी देखें",
    membersUnit: "सदस्य",
    addMember: "सदस्य जोड़ें",
    recentNotif: "हाल की सूचनाएँ",
    all: "सभी",
    noNotif: "कोई सूचना नहीं।",
    noFamily: "आपके खाते से कोई सक्रिय परिवार सदस्यता जुड़ी नहीं है।",
    registerFamily: "अपना परिवार रजिस्टर करें",
    upcomingEvents: "आगामी कार्यक्रम",
    noEvents: "कोई आगामी कार्यक्रम नहीं।",
    viewEvent: "कार्यक्रम देखें",
    digitalCard: "डिजिटल सदस्यता कार्ड",
    head: "मुखिया",
    close: "बंद करें",
    member: "सदस्य",
    studentBadge: "स्टूडेंट आईडी",
    studentTransferHint: "आप स्टूडेंट के रूप में पंजीकृत हैं। परिवार का सदस्य बनने के लिए परिवार जुड़ने का अनुरोध करें।",
    requestTransfer: "परिवार ट्रांसफर अनुरोध",
  },
};

export default function MemberDashboard() {
  const { user } = useAuth();
  const { lang } = useLang();
  const t = L[lang];
  const [family, setFamily] = useState(null);
  const [members, setMembers] = useState([]);
  const [student, setStudent] = useState(null);
  const [events, setEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCard, setShowCard] = useState(false);
  const [showQrZoom, setShowQrZoom] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { family: mine, members: mems, student: stu } = await resolveMyFamily(user);
        setFamily(mine);
        setMembers(mems);
        setStudent(stu);
        const evs = await base44.entities.Event.list("-date", 5);
        setEvents(evs.filter((e) => e.status === "PUBLISHED"));
        const notifs = await base44.entities.Notification.list("-date", 5);
        setNotifications(notifs);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gold/30 border-t-maroon" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-3xl font-semibold text-maroon">
          {t.greeting}, {user?.full_name?.split(" ")[0] || t.member} 🙏
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.welcome}</p>
      </div>

      {family ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <MembershipPass family={family} onFlip={() => setShowCard(true)} />
          <div className="space-y-4">
            <div className="rounded-2xl border border-gold/30 bg-card p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-maroon">{t.familyMembers}</h3>
                <Link to="/portal/family" className="text-xs font-semibold text-maroon hover:underline">{t.viewAll} →</Link>
              </div>
              <div className="mt-3 flex items-center gap-2 text-2xl font-bold text-maroon">
                <Users className="h-5 w-5" /> {family.member_count || members.length}
                <span className="text-sm font-normal text-muted-foreground">{t.membersUnit}</span>
              </div>
              <Link to="/portal/family" className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-maroon px-4 py-2 text-xs font-semibold text-cream hover:bg-maroon-dark">
                <UserPlus className="h-3.5 w-3.5" /> {t.addMember}
              </Link>
            </div>
            <div className="rounded-2xl border border-gold/30 bg-card p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-maroon">{t.recentNotif}</h3>
                <Link to="/portal/notifications" className="text-xs font-semibold text-maroon hover:underline">{t.all} →</Link>
              </div>
              <div className="mt-3 space-y-2">
                {notifications.slice(0, 3).map((n) => (
                  <div key={n.id} className="flex items-start gap-2 rounded-xl border border-border p-2.5">
                    <Bell className="mt-0.5 h-3.5 w-3.5 text-maroon" />
                    <div>
                      <div className="text-xs font-semibold text-foreground">{n.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{n.message}</div>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && <p className="text-xs text-muted-foreground">{t.noNotif}</p>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">{t.noFamily}</p>
          {student ? (
            <>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold text-maroon">
                <ArrowRightLeft className="h-3.5 w-3.5" /> {t.studentBadge}: {student.student_id}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{t.studentTransferHint}</p>
              <button onClick={() => setShowTransfer(true)} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-maroon px-5 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark">
                <ArrowRightLeft className="h-4 w-4" /> {t.requestTransfer}
              </button>
            </>
          ) : (
            <Link to="/register" className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-maroon px-5 py-2.5 text-sm font-semibold text-cream hover:bg-maroon-dark">
              {t.registerFamily} <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}

      {/* Upcoming events */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-maroon">{t.upcomingEvents}</h2>
          <Link to="/portal/events" className="text-xs font-semibold text-maroon hover:underline">{t.viewAll} →</Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.length === 0 && <p className="text-sm text-muted-foreground">{t.noEvents}</p>}
          {events.map((ev) => (
            <div key={ev.id} className="overflow-hidden rounded-2xl border border-gold/30 bg-card shadow-sm">
              <div className="h-28 bg-gradient-to-br from-maroon to-maroon-dark">
                {ev.banner_url && <img src={ev.banner_url} alt={localizedText(ev, "title", lang)} loading="lazy" decoding="async" className="h-full w-full object-cover" />}
              </div>
              <div className="p-3.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {ev.date ? new Date(ev.date).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short" }) : "—"}
                </div>
                <h3 className="mt-1 font-display text-sm font-semibold text-maroon">{localizedText(ev, "title", lang)}</h3>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{ev.venue}</p>
                <Link to="/portal/events" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-maroon hover:underline">
                  {t.viewEvent} <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Digital card modal */}
      {showCard && family && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowCard(false)}>
          <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="maroon-pass relative overflow-hidden rounded-2xl border-2 border-gold/60 p-6 text-cream shadow-2xl">
              <div className="text-center">
                <div className="text-[0.6rem] uppercase tracking-[0.2em] text-gold/80">{t.digitalCard}</div>
                <button
                  type="button"
                  onClick={() => setShowQrZoom(true)}
                  className="mx-auto mt-4 flex h-56 w-56 items-center justify-center rounded-xl border-2 border-gold/50 bg-cream p-2 transition hover:scale-105 active:scale-95"
                  title="Tap to enlarge"
                >
                  <QRCodeSVG
                    value={`${window.location.origin}/verify/${family.family_id}`}
                    size={216}
                    bgColor="#F7F0E3"
                    fgColor="#5A1A2A"
                    level="M"
                  />
                </button>
                <div className="mt-2 text-[0.65rem] text-cream/60">Tap QR to enlarge for scanning</div>
                <div className="mt-4 font-display text-xl font-bold text-gold">{family.family_id}</div>
                <div className="text-sm text-cream/90">{family.family_name}</div>
                <div className="mt-1 text-xs text-cream/60">{t.head}: {family.head_name}</div>
                <div className="mt-1 text-xs text-green-300">● {family.status}</div>
              </div>
            </div>
            <button onClick={() => setShowCard(false)} className="mt-3 w-full rounded-full bg-cream py-2.5 text-sm font-semibold text-maroon">
              {t.close}
            </button>
          </div>
        </div>
      )}

      {/* Enlarged QR for easier scanning */}
      {showQrZoom && family && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4" onClick={() => setShowQrZoom(false)}>
          <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <QRCodeSVG
              value={`${window.location.origin}/verify/${family.family_id}`}
              size={380}
              bgColor="#FFFFFF"
              fgColor="#000000"
              level="M"
              includeMargin
              style={{ width: "100%", height: "auto", maxWidth: "380px" }}
            />
            <div className="text-center">
              <div className="font-display text-base font-bold text-maroon">{family.family_id}</div>
              <div className="text-xs text-muted-foreground">{family.family_name}</div>
            </div>
            <button onClick={() => setShowQrZoom(false)} className="w-full rounded-full bg-maroon py-2.5 text-sm font-semibold text-cream">
              {t.close}
            </button>
          </div>
        </div>
      )}

      <RequestTransferModal open={showTransfer} onClose={() => setShowTransfer(false)} student={student} />

    </div>
  );
}
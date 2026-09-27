import React, { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useLang } from "@/lib/i18n";

const L = {
  en: {
    title: "Notifications",
    sub: "Stay updated with Sangathan alerts and messages.",
    all: "All",
    unread: "Unread",
    events: "Events",
    payments: "Payments",
    family: "Family",
    announcements: "Announcements",
    markRead: "Mark as read",
    empty: "No notifications.",
  },
  hi: {
    title: "सूचनाएँ",
    sub: "संगठन की सूचनाओं और संदेशों से अपडेट रहें।",
    all: "सभी",
    unread: "अपठित",
    events: "कार्यक्रम",
    payments: "भुगतान",
    family: "परिवार",
    announcements: "घोषणाएँ",
    markRead: "पढ़ा हुआ चिह्नित करें",
    empty: "कोई सूचना नहीं।",
  },
};

export default function Notifications() {
  const { lang } = useLang();
  const t = L[lang];
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const notifs = await base44.entities.Notification.list("-date", 50);
      setNotifications(notifs);
    } catch (e) {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const tabs = [
    { key: "all", label: t.all },
    { key: "unread", label: t.unread },
    { key: "events", label: t.events },
    { key: "payments", label: t.payments },
    { key: "family", label: t.family },
    { key: "announcements", label: t.announcements },
  ];
  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    if (filter === "events") return n.type === "Event";
    if (filter === "payments") return n.type === "Payment";
    if (filter === "family") return n.type === "Registration" || n.type === "Approval" || n.type === "Correction";
    if (filter === "announcements") return n.type === "Announcement";
    return true;
  });

  const markRead = async (id) => {
    await base44.entities.Notification.update(id, { read: true });
    load();
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-gold/30 border-t-maroon" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-maroon">{t.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.sub}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              filter === tab.key ? "bg-maroon text-cream" : "border border-gold/40 text-maroon hover:bg-gold/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((n) => (
          <div key={n.id} className={`rounded-2xl border p-4 ${n.read ? "border-border bg-card" : "border-gold/40 bg-gold/5"}`}>
            <div className="flex items-start gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${n.read ? "bg-muted" : "bg-maroon/10"}`}>
                <Bell className={`h-4 w-4 ${n.read ? "text-muted-foreground" : "text-maroon"}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-foreground">{n.title}</div>
                  <span className="text-xs text-muted-foreground">{n.date ? new Date(n.date).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN") : ""}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                {!n.read && (
                  <button onClick={() => markRead(n.id)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-maroon hover:underline">
                    <CheckCheck className="h-3 w-3" /> {t.markRead}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{t.empty}</div>}
      </div>
    </div>
  );
}
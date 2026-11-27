import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HeartHandshake, House, Megaphone, Route } from "lucide-react";
import { sagunApi } from "@/api/sagunApi";
import { roomApi } from "@/api/roomHuntingApi";
import { API } from "@/api/endpoints";
import { API_BASE_URL } from "@/api/apiBaseUrl";
import { base44, apiFetch } from "@/api/base44Client";
import { localizedText } from "@/lib/utils";

const openSafar = async () => {
  const response = await apiFetch(`${API_BASE_URL}${API.safar}/admin/entries?status=OPEN`, { credentials: "include" });
  if (!response.ok) throw new Error(String(response.status));
  return (await response.json()).length;
};
const words = {
  en: { title: "Services overview", sagun: "Shagun Bandhan applications", room: "Rental listings", roomNeeds: "Room requirements", transport: "Open transport requests", pending: "pending", total: "total", latest: "Latest Sandesh", none: "No Sandesh yet.", manage: "Manage" },
  hi: { title: "सेवाओं का सारांश", sagun: "शगुन बंधन आवेदन", room: "किराए की लिस्टिंग", roomNeeds: "कमरे की आवश्यकताएँ", transport: "खुले यात्रा एवं सहायता अनुरोध", pending: "लंबित", total: "कुल", latest: "नवीनतम संदेश", none: "अभी कोई संदेश नहीं।", manage: "प्रबंधित करें" },
};
const sum = (counts) => Object.entries(counts || {}).filter(([status]) => status !== "ARCHIVED").reduce((total, [, count]) => total + count, 0);

// Admin dashboard: one line per community service with what needs attention, plus the latest Sandesh items.
export default function ServicesOverview({ lang }) {
  const t = words[lang] || words.en;
  const [data, setData] = useState({});
  useEffect(() => {
    let alive = true;
    Promise.allSettled([sagunApi.sagun.adminStats(), roomApi.admin.stats(), openSafar(), base44.entities.Announcement.list("-date", 3)]).then(([sagun, room, safar, news]) => {
      if (alive) setData({ sagun: sagun.value, room: room.value, safar: safar.value, news: news.value || [] });
    });
    return () => { alive = false; };
  }, []);
  const tiles = [
    { label: t.sagun, icon: HeartHandshake, to: "/admin/sagun", total: data.sagun?.total, pending: data.sagun?.pending },
    { label: t.room, icon: House, to: "/admin/room-hunting", total: sum(data.room?.listings), pending: data.room?.listings?.PENDING || 0 },
    { label: t.roomNeeds, icon: House, to: "/admin/room-hunting", total: sum(data.room?.requirements), pending: data.room?.requirements?.PENDING || 0 },
    { label: t.transport, icon: Route, to: "/admin/travel-assistance", total: data.safar },
  ];
  return <section className="rounded-2xl border border-gold/30 bg-card p-5">
    <h2 className="font-display text-lg font-semibold text-maroon">{t.title}</h2>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((tile) => <Link key={tile.label} to={tile.to} className="rounded-xl border border-border p-4 hover:bg-muted">
        <tile.icon className="h-5 w-5 text-maroon" aria-hidden="true" />
        <div className="mt-2 font-display text-2xl font-bold">{tile.total ?? "—"}</div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{tile.label}</div>
        {tile.pending ? <div className="mt-1 text-xs font-semibold text-amber-700">{tile.pending} {t.pending}</div> : null}
      </Link>)}
    </div>
    <div className="mt-5 flex items-center justify-between"><h3 className="flex items-center gap-2 text-sm font-semibold"><Megaphone className="h-4 w-4 text-maroon" />{t.latest}</h3><Link to="/admin/news" className="text-xs font-semibold text-maroon hover:underline">{t.manage} →</Link></div>
    {data.news?.length ? <ul className="mt-2 divide-y divide-border text-sm">{data.news.map((item) => <li key={item.id} className="flex items-center justify-between gap-3 py-2"><span className="truncate">{localizedText(item, "title", lang)}</span><span className="shrink-0 text-xs text-muted-foreground">{item.status}</span></li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">{t.none}</p>}
  </section>;
}

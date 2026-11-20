import React, { useEffect, useState } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Search, UserCog, Eye, Contact, HandHeart, IdCard, Stethoscope, UsersRound, LayoutDashboard, FileCheck, Users, CalendarDays, CreditCard, Bell, Settings, LogOut, Shield, ScrollText, Menu, X, Landmark, Globe, GraduationCap, MessageSquare, ArrowRightLeft, TicketCheck, Lightbulb, Newspaper, Wallet, Sparkles, HeartHandshake, LayoutTemplate, House, Route } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";
import { useLang, useT } from "@/lib/i18n";
import { allowedAdminPaths, areaLabel, canOpenAdminPath, isSuperAdmin } from "@/lib/admin-access";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const t = useT();
  const { lang } = useLang();
  const sehatLabel = lang === "hi" ? "स्वास्थ्य सहयोग" : "Health Support";
  const [menuOpen, setMenuOpen] = useState(false);
  // The admin portal's own colours (index.css .admin-theme) on <html>, so dialogs and popups opened outside this
  // layout match too; removed again when the admin leaves for the website or the member portal.
  useEffect(() => {
    document.documentElement.classList.add("admin-theme");
    return () => document.documentElement.classList.remove("admin-theme");
  }, []);

  const navItems = [
    { label: t("admin.dashboard"), path: "/admin", icon: LayoutDashboard },
    { label: t("admin.registrations"), path: "/admin/applications", icon: FileCheck },
    { label: t("admin.families"), path: "/admin/families", icon: Users },
    { label: t("admin.students"), path: "/admin/students", icon: GraduationCap },
    { label: t("admin.transfers"), path: "/admin/transfers", icon: ArrowRightLeft },
    { label: lang === "hi" ? "रजिस्ट्रेशन भुगतान" : "Registration payments", path: "/admin/registration-payments", icon: FileCheck },
    { label: lang === "hi" ? "शगुन बंधन" : "Shagun Bandhan", path: "/admin/sagun", icon: HeartHandshake },
    { label: lang === "hi" ? "शगुन डिजिटल कार्ड" : "Shagun Digital Cards", path: "/admin/sagun-cards", icon: IdCard },
    { label: lang === "hi" ? "आवास सहयोग" : "Room Hunting", path: "/admin/room-hunting", icon: House },
    { label: lang === "hi" ? "यातायात सहयोग" : "Transportation", path: "/admin/transportation", icon: Route },
    { label: sehatLabel, path: "/admin/sehat-saathi", icon: Stethoscope },
    { label: t("admin.events"), path: "/admin/events", icon: CalendarDays },
    { label: lang === "hi" ? "कार्यक्रम वित्त एवं रोस्टर" : "Event Finance & Roster", path: "/admin/event-finance", icon: Wallet },
    { label: t("admin.eventRegs"), path: "/admin/event-registrations", icon: TicketCheck },
    { label: t("admin.transactions"), path: "/admin/transactions", icon: CreditCard },
    { label: t("admin.samiti"), path: "/admin/samiti", icon: Landmark },
    { label: lang === "hi" ? "एनपीएसआई इवेंट सदस्य बनें" : "Become a NPSI Event Member", path: "/admin/event-members", icon: UsersRound },
    { label: lang === "hi" ? "वरिष्ठजन एवं अनुशासन समिति" : "Senior & Discipline Committee", path: "/admin/senior-discipline-committee", icon: Shield },
    { label: t("admin.news"), path: "/admin/news", icon: Newspaper },
    { label: lang === "hi" ? "पेज सामग्री" : "Page Content", path: "/admin/page-content", icon: LayoutTemplate },
    { label: lang === "hi" ? "पेज दृश्यता (चालू / बंद)" : "Page visibility (on / off)", path: "/admin/site-visibility", icon: Eye },
    { label: lang === "hi" ? "समाज की झलक (होमपेज)" : "Community highlights", path: "/admin/home-highlights", icon: Sparkles },
    { label: lang === "hi" ? "सामुदायिक सेवाएँ" : "Community Services", path: "/admin/community-services", icon: HandHeart },
    { label: t("admin.rules"), path: "/admin/rules", icon: ScrollText },
    { label: t("admin.principles"), path: "/admin/principles", icon: Lightbulb },
    { label: lang === "hi" ? "पता सूची" : "Address lists", path: "/admin/address-options", icon: Globe },
    { label: t("admin.notifications"), path: "/admin/notifications", icon: Bell },
    { label: t("contacts.title"), path: "/admin/contact-info", icon: Contact },
    { label: t("admin.feedback"), path: "/admin/feedback", icon: MessageSquare },
    { label: t("admin.settings"), path: "/admin/settings", icon: Settings },
  ];

  // Super admin: every page, plus "Assign roles" at the top. A sub-admin (Admin → Assign roles) only the pages of their
  // admin work. The menu search filters by the label in either language and by the page address.
  const superAdmin = isSuperAdmin(user);
  const rolesItem = { label: lang === "hi" ? "रोल असाइन करें (उप-एडमिन)" : "Assign roles (sub-admins)", path: "/admin/roles", icon: UserCog, highlight: true };
  const allowed = allowedAdminPaths(user);
  const visibleItems = superAdmin ? [navItems[0], rolesItem, ...navItems.slice(1)] : navItems.filter((item) => allowed?.includes(item.path));
  const [menuQuery, setMenuQuery] = useState("");
  const needle = menuQuery.trim().toLowerCase();
  const shownItems = needle ? visibleItems.filter((item) => `${item.label} ${item.path}`.toLowerCase().includes(needle)) : visibleItems;
  const current = visibleItems.find((n) => location.pathname === n.path);
  const searchBox = (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/60" aria-hidden="true" />
      <input
        type="search"
        value={menuQuery}
        onChange={(event) => setMenuQuery(event.target.value)}
        placeholder={lang === "hi" ? "मेन्यू खोजें…" : "Search menu…"}
        aria-label={lang === "hi" ? "मेन्यू खोजें" : "Search menu"}
        className="h-10 w-full rounded-lg border border-gold/30 bg-maroon-dark/60 pl-9 pr-3 text-sm text-cream placeholder:text-cream/50 outline-none focus:border-gold"
      />
    </div>
  );
  const noMatch = <p className="px-3 py-2 text-xs text-cream/60">{lang === "hi" ? "कोई मेन्यू नहीं मिला।" : "No menu item found."}</p>;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-maroon text-cream md:flex">
        <div className="flex items-center gap-3 border-b border-gold/15 px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/50 bg-maroon-dark">
            <Shield className="h-5 w-5 text-gold" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-sm font-semibold tracking-wide text-gold">{t("admin.portal")}</div>
            <div className="text-[0.6rem] uppercase tracking-[0.16em] text-cream/60">Patidar Samaj</div>
          </div>
        </div>
        <Link
          to="/"
          className="mx-3 mt-4 flex items-center gap-2 rounded-lg border border-gold/30 px-3 py-2.5 text-xs font-semibold text-cream/90 transition hover:bg-gold/10 hover:text-gold"
        >
          <Globe className="h-3.5 w-3.5" />
          {t("common.backToWebsite")}
        </Link>

        <div className="mx-3 mt-3">{searchBox}</div>
        <nav aria-label={lang === "hi" ? "एडमिन मेन्यू" : "Admin menu"} className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {shownItems.length === 0 && noMatch}
          {shownItems.map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-gold/15 text-gold" : item.highlight ? "border border-gold/40 bg-gold/10 text-gold hover:bg-gold/20" : "text-cream/75 hover:bg-maroon-light hover:text-cream"
                }`}
              >
                {active && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-gold" />}
                <Icon className={`h-4 w-4 ${active ? "text-gold" : "text-cream/60 group-hover:text-cream"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-gold/15 p-3">
          <div className="mb-2 flex items-center gap-2 px-1">
            <ThemeToggle variant="dark" />
            <LanguageToggle variant="dark" />
          </div>
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-cream/70 hover:bg-maroon-light hover:text-cream">
            <LogOut className="h-4 w-4" />
            {t("admin.logout")}
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-maroon px-4 py-3 text-cream md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/50 bg-maroon-dark">
            <Shield className="h-4 w-4 text-gold" />
          </div>
          <span className="font-display text-sm font-semibold text-gold">{t("admin.portal")}</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle variant="dark" />
          <LanguageToggle variant="dark" />
          <button onClick={() => setMenuOpen(!menuOpen)} className="rounded-full p-2 text-cream hover:bg-maroon-light">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="absolute inset-x-0 top-[52px] z-30 border-b border-gold/15 bg-maroon p-4 shadow-lg md:hidden">
          <div className="mb-3">{searchBox}</div>
          {shownItems.length === 0 && noMatch}
          <nav aria-label={lang === "hi" ? "एडमिन मेन्यू" : "Admin menu"} className="grid grid-cols-2 gap-2">
            {shownItems.map((item) => {
              const active = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${active ? "bg-gold/15 text-gold" : "text-cream/80 hover:bg-maroon-light"}`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="mt-3 flex w-full items-center gap-3 rounded-lg border border-gold/30 px-3 py-2.5 text-sm font-semibold text-cream/90 hover:bg-gold/10 hover:text-gold"
          >
            <Globe className="h-4 w-4" />
            {t("common.backToWebsite")}
          </Link>
          <button onClick={handleLogout} className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-cream/80 hover:bg-maroon-light">
            <LogOut className="h-4 w-4" />
            {t("admin.logout")}
          </button>
        </div>
      )}

      <main className="md:pl-64">
        {/* Desktop topbar */}
        <div className="sticky top-0 z-30 hidden items-center justify-between border-b border-gold/15 bg-card/80 px-8 py-3.5 backdrop-blur md:flex">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            {current?.label || t("admin.dashboard")}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 font-semibold text-gold">
              <Shield className="h-3 w-3" />
              {superAdmin ? (lang === "hi" ? "सुपर एडमिन" : "Super Admin") : lang === "hi" ? "उप-एडमिन" : "Sub-admin"}
            </span>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {!superAdmin && (
            <div role="note" className="mb-5 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-foreground">
              <span className="font-semibold">{lang === "hi" ? "आपकी एडमिन पहुँच:" : "Your admin access:"}</span>{" "}
              {(user?.adminAccess?.areas || []).map((area) => areaLabel(area, lang)).join(", ")}
              {" · "}
              <span className="font-semibold">{lang === "hi" ? "गाँव:" : "Villages:"}</span>{" "}
              {user?.adminAccess?.allVillages ? (lang === "hi" ? "सभी गाँव" : "All villages") : (user?.adminAccess?.villages || []).join(", ")}
            </div>
          )}
          {/* A sub-admin who opens a page outside their access goes to their first page. */}
          {canOpenAdminPath(user, location.pathname) ? <Outlet /> : <Navigate to={allowed?.[0] || "/portal"} replace />}
        </div>
      </main>
    </div>
  );
}

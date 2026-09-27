import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FileCheck, Users, CalendarDays, CreditCard, Bell, Settings, LogOut, Shield, ScrollText, Menu, X, Landmark, Globe, GraduationCap, MessageSquare, ArrowRightLeft, TicketCheck, Lightbulb, Newspaper } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";
import { useT } from "@/lib/i18n";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { label: t("admin.dashboard"), path: "/admin", icon: LayoutDashboard },
    { label: t("admin.registrations"), path: "/admin/applications", icon: FileCheck },
    { label: t("admin.students"), path: "/admin/students", icon: GraduationCap },
    { label: t("admin.transfers"), path: "/admin/transfers", icon: ArrowRightLeft },
    { label: t("admin.families"), path: "/admin/families", icon: Users },
    { label: t("admin.samiti"), path: "/admin/samiti", icon: Landmark },
    { label: t("admin.events"), path: "/admin/events", icon: CalendarDays },
    { label: t("admin.eventRegs"), path: "/admin/event-registrations", icon: TicketCheck },
    { label: t("admin.transactions"), path: "/admin/transactions", icon: CreditCard },
    { label: t("admin.notifications"), path: "/admin/notifications", icon: Bell },
    { label: t("admin.feedback"), path: "/admin/feedback", icon: MessageSquare },
    { label: t("admin.rules"), path: "/admin/rules", icon: ScrollText },
    { label: t("admin.principles"), path: "/admin/principles", icon: Lightbulb },
    { label: t("admin.news"), path: "/admin/news", icon: Newspaper },
    { label: t("admin.settings"), path: "/admin/settings", icon: Settings },
  ];

  const current = navItems.find((n) => location.pathname === n.path);

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

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-gold/15 text-gold" : "text-cream/75 hover:bg-maroon-light hover:text-cream"
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
          <nav className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
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
              {user?.role || "admin"}
            </span>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
import React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, Users, CalendarDays, Bell, Settings, LogOut, Menu, X, Globe, MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";
import MemberProfileChip from "@/components/MemberProfileChip";
import { useT } from "@/lib/i18n";
import logoImage from "@/images/logo.png";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const t = useT();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const navItems = [
    { label: t("portal.home"), path: "/portal", icon: Home },
    { label: t("portal.family"), path: "/portal/family", icon: Users },
    { label: t("portal.events"), path: "/portal/events", icon: CalendarDays },
    { label: t("portal.notifications"), path: "/portal/notifications", icon: Bell },
    { label: t("portal.feedback"), path: "/portal/feedback", icon: MessageSquare, bottom: false },
    { label: t("portal.settings"), path: "/portal/settings", icon: Settings },
  ];

  const current = navItems.find((n) => location.pathname === n.path);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop left rail */}
      <aside className="fixed inset-y-0 left-0 hidden w-[300px] flex-col border-r border-gold/20 bg-card lg:flex">
        <div className="flex items-center gap-3 border-b border-gold/15 px-6 py-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold/50 bg-maroon shadow-sm">
            <img src={logoImage} alt="Nimar Patidar Sangathan Indore logo" className="h-full w-full rounded-xl object-contain" />
          </div>
          <span className="font-display text-base font-semibold leading-tight tracking-wide text-maroon">
            <span className="block">Nimar Patidar</span>
            <span className="block text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">Sangathan Indore</span>
          </span>
        </div>

        <Link
          to="/"
          className="mx-4 mt-4 flex items-center gap-2 rounded-xl border border-gold/30 px-4 py-2.5 text-xs font-semibold text-maroon transition hover:bg-gold/10"
        >
          <Globe className="h-3.5 w-3.5" />
          {t("common.backToWebsite")}
        </Link>

        <div className="px-6 pt-4">
          <MemberProfileChip variant="sidebar" />
        </div>

        <nav className="flex-1 space-y-1 px-4 py-4">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  active ? "bg-maroon text-cream shadow-sm" : "text-foreground/75 hover:bg-maroon/5 hover:text-maroon"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-gold" : "text-foreground/60 group-hover:text-maroon"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gold/15 p-4">
          <div className="mb-2 flex items-center gap-2 px-2">
            <ThemeToggle />
            <LanguageToggle />
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/5 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            {t("portal.logout")}
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gold/20 bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/50 bg-card text-maroon hover:bg-gold/10" title="Back to Website" aria-label="Back to Website">
          <Globe className="h-4 w-4" />
        </Link>
        <Link to="/portal" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/50 bg-maroon">
            <img src={logoImage} alt="Nimar Patidar Sangathan Indore logo" className="h-full w-full rounded-lg object-contain" />
          </div>
          <span className="font-display text-xs font-semibold leading-tight tracking-wide text-maroon">
            <span className="block">Nimar Patidar</span>
            <span className="block text-[0.55rem] uppercase tracking-[0.1em] text-muted-foreground">Sangathan Indore</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <MemberProfileChip compact />
          <ThemeToggle />
          <LanguageToggle />
          <button onClick={() => setMenuOpen(!menuOpen)} className="rounded-full p-2 text-maroon hover:bg-maroon/5">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="absolute inset-x-0 top-[64px] z-30 border-b border-gold/20 bg-card p-4 shadow-lg lg:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${active ? "bg-maroon/5 text-maroon" : "text-foreground/75 hover:bg-maroon/5"}`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/5">
            <LogOut className="h-4 w-4" />
            {t("portal.logout")}
          </button>
        </div>
      )}

      {/* Main content */}
      <main className="lg:pl-[300px]">
        <div className="sticky top-0 z-30 hidden items-center justify-between border-b border-gold/15 bg-card/80 px-6 py-3.5 backdrop-blur lg:flex">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            {current?.label || t("portal.home")}
          </div>
          <MemberProfileChip />
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-gold/20 bg-card/95 backdrop-blur lg:hidden">
        {navItems.filter((n) => n.bottom !== false).map((item) => {
          const active = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-1 flex-col items-center gap-1 py-2.5"
            >
              {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-gold" />}
              <Icon className={`h-5 w-5 ${active ? "text-maroon" : "text-muted-foreground"}`} />
              <span className={`text-[0.65rem] font-medium ${active ? "text-maroon" : "text-muted-foreground"}`}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
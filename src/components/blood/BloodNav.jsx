import { Bell, CalendarDays, Droplet, Home, UserPlus, UserRound } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { BLOOD_PATHS, useBloodCopy } from "@/lib/blood-help";

// The Blood Help Network's own navigation: brand, the four pages (the current one in red), notifications and the
// member (or Log in). Sits under the site header on every Blood Help page.
export default function BloodNav() {
  const { t, lang } = useBloodCopy();
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const items = [
    { to: BLOOD_PATHS.home, label: t.nav.home, icon: Home, end: true },
    { to: BLOOD_PATHS.donor, label: t.nav.donor, icon: UserPlus },
    { to: BLOOD_PATHS.request, label: t.nav.request, icon: Droplet },
    { to: BLOOD_PATHS.requests, label: t.nav.requests, icon: CalendarDays },
  ];
  const first = (user?.fullName || "").trim().split(/\s+/)[0];
  return (
    <div className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <Link to={BLOOD_PATHS.home} className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#C8102E] text-white shadow">
            <Droplet className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-base font-bold text-[#C8102E] sm:text-lg">{t.network}</span>
            <span className="block text-xs text-muted-foreground">{t.tagline}</span>
          </span>
        </Link>
        <nav aria-label={t.network} className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-1 lg:pb-0">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? "bg-[#C8102E] text-white shadow" : "text-foreground hover:bg-[#C8102E]/10 hover:text-[#C8102E]"}`
              }
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
          {isAuthenticated ? (
            <>
              <Link to="/portal/notifications" aria-label={t.nav.notifications} className="ml-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground hover:bg-muted">
                <Bell className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link to="/portal" className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-2 text-sm font-semibold hover:bg-muted">
                <UserRound className="h-5 w-5" aria-hidden="true" />
                {first ? `${lang === "hi" ? "नमस्ते" : "Hi"}, ${first}` : t.nav.home}
              </Link>
            </>
          ) : (
            <Link to={`/login?returnTo=${encodeURIComponent(location.pathname)}`} className="ml-1 inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#C8102E] px-3 py-2 text-sm font-semibold text-[#C8102E] hover:bg-[#C8102E]/10">
              <UserRound className="h-4 w-4" aria-hidden="true" />
              {t.nav.login}
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}

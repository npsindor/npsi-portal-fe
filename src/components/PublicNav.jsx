import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Info, CalendarDays, ScrollText, LayoutDashboard, UserRound, Menu, X, Lightbulb, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/lib/AuthContext";
import { useT } from "@/lib/i18n";
import logoImage from "@/images/logo.png";

export default function PublicNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const t = useT();
  const { user, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = (user?.full_name || "Member").split(" ").filter(Boolean)[0];
  const initials = (user?.full_name || "Member")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const navItems = [
    { label: t("nav.home"), path: "/", icon: Home },
    { label: t("nav.about"), path: "/about", icon: Info },
    { label: t("nav.events"), path: "/events", icon: CalendarDays },
    { label: t("nav.rules"), path: "/rules", icon: ScrollText },
    { label: t("nav.principles"), path: "/principles", icon: Lightbulb },
    { label: t("nav.news"), path: "/news", icon: Newspaper },
  ].filter((item) => !((isAuthenticated && (item.path === "/register"))));

  return (
    <header className="sticky top-0 z-40 border-b border-gold/30 bg-cream/90 backdrop-blur supports-[backdrop-filter]:bg-cream/75 dark:bg-card/90 dark:supports-[backdrop-filter]:bg-card/75">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/50 bg-maroon shadow-sm">
            <img src={logoImage} alt="Nimar Patidar Sangathan Indore logo" className="h-full w-full rounded-xl object-contain" />
          </div>
          <span className="font-display text-sm font-semibold leading-tight tracking-wide text-maroon">
            <span className="block">Nimar Patidar</span>
            <span className="block text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">Sangathan Indore</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative rounded-full px-4 py-2 text-sm font-medium transition ${
                  active ? "text-maroon" : "text-foreground/70 hover:text-maroon"
                }`}
              >
                {item.label}
                {active && <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-gold" />}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <LanguageToggle />
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {user?.role === "admin" && (
                <Button size="sm" variant="outline" className="hidden border-gold/50 text-maroon hover:bg-gold/10 sm:inline-flex" onClick={() => navigate("/admin")}>
                  <LayoutDashboard className="mr-1.5 h-4 w-4" />
                  {t("footer.adminAccess")}
                </Button>
              )}
              <Button size="sm" className="hidden items-center gap-2 bg-maroon text-cream hover:bg-maroon-dark sm:inline-flex" onClick={() => navigate("/portal")}>
                {user?.photo_url ? (
                  <img src={user.photo_url} alt={displayName} className="h-6 w-6 rounded-full border border-gold/60 object-cover" />
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/20 text-[0.65rem] font-semibold text-gold">
                    {initials || <UserRound className="h-3.5 w-3.5" />}
                  </span>
                )}
                {displayName}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="hidden text-sm font-semibold text-maroon hover:underline sm:block">
                {t("nav.login")}
              </Link>
              <Button size="sm" className="hidden bg-maroon text-cream hover:bg-maroon-dark sm:inline-flex" onClick={() => navigate("/register")}>
                {t("nav.registerBtn")}
              </Button>
            </div>
          )}
          <button
            type="button"
            className="rounded-lg p-2 text-maroon hover:bg-maroon/5 md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav className="border-t border-gold/20 bg-cream px-3 py-3 shadow-lg md:hidden">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${active ? "bg-maroon text-cream" : "text-foreground/75 hover:bg-maroon/5 hover:text-maroon"}`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-gold" : "text-muted-foreground"}`} />
                  {item.label}
                </Link>
              );
            })}
            {!isAuthenticated && <Link to="/login" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/75 hover:bg-maroon/5 hover:text-maroon">{t("nav.login")}</Link>}
          </div>
        </nav>
      )}
    </header>
  );
}
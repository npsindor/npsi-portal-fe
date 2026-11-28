import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { EyeOff } from 'lucide-react';
import { API } from '@/api/endpoints';
import { API_BASE_URL } from '@/api/apiBaseUrl';
import { apiFetch } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useLang } from '@/lib/i18n';

// Public pages and homepage sections an admin can switch off (Admin → Page visibility). The same keys are listed in
// the API (npsi-portal-be/src/site-visibility); the homepage itself always stays on.
export const SITE_PAGES = [
  { path: '/about', en: 'About Us', hi: 'हमारे बारे में' },
  { path: '/events', en: 'Events & Programs', hi: 'कार्यक्रम और आयोजन' },
  { path: '/news', en: 'Sandesh / News', hi: 'संदेश / समाचार' },
  { path: '/sagun', en: 'Shagun Bandhan', hi: 'शगुन बंधन' },
  { path: '/travel-assistance', en: 'Travel & Assistance', hi: 'यात्रा एवं सहायता' },
  { path: '/room-hunting', en: 'Room Hunting', hi: 'आवास सहयोग' },
  { path: '/medical', en: 'Health Support', hi: 'स्वास्थ्य सहयोग' },
  { path: '/community-services', en: 'Blood Donor (Community Services)', hi: 'रक्तदाता (सामुदायिक सेवाएँ)' },
  { path: '/career-business', en: 'Career & Business', hi: 'करियर और व्यवसाय' },
  { path: '/core-team', en: 'Core Team', hi: 'कोर टीम' },
  { path: '/register', en: 'Family Registration', hi: 'परिवार पंजीकरण' },
  { path: '/student-register', en: 'Student Registration', hi: 'विद्यार्थी पंजीकरण' },
  { path: '/application-status', en: 'Application Status', hi: 'आवेदन की स्थिति' },
  { path: '/rules', en: 'Community Rules', hi: 'सामुदायिक नियम' },
  { path: '/principles', en: 'Guiding Principles', hi: 'मार्गदर्शक सिद्धांत' },
  { path: '/help', en: 'Help', hi: 'सहायता' },
  { path: '/contact', en: 'Contact Us', hi: 'संपर्क करें' },
  { path: '/public-feedback', en: 'Feedback', hi: 'सुझाव' },
];

export const HOME_SECTIONS = [
  { key: 'counters', en: 'Community counters (families, members…)', hi: 'समुदाय के आँकड़े (परिवार, सदस्य…)' },
  { key: 'services', en: 'Logo slider and community services (first section)', hi: 'लोगो स्लाइडर और समुदाय की सेवाएँ (पहला सेक्शन)' },
  { key: 'familyHeads', en: 'NPS Family Heads (photo carousel)', hi: 'NPS परिवार मुखिया (फ़ोटो कैरोसेल)' },
  { key: 'getStarted', en: 'Get started: important services', hi: 'शुरुआत करें: ज़रूरी सेवाएँ' },
  { key: 'birthdays', en: 'Today Birthday (beside Get started)', hi: 'आज जन्मदिन (शुरुआत करें के साथ)' },
  { key: 'participation', en: 'Your participation', hi: 'आपकी भागीदारी' },
  { key: 'updates', en: 'From the Sangathan: announcements', hi: 'आधिकारिक जानकारी: सूचनाएँ' },
  { key: 'pillars', en: 'What brings us together', hi: 'हमारी प्रतिबद्धता' },
  { key: 'events', en: 'Events', hi: 'कार्यक्रम' },
  { key: 'community', en: 'Explore Community Services', hi: 'सामुदायिक सेवाएँ देखें' },
  { key: 'showcase', en: 'Advertisements & sponsors', hi: 'विज्ञापन और प्रायोजक' },
  { key: 'career', en: 'Career & Business', hi: 'करियर और व्यवसाय' },
  { key: 'gallery', en: 'Photo gallery', hi: 'फोटो गैलरी' },
  { key: 'feedback', en: 'Share feedback', hi: 'सुझाव दें' },
];

export const pageKey = (path) => `page:${path}`;
export const sectionKey = (key) => `section:home.${key}`;
// The switchable page a URL belongs to: /events and /events/garba-2026 are both the Events page.
export const pageOf = (pathname) => SITE_PAGES.find((page) => pathname === page.path || pathname.startsWith(`${page.path}/`)) ?? null;

const Ctx = createContext({ hidden: new Set(), loaded: false, refresh: async () => {} });

// Loads what is switched off once per visit. If the API can't be reached everything stays visible (fail open), so a
// network error never empties the website.
export function SiteVisibilityProvider({ children }) {
  const [hidden, setHidden] = useState(() => new Set());
  const [loaded, setLoaded] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const response = await apiFetch(`${API_BASE_URL}${API.siteVisibility}`, { credentials: 'include' });
      if (response.ok) setHidden(new Set((await response.json()).hidden || []));
    } catch {
      /* fail open */
    } finally {
      setLoaded(true);
    }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const value = useMemo(() => ({ hidden, loaded, refresh, setHidden }), [hidden, loaded, refresh]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSiteVisibility = () => {
  const { hidden, loaded, refresh, setHidden } = useContext(Ctx);
  return {
    hidden,
    loaded,
    refresh,
    setHidden,
    isPageVisible: (path) => {
      const page = pageOf(String(path || '').split('#')[0].split('?')[0]);
      return !page || !hidden.has(pageKey(page.path));
    },
    isSectionVisible: (key) => !hidden.has(sectionKey(key)),
  };
};

// A homepage section that an admin can switch off.
export function HomeSection({ id, children }) {
  const { isSectionVisible } = useSiteVisibility();
  return isSectionVisible(id) ? children : null;
}

const COPY = {
  en: {
    title: 'This page is not available right now',
    body: 'The Sangathan has switched this page off for the moment. Please check back later.',
    home: 'Go to the homepage',
    admin: 'Hidden from the public: visitors see “not available” here. Switch it on in Admin → Page visibility.',
  },
  hi: {
    title: 'यह पेज अभी उपलब्ध नहीं है',
    body: 'संगठन ने यह पेज कुछ समय के लिए बंद किया है। कृपया बाद में देखें।',
    home: 'होमपेज पर जाएँ',
    admin: 'जनता से छिपा है: आगंतुकों को यहाँ “उपलब्ध नहीं” दिखता है। एडमिन → पेज दृश्यता में इसे चालू करें।',
  },
};

// Wraps the routes: a switched-off page shows "not available" to visitors; an admin still sees it, with a notice.
export function PageVisibilityGate({ children }) {
  const location = useLocation();
  const { user } = useAuth();
  const { lang } = useLang();
  const { isPageVisible } = useSiteVisibility();
  const t = COPY[lang] || COPY.en;
  if (isPageVisible(location.pathname)) return children;
  if (user?.role === 'admin')
    return (
      <>
        <div role="status" className="sticky top-0 z-[60] flex items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-center text-sm font-semibold text-amber-900">
          <EyeOff className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t.admin}
        </div>
        {children}
      </>
    );
  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <EyeOff className="h-10 w-10 text-gold" aria-hidden="true" />
      <h1 className="font-display text-2xl font-semibold text-maroon sm:text-3xl">{t.title}</h1>
      <p className="max-w-md text-sm text-muted-foreground">{t.body}</p>
      <Link to="/" className="inline-flex min-h-11 items-center rounded-full bg-maroon px-6 text-sm font-semibold text-cream">{t.home}</Link>
    </main>
  );
}

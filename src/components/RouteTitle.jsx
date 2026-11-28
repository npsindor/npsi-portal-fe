import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLang } from '@/lib/i18n';

const SITE = { en: 'Nimad Patidar Sangathan, Indore', hi: 'निमाड़ पाटीदार संगठन, इंदौर' };
// The home page keeps the search-engine title from index.html.
const HOME_TITLE = typeof document !== 'undefined' ? document.title : SITE.en;

// Page names for the browser tab, bookmarks and screen readers. Longest matching prefix wins.
// Pages that know a more specific name (an event, a team, a search) set document.title themselves
// after this runs.
const TITLES = [
  ['/about', 'About Us', 'हमारे बारे में'],
  ['/events', 'Events', 'कार्यक्रम'],
  ['/core-team', 'Core Team', 'कोर टीम'],
  ['/student-register', 'Student Registration', 'विद्यार्थी पंजीकरण'],
  ['/join', 'Join the Sangathan', 'संगठन से जुड़ें'],
  ['/application-status', 'Application Status', 'आवेदन की स्थिति'],
  ['/verify', 'Verify Membership', 'सदस्यता सत्यापन'],
  ['/help', 'Help', 'सहायता'],
  ['/news', 'News', 'समाचार'],
  ['/travel-assistance', 'Travel & Assistance', 'यात्रा एवं सहायता'],
  ['/medical', 'Sehat Saathi', 'सेहत साथी'],
  ['/room-hunting', 'Room Hunting', 'रूम हंटिंग'],
  ['/community-services', 'Community Services', 'सामुदायिक सेवाएँ'],
  ['/community-services/become-donor', 'Become a Donor', 'रक्तदाता बनें'],
  ['/community-services/request-blood', 'Request for Blood', 'रक्त के लिए अनुरोध'],
  ['/community-services/blood-requests', 'Blood Requests', 'रक्त अनुरोध सूची'],
  ['/career-business', 'Career & Business', 'करियर और व्यवसाय'],
  ['/sagun', 'Shagun', 'शगुन'],
  ['/contact', 'Contact Us', 'संपर्क करें'],
  ['/public-feedback', 'Feedback', 'सुझाव'],
  ['/login', 'Log In', 'लॉग इन'],
  ['/register-account', 'Create Account', 'खाता बनाएँ'],
  ['/forgot-password', 'Forgot Password', 'पासवर्ड भूल गए'],
  ['/reset-password', 'Reset Password', 'पासवर्ड रीसेट करें'],
  ['/portal', 'Member Portal', 'सदस्य पोर्टल'],
  ['/portal/registration', 'Family Registration', 'परिवार पंजीकरण'],
  ['/portal/family', 'My Family', 'मेरा परिवार'],
  ['/portal/events', 'My Events', 'मेरे कार्यक्रम'],
  ['/portal/event-kharcha', 'Event Expenses', 'कार्यक्रम खर्च'],
  ['/portal/room-hunting', 'My Room Hunting', 'मेरी रूम हंटिंग'],
  ['/portal/notifications', 'Notifications', 'सूचनाएँ'],
  ['/portal/settings', 'Settings', 'सेटिंग्स'],
  ['/portal/feedback', 'Feedback', 'सुझाव'],
  ['/admin', 'Admin', 'एडमिन'],
  ['/admin/applications', 'Admin · Applications', 'एडमिन · आवेदन'],
  ['/admin/families', 'Admin · Families', 'एडमिन · परिवार'],
  ['/admin/students', 'Admin · Students', 'एडमिन · विद्यार्थी'],
  ['/admin/transactions', 'Admin · Transactions', 'एडमिन · लेन-देन'],
  ['/admin/registration-payments', 'Admin · Registration Payments', 'एडमिन · पंजीकरण भुगतान'],
  ['/admin/transfers', 'Admin · Transfers', 'एडमिन · स्थानांतरण'],
  ['/admin/events', 'Admin · Events', 'एडमिन · कार्यक्रम'],
  ['/admin/event-registrations', 'Admin · Event Registrations', 'एडमिन · कार्यक्रम पंजीकरण'],
  ['/admin/event-finance', 'Admin · Event Finance', 'एडमिन · कार्यक्रम वित्त'],
  ['/admin/event-members', 'Admin · Event Members', 'एडमिन · कार्यक्रम सदस्य'],
  ['/admin/samiti', 'Admin · Samiti', 'एडमिन · समिति'],
  ['/admin/senior-discipline-committee', 'Admin · Discipline Committee', 'एडमिन · अनुशासन समिति'],
  ['/admin/notifications', 'Admin · Notifications', 'एडमिन · सूचनाएँ'],
  ['/admin/contact-info', 'Admin · Contact Info', 'एडमिन · संपर्क जानकारी'],
  ['/admin/feedback', 'Admin · Feedback', 'एडमिन · सुझाव'],
  ['/admin/rules', 'Admin · Rules', 'एडमिन · नियम'],
  ['/admin/principles', 'Admin · Principles', 'एडमिन · सिद्धांत'],
  ['/admin/news', 'Admin · News', 'एडमिन · समाचार'],
  ['/admin/sagun', 'Admin · Shagun', 'एडमिन · शगुन'],
  ['/admin/sagun-cards', 'Admin · Shagun Cards', 'एडमिन · शगुन कार्ड'],
  ['/admin/sehat-saathi', 'Admin · Sehat Saathi', 'एडमिन · सेहत साथी'],
  ['/admin/travel-assistance', 'Admin · Travel & Assistance', 'एडमिन · यात्रा एवं सहायता'],
  ['/admin/room-hunting', 'Admin · Room Hunting', 'एडमिन · रूम हंटिंग'],
  ['/admin/core-team', 'Admin · Core Team', 'एडमिन · कोर टीम'],
  ['/admin/address-options', 'Admin · Address Options', 'एडमिन · पता विकल्प'],
  ['/admin/site-visibility', 'Admin · Page Visibility', 'एडमिन · पेज दृश्यता'],
  ['/admin/roles', 'Admin · Assign Roles', 'एडमिन · रोल असाइन करें'],
  ['/admin/home-highlights', 'Admin · Home Highlights', 'एडमिन · होम हाइलाइट्स'],
  ['/admin/community-services', 'Admin · Community Services', 'एडमिन · सामुदायिक सेवाएँ'],
  ['/admin/blood-requests', 'Admin · Blood Requests', 'एडमिन · रक्त अनुरोध'],
  ['/admin/audit-log', 'Admin · Audit Log', 'एडमिन · ऑडिट लॉग'],
  ['/admin/page-content', 'Admin · Page Content', 'एडमिन · पेज सामग्री'],
  ['/admin/settings', 'Admin · Settings', 'एडमिन · सेटिंग्स'],
];

const titleFor = (pathname) => {
  const path = pathname.replace(/\/+$/, '') || '/';
  let best = null;
  for (const entry of TITLES) {
    const [prefix] = entry;
    const matches = path === prefix || path.startsWith(`${prefix}/`);
    if (matches && (!best || prefix.length > best[0].length)) best = entry;
  }
  return best;
};

export default function RouteTitle() {
  const { pathname } = useLocation();
  const { lang } = useLang();
  useEffect(() => {
    const hi = lang === 'hi';
    if ((pathname.replace(/\/+$/, '') || '/') === '/') {
      document.title = HOME_TITLE;
      return;
    }
    const entry = titleFor(pathname);
    const page = entry ? (hi ? entry[2] : entry[1]) : hi ? 'पेज नहीं मिला' : 'Page not found';
    document.title = `${page} | ${hi ? SITE.hi : SITE.en}`;
  }, [pathname, lang]);
  return null;
}

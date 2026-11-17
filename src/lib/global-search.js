import { API } from '@/api/endpoints';
import { API_BASE_URL } from '@/api/apiBaseUrl';
import { apiFetch } from '@/api/base44Client';

// Category headings for search results [English, Hindi].
export const SEARCH_GROUPS = {
  pages: ['Pages', 'पेज'],
  news: ['News / Sandesh', 'समाचार / संदेश'],
  events: ['Events', 'कार्यक्रम'],
  community: ['Community', 'समुदाय'],
  rentals: ['Rental listings', 'किराए की लिस्टिंग'],
  roomRequirements: ['People looking for rooms', 'कमरा खोज रहे लोग'],
  myFamily: ['My family', 'मेरा परिवार'],
  families: ['Families', 'परिवार'],
  members: ['Members', 'सदस्य'],
  students: ['Students', 'विद्यार्थी'],
};

// Public pages, found instantly by name or keyword in either language.
const PAGES = [
  ['/', 'Home', 'होम', 'home start'],
  ['/about', 'About Us', 'हमारे बारे में', 'about organization objectives committee samiti principles rules संगठन समिति नियम'],
  ['/events', 'Events & Programs', 'कार्यक्रम', 'events programs garba milan कार्यक्रम'],
  ['/news', 'Sandesh / News', 'संदेश / समाचार', 'news sandesh announcements notice समाचार सूचना'],
  ['/sagun', 'Shagun Bandhan Registration', 'शगुन बंधन पंजीकरण', 'sagun marriage vivah शगुन विवाह'],
  ['/transportation', 'Transportation', 'यातायात सहयोग', 'transport travel safar saathi yatra परिवहन यात्रा यातायात सहयोग सफ़र'],
  ['/room-hunting', 'Room Hunting', 'आवास सहयोग', 'room rent rental house flat bhk pg hostel कमरा किराया मकान आवास साथी'],
  ['/medical', 'Health Support', 'स्वास्थ्य सहयोग', 'medical health hospital doctor sehat saathi health support स्वास्थ्य चिकित्सा सेहत साथी'],
  ['/community-services', 'Community Services', 'सामुदायिक सेवाएँ', 'community services social education सेवा'],
  ['/career-business', 'Career & Business', 'करियर और व्यवसाय', 'career job employment business रोजगार व्यवसाय'],
  ['/register', 'Member Registration', 'सदस्य पंजीकरण', 'register registration join family member पंजीकरण'],
  ['/student-register', 'Student Registration', 'विद्यार्थी पंजीकरण', 'student registration विद्यार्थी'],
  ['/public-feedback', 'Feedback', 'सुझाव', 'feedback suggestion सुझाव'],
  ['/contact', 'Contact Us', 'संपर्क करें', 'contact phone email address संपर्क'],
  ['/help', 'Help', 'सहायता', 'help faq support मदद'],
];
const norm = (text) => String(text || '').toLowerCase().normalize('NFKC');
export const searchPages = (query, lang) => {
  const q = norm(query).trim();
  if (q.length < 2) return [];
  return PAGES.filter(([, en, hi, words]) => [en, hi, words].some((text) => norm(text).includes(q)))
    .slice(0, 4)
    .map(([link, en, hi]) => ({ id: link, title: lang === 'hi' ? hi : en, link }));
};

export const searchPortal = async (query, signal) => {
  const response = await apiFetch(`${API_BASE_URL}${API.search}?q=${encodeURIComponent(query)}`, { credentials: 'include', signal });
  if (!response.ok) throw new Error(`search failed: ${response.status}`);
  return response.json();
};

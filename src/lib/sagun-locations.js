// Locations for the Sagun "Village/City" picker. Values are what gets saved (Hindi names for villages, kept as
// before so existing profiles still match); `en` / `hi` are the labels shown in each language.
import { base44 } from '@/api/base44Client';

export const SAGUN_CITY_OPTIONS = [
  { value: 'Indore', en: 'Indore', hi: 'इंदौर', district: 'Indore', pincode: '452001' },
  { value: 'Dewas', en: 'Dewas', hi: 'देवास', district: 'Dewas', pincode: '455001' },
  { value: 'Pithampur', en: 'Pithampur', hi: 'पीथमपुर', district: 'Dhar', pincode: '454775' },
  { value: 'Ujjain', en: 'Ujjain', hi: 'उज्जैन', district: 'Ujjain', pincode: '456001' },
  { value: 'Khargone', en: 'Khargone', hi: 'खरगोन', district: 'Khargone', pincode: '451001' },
];

export const KHARGONE_VILLAGE_OPTIONS = [
  ['अघावन (टेमला)', 'Aghawan (Temla)'], ['अघावन-खेड़ी', 'Aghawan-Khedi'], ['अकावल्या', 'Akawalya'], ['आसनगांव', 'Asangaon'],
  ['इदारतपुर (बड़ी छालपा)', 'Idaratpur (Badi Chhalpa)'], ['इच्छापुर', 'Ichhapur'], ['ऊन', 'Oon'], ['उबदी', 'Ubadi'],
  ['कमोदवाड़ा', 'Kamodwada'], ['खेड़ी', 'Khedi'], ['खेड़ी खानपुरा', 'Khedi Khanpura'], ['घुघरी', 'Ghughri'], ['घोटिया', 'Ghotiya'],
  ['घेगांव', 'Ghegaon'], ['गंधावड़ (चंदावड़)', 'Gandhawad (Chandawad)'], ['गवला', 'Gawala'], ['गांवसन', 'Gaonsan'], ['गोलवाड़ी', 'Golwadi'],
  ['गोपालपुरा (नारायणपुरा)', 'Gopalpura (Narayanpura)'], ['छोटी छालपा', 'Chhoti Chhalpa'], ['जलज्योति', 'Jaljyoti'], ['टेमला', 'Temla'],
  ['टेमरनी', 'Temarni'], ['डाबरी', 'Dabri'], ['डालका', 'Dalka'], ['डोंगरगांव', 'Dongargaon'], ['दसंगा', 'Dasanga'], ['दसनावाल', 'Dasnawal'],
  ['देहरी (डेरी)', 'Dehri (Deri)'], ['दाभड (सुरपाला)', 'Dabhad (Surpala)'], ['नंदगांव-बगुद', 'Nandgaon-Bagud'], ['नंदगांव-रोड', 'Nandgaon-Road'],
  ['केली', 'Keli'], ['पंधानिया', 'Pandhaniya'], ['पिपरी', 'Pipri'], ['पिपराटा', 'Piprata'], ['पोखर', 'Pokhar'], ['बंगवा', 'Bangwa'],
  ['बनिहार', 'Banihar'], ['बलवाड़ी', 'Balwadi'], ['बेजापुरा', 'Bejapura'], ['बेगन्दी', 'Begandi'], ['मलतार', 'Maltar'], ['मेनगांव', 'Mengaon'],
  ['मोठापुरा', 'Mothapura'], ['रजुर', 'Rajur'], ['रणगांव', 'Rangaon'], ['रमनगांव', 'Ramangaon'], ['रामपुरा', 'Rampura'],
  ['रामपुर (बामखल)', 'Rampur (Bamkhal)'], ['लिक्खी', 'Likkhi'], ['लोनारा', 'Lonara'], ['सिनगुण', 'Singun'], ['सिंखेड़ा', 'Sinkheda'],
  ['सोनतलाव', 'Sontalav'], ['सोनिपुरा', 'Sonipura'], ['सुरपाला', 'Surpala'], ['सेगांव', 'Segaon'], ['हतोला', 'Hatola'],
].map(([hi, en]) => ({ value: hi, en, hi, district: 'Khargone' }));

export const SAGUN_LOCATION_OPTIONS = [...SAGUN_CITY_OPTIONS, ...KHARGONE_VILLAGE_OPTIONS];

export const sagunCity = value => SAGUN_CITY_OPTIONS.find(option => option.value === value) || null;

// Display a saved village/city (or a built-in area) in the current language; unknown values are shown as saved.
export const locationLabel = (value, lang) => {
  const option = SAGUN_LOCATION_OPTIONS.find(item => item.value === value) || Object.values(DEFAULT_AREAS).flat().find(item => item.value === value);
  return option ? option[lang] || option.en : String(value ?? '');
};

// Areas offered when no admin-managed list exists for the city (Admin → address lists adds more, shown first).
const DEFAULT_AREAS = {
  Indore: [['Vijay Nagar', 'विजय नगर'], ['Palasia', 'पलासिया'], ['Rajendra Nagar', 'राजेंद्र नगर'], ['Bhawarkuan', 'भंवरकुआं'], ['Sudama Nagar', 'सुदामा नगर'], ['Annapurna', 'अन्नपूर्णा'], ['Khajrana', 'खजराना'], ['Nipania', 'निपानिया'], ['Rau', 'राऊ']],
  Dewas: [['Civil Lines', 'सिविल लाइंस'], ['Radhaganj', 'राधागंज'], ['Bank Note Press', 'बैंक नोट प्रेस']],
  Pithampur: [['Pithampur', 'पीथमपुर'], ['Sector 1', 'सेक्टर 1'], ['Sector 2', 'सेक्टर 2'], ['Sector 3', 'सेक्टर 3']],
  Ujjain: [['Freeganj', 'फ्रीगंज'], ['Nanakheda', 'नानाखेड़ा'], ['Madhav Nagar', 'माधव नगर']],
  Khargone: [['Khargone', 'खरगोन']],
};
Object.keys(DEFAULT_AREAS).forEach(city => { DEFAULT_AREAS[city] = DEFAULT_AREAS[city].map(([en, hi]) => ({ value: en, en, hi })); });

// Admin-managed areas for the city first, then the built-in ones not already listed.
export async function loadSagunAreas(city) {
  const builtIn = DEFAULT_AREAS[city] || [];
  let managed = [];
  try { managed = (await base44.addressOptions.list('AREA', city)).map(row => ({ value: row.value, en: row.value, hi: row.labelHi || row.value })); } catch { managed = []; }
  const seen = new Set(managed.map(option => option.value.toLowerCase()));
  return [...managed, ...builtIn.filter(option => !seen.has(option.value.toLowerCase()))];
}

// India Post names some districts differently (Khargone is "West Nimar").
const POST_DISTRICTS = { Khargone: ['khargone', 'west nimar'], Dhar: ['dhar'], Indore: ['indore'], Dewas: ['dewas'], Ujjain: ['ujjain'] };

// PIN code of an area from the public India Post lookup, falling back to the city's main PIN code.
export async function lookupSagunPincode(area, city) {
  const info = sagunCity(city);
  if (!info) return '';
  const districts = POST_DISTRICTS[info.district] || [info.district.toLowerCase()];
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(area)}`, { signal: controller.signal });
    clearTimeout(timer);
    const [result] = await response.json();
    const offices = Array.isArray(result?.PostOffice) ? result.PostOffice : [];
    const match = offices.find(office => districts.some(name => String(office.District || '').toLowerCase().includes(name)) && /^[1-9]\d{5}$/.test(String(office.Pincode)));
    if (match) return String(match.Pincode);
  } catch {
    // offline / API unavailable: use the city's PIN code
  }
  return info.pincode;
}

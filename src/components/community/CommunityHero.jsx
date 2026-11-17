import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, Droplet, HandHeart, HeartHandshake, LifeBuoy, MessageCircle, Users } from 'lucide-react';
import { blockText } from '@/lib/page-content';
import '@/styles/community-hero.css';

const words = {
  en: {
    home: 'Home', group: 'NPSI Sangathan group', need: 'B+ blood needed urgently', place: 'Hospital, Indore · 2 units',
    reply1: 'I am coming, 20 min 🙏', reply2: 'I can donate too', reply3: 'Volunteers informed',
    steps: [['One message', 'On the website or the Sangathan WhatsApp group'], ['Reaches the samaj', 'Donors and volunteers see it'], ['Help arrives', 'Members come forward to help']],
    needHelp: 'Need blood or help?', donor: 'Become a donor', note: 'In a life-threatening emergency, call 112 first.',
    themes: [['Blood Donation', Droplet, 'blood'], ['Emergency Help', LifeBuoy, 'emergency'], ['Social Welfare', HandHeart, 'welfare']],
  },
  hi: {
    home: 'मुख्य पृष्ठ', group: 'NPSI संगठन समूह', need: 'B+ रक्त की तत्काल ज़रूरत', place: 'अस्पताल, इंदौर · 2 यूनिट',
    reply1: 'मैं आ रहा हूँ, 20 मिनट 🙏', reply2: 'मैं भी रक्तदान करूँगा', reply3: 'स्वयंसेवकों को सूचना दी',
    steps: [['एक संदेश', 'वेबसाइट या संगठन के WhatsApp समूह पर'], ['समाज तक पहुँचे', 'रक्तदाता और स्वयंसेवक देखें'], ['मदद पहुँचे', 'सदस्य मदद के लिए आगे आएँ']],
    needHelp: 'रक्त या सहायता चाहिए?', donor: 'रक्तदाता बनें', note: 'जानलेवा आपात स्थिति में पहले 112 पर कॉल करें।',
    themes: [['रक्तदान', Droplet, 'blood'], ['आपातकालीन सहायता', LifeBuoy, 'emergency'], ['समाज कल्याण', HandHeart, 'welfare']],
  },
};

// Decorative scene: a group chat where one request for blood gets replies, next to a blood drop with a heartbeat line.
function HelpScene({ w }) {
  return (
    <svg className="community-art" viewBox="0 0 520 380" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="community-drop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fb7185" />
          <stop offset="1" stopColor="#be123c" />
        </linearGradient>
      </defs>
      {/* links from the chat to the drop and the three services */}
      <path className="community-link" d="M228 120 C280 90 300 100 330 120" fill="none" stroke="#fecdd3" strokeWidth="2.5" strokeDasharray="3 8" strokeLinecap="round" />
      <path className="community-link" d="M228 250 C290 290 320 300 352 300" fill="none" stroke="#fde68a" strokeWidth="2.5" strokeDasharray="3 8" strokeLinecap="round" />

      {/* phone */}
      <rect x="40" y="18" width="190" height="344" rx="28" fill="#1f0a10" />
      <rect x="50" y="30" width="170" height="320" rx="20" fill="#fff7f3" />
      <rect x="50" y="30" width="170" height="44" rx="20" fill="#0f766e" />
      <rect x="50" y="56" width="170" height="18" fill="#0f766e" />
      <circle cx="72" cy="52" r="11" fill="#99f6e4" />
      <path d="M66 55 a6 4 0 0 1 12 0 Z M72 49 m-3 0 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0" fill="#0f766e" />
      <text x="90" y="49" fontSize="10.5" fontWeight="700" fill="#fff">{w.group}</text>
      <text x="90" y="62" fontSize="8.5" fill="#ccfbf1">● 1,240</text>

      <g className="community-bubble" style={{ animationDelay: '.2s' }}>
        <rect x="60" y="88" width="140" height="58" rx="12" fill="#fff" stroke="#fecdd3" />
        <path d="M76 100 C82 108 84 113 80 118 C76 122 70 120 69 115 C68 110 72 105 76 100 Z" fill="#e11d48" />
        <text x="90" y="106" fontSize="9.5" fontWeight="700" fill="#9f1239">{w.need}</text>
        <text x="90" y="121" fontSize="8.5" fill="#6b4a4a">{w.place}</text>
        <text x="186" y="139" fontSize="7" textAnchor="end" fill="#9ca3af">10:42</text>
      </g>
      <g className="community-bubble" style={{ animationDelay: '1s' }}>
        <rect x="78" y="160" width="132" height="34" rx="12" fill="#d9f7e8" />
        <text x="90" y="181" fontSize="9.5" fill="#14532d">{w.reply1}</text>
      </g>
      <g className="community-bubble" style={{ animationDelay: '1.7s' }}>
        <rect x="96" y="204" width="114" height="34" rx="12" fill="#d9f7e8" />
        <text x="108" y="225" fontSize="9.5" fill="#14532d">{w.reply2}</text>
      </g>
      <g className="community-bubble" style={{ animationDelay: '2.4s' }}>
        <rect x="60" y="248" width="124" height="30" rx="12" fill="#fff4d6" />
        <text x="72" y="267" fontSize="9" fill="#92400e">✓ {w.reply3}</text>
      </g>
      <rect x="60" y="312" width="150" height="26" rx="13" fill="#f1e7e3" />
      <circle cx="196" cy="325" r="10" fill="#0f766e" />
      <path d="M192 321 L201 325 L192 329 Z" fill="#fff" />

      {/* blood drop with a heart */}
      <g className="community-drop">
        <path d="M400 60 C440 120 470 160 470 205 C470 250 438 282 400 282 C362 282 330 250 330 205 C330 160 360 120 400 60 Z" fill="url(#community-drop)" />
        <path d="M368 150 C360 168 358 180 362 192" fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="8" strokeLinecap="round" />
        <path d="M400 236 C374 218 368 204 368 194 C368 182 377 175 386 175 C393 175 398 179 400 184 C402 179 407 175 414 175 C423 175 432 182 432 194 C432 204 426 218 400 236 Z" fill="#fff" />
        <path d="M396 196 h8 M400 192 v8" stroke="#e11d48" strokeWidth="3" strokeLinecap="round" />
      </g>
      {/* heartbeat line */}
      <path className="community-ecg" d="M250 205 H332 L344 205 L352 180 L362 232 L372 168 L382 214 L390 205 H500" fill="none" stroke="#fde68a" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />

      {/* the three services */}
      <g transform="translate(352 318)">
        <circle r="22" fill="#e11d48" stroke="#fff" strokeWidth="3" />
        <path d="M0 -10 C6 -2 8 2 8 6 C8 11 4 14 0 14 C-4 14 -8 11 -8 6 C-8 2 -6 -2 0 -10 Z" fill="#fff" />
      </g>
      <g transform="translate(410 336)">
        <circle r="22" fill="#d97706" stroke="#fff" strokeWidth="3" />
        <circle r="10" fill="none" stroke="#fff" strokeWidth="5" />
        <path d="M0 -12 v5 M0 7 v5 M-12 0 h5 M7 0 h5" stroke="#d97706" strokeWidth="3" />
      </g>
      <g transform="translate(468 318)">
        <circle r="22" fill="#059669" stroke="#fff" strokeWidth="3" />
        <path d="M0 9 C-10 2 -12 -3 -12 -6 C-12 -10 -9 -12 -6 -12 C-3 -12 -1 -10 0 -8 C1 -10 3 -12 6 -12 C9 -12 12 -10 12 -6 C12 -3 10 2 0 9 Z" fill="#fff" />
      </g>
    </svg>
  );
}

// Community Services hero: one message (website or the Sangathan WhatsApp group) brings the samaj together for blood,
// emergencies and welfare. The admin's page-banner title and text still override the default copy.
export default function CommunityHero({ lang, eyebrow, title, intro, block }) {
  const w = words[lang] || words.en;
  const heading = blockText(block, 'title', lang) || title;
  const text = blockText(block, 'body', lang) || intro;
  const stepIcons = [MessageCircle, Users, HeartHandshake];
  return (
    <section className="community-hero relative overflow-hidden text-cream">
      <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 sm:pb-28 sm:pt-12">
        <nav aria-label={lang === 'hi' ? 'ब्रेडक्रंब' : 'Breadcrumb'} className="flex items-center gap-1.5 text-xs text-cream/70">
          <Link to="/" className="hover:text-gold">{w.home}</Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span aria-current="page" className="text-cream">{eyebrow}</span>
        </nav>
        <div className="mt-6 grid items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="min-w-0">
            <ul className="flex flex-wrap gap-2" aria-label={eyebrow}>
              {w.themes.map(([label, Icon, tone]) => <li key={tone} className={`community-chip community-chip-${tone}`}><Icon className="h-4 w-4" aria-hidden="true" />{label}</li>)}
            </ul>
            <h1 className="mt-5 max-w-3xl font-display text-3xl font-semibold leading-tight text-white sm:text-5xl">{heading}</h1>
            {text && <p className="mt-4 max-w-2xl whitespace-pre-line text-base leading-relaxed text-rose-50/90 sm:text-lg">{text}</p>}
            <ol className="mt-7 grid gap-3 sm:grid-cols-3">
              {w.steps.map(([stepTitle, stepNote], index) => {
                const Icon = stepIcons[index];
                return (
                  <li key={stepTitle} className="community-step">
                    <span className="community-step-icon"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                    <span className="min-w-0"><span className="block text-sm font-bold text-white">{index + 1}. {stepTitle}</span><span className="mt-0.5 block text-xs leading-snug text-rose-50/80">{stepNote}</span></span>
                  </li>
                );
              })}
            </ol>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to="/contact" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-rose-700 shadow-lg transition hover:bg-rose-50"><Droplet className="h-4 w-4" aria-hidden="true" />{w.needHelp}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
              <a href="#blood-donation" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/50 px-6 text-sm font-bold text-white transition hover:bg-white/10">{w.donor}</a>
            </div>
            <p className="mt-4 text-xs text-rose-50/75">{w.note}</p>
          </div>
          <HelpScene w={w} />
        </div>
      </div>
    </section>
  );
}

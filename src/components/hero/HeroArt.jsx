import { useId } from 'react';

// Decorative hero scenes for Career & Business, Health Support and Sandesh (News). aria-hidden; bilingual labels;
// motion comes from page-heroes.css and stops under prefers-reduced-motion.

const useIds = (prefix) => { const id = useId().replace(/:/g, ''); return (name) => `${prefix}-${name}-${id}`; };

const Person = ({ x, y, shirt, skin = '#e0a87a', scale = 1, children }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <circle cx="0" cy="-46" r="9" fill={skin} />
    <path d="M-9 -50 Q0 -62 9 -50 Q4 -56 0 -56 Q-4 -56 -9 -50 Z" fill="#2b1b14" />
    <path d="M-12 -34 Q0 -40 12 -34 L14 -6 H-14 Z" fill={shirt} />
    <rect x="-10" y="-6" width="8" height="22" rx="3" fill="#334155" />
    <rect x="2" y="-6" width="8" height="22" rx="3" fill="#334155" />
    {children}
  </g>
);

const Frame = ({ id, top, bottom, children }) => (
  <>
    <defs>
      <clipPath id={id('clip')}><rect width="640" height="340" rx="28" /></clipPath>
      <linearGradient id={id('sky')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={top} /><stop offset="1" stopColor={bottom} /></linearGradient>
    </defs>
    <g clipPath={`url(#${id('clip')})`}><rect width="640" height="340" fill={`url(#${id('sky')})`} />{children}</g>
  </>
);

// Career & Business: a rising growth chart, a graduate, a professional with a briefcase and a samaj shop front.
export function CareerHeroArt({ lang = 'en', className = '' }) {
  const hi = lang === 'hi';
  const id = useIds('career');
  return (
    <svg className={`page-hero-art ${className}`} viewBox="0 0 640 340" aria-hidden="true" focusable="false">
      <Frame id={id} top="#0f2f4f" bottom="#1d6b74">
        {[[70, 40], [160, 30], [300, 46], [470, 28], [600, 50]].map(([cx, cy], i) => <circle key={i} className="hero-twinkle" style={{ animationDelay: `${i * 0.5}s` }} cx={cx} cy={cy} r="1.8" fill="#fff6d8" />)}
        {/* growth chart */}
        <g transform="translate(60 70)">
          <rect width="250" height="160" rx="16" fill="#ffffff" opacity=".1" />
          {[0, 1, 2, 3].map((i) => <path key={i} d={`M16 ${130 - i * 34} H234`} stroke="#ffffff" opacity=".15" />)}
          {[[28, 90], [78, 66], [128, 98], [178, 40]].map(([x, h], i) => <rect key={x} className="hero-bar" style={{ animationDelay: `${i * 0.25}s` }} x={x} y={140 - h} width="30" height={h} rx="5" fill={['#f5c84c', '#e8792d', '#4fb3a9', '#f5c84c'][i]} />)}
          <path className="hero-route" d="M30 104 L92 80 L142 92 L196 40 L226 24" fill="none" stroke="#fff4dc" strokeWidth="3" strokeDasharray="7 7" strokeLinecap="round" />
          <path d="M214 20 L232 22 L226 38" fill="none" stroke="#fff4dc" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <text x="16" y="-10" fontSize="12" fontWeight="700" fill="#f5c84c">{hi ? 'प्रगति' : 'Growth'}</text>
        </g>
        {/* samaj shop */}
        <g transform="translate(372 126)">
          <rect x="0" y="40" width="200" height="110" rx="6" fill="#fff4e3" />
          <path d="M-8 40 H208 L196 10 H4 Z" fill="#a8323e" />
          {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${4 + i * 34} 40 q17 18 34 0`} fill={i % 2 ? '#fff4dc' : '#e8792d'} />)}
          <rect x="18" y="78" width="70" height="52" rx="4" fill="#2b4a6b" /><rect className="hero-glow" x="22" y="82" width="62" height="44" rx="3" fill="#9ad3e6" opacity=".55" />
          <rect x="112" y="78" width="66" height="72" rx="4" fill="#7a3b1e" />
          <rect x="30" y="-18" width="140" height="24" rx="6" fill="#0f2f4f" stroke="#f5c84c" strokeWidth="2" />
          <text x="100" y="-1" textAnchor="middle" fontSize="11" fontWeight="800" fill="#f5c84c">{hi ? 'समाज व्यापार' : 'SAMAJ BUSINESS'}</text>
        </g>
        {/* ground */}
        <path d="M0 296 Q320 276 640 296 V340 H0 Z" fill="#0b2338" />
        {/* graduate and professional */}
        <g className="hero-walk">
          <Person x={120} y={300} shirt="#2f6fb3">
            <path d="M-14 -60 L0 -68 L14 -60 L0 -54 Z" fill="#1b1b1b" /><path d="M10 -58 V-48" stroke="#f5c84c" strokeWidth="2" />
            <rect x="12" y="-28" width="14" height="10" rx="2" fill="#fff4dc" />
          </Person>
          <Person x={196} y={302} shirt="#f5f5f5" skin="#d99a6c">
            <path d="M-3 -34 L0 -20 L3 -34 Z" fill="#a8323e" />
            <rect x="12" y="-14" width="20" height="16" rx="3" fill="#7a3b1e" /><path d="M17 -14 V-18 H27 V-14" fill="none" stroke="#7a3b1e" strokeWidth="2" />
          </Person>
        </g>
        {/* handshake badge */}
        <g transform="translate(300 250)">
          <circle className="hero-pulse" r="26" fill="#f5c84c" />
          <path d="M-14 2 L-4 -6 L6 2 L14 -4 M-4 -6 L4 6" fill="none" stroke="#0f2f4f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </Frame>
    </svg>
  );
}

// Health Support: a heartbeat line over a small clinic, a first-aid kit, medicine and a medical representative with a bag.
export function HealthHeroArt({ lang = 'en', className = '' }) {
  const hi = lang === 'hi';
  const id = useIds('health');
  return (
    <svg className={`page-hero-art ${className}`} viewBox="0 0 640 340" aria-hidden="true" focusable="false">
      <Frame id={id} top="#0b3a3a" bottom="#1f8a70">
        {/* heartbeat */}
        <path className="hero-ecg" d="M0 74 H150 L170 40 L192 112 L214 26 L236 92 L252 74 H640" fill="none" stroke="#c8ffe4" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round" />
        <g transform="translate(560 60)"><path className="hero-pulse" d="M0 14 C-22 -2 -14 -22 0 -10 C14 -22 22 -2 0 14 Z" fill="#ff6b6b" /></g>
        {/* clinic */}
        <g transform="translate(230 124)">
          <rect x="0" y="30" width="190" height="140" rx="8" fill="#f4fbf8" />
          <rect x="-8" y="18" width="206" height="18" rx="6" fill="#137453" />
          <rect x="70" y="-14" width="50" height="50" rx="10" fill="#fff" stroke="#137453" strokeWidth="3" />
          <path d="M95 -4 V26 M80 11 H110" stroke="#e11d48" strokeWidth="8" strokeLinecap="round" />
          {[20, 120].map((x, i) => <g key={x}><rect x={x} y="56" width="50" height="40" rx="4" fill="#2b4a6b" /><rect className="hero-glow" style={{ animationDelay: `${i * 0.8}s` }} x={x + 4} y="60" width="42" height="32" rx="3" fill="#bdeee0" /></g>)}
          <rect x="72" y="110" width="46" height="60" rx="4" fill="#137453" />
          <text x="95" y="160" textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff">{hi ? 'सहयोग' : 'HELP'}</text>
        </g>
        {/* first-aid kit and capsules */}
        <g transform="translate(470 230)">
          <rect x="0" y="0" width="70" height="50" rx="8" fill="#fff" stroke="#e11d48" strokeWidth="3" />
          <path d="M28 -6 V0 M42 -6 V0 M24 -8 H46" stroke="#e11d48" strokeWidth="3" strokeLinecap="round" />
          <path d="M35 12 V38 M22 25 H48" stroke="#e11d48" strokeWidth="7" strokeLinecap="round" />
        </g>
        <g className="hero-float" transform="translate(110 150)">
          <g transform="rotate(-30)"><rect x="-26" y="-10" width="52" height="20" rx="10" fill="#fff" /><path d="M0 -10 H16 A10 10 0 0 1 16 10 H0 Z" fill="#f5c84c" /></g>
        </g>
        <g className="hero-float" style={{ animationDelay: '1s' }} transform="translate(560 170)"><circle r="10" fill="#fff" /><path d="M-7 0 H7" stroke="#9aa" strokeWidth="2" /></g>
        {/* ground */}
        <path d="M0 296 Q320 276 640 296 V340 H0 Z" fill="#0a2f2a" />
        <g className="hero-walk">
          <Person x={120} y={300} shirt="#f4fbf8" skin="#d99a6c">
            <path d="M-6 -36 Q0 -22 6 -36" fill="none" stroke="#475569" strokeWidth="2" /><circle cx="5" cy="-24" r="3" fill="#475569" />
            <rect x="12" y="-16" width="20" height="16" rx="3" fill="#1e3a5f" />
          </Person>
          <Person x={176} y={302} shirt="#e8792d" scale={0.95} />
        </g>
        <text x="300" y="320" textAnchor="middle" fontSize="11" fontWeight="700" fill="#c8ffe4" opacity=".9">{hi ? 'विश्वसनीय जानकारी · ज़िम्मेदार सहायता' : 'Trusted information · Responsible help'}</text>
      </Frame>
    </svg>
  );
}

// Sandesh (News): a folded samaj newspaper, a megaphone with sound waves, a notification bell and a festive diya.
export function NewsHeroArt({ lang = 'en', className = '' }) {
  const hi = lang === 'hi';
  const id = useIds('news');
  return (
    <svg className={`page-hero-art ${className}`} viewBox="0 0 640 340" aria-hidden="true" focusable="false">
      <Frame id={id} top="#3a1220" bottom="#a8323e">
        {[[60, 46], [200, 28], [380, 40], [520, 26], [610, 64]].map(([cx, cy], i) => <circle key={i} className="hero-twinkle" style={{ animationDelay: `${i * 0.45}s` }} cx={cx} cy={cy} r="1.8" fill="#fff6d8" />)}
        {/* newspaper */}
        <g transform="translate(150 70) rotate(-4)">
          <rect x="8" y="8" width="260" height="196" rx="10" fill="#000" opacity=".2" />
          <rect width="260" height="196" rx="10" fill="#fffaf0" />
          <rect x="16" y="14" width="228" height="34" rx="4" fill="#7a1f2b" />
          <text x="130" y="38" textAnchor="middle" fontSize="18" fontWeight="800" fill="#f5c84c">{hi ? 'संदेश' : 'SANDESH'}</text>
          <rect x="16" y="58" width="140" height="10" rx="3" fill="#2b1b14" opacity=".85" />
          <rect x="16" y="74" width="120" height="7" rx="3" fill="#2b1b14" opacity=".35" />
          {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x="16" y={90 + i * 13} width={i % 3 === 2 ? 90 : 130} height="6" rx="3" fill="#2b1b14" opacity=".22" />)}
          <rect x="164" y="58" width="80" height="62" rx="6" fill="#f5c84c" opacity=".85" />
          <path d="M176 110 L196 84 L210 100 L222 88 L236 110 Z" fill="#7a1f2b" opacity=".8" /><circle cx="226" cy="72" r="6" fill="#fff" />
          {[0, 1, 2, 3].map((i) => <rect key={i} x="164" y={130 + i * 13} width="80" height="6" rx="3" fill="#2b1b14" opacity=".22" />)}
        </g>
        {/* megaphone */}
        <g transform="translate(470 120)">
          <path d="M0 18 L50 -6 V62 L0 38 Z" fill="#f5c84c" /><rect x="-16" y="16" width="18" height="24" rx="4" fill="#e8792d" />
          <path d="M0 38 L8 60 H20 L14 42" fill="#e8792d" />
          {[0, 1, 2].map((i) => <path key={i} className="hero-wave" style={{ animationDelay: `${i * 0.35}s` }} d={`M${66 + i * 16} ${0 - i * 8} Q${84 + i * 18} 28 ${66 + i * 16} ${56 + i * 8}`} fill="none" stroke="#fff4dc" strokeWidth="3" strokeLinecap="round" />)}
        </g>
        {/* bell with a badge */}
        <g transform="translate(90 120)">
          <g className="hero-ring">
            <path d="M-20 26 Q-20 -12 0 -14 Q20 -12 20 26 L26 34 H-26 Z" fill="#f5c84c" /><circle cx="0" cy="40" r="6" fill="#e8792d" />
          </g>
          <circle cx="18" cy="-10" r="10" fill="#e11d48" /><text x="18" y="-6" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">3</text>
        </g>
        {/* diya for festival greetings */}
        <g transform="translate(540 270)">
          <path d="M-30 0 Q0 26 30 0 Z" fill="#e8792d" /><path className="hero-flame" d="M0 -26 Q10 -10 0 -2 Q-10 -10 0 -26 Z" fill="#ffd27a" />
        </g>
        <path d="M0 300 Q320 282 640 300 V340 H0 Z" fill="#2a0d17" />
        <text x="290" y="324" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff4dc" opacity=".9">{hi ? 'सूचनाएँ · समाचार · शुभकामनाएँ' : 'Notices · News · Greetings'}</text>
      </Frame>
    </svg>
  );
}

import { useId } from 'react';

// Room Hunting hero scene: dusk over an Indore skyline, a welcoming home with lit windows and a swinging "To-Let" board,
// a student and a family walking up to it, a key on a ring, and pins for Indore, Rau and Pithampur. Decorative only.

const Window = ({ x, y, delay = 0 }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect width="22" height="24" rx="3" fill="#2b1a3a" />
    <rect className="room-window" style={{ animationDelay: `${delay}s` }} x="2" y="2" width="18" height="20" rx="2" fill="#ffd27a" />
    <path d="M11 2 V22 M2 12 H20" stroke="#8a5a2b" strokeWidth="1.4" />
  </g>
);

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

const Pin = ({ x, y, label, color, delay = 0 }) => (
  <g transform={`translate(${x} ${y})`}>
    <g className="room-pin" style={{ animationDelay: `${delay}s` }}>
      <path d="M0 0 C-13 -17 -13 -34 0 -34 C13 -34 13 -17 0 0 Z" fill={color} stroke="#fff" strokeWidth="1.5" />
      <circle cx="0" cy="-22" r="5" fill="#fff" />
    </g>
    <rect x="-34" y="6" width="68" height="18" rx="9" fill="#1f1530" opacity=".78" />
    <text x="0" y="19" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff4dc">{label}</text>
  </g>
);

export default function RoomHeroArt({ lang = 'en', className = '' }) {
  const hi = lang === 'hi';
  const id = useId().replace(/:/g, '');
  const clip = `room-clip-${id}`;
  const sky = `room-sky-${id}`;
  const glow = `room-glow-${id}`;
  return (
    <svg className={`room-art ${className}`} viewBox="0 0 640 340" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={clip}><rect width="640" height="340" rx="28" /></clipPath>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b1f5c" />
          <stop offset=".55" stopColor="#9a3f5a" />
          <stop offset="1" stopColor="#f2a65a" />
        </linearGradient>
        <radialGradient id={glow} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#ffe3a3" stopOpacity=".95" />
          <stop offset="1" stopColor="#ffe3a3" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect width="640" height="340" fill={`url(#${sky})`} />
        {/* stars and evening sun */}
        {[[60, 40], [140, 26], [250, 50], [420, 30], [520, 58], [590, 24], [330, 22]].map(([cx, cy], i) => <circle key={i} className="room-star" style={{ animationDelay: `${i * 0.4}s` }} cx={cx} cy={cy} r="1.8" fill="#fff6d8" />)}
        <circle cx="520" cy="210" r="70" fill={`url(#${glow})`} />
        <circle cx="520" cy="210" r="30" fill="#ffd27a" opacity=".9" />

        {/* far skyline: towers and a Rajwada-style silhouette */}
        <g fill="#2a1840" opacity=".55">
          <rect x="18" y="150" width="40" height="120" /><rect x="64" y="122" width="30" height="148" /><rect x="100" y="166" width="46" height="104" />
          <path d="M150 270 V170 H166 V156 H200 V170 H216 V270 Z" />
          <path d="M226 270 V182 Q246 150 266 182 V270 Z" />
          <rect x="430" y="140" width="34" height="130" /><rect x="470" y="162" width="52" height="108" /><rect x="580" y="130" width="44" height="140" />
        </g>
        {/* lit windows in the far towers */}
        <g fill="#ffd27a" opacity=".55">
          {[[26, 168], [40, 190], [72, 140], [80, 176], [110, 186], [124, 212], [438, 160], [448, 196], [482, 180], [500, 214], [590, 150], [604, 190]].map(([x, y], i) => <rect key={i} className="room-window" style={{ animationDelay: `${(i % 5) * 0.7}s` }} x={x} y={y} width="6" height="8" />)}
        </g>

        {/* the home */}
        <g transform="translate(250 112)">
          <rect x="18" y="66" width="164" height="112" rx="6" fill="#fff4e3" />
          <path d="M0 74 L100 0 L200 74 Z" fill="#a8323e" />
          <path d="M0 74 L100 0 L200 74" fill="none" stroke="#7a1f2b" strokeWidth="6" strokeLinejoin="round" />
          <rect x="140" y="14" width="18" height="34" fill="#7a1f2b" />
          <Window x={36} y={90} delay={0.2} />
          <Window x={142} y={90} delay={1.1} />
          <circle cx="100" cy="46" r="13" fill="#2b1a3a" /><circle className="room-window" style={{ animationDelay: '0.6s' }} cx="100" cy="46" r="10" fill="#ffd27a" />
          {/* door with toran */}
          <rect x="80" y="112" width="40" height="66" rx="4" fill="#7a3b1e" />
          <circle cx="111" cy="146" r="2.6" fill="#f5c84c" />
          <path d="M74 108 Q100 124 126 108" fill="none" stroke="#e8792d" strokeWidth="3" />
          {[78, 88, 100, 112, 122].map((x, i) => <circle key={x} cx={x} cy={110 + (i % 2 ? 6 : 3)} r="3" fill={i % 2 ? '#f5c84c' : '#2f8f4e'} />)}
          {/* step */}
          <rect x="72" y="178" width="56" height="8" rx="2" fill="#d9c3a5" />
        </g>

        {/* swinging To-Let board */}
        <g transform="translate(470 230)">
          <rect x="-2" y="0" width="4" height="70" fill="#5b3a22" />
          <g className="room-sign">
            <path d="M-34 6 L-24 0 M34 6 L24 0" stroke="#5b3a22" strokeWidth="2" />
            <rect x="-40" y="6" width="80" height="36" rx="6" fill="#fff4dc" stroke="#a8323e" strokeWidth="3" />
            <text x="0" y="22" textAnchor="middle" fontSize="12" fontWeight="800" fill="#a8323e">{hi ? 'किराए हेतु' : 'TO-LET'}</text>
            <text x="0" y="36" textAnchor="middle" fontSize="9" fontWeight="600" fill="#5b3a22">{hi ? 'कमरा / मकान' : 'Room / House'}</text>
          </g>
        </g>

        {/* ground and path to the door */}
        <path d="M0 296 Q320 270 640 296 V340 H0 Z" fill="#3a2a1f" />
        <path d="M0 304 Q320 280 640 304" fill="none" stroke="#5a4232" strokeWidth="2" />
        <path className="room-route" d="M70 318 C150 300 230 312 350 300" fill="none" stroke="#f5c84c" strokeWidth="3" strokeDasharray="8 8" strokeLinecap="round" />

        {/* student with backpack, family with a child */}
        <g className="room-walk">
          <Person x={92} y={300} shirt="#2f6fb3" scale={0.92}>
            <rect x="-20" y="-36" width="9" height="20" rx="3" fill="#e8792d" />
          </Person>
          <Person x={180} y={302} shirt="#a8323e" />
          <Person x={208} y={302} shirt="#2f8f4e" skin="#d99a6c" scale={0.95} />
          <Person x={194} y={306} shirt="#f5c84c" scale={0.6} />
        </g>

        {/* key on a ring */}
        <g transform="translate(560 96)">
          <g className="room-key">
            <path d="M0 -26 V0" stroke="#f5c84c" strokeWidth="2" />
            <circle cx="0" cy="12" r="12" fill="none" stroke="#f5c84c" strokeWidth="5" />
            <path d="M0 24 V60 M0 46 H10 M0 54 H8" stroke="#f5c84c" strokeWidth="5" strokeLinecap="round" />
          </g>
        </g>

        {/* places */}
        <Pin x={88} y={92} color="#e8792d" label={hi ? 'इंदौर' : 'Indore'} />
        <Pin x={196} y={58} color="#2f8f4e" label={hi ? 'राऊ' : 'Rau'} delay={0.5} />
        <Pin x={392} y={70} color="#2f6fb3" label={hi ? 'पीथमपुर' : 'Pithampur'} delay={1} />
      </g>
    </svg>
  );
}

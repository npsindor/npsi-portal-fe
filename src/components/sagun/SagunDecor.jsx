import { useId } from 'react';

// Decorative wedding motifs for the Sagun Bandhan pages only (inline SVG, no external images).
// Everything here is aria-hidden: it sets the mood, the text around it carries the meaning.

const Marigold = ({ x, y, r = 7 }) => (
  <g transform={`translate(${x} ${y})`}>
    {Array.from({ length: 10 }, (_, index) => {
      const angle = (index * Math.PI) / 5;
      return <circle key={index} cx={Math.cos(angle) * r * 0.62} cy={Math.sin(angle) * r * 0.62} r={r * 0.48} fill={index % 2 ? '#f59e0b' : '#ea7a0b'} />;
    })}
    <circle r={r * 0.45} fill="#fbbf24" />
    <circle r={r * 0.2} fill="#b45309" />
  </g>
);

const Leaf = ({ x, y, rotate = 0, scale = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
    <path d="M0 0 C7 6 7 19 0 28 C-7 19 -7 6 0 0 Z" fill="#3f7d20" />
    <path d="M0 2 L0 25" stroke="#a3c97a" strokeWidth="1" />
  </g>
);

// Bandhanwar / toran: mango leaves and marigolds on a thread, repeated across the full width.
export function Toran({ className = '' }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={`sagun-toran ${className}`} aria-hidden="true" focusable="false" width="100%" height="58" preserveAspectRatio="none">
      <defs>
        <pattern id={`toran-${id}`} width="120" height="58" patternUnits="userSpaceOnUse">
          <path d="M0 6 Q30 16 60 6 T120 6" fill="none" stroke="#b91c1c" strokeWidth="2.5" />
          <path d="M0 6 Q30 16 60 6 T120 6" fill="none" stroke="#facc15" strokeWidth="1" strokeDasharray="3 4" />
          <g className="sagun-toran-swing">
            <Leaf x={18} y={10} rotate={8} />
            <Leaf x={42} y={10} rotate={-8} />
            <line x1="30" y1="11" x2="30" y2="30" stroke="#b91c1c" strokeWidth="1" />
            <Marigold x={30} y={36} r={8} />
            <Leaf x={78} y={10} rotate={8} />
            <Leaf x={102} y={10} rotate={-8} />
            <line x1="90" y1="11" x2="90" y2="22" stroke="#b91c1c" strokeWidth="1" />
            <Marigold x={90} y={27} r={6} />
          </g>
          <Marigold x={60} y={7} r={5} />
          <Marigold x={0} y={7} r={5} />
          <Marigold x={120} y={7} r={5} />
        </pattern>
      </defs>
      <rect width="100%" height="58" fill={`url(#toran-${id})`} />
    </svg>
  );
}

export function Diya({ x = 0, y = 0, scale = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="-30" rx="14" ry="20" fill="#fde68a" opacity=".35" className="sagun-diya-glow" />
      <path className="sagun-diya-flame" d="M0 -46 C7 -34 8 -24 0 -16 C-8 -24 -7 -34 0 -46 Z" fill="#f59e0b" />
      <path d="M0 -38 C3 -31 3 -25 0 -20 C-3 -25 -3 -31 0 -38 Z" fill="#fff7cc" />
      <path d="M-26 -14 Q0 -20 26 -14 Q22 4 0 6 Q-22 4 -26 -14 Z" fill="#b45309" />
      <path d="M-26 -14 Q0 -20 26 -14" fill="none" stroke="#7c2d12" strokeWidth="2" />
      <path d="M-16 -6 h32" stroke="#facc15" strokeWidth="2" strokeDasharray="2 4" />
    </g>
  );
}

// Hero art: a kalash with mango leaves and coconut inside a rangoli mandala, flanked by two diyas.
export function WeddingArt({ className = '' }) {
  const id = useId().replace(/:/g, '');
  const petals = Array.from({ length: 16 }, (_, index) => index * 22.5);
  const dots = Array.from({ length: 32 }, (_, index) => (index * Math.PI) / 16);
  return (
    <svg className={`sagun-wedding-art ${className}`} viewBox="0 0 320 320" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`glow-${id}`}>
          <stop offset="0" stopColor="#fde68a" stopOpacity=".55" />
          <stop offset="1" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`pot-${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#9a3412" />
          <stop offset=".45" stopColor="#ea8a1b" />
          <stop offset="1" stopColor="#9a3412" />
        </linearGradient>
      </defs>
      <circle cx="160" cy="160" r="158" fill={`url(#glow-${id})`} />
      <g className="sagun-mandala">
        <circle cx="160" cy="160" r="148" fill="none" stroke="#facc15" strokeOpacity=".7" strokeWidth="1.5" strokeDasharray="2 6" />
        {petals.map((angle) => (
          <ellipse key={angle} cx="160" cy="38" rx="11" ry="24" fill="#fbbf24" fillOpacity=".22" stroke="#fde68a" strokeOpacity=".75" transform={`rotate(${angle} 160 160)`} />
        ))}
        {dots.map((angle) => (
          <circle key={angle} cx={160 + Math.cos(angle) * 104} cy={160 + Math.sin(angle) * 104} r="2.6" fill="#fde68a" fillOpacity=".85" />
        ))}
        <circle cx="160" cy="160" r="96" fill="none" stroke="#fde68a" strokeOpacity=".55" />
      </g>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const radians = (angle * Math.PI) / 180;
        return <Marigold key={angle} x={160 + Math.cos(radians) * 126} y={160 + Math.sin(radians) * 126} r={9} />;
      })}
      {/* mango leaves and coconut */}
      <Leaf x={160} y={120} rotate={180} scale={1.5} />
      <Leaf x={152} y={122} rotate={140} scale={1.45} />
      <Leaf x={168} y={122} rotate={-140} scale={1.45} />
      <Leaf x={148} y={128} rotate={105} scale={1.35} />
      <Leaf x={172} y={128} rotate={-105} scale={1.35} />
      <ellipse cx="160" cy="108" rx="17" ry="20" fill="#8b5a2b" />
      <path d="M152 92 Q160 80 168 92" fill="none" stroke="#5b3a1a" strokeWidth="3" strokeLinecap="round" />
      <path d="M146 112 Q160 118 174 112" fill="none" stroke="#dc2626" strokeWidth="3" />
      {/* kalash */}
      <rect x="138" y="124" width="44" height="10" rx="4" fill="#c2410c" />
      <path d="M144 134 h32 l4 12 h-40 Z" fill="#b45309" />
      <path d="M140 146 C102 160 104 222 136 236 H184 C216 222 218 160 180 146 Z" fill={`url(#pot-${id})`} />
      <path d="M128 160 Q160 170 192 160" fill="none" stroke="#dc2626" strokeWidth="5" />
      <path d="M128 160 Q160 170 192 160" fill="none" stroke="#facc15" strokeWidth="2" strokeDasharray="4 4" />
      <circle cx="160" cy="194" r="11" fill="#dc2626" />
      <circle cx="160" cy="194" r="5" fill="#facc15" />
      {[-24, 24].map((offset) => (
        <circle key={offset} cx={160 + offset} cy="196" r="3.5" fill="#facc15" />
      ))}
      <ellipse cx="160" cy="238" rx="30" ry="5" fill="#7c2d12" />
      <Diya x={70} y={262} scale={1.1} />
      <Diya x={250} y={262} scale={1.1} />
    </svg>
  );
}

// Small divider used above headings: ornament – text – ornament.
export function Shubh({ children, className = '' }) {
  return (
    <p className={`sagun-shubh ${className}`}>
      <span aria-hidden="true" className="sagun-shubh-line" />
      <span>{children}</span>
      <span aria-hidden="true" className="sagun-shubh-line" />
    </p>
  );
}

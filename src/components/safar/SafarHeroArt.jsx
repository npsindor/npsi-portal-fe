import { useId } from 'react';

// Travel & Assistance hero scene: a member drives from the city to their home village with a neighbour's parcel on the roof;
// one person hands the parcel over in the city, a family receives it at home. Decorative only (aria-hidden).

const Person = ({ x, y, body, skin = '#e0a87a', flip = false, children }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
    <circle cx="0" cy="-46" r="9" fill={skin} />
    <path d="M-9 -50 Q0 -62 9 -50 Q4 -56 0 -56 Q-4 -56 -9 -50 Z" fill="#2b1b14" />
    <path d="M-12 -34 Q0 -40 12 -34 L14 -6 H-14 Z" fill={body} />
    <rect x="-10" y="-6" width="8" height="22" rx="3" fill="#334155" />
    <rect x="2" y="-6" width="8" height="22" rx="3" fill="#334155" />
    {children}
  </g>
);

const Parcel = ({ x, y, size = 18 }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-size / 2} y={-size / 2} width={size} height={size} rx="2" fill="#d6a15a" stroke="#8a5a24" strokeWidth="1.2" />
    <path d={`M${-size / 2} 0 H${size / 2} M0 ${-size / 2} V${size / 2}`} stroke="#8a5a24" strokeWidth="1.4" />
  </g>
);

const Pin = ({ x, y, color }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M0 0 C-12 -16 -12 -32 0 -32 C12 -32 12 -16 0 0 Z" fill={color} />
    <circle cx="0" cy="-21" r="4.5" fill="#fff" />
  </g>
);

export default function SafarHeroArt({ lang = 'en', className = '' }) {
  const hi = lang === 'hi';
  const clip = `safar-clip-${useId().replace(/:/g, '')}`;
  return (
    <svg className={`safar-art ${className}`} viewBox="0 0 640 320" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={clip}><rect width="640" height="320" rx="28" /></clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
      <rect width="640" height="320" fill="#fff" opacity=".07" />
      {/* sun and hills */}
      <circle cx="560" cy="62" r="30" fill="#f5c84c" opacity=".9" />
      <circle cx="560" cy="62" r="44" fill="#f5c84c" opacity=".18" />
      <path d="M0 210 Q120 150 250 196 T470 180 T640 170 V320 H0 Z" fill="#2f6b3a" opacity=".55" />
      <path d="M0 236 Q160 196 320 226 T640 210 V320 H0 Z" fill="#3f7d46" opacity=".75" />

      {/* city on the left */}
      <g opacity=".95">
        <rect x="18" y="120" width="34" height="104" rx="3" fill="#e9d6b5" />
        <rect x="56" y="96" width="40" height="128" rx="3" fill="#f3e6cc" />
        <rect x="100" y="138" width="30" height="86" rx="3" fill="#e9d6b5" />
        {[0, 1, 2, 3, 4].map((row) => [0, 1].map((col) => <rect key={`${row}-${col}`} x={63 + col * 16} y={106 + row * 22} width="9" height="11" rx="1.5" fill="#b8892f" opacity=".75" />))}
        {[0, 1, 2, 3].map((row) => <rect key={row} x="27" y={130 + row * 22} width="16" height="9" rx="1.5" fill="#b8892f" opacity=".6" />)}
      </g>

      {/* village home on the right */}
      <g>
        <rect x="514" y="168" width="96" height="62" rx="3" fill="#f6e7c8" />
        <path d="M502 172 L562 128 L622 172 Z" fill="#b3261e" />
        <path d="M502 172 L562 128 L622 172" fill="none" stroke="#7a1414" strokeWidth="3" strokeLinejoin="round" />
        <rect x="550" y="192" width="22" height="38" rx="2" fill="#7c3f12" />
        <rect x="524" y="184" width="16" height="16" rx="2" fill="#f5c84c" />
        <rect x="584" y="184" width="16" height="16" rx="2" fill="#f5c84c" />
        <path d="M546 168 q16 -10 32 0" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="2 4" />
        <rect x="486" y="176" width="6" height="54" fill="#6b3f1d" />
        <circle cx="489" cy="166" r="20" fill="#2f7a3a" />
        <circle cx="478" cy="178" r="13" fill="#3a8b45" />
      </g>

      {/* road */}
      <path d="M-10 300 C150 250 300 232 470 238 S620 246 660 250" fill="none" stroke="#3d3d48" strokeWidth="34" strokeLinecap="round" />
      <path className="safar-road-line" d="M-10 300 C150 250 300 232 470 238 S620 246 660 250" fill="none" stroke="#f8e7a8" strokeWidth="3" strokeDasharray="16 14" />

      {/* route between the two pins */}
      <path className="safar-route" d="M150 92 C260 30 400 30 520 108" fill="none" stroke="#f5c84c" strokeWidth="2.5" strokeDasharray="4 8" strokeLinecap="round" />
      <Pin x={150} y={96} color="#f5c84c" />
      <Pin x={520} y={112} color="#f5c84c" />
      <text x="150" y="112" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff7e6">{hi ? 'शहर' : 'City'}</text>
      <text x="470" y="122" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff7e6">{hi ? 'गाँव / घर' : 'Home village'}</text>

      {/* sender in the city, handing over a parcel */}
      <Person x={168} y={250} body="#f59e0b">
        <path d="M10 -30 L26 -24" stroke="#e0a87a" strokeWidth="5" strokeLinecap="round" />
        <Parcel x={32} y={-26} size={15} />
      </Person>

      {/* car carrying parcels */}
      <g className="safar-car" transform="translate(250 162) scale(1.3)">
        <g className="safar-car-body">
          <rect x="22" y="-8" width="64" height="5" rx="2" fill="#5b4636" />
          <Parcel x={38} y={-17} size={18} />
          <Parcel x={60} y={-15} size={14} />
          <Parcel x={76} y={-14} size={12} />
          <path d="M6 30 Q8 12 26 8 L40 -2 H78 L96 12 Q118 14 120 30 V40 H6 Z" fill="#c8102e" />
          <path d="M44 4 H74 L88 14 H40 Z" fill="#bfe3f2" />
          <path d="M28 14 L40 4 V14 Z" fill="#bfe3f2" />
          <rect x="112" y="24" width="8" height="6" rx="2" fill="#fde68a" />
          <rect x="6" y="26" width="6" height="6" rx="2" fill="#fca5a5" />
          <path d="M56 18 H70" stroke="#8b0b1f" strokeWidth="2" strokeLinecap="round" />
        </g>
        {[30, 96].map((cx) => (
          <g key={cx} transform={`translate(${cx} 42)`}>
            <circle r="11" fill="#1f2937" />
            <g className="safar-wheel">
              <circle r="5" fill="#cbd5e1" />
              <path d="M0 -5 V5 M-5 0 H5" stroke="#64748b" strokeWidth="1.5" />
            </g>
          </g>
        ))}
        {/* a heart above the car: travelling and helping */}
        <path className="safar-heart" d="M63 -44 C63 -50 55 -52 53 -46 C51 -52 43 -50 43 -44 C43 -38 53 -33 53 -33 C53 -33 63 -38 63 -44 Z" fill="#f43f5e" />
      </g>

      {/* family receiving the parcel at home */}
      <Person x={600} y={262} body="#7c3aed" flip>
        <path d="M10 -30 L22 -38" stroke="#e0a87a" strokeWidth="5" strokeLinecap="round" />
      </Person>
      <Person x={624} y={268} body="#0e7490" skin="#c98d5f" flip />
      </g>
      <rect width="639" height="319" x=".5" y=".5" rx="28" fill="none" stroke="#f5c84c" strokeOpacity=".35" />
    </svg>
  );
}

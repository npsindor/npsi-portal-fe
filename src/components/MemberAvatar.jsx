import { useState } from "react";

// A round member photo; initials on a gold-and-navy circle when there is no photo or it fails to load.
export default function MemberAvatar({ name, photoUrl, size = 48, className = "" }) {
  const [broken, setBroken] = useState(false);
  const initials = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const style = { width: size, height: size };
  if (photoUrl && !broken)
    return <img src={photoUrl} alt={name} loading="lazy" decoding="async" onError={() => setBroken(true)} style={style} className={`shrink-0 rounded-full border-2 border-gold/60 object-cover ${className}`} />;
  return (
    <span role="img" aria-label={name} style={{ ...style, fontSize: Math.round(size * 0.36) }} className={`inline-flex shrink-0 items-center justify-center rounded-full border-2 border-gold/60 bg-maroon font-semibold text-gold ${className}`}>
      {initials || "•"}
    </span>
  );
}

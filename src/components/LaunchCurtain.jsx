import React, { useState } from "react";
import logoImage from "@/images/logo.png";

const SESSION_KEY = "nps_curtain_opened";
const SLIDE_DURATION_MS = 2800;

const STARS = [
  { left: "8%", top: "18%", size: "1.4rem", delay: "0s", char: "⭐" },
  { left: "18%", top: "62%", size: "1rem", delay: "0.4s", char: "✨" },
  { left: "28%", top: "30%", size: "1.1rem", delay: "0.8s", char: "✨" },
  { left: "12%", top: "80%", size: "1.3rem", delay: "1.2s", char: "⭐" },
  { left: "88%", top: "20%", size: "1.4rem", delay: "0.2s", char: "⭐" },
  { left: "80%", top: "65%", size: "1rem", delay: "0.6s", char: "✨" },
  { left: "72%", top: "35%", size: "1.1rem", delay: "1s", char: "✨" },
  { left: "90%", top: "80%", size: "1.2rem", delay: "1.4s", char: "⭐" },
];

const BALLOONS = [
  { left: "6%", bottom: "-10%", size: "2.6rem", delay: "0s", duration: "6s" },
  { left: "16%", bottom: "-16%", size: "2rem", delay: "0.8s", duration: "7s" },
  { left: "84%", bottom: "-12%", size: "2.4rem", delay: "0.4s", duration: "6.5s" },
  { left: "92%", bottom: "-18%", size: "1.9rem", delay: "1.2s", duration: "7.5s" },
];

/**
 * Purely decorative full-screen curtain overlay shown on first load of a
 * browser tab. Has no relation to auth/routing/data — clicking the center
 * button cuts the ceremonial ribbon and slides the two halves away.
 */
export default function LaunchCurtain() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [opening, setOpening] = useState(false);

  if (dismissed) return null;

  const handleOpen = () => {
    setOpening(true);
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // ignore storage errors (private browsing etc.)
    }
    // Timer-based unmount instead of onTransitionEnd: a bubbled transitionend
    // from an unrelated element (e.g. the button's own active:scale click
    // effect) would otherwise fire this early and cut the slide short.
    window.setTimeout(() => setDismissed(true), SLIDE_DURATION_MS);
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden" aria-hidden={opening}>
      <style>{`
        @keyframes nps-float-balloon {
          0% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-40vh) rotate(3deg); }
          100% { transform: translateY(-95vh) rotate(-3deg); }
        }
        @keyframes nps-twinkle {
          0%, 100% { opacity: 0.25; transform: scale(0.75); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>

      {/* Left curtain panel */}
      <div
        className="absolute inset-y-0 left-0 w-1/2"
        style={{
          transform: opening ? "translateX(-100%)" : "translateX(0)",
          transition: `transform ${SLIDE_DURATION_MS}ms cubic-bezier(0.65, 0, 0.35, 1)`,
          background:
            "repeating-linear-gradient(90deg, #4A0000 0px, #7A0C0C 22px, #4A0000 44px), linear-gradient(180deg, #7A0C0C, #4A0000)",
          boxShadow: "inset -12px 0 30px rgba(0,0,0,0.5)",
        }}
      />
      {/* Right curtain panel */}
      <div
        className="absolute inset-y-0 right-0 w-1/2"
        style={{
          transform: opening ? "translateX(100%)" : "translateX(0)",
          transition: `transform ${SLIDE_DURATION_MS}ms cubic-bezier(0.65, 0, 0.35, 1)`,
          background:
            "repeating-linear-gradient(90deg, #4A0000 0px, #7A0C0C 22px, #4A0000 44px), linear-gradient(180deg, #7A0C0C, #4A0000)",
          boxShadow: "inset 12px 0 30px rgba(0,0,0,0.5)",
        }}
      />

      {/* Gold seam down the middle */}
      <div
        className="pointer-events-none absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-gold/70"
        style={{ opacity: opening ? 0 : 1, transition: "opacity 900ms ease-in" }}
      />

      {/* Twinkling stars */}
      {STARS.map((s, i) => (
        <div
          key={i}
          className="pointer-events-none absolute select-none"
          style={{
            left: s.left,
            top: s.top,
            fontSize: s.size,
            opacity: opening ? 0 : undefined,
            transition: "opacity 700ms ease-in",
            animation: opening ? "none" : `nps-twinkle 1.8s ease-in-out ${s.delay} infinite`,
          }}
        >
          {s.char}
        </div>
      ))}

      {/* Rising balloons — released once the ribbon is cut */}
      {opening &&
        BALLOONS.map((b, i) => (
          <div
            key={i}
            className="pointer-events-none absolute select-none"
            style={{
              left: b.left,
              bottom: b.bottom,
              fontSize: b.size,
              animation: `nps-float-balloon ${b.duration} ease-out ${b.delay} forwards`,
            }}
          >
            🎈
          </div>
        ))}

      {/* Center content */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-4 text-center"
        style={{
          opacity: opening ? 0 : 1,
          pointerEvents: opening ? "none" : "auto",
          transition: "opacity 900ms ease-in",
        }}
      >
        <img src={logoImage} alt="" className="h-24 w-24 rounded-full border-4 border-gold/70 object-cover shadow-2xl sm:h-32 sm:w-32" />

        {/* Ceremonial ribbon — snips apart and falls away on click */}
        <div className="relative mt-1 flex h-6 w-64 items-center justify-center sm:w-80">
          <div
            className="absolute left-0 top-1/2 h-2 w-1/2 -translate-y-1/2 rounded-l-full bg-gold shadow-lg"
            style={{
              transformOrigin: "left center",
              transition: "transform 700ms ease-in, opacity 700ms ease-in",
              transform: opening ? "translateY(40px) rotate(-25deg)" : "translateY(-50%) rotate(0deg)",
              opacity: opening ? 0 : 1,
            }}
          />
          <div
            className="absolute right-0 top-1/2 h-2 w-1/2 -translate-y-1/2 rounded-r-full bg-gold shadow-lg"
            style={{
              transformOrigin: "right center",
              transition: "transform 700ms ease-in, opacity 700ms ease-in",
              transform: opening ? "translateY(40px) rotate(25deg)" : "translateY(-50%) rotate(0deg)",
              opacity: opening ? 0 : 1,
            }}
          />
          <span className="relative text-lg">✂️</span>
        </div>

        <button
          type="button"
          onClick={handleOpen}
          className="rounded-full border-2 border-gold bg-gold/10 px-8 py-4 font-display text-lg font-bold uppercase tracking-[0.1em] text-gold shadow-2xl backdrop-blur transition hover:scale-105 hover:bg-gold hover:text-maroon-dark active:scale-95 sm:px-12 sm:py-5 sm:text-xl"
        >
          निमाड़ पाटीदार संगठन, इंदौर
        </button>
        <p className="text-xs uppercase tracking-[0.25em] text-gold/70 sm:text-sm">Nimar Patidar Sangathan Indore</p>
      </div>
    </div>
  );
}

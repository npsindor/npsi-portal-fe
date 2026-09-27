import React, { useState } from "react";
import { X, Volume2, VolumeX } from "lucide-react";

// ---------------------------------------------------------------------------
// TEMPORARY EVENT PROMO — self-contained on purpose.
//
// Once "Maa na Garba" is over, remove this feature in exactly two steps:
//   1. Delete this file (GarbaVideoPopup.jsx).
//   2. In App.jsx, delete the one import line and the one <GarbaVideoPopup />
//      line that renders it (both are marked "GARBA PROMO" there).
//   3. Optionally delete public/videos/maanagarba.mp4.
// Nothing else in the app references this component or the video file.
// ---------------------------------------------------------------------------

const SESSION_KEY = "nps_garba_popup_seen";
const VIDEO_SRC = "/videos/maanagarba.mp4";

export default function GarbaVideoPopup() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [muted, setMuted] = useState(true);

  if (dismissed) return null;

  const close = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // ignore storage errors (private browsing etc.)
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-label="Maa na Garba video"
      onClick={close}
    >
      <div
        className="relative w-[75%] overflow-hidden rounded-2xl bg-black shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
        >
          <X className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "Unmute" : "Mute"}
          className="absolute bottom-2 right-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>

        <video
          key={muted}
          src={VIDEO_SRC}
          autoPlay
          muted={muted}
          loop
          playsInline
          controls
          className="block aspect-video w-full object-contain"
        />
      </div>
    </div>
  );
}

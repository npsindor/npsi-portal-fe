// The mobile app's opening video (the NPS Indore logo animation), shown full screen over the app on every launch.
// It ends by itself when the video finishes, when it is skipped, when it can't play, or after `maxMs` at the latest,
// so the app can never stay stuck behind it. Plain DOM (no React): it starts before the app has rendered.
export const SPLASH_VIDEO = "/slider/npsi-logo.mp4";
export const SPLASH_BACKGROUND = "#0B1B2B";

export function mountVideoSplash({ src = SPLASH_VIDEO, maxMs = 13000, skipAfterMs = 1000, skipLabel = "Skip", onFirstFrame = () => {}, doc = document } = {}) {
  return new Promise((resolve) => {
    const overlay = doc.createElement("div");
    overlay.id = "video-splash";
    overlay.setAttribute("role", "presentation");
    overlay.style.cssText = `position:fixed;inset:0;z-index:2147483647;background:${SPLASH_BACKGROUND};display:flex;align-items:center;justify-content:center;transition:opacity .35s ease`;
    const video = doc.createElement("video");
    video.src = src;
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("muted", "");
    video.style.cssText = "width:100%;height:100%;object-fit:contain;background:transparent";
    const skip = doc.createElement("button");
    skip.type = "button";
    skip.textContent = skipLabel;
    skip.style.cssText =
      "position:absolute;right:16px;bottom:calc(24px + env(safe-area-inset-bottom, 0px));padding:10px 18px;border-radius:999px;border:1px solid rgba(212,175,55,.6);background:rgba(11,27,43,.7);color:#E9D9A6;font:600 14px system-ui,sans-serif;opacity:0;transition:opacity .3s";
    overlay.append(video, skip);
    doc.body.append(overlay);

    let shown = false;
    const firstFrame = () => {
      if (shown) return;
      shown = true;
      onFirstFrame();
    };
    let done = false;
    const finish = (reason) => {
      if (done) return;
      done = true;
      firstFrame();
      clearTimeout(limit);
      clearTimeout(showSkip);
      overlay.style.opacity = "0";
      setTimeout(() => {
        overlay.remove();
        resolve(reason);
      }, 350);
    };
    const limit = setTimeout(() => finish("timeout"), maxMs);
    const showSkip = setTimeout(() => {
      skip.style.opacity = "1";
    }, skipAfterMs);
    video.addEventListener("playing", firstFrame);
    video.addEventListener("ended", () => finish("ended"));
    video.addEventListener("error", () => finish("error"));
    skip.addEventListener("click", () => finish("skipped"));
    const played = video.play?.();
    if (played?.catch) played.catch(() => finish("error"));
  });
}

// Google reCAPTCHA v3 helper — this site key is a v3 (invisible, score-based)
// key, not a v2 checkbox key, so there's no widget to render. Instead, right
// before a protected form submits, we ask Google for a fresh token tied to
// this page/action; the backend re-verifies that token (and its score)
// against Google's siteverify API before accepting the submission. The
// script is loaded on demand — only pages that call getRecaptchaToken() ever
// fetch it — and Google auto-shows its small required badge once loaded.
const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
let scriptLoadPromise = null;

const loadScript = () => {
  if (window.grecaptcha?.execute) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;
  scriptLoadPromise = new Promise((resolve, reject) => {
    const waitForReady = () => {
      window.grecaptcha.ready(() => resolve());
    };
    const existing = document.getElementById("google-recaptcha-v3-script");
    if (existing) {
      if (window.grecaptcha) waitForReady();
      else existing.addEventListener("load", waitForReady);
      return;
    }
    const script = document.createElement("script");
    script.id = "google-recaptcha-v3-script";
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = waitForReady;
    script.onerror = () => reject(new Error("Failed to load reCAPTCHA"));
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
};

// Call this immediately before submitting a protected form. Returns "" if no
// site key is configured (caller decides whether that's acceptable) or if
// the token request itself fails (e.g. offline) — the backend treats a
// missing/invalid token as a failed verification either way.
export const getRecaptchaToken = async (action = "submit") => {
  if (!SITE_KEY) return "";
  try {
    await loadScript();
    return await window.grecaptcha.execute(SITE_KEY, { action });
  } catch (error) {
    console.error("[recaptcha] token request failed:", error.message);
    return "";
  }
};

// The NPS Indore mobile app (Capacitor, Android first). The app runs this same website code inside the phone's web
// view, served from https://app.npsindore.org (capacitor.config.json). That origin is same-site with the API, so the
// login is the same httpOnly session cookie as on the website, and both show the same data. Nothing here runs on the
// website: main.jsx loads it only inside the app.
import { App } from "@capacitor/app";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { mountVideoSplash } from "./video-splash.js";

// The app opens on the member portal (it sends a logged-out user to the login page), not on the public home page.
export const appStartPath = (pathname) => (pathname === "/" || pathname === "" ? "/portal" : null);

// The Skip button speaks the language the member chose on the website (English unless they picked Hindi).
export const skipLabel = (lang) => (lang === "hi" ? "आगे बढ़ें" : "Skip");

// Android back button: back through the pages, and close the app from the first page.
export const backAction = (canGoBack) => (canGoBack ? "back" : "exit");

export async function initNativeApp() {
  document.documentElement.classList.add("native-app");
  let lang = "en";
  try {
    lang = localStorage.getItem("pss_lang") || "en";
  } catch {
    // Storage may be unavailable; English then.
  }
  // The logo video plays over the app on every launch; the static splash stays until its first frame shows.
  mountVideoSplash({ skipLabel: skipLabel(lang), onFirstFrame: () => SplashScreen.hide() });
  App.addListener("backButton", ({ canGoBack }) => {
    if (backAction(canGoBack) === "back") window.history.back();
    else App.exitApp();
  });
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#102A43" });
  } catch {
    // Not every platform lets the app colour the status bar.
  }
}

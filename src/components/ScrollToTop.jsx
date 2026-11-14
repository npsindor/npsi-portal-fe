import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const getHashId = (hash) => {
  const rawId = hash.slice(1);

  try {
    return decodeURIComponent(rawId);
  } catch {
    return rawId;
  }
};

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (hash) {
      const id = getHashId(hash);
      // Lazy routes may mount after the location changes, including direct URLs.
      const scroll = () => {
        const target = document.getElementById(id);
        if (!target) return false;
        target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
        return true;
      };
      if (scroll()) return;
      const observer = new MutationObserver(() => { if (scroll()) observer.disconnect(); });
      observer.observe(document.body, { subtree: true, childList: true });
      const timeout = window.setTimeout(() => observer.disconnect(), 5000);
      return () => { observer.disconnect(); window.clearTimeout(timeout); };
    }
    if (navigationType === "POP") return;

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash, navigationType]);

  return null;
}

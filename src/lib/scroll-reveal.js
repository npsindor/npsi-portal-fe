import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Public pages: sections and cards fade up as they scroll into view; cards in one row/grid come in one after another.
// Only things below the fold wait to animate (what is on screen at load shows at once), each animates once, and
// people who asked for less motion get no animation at all. Styles: `[data-reveal]` in index.css.
const SECTIONS = 'section';
const CARDS = '.premium-card, article, [data-reveal-card]';
const CAROUSEL = '[aria-roledescription="carousel"]';
const SKIP = `header, nav, [role="dialog"], [data-radix-popper-content-wrapper], ${CAROUSEL}, [data-no-reveal]`;
const STAGGER_MS = 90;

export function useScrollReveal() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined' || typeof MutationObserver === 'undefined') return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.dataset.reveal = 'in';
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -6% 0px' });
    const mark = () => {
      document.querySelectorAll(`${SECTIONS}, ${CARDS}`).forEach((el) => {
        // A section holding a carousel stays put too, so its arrows and dots never move under a tap.
        if (el.dataset.reveal || el.closest(SKIP) || (el.matches(SECTIONS) && el.querySelector(CAROUSEL))) return;
        const box = el.getBoundingClientRect();
        // Already on screen (or not laid out yet / hidden): show as is, no flash.
        if (box.height === 0 || (box.top < window.innerHeight && box.bottom > 0)) {
          if (box.height > 0) el.dataset.reveal = 'done';
          return;
        }
        el.dataset.reveal = el.matches(CARDS) ? 'wait-card' : 'wait';
        if (el.matches(CARDS) && el.parentElement) {
          const index = Array.prototype.indexOf.call(el.parentElement.children, el);
          el.style.setProperty('--reveal-delay', `${(index % 4) * STAGGER_MS}ms`);
        }
        observer.observe(el);
      });
    };
    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        mark();
      });
    };
    mark();
    // Pages load their lists after the first paint; new sections and cards get the same treatment.
    const mutations = new MutationObserver(schedule);
    mutations.observe(document.body, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      mutations.disconnect();
      observer.disconnect();
      // Nothing may stay hidden once this page's observer is gone.
      document.querySelectorAll('[data-reveal^="wait"]').forEach((el) => { el.dataset.reveal = 'done'; });
    };
  }, [pathname]);
}

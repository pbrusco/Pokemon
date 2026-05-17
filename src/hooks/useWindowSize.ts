import { useState, useEffect } from 'react';

/**
 * Tracks the current `window.innerWidth` / `innerHeight`.
 *
 * Two small optimisations vs. the obvious version:
 *   1. The resize event is throttled to one update per animation frame —
 *      holding the window-edge handle in dev fires resize at ~60 Hz and
 *      would otherwise re-render the whole world tree on every event.
 *   2. We bail out of `setState` when the dimensions match the previous
 *      snapshot, so React doesn't get a new object reference (which would
 *      defeat downstream `memo`s on viewport-derived props).
 */
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  }));

  useEffect(() => {
    let raf: number | null = null;
    const apply = () => {
      raf = null;
      const w = window.innerWidth;
      const h = window.innerHeight;
      setWindowSize(prev => (prev.width === w && prev.height === h ? prev : { width: w, height: h }));
    };
    const handleResize = () => {
      if (raf !== null) return;
      raf = requestAnimationFrame(apply);
    };
    window.addEventListener('resize', handleResize);
    // Run once in case the initial state was the SSR placeholder.
    apply();
    return () => {
      window.removeEventListener('resize', handleResize);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);

  return windowSize;
}

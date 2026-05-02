import { memo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const PAGE_LEN = 120;
const CHARS_PER_TICK = 2;
const TICK_MS = 22;

function splitPages(text: string): string[] {
  if (text.length <= PAGE_LEN) return [text];
  const pages: string[] = [];
  let rem = text;
  while (rem.length > PAGE_LEN) {
    const cut = rem.lastIndexOf(' ', PAGE_LEN);
    const at = cut > 20 ? cut : PAGE_LEN;
    pages.push(rem.slice(0, at).trim());
    rem = rem.slice(at).trim();
  }
  if (rem) pages.push(rem);
  return pages;
}

// Matches "NAME: rest" where NAME starts with an uppercase letter and is ≤25 chars.
// Handles names like "PROF. OAK", "GUARDIA", "AZUL", etc.
function parseSpeaker(text: string): { speaker: string | null; body: string } {
  const m = text.match(/^([A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑ\s\.]{0,24}):\s*([\s\S]+)/);
  return m ? { speaker: m[1].trim(), body: m[2] } : { speaker: null, body: text };
}

export const DialogueBox = memo(({ text, onComplete }: { text: string; onComplete: () => void }) => {
  const { speaker, body } = parseSpeaker(text);
  const pages = splitPages(body);

  const [pageIdx, setPageIdx] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  // Reset page index whenever the source text changes
  useEffect(() => {
    setPageIdx(0);
  }, [text]);

  // Typewriter effect — reruns whenever the visible page changes
  const currentPage = pages[pageIdx] ?? '';
  useEffect(() => {
    setDisplayed('');
    setDone(false);
    if (!currentPage) return;
    let pos = 0;
    const id = setInterval(() => {
      pos = Math.min(pos + CHARS_PER_TICK, currentPage.length);
      setDisplayed(currentPage.slice(0, pos));
      if (pos >= currentPage.length) {
        clearInterval(id);
        setDone(true);
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [currentPage]);

  const advance = useCallback(() => {
    if (!done) {
      // Skip typewriter — show full page immediately
      setDisplayed(currentPage);
      setDone(true);
      return;
    }
    if (pageIdx < pages.length - 1) {
      setPageIdx(p => p + 1);
    } else {
      onComplete();
    }
  }, [done, currentPage, pageIdx, pages.length, onComplete]);

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'tween', duration: 0.18, ease: 'easeOut' }}
      className="fixed bottom-28 sm:bottom-10 left-1/2 -translate-x-1/2 w-[94%] max-w-3xl z-50 cursor-pointer select-none"
      onClick={advance}
      style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.7))' }}
    >
      {/* Outer frame */}
      <div
        className="relative rounded-sm"
        style={{
          background: '#f8f8f0',
          padding: '3px',
          boxShadow: '0 0 0 3px #383838, inset 0 0 0 1px #f8f8f0',
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-red-600 rounded-t-sm" />

        {/* Inner panel */}
        <div
          className="rounded-sm px-5 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4"
          style={{ background: '#0d1b2a', boxShadow: 'inset 0 0 0 2px #1e3a5f' }}
        >
          {/* Speaker label */}
          {speaker && (
            <p
              className="font-game text-[#f8d830] mb-2"
              style={{ fontSize: '8px', letterSpacing: '0.06em' }}
            >
              {speaker}:
            </p>
          )}

          {/* Dialogue text */}
          <p
            className="font-sans font-semibold text-white leading-relaxed"
            style={{
              fontSize: 'clamp(15px, 2.5vw, 20px)',
              letterSpacing: '0.02em',
              minHeight: '2.8em',
            }}
          >
            {displayed}
            {!done && (
              <span className="inline-block w-[2px] h-[1em] bg-white/60 ml-0.5 align-middle animate-pulse" />
            )}
          </p>

          {/* Footer: page counter + continue arrow */}
          <div className="mt-2 flex justify-between items-center">
            {pages.length > 1 ? (
              <span className="font-mono text-white/30" style={{ fontSize: '9px' }}>
                {pageIdx + 1}&nbsp;/&nbsp;{pages.length}
              </span>
            ) : (
              <span />
            )}
            <AnimatePresence mode="wait">
              {done && (
                <motion.div
                  key={pageIdx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, y: [0, 5, 0] }}
                  transition={{ opacity: { duration: 0.15 }, y: { repeat: Infinity, duration: 0.9 } }}
                  className="text-red-500"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(239,68,68,0.6))' }}
                >
                  <div className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[9px] border-t-current" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

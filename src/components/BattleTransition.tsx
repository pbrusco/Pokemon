import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const BattleTransition = memo(({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState<'wipe-in' | 'hold' | 'wipe-out'>('wipe-in');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 480);
    const t2 = setTimeout(() => setPhase('wipe-out'), 780);
    const t3 = setTimeout(() => onComplete(), 1260);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  const barVariants = {
    initial: { scaleY: 0 },
    'wipe-in': { scaleY: 1 },
    hold: { scaleY: 1 },
    'wipe-out': { scaleY: 0 },
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      {/* Top bar */}
      <motion.div
        className="absolute top-0 left-0 w-full h-1/2 bg-black"
        style={{ originY: 0 }}
        variants={barVariants}
        initial="initial"
        animate={phase}
        transition={{ duration: phase === 'wipe-out' ? 0.4 : 0.45, ease: [0.4, 0, 0.2, 1] }}
      />
      {/* Bottom bar */}
      <motion.div
        className="absolute bottom-0 left-0 w-full h-1/2 bg-black"
        style={{ originY: 1 }}
        variants={barVariants}
        initial="initial"
        animate={phase}
        transition={{ duration: phase === 'wipe-out' ? 0.4 : 0.45, ease: [0.4, 0, 0.2, 1] }}
      />

      {/* Pokéball icon + text during hold */}
      <AnimatePresence>
        {(phase === 'hold' || phase === 'wipe-out') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10"
          >
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <circle cx="24" cy="24" r="22" stroke="white" strokeWidth="3"/>
              <path d="M2 24h44" stroke="white" strokeWidth="3"/>
              <circle cx="24" cy="24" r="7" fill="black" stroke="white" strokeWidth="3"/>
              <circle cx="24" cy="24" r="3.5" fill="white"/>
            </svg>
            <p className="font-game text-white" style={{ fontSize: '11px', letterSpacing: '0.1em', textShadow: '2px 2px 0 #7f1d1d' }}>
              ¡COMBATE!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

import { memo } from 'react';
import { motion } from 'motion/react';

export const DialogueBox = memo(({ text, onComplete }: { text: string, onComplete: () => void }) => {
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'tween', duration: 0.18, ease: 'easeOut' }}
      className="fixed bottom-28 sm:bottom-10 left-1/2 -translate-x-1/2 w-[94%] max-w-3xl z-50 cursor-pointer"
      onClick={onComplete}
      style={{
        filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.7))',
      }}
    >
      {/* Outer border frame */}
      <div
        className="relative rounded-sm"
        style={{
          background: '#f8f8f0',
          padding: '3px',
          boxShadow: '0 0 0 3px #383838, inset 0 0 0 1px #f8f8f0',
        }}
      >
        {/* Red accent bar at top */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-red-600 rounded-t-sm" />

        {/* Inner panel */}
        <div
          className="rounded-sm p-5 sm:p-6"
          style={{
            background: '#0d1b2a',
            boxShadow: 'inset 0 0 0 2px #1e3a5f',
          }}
        >
          <p
            className="font-sans font-semibold text-white leading-relaxed"
            style={{ fontSize: 'clamp(15px, 2.5vw, 20px)', letterSpacing: '0.02em' }}
          >
            {text}
          </p>
          <div className="mt-3 flex justify-end">
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 0.9 }}
              className="text-red-500"
              style={{ filter: 'drop-shadow(0 0 6px rgba(239,68,68,0.6))' }}
            >
              <div className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[9px] border-t-current" />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

import { memo } from 'react';
import { motion } from 'motion/react';

export const BattleTransition = memo(({ onComplete }: { onComplete: () => void }) => {
  return (
    <motion.div
      initial={{ scale: 0, rotate: 0, opacity: 0 }}
      animate={{
        scale: [0, 1.5, 1],
        rotate: [0, 360, 720],
        opacity: [0, 1, 1]
      }}
      exit={{ opacity: 0, scale: 2 }}
      onAnimationComplete={onComplete}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
    >
      <div className="w-full h-full bg-[radial-gradient(circle,rgba(255,255,255,0.2)_0%,transparent_70%)]" />
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 0.5 }}
        className="absolute text-white font-black text-6xl italic tracking-tighter"
      >
        ¡BATTLE!
      </motion.div>
    </motion.div>
  );
});

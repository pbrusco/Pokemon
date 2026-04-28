import { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { sdur } from '../lib/gameSpeed';
import { type BattlePhase } from '../types/gamePhase';

interface ScreenEffectsProps {
  phaseType: string;
  battlePhase: BattlePhase | null;
}

export const ScreenEffects = memo(({ phaseType, battlePhase }: ScreenEffectsProps) => (
  <>
    {/* Level-up flash */}
    <AnimatePresence>
      {battlePhase?.type === 'LEVEL_UP' && (
        <motion.div
          className="fixed inset-0 bg-yellow-300 z-[300] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.7, 0, 0.7, 0, 0.7, 0] }}
          transition={{ duration: sdur(1.8), times: [0, 0.1, 0.3, 0.45, 0.6, 0.75, 1], ease: "linear" }}
          exit={{ opacity: 0 }}
        />
      )}
    </AnimatePresence>

    {/* Evolution flash */}
    <AnimatePresence>
      {battlePhase?.type === 'EVOLVING' && (
        <motion.div
          className="fixed inset-0 bg-white z-[300] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0, 1, 0, 1, 0, 1, 0] }}
          transition={{ duration: sdur(3), times: [0, 0.1, 0.22, 0.33, 0.44, 0.56, 0.67, 0.78, 1], ease: "linear" }}
          exit={{ opacity: 0 }}
        />
      )}
    </AnimatePresence>

    {/* Blackout overlay */}
    <AnimatePresence>
      {phaseType === 'BLACKOUT' && (
        <motion.div
          className="fixed inset-0 bg-black z-[300] pointer-events-none"
          initial={{ opacity: 1 }}
          animate={{ opacity: [1, 0.2, 1, 0.2, 1, 0.2, 1, 0] }}
          transition={{ duration: sdur(2.4), times: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.88, 1], ease: "linear" }}
          exit={{ opacity: 0 }}
        />
      )}
    </AnimatePresence>

    {/* Heal animation */}
    <AnimatePresence>
      {phaseType === 'HEALING' && (
        <motion.div
          className="fixed inset-0 bg-white z-[300] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.85, 0, 0.85, 0, 0.85, 0] }}
          transition={{ duration: sdur(1.6), times: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 1], ease: "linear" }}
          exit={{ opacity: 0 }}
        />
      )}
    </AnimatePresence>

    {/* Overlay Vignette */}
    <div className="fixed inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.2)] z-10" />
  </>
));

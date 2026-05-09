import { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { sdur } from '../lib/gameSpeed';
import { type BattlePhase } from '../types';
import { useGameStore } from '../store/gameStore';

interface ScreenEffectsProps {
  phaseType: string;
  battlePhase: BattlePhase | null;
}

export const ScreenEffects = memo(({ phaseType, battlePhase }: ScreenEffectsProps) => {
  const isTrainerBattle = useGameStore(s => s.isTrainerBattle);
  const flashActive = useGameStore(s => s.flashActive);
  const currentMap = useGameStore(s => s.currentMap);
  const worldMaps = useGameStore(s => s.worldMaps);

  const mapData = worldMaps[currentMap];
  const inDarkCave = mapData?.isUnderground ?? false;
  const showFlashDarkness = inDarkCave && !flashActive && !['BATTLE', 'BATTLE_TRANSITION', 'HEALING', 'BLACKOUT'].includes(phaseType);

  return (
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

      {/* Evolution flash — silhouette pulse with white flashes */}
      <AnimatePresence>
        {battlePhase?.type === 'EVOLVING' && (
          <motion.div
            className="fixed inset-0 z-[300] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0, 1, 0, 1, 0, 1, 0, 1, 0],
              scale: [1, 1, 1.15, 1, 1.2, 1, 1.3, 1, 1.4, 1],
            }}
            transition={{ duration: sdur(3.2), times: [0, 0.08, 0.16, 0.28, 0.37, 0.49, 0.58, 0.72, 0.82, 1], ease: "linear" }}
            exit={{ opacity: 0 }}
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(200,220,255,0.6) 50%, transparent 80%)' }}
          />
        )}
      </AnimatePresence>

      {/* Battle win: gray spiral for wild faint */}
      <AnimatePresence>
        {battlePhase?.type === 'ENEMY_FAINTED' && !isTrainerBattle && (
          <motion.div
            className="fixed inset-0 z-[200] pointer-events-none"
            initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
            animate={{ opacity: [0.6, 0], scale: [1, 1.5], rotate: 360 }}
            transition={{ duration: sdur(0.5), ease: "easeOut" }}
            style={{
              background: 'conic-gradient(from 0deg, #888 0%, #444 25%, #888 50%, #444 75%, #888 100%)',
              maskImage: 'radial-gradient(circle, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 60%, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 60%, transparent 80%)',
            }}
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

      {/* Flash cave darkness — visible ring around player, everything else black */}
      <AnimatePresence>
        {showFlashDarkness && (
          <motion.div
            className="fixed inset-0 z-[150] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              background: 'radial-gradient(circle at 50% 50%, transparent 12%, rgba(0,0,0,0.75) 35%, rgba(0,0,0,0.92) 100%)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Overlay Vignette */}
      <div className="fixed inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.2)] z-10" />
    </>
  );
});

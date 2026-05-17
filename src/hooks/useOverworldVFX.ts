import { useState } from 'react';
import { useGameStore } from '../store/gameStore';

export function useOverworldVFX() {
  // Per-field selectors so the consumer (App.tsx) doesn't re-render on every
  // unrelated store mutation while walking.
  const grassEffect = useGameStore(s => s.grassEffect);
  const setGrassEffect = useGameStore(s => s.setGrassEffect);
  const spottedTrainerId = useGameStore(s => s.spottedTrainerId);
  const setSpottedTrainerId = useGameStore(s => s.setSpottedTrainerId);
  const spottedTrainerPos = useGameStore(s => s.spottedTrainerPos);
  const setSpottedTrainerPos = useGameStore(s => s.setSpottedTrainerPos);
  const [overworldShake, setOverworldShake] = useState(false);

  return {
    grassEffect,
    setGrassEffect,
    spottedTrainerId,
    setSpottedTrainerId,
    spottedTrainerPos,
    setSpottedTrainerPos,
    overworldShake,
    setOverworldShake,
  };
}

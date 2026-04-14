import { useState } from 'react';
import { useGameStore } from '../store/gameStore';

export function useOverworldVFX() {
  const store = useGameStore();
  const [overworldShake, setOverworldShake] = useState(false);

  return {
    grassEffect: store.grassEffect,
    setGrassEffect: store.setGrassEffect,
    spottedTrainerId: store.spottedTrainerId,
    setSpottedTrainerId: store.setSpottedTrainerId,
    spottedTrainerPos: store.spottedTrainerPos,
    setSpottedTrainerPos: store.setSpottedTrainerPos,
    overworldShake, 
    setOverworldShake,
  };
}

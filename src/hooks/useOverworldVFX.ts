import { useState } from 'react';
import type { Position } from '../types';

export function useOverworldVFX() {
  const [grassEffect, setGrassEffect] = useState<{ x: number; y: number } | null>(null);
  const [spottedTrainerId, setSpottedTrainerId] = useState<string | null>(null);
  const [spottedTrainerPos, setSpottedTrainerPos] = useState<Position | null>(null);
  const [overworldShake, setOverworldShake] = useState(false);

  return {
    grassEffect, setGrassEffect,
    spottedTrainerId, setSpottedTrainerId,
    spottedTrainerPos, setSpottedTrainerPos,
    overworldShake, setOverworldShake,
  };
}

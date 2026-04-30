import { useState } from 'react';

export type CinematicEvent = { attacker: 'player' | 'enemy'; moveName: string; moveType: string } | null;

// Total wall-clock duration of the 3-shot cinematic sequence (unscaled ms).
// useBattleEngine uses this to hold the pipeline until the cinematic finishes.
export const CINEMATIC_DURATION_MS = (0.35 + 0.06 + 0.25 + 0.06 + 0.3) * 1000 + 50; // ~1070ms

export function useBattleVFX() {
  const [playerAnim, setPlayerAnim] = useState<'idle' | 'attack' | 'hit' | 'faint'>('idle');
  const [enemyAnim, setEnemyAnim] = useState<'idle' | 'attack' | 'hit' | 'faint'>('idle');
  const [battleShake, setBattleShake] = useState(false);
  const [cinematicEvent, setCinematicEvent] = useState<CinematicEvent>(null);

  function resetBattleVFX() {
    setPlayerAnim('idle');
    setEnemyAnim('idle');
    setBattleShake(false);
    setCinematicEvent(null);
  }

  return {
    playerAnim, setPlayerAnim,
    enemyAnim, setEnemyAnim,
    battleShake, setBattleShake,
    cinematicEvent, setCinematicEvent,
    resetBattleVFX,
  };
}

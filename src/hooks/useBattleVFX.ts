import { useState } from 'react';

export function useBattleVFX() {
  const [playerAnim, setPlayerAnim] = useState<'idle' | 'attack' | 'hit' | 'faint'>('idle');
  const [enemyAnim, setEnemyAnim] = useState<'idle' | 'attack' | 'hit' | 'faint'>('idle');
  const [battleShake, setBattleShake] = useState(false);

  function resetBattleVFX() {
    setPlayerAnim('idle');
    setEnemyAnim('idle');
    setBattleShake(false);
  }

  return {
    playerAnim, setPlayerAnim,
    enemyAnim, setEnemyAnim,
    battleShake, setBattleShake,
    resetBattleVFX,
  };
}

import { useState } from 'react';

export function useBattleVFX() {
  const [playerAnim, setPlayerAnim] = useState<'idle' | 'attack' | 'hit' | 'faint'>('idle');
  const [enemyAnim, setEnemyAnim] = useState<'idle' | 'attack' | 'hit' | 'faint'>('idle');
  const [screenFlash, setScreenFlash] = useState(false);
  const [hitEffect, setHitEffect] = useState<{ x: number; y: number; type: string } | null>(null);
  const [projectile, setProjectile] = useState<{ type: string; from: 'player' | 'enemy' } | null>(null);
  const [damageNumber, setDamageNumber] = useState<{ x: number; y: number; value: number } | null>(null);
  const [healNumber, setHealNumber] = useState<{ x: number; y: number; value: number } | null>(null);
  const [battleShake, setBattleShake] = useState(false);

  function resetBattleVFX() {
    setPlayerAnim('idle');
    setEnemyAnim('idle');
    setScreenFlash(false);
    setHitEffect(null);
    setProjectile(null);
    setDamageNumber(null);
    setHealNumber(null);
    setBattleShake(false);
  }

  return {
    playerAnim, setPlayerAnim,
    enemyAnim, setEnemyAnim,
    screenFlash, setScreenFlash,
    hitEffect, setHitEffect,
    projectile, setProjectile,
    damageNumber, setDamageNumber,
    healNumber, setHealNumber,
    battleShake, setBattleShake,
    resetBattleVFX,
  };
}

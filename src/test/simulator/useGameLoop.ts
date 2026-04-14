/**
 * useGameLoop — Headless composite hook for the game simulator.
 *
 * Wires together useMovementEngine, useBattleEngine, and useInteractionEngine
 * with stubbed visual callbacks (no DOM, no animations). Shares a real
 * battleStateRef so all three hooks operate on the same battle state.
 */

import { useRef, useState } from 'react';
import { useMovementEngine } from '../../hooks/useMovementEngine';
import { useBattleEngine } from '../../hooks/useBattleEngine';
import { useInteractionEngine } from '../../hooks/useInteractionEngine';
import type { BattleState } from '../../lib/battleEngine';

const noop = () => {};

export function useGameLoop() {
  const battleStateRef = useRef<BattleState | null>(null);

  // Stubbed visual state — not rendered, but hooks may call these
  const [, setGrassEffect] = useState<{ x: number; y: number } | null>(null);
  const [, setSpottedTrainerId] = useState<string | null>(null);
  const [, setSpottedTrainerPos] = useState<{ x: number; y: number } | null>(null);

  const { dispatchBattle, enemyPokemon, battleLog, battleLogs, isTrainerBattle, setEnemyPokemon, setIsTrainerBattle, setBattleLog, setBattleLogs } = useBattleEngine({
    battleStateRef,
    setPlayerAnim: noop as (anim: 'idle' | 'attack' | 'hit' | 'faint') => void,
    setEnemyAnim: noop as (anim: 'idle' | 'attack' | 'hit' | 'faint') => void,
    setBattleShake: noop,
  });

  const { handleMove, initBattle } = useMovementEngine({
    battleStateRef,
    setOverworldShake: noop,
    setGrassEffect,
    setSpottedTrainerId,
    setSpottedTrainerPos,
    setEnemyPokemon,
    setIsTrainerBattle,
    setBattleLog,
    setBattleLogs: noop,
  });

  const { handleAction } = useInteractionEngine({ initBattle });

  return {
    handleMove,
    handleAction,
    dispatchBattle,
    battleStateRef,
    enemyPokemon,
    battleLog,
    isTrainerBattle,
  };
}

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

  const { dispatchBattle } = useBattleEngine({
    battleStateRef,
    setPlayerAnim: noop as (anim: 'idle' | 'attack' | 'hit' | 'faint') => void,
    setEnemyAnim: noop as (anim: 'idle' | 'attack' | 'hit' | 'faint') => void,
    setBattleShake: noop,
  });

  const { handleMove, initBattle } = useMovementEngine({
    battleStateRef,
    setOverworldShake: noop,
  });

  const { handleAction } = useInteractionEngine({ initBattle });

  return {
    handleMove,
    handleAction,
    dispatchBattle,
    battleStateRef,
  };
}

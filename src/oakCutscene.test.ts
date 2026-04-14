import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMovementEngine } from './hooks/useMovementEngine';
import { useGameStore } from './store/gameStore';
import { MutableRefObject } from 'react';
import { BattleState } from './lib/battleEngine';

describe('Oak Cutscene Sequence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    if (typeof Storage !== 'undefined') {
      Storage.prototype.setItem = vi.fn();
      Storage.prototype.getItem = vi.fn();
      Storage.prototype.removeItem = vi.fn();
      Storage.prototype.clear = vi.fn();
    }
    useGameStore.getState().resetGame();
  });

  it('triggers dialogue and walk sequence when leaving Pallet Town without Pokemon', async () => {
    // 1. Set up game state
    const store = useGameStore.getState();
    store.setCurrentMap('PALLET_TOWN');
    store.setPlayerPos({ x: 10, y: 6 }); // Position right before the grass
    store.setPlayerTeam([]); // No pokemon

    // 2. Setup mock dependencies for useMovementEngine
    const battleStateRef: MutableRefObject<BattleState | null> = { current: null };
    const setOverworldShake = vi.fn();
    const setGrassEffect = vi.fn();
    const setSpottedTrainerId = vi.fn();
    const setSpottedTrainerPos = vi.fn();
    const setEnemyPokemon = vi.fn();
    const setIsTrainerBattle = vi.fn();
    const setBattleLog = vi.fn();
    const setBattleLogs = vi.fn();

    // 3. Render the hook
    const { result } = renderHook(() => useMovementEngine({
      battleStateRef,
      setOverworldShake,
      setGrassEffect,
      setSpottedTrainerId,
      setSpottedTrainerPos,
      setEnemyPokemon,
      setIsTrainerBattle,
      setBattleLog,
      setBattleLogs
    }));

    // 4. Trigger movement UP
    result.current.handleMove('up');

    // 5. Assert Player is locked and dialogue is active
    expect(useGameStore.getState().isMoving).toBe(true);
    expect(useGameStore.getState().dialogue).toContain('Es peligroso salir a la hierba sin un POKÉMON');
    
    // We expect the position to remain identical until the callback processes
    expect(useGameStore.getState().playerPos).toEqual({ x: 10, y: 6 });
    expect(useGameStore.getState().direction).toEqual('down'); // Should have turned to face Oak

    // 6. Extracted and execute dialogue callback
    const cb = useGameStore.getState().dialogueCallback;
    expect(cb).toBeTypeOf('function');
    
    // Simulate dismissing the dialogue by triggering the callback
    cb!();

    // 7. Fast forward through the timeline to evaluate the movement loop
    // Total steps ~ 10.
    
    // Jump time ahead slightly to ensure first step fires
    await vi.advanceTimersByTimeAsync(250); 
    expect(useGameStore.getState().playerPos.y).toBeGreaterThan(6);

    // Fast forward enough for the entire sequence to resolve
    await vi.advanceTimersByTimeAsync(3000);

    // 8. Final Assertions: Player warped to Lab
    expect(useGameStore.getState().currentMap).toBe('OAKS_LAB');
    expect(useGameStore.getState().storyStep).toBe('OAK_STOPPED');
    expect(useGameStore.getState().playerPos).toEqual({ x: 10, y: 14 });
    expect(useGameStore.getState().isMoving).toBe(false); // Player unlocked
  });
});

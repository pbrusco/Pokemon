/**
 * GameSimulator — Headless driver for integration-testing game scenarios.
 *
 * Renders the composite useGameLoop hook via renderHook, then exposes
 * high-level commands (move, interact, battle) and state queries.
 * Uses Vitest fake timers + seeded Math.random for deterministic runs.
 *
 * Usage:
 *   const sim = new GameSimulator();
 *   sim.init({ currentMap: 'OAKS_LAB', playerPos: { x: 10, y: 9 } });
 *   sim.face('up');
 *   sim.interact();
 *   sim.tick(2000);
 *   expect(sim.phase.type).toBe('BATTLE_TRANSITION');
 *   sim.destroy();
 */

import { renderHook, act, type RenderHookResult } from '@testing-library/react';
import { vi } from 'vitest';
import { useGameStore } from '../../store/gameStore';
import { useGameLoop } from './useGameLoop';
import { setGameSpeed } from '../../lib/gameSpeed';
import { EXPLORING } from '../../types/gamePhase';
import { battle, B_CHOOSING } from '../../types/gamePhase';
import { worldConfig } from '../../data/worldConfig';
import { validateWorld } from '../../lib/worldValidator';
import type { Direction, Position, MapID, Pokemon, InventoryCounts } from '../../types';
import type { GamePhase } from '../../types/gamePhase';
import type { BattleAction } from '../../lib/battleEngine';
import type { RecLog } from '../../lib/eventLog';

// ─── Event log ──────────────────────────────────────────────────────────────

interface SimEvent {
  type: 'phase' | 'map' | 'dialogue' | 'storyStep' | 'position';
  value: unknown;
  ms: number;
}

// ─── Store overrides ────────────────────────────────────────────────────────

interface StoreOverrides {
  playerPos?: Position;
  direction?: Direction;
  currentMap?: MapID;
  playerTeam?: Pokemon[];
  hasPokedex?: boolean;
  hasParcel?: boolean;
  badges?: string[];
  storyStep?: 'START' | 'OAK_STOPPED' | 'IN_LAB' | 'PICKED_STARTER' | 'RIVAL_BATTLE' | 'EXPLORING';
  defeatedTrainers?: string[];
  inventory?: InventoryCounts;
  pickedItemIds?: string[];
  money?: number;
}

// ─── Simulator ──────────────────────────────────────────────────────────────

export class GameSimulator {
  private hookResult!: RenderHookResult<ReturnType<typeof useGameLoop>, unknown>;
  private unsubscribe?: () => void;
  private randomValues: number[] = [];
  private randomIndex = 0;
  private originalRandom!: () => number;

  /** Chronological event log recording state transitions */
  log: SimEvent[] = [];

  // ── Lifecycle ────────────────────────────────────────────────────────────

  /** Initialize simulator with optional store overrides. Call before any commands. */
  init(overrides: StoreOverrides = {}) {
    // Fake timers (must be set before renderHook so setTimeout is patched)
    vi.useFakeTimers();

    // Set game speed very high so sd() returns near-zero delays
    setGameSpeed(10_000);

    // Reset the Zustand store to a clean initial state
    useGameStore.setState({
      playerPos: overrides.playerPos ?? { x: 16, y: 204 },
      direction: overrides.direction ?? 'down',
      currentMap: overrides.currentMap ?? 'KANTO_OVERWORLD',
      playerTeam: overrides.playerTeam ?? [],
      hasPokedex: overrides.hasPokedex ?? false,
      hasParcel: overrides.hasParcel ?? false,
      badges: overrides.badges ?? [],
      storyStep: overrides.storyStep ?? 'START',
      defeatedTrainers: overrides.defeatedTrainers ?? [],
      inventory: overrides.inventory ?? { POTION: 1, POKEBALL: 1 },
      pickedItemIds: overrides.pickedItemIds ?? [],
      money: overrides.money ?? 3000,
      pcStorage: [],
      pokedex: {},
      lastHealLocation: { map: 'PLAYERS_HOUSE_1F' as MapID, pos: { x: 5, y: 7 } },

      // Runtime state
      isMoving: false,
      phase: EXPLORING,
      showMoves: false,
      dialogue: null,
      dialogueCallback: null,
      confirm: null,
      isLocked: false,
      showBattleTransition: false,
      activeBattle: null,
      worldMaps: worldConfig.maps,
    });

    // Subscribe to store changes for the event log
    let prevState = useGameStore.getState();
    this.unsubscribe = useGameStore.subscribe((state) => {
      const ms = Date.now();
      if (state.phase !== prevState.phase) {
        this.log.push({ type: 'phase', value: state.phase, ms });
      }
      if (state.currentMap !== prevState.currentMap) {
        this.log.push({ type: 'map', value: state.currentMap, ms });
      }
      if (state.dialogue !== prevState.dialogue && state.dialogue !== null) {
        this.log.push({ type: 'dialogue', value: state.dialogue, ms });
      }
      if (state.storyStep !== prevState.storyStep) {
        this.log.push({ type: 'storyStep', value: state.storyStep, ms });
      }
      if (state.playerPos.x !== prevState.playerPos.x || state.playerPos.y !== prevState.playerPos.y) {
        this.log.push({ type: 'position', value: { ...state.playerPos }, ms });
      }
      prevState = state;
    });

    // Seed Math.random
    this.originalRandom = Math.random;
    this.randomValues = [];
    this.randomIndex = 0;
    Math.random = () => {
      if (this.randomIndex < this.randomValues.length) {
        return this.randomValues[this.randomIndex++];
      }
      // Default: return 0.99 (no encounter, no crit, no status, miss nothing)
      return 0.99;
    };

    // Render the composite hook
    this.hookResult = renderHook(() => useGameLoop());

    return this;
  }

  /** Clean up: restore timers, Math.random, unsubscribe store */
  destroy() {
    this.hookResult?.unmount();
    this.unsubscribe?.();
    Math.random = this.originalRandom;
    setGameSpeed(1);
    vi.useRealTimers();
  }

  // ── Commands ─────────────────────────────────────────────────────────────

  /** Move player one tile in direction. Also sets direction. */
  move(dir: Direction): this {
    act(() => {
      this.hookResult.result.current.handleMove(dir);
    });
    return this;
  }

  /** Set player direction without moving (face a tile) */
  face(dir: Direction): this {
    act(() => {
      useGameStore.getState().setDirection(dir);
    });
    return this;
  }

  /** Press the action/interact button */
  interact(): this {
    act(() => {
      this.hookResult.result.current.handleAction();
    });
    return this;
  }

  /** Dispatch a battle action */
  battleAction(action: BattleAction): this {
    act(() => {
      this.hookResult.result.current.dispatchBattle(action);
    });
    return this;
  }

  /** Advance fake timers by `ms` milliseconds */
  tick(ms: number): this {
    act(() => {
      vi.advanceTimersByTime(ms);
    });
    return this;
  }

  /** Run all pending timers to completion */
  flushTimers(): this {
    act(() => {
      vi.runAllTimers();
    });
    return this;
  }

  /** Dismiss current dialogue (interact clears it if dialogue is active) */
  dismissDialogue(): this {
    if (this.dialogue) {
      this.interact();
    }
    return this;
  }

  /** Pick "Sí" on the active confirm prompt (no-op if none is open). */
  confirmYes(): this {
    const c = useGameStore.getState().confirm;
    if (!c) return this;
    act(() => {
      useGameStore.getState().setConfirm(null);
      c.onYes();
    });
    return this;
  }

  /** Pick "No" on the active confirm prompt (no-op if none is open). */
  confirmNo(): this {
    const c = useGameStore.getState().confirm;
    if (!c) return this;
    act(() => {
      useGameStore.getState().setConfirm(null);
      c.onNo();
    });
    return this;
  }

  /**
   * Skip the BATTLE_TRANSITION animation (which requires DOM).
   * In the real game, BattleTransition's onAnimationComplete fires
   * setPhase(battle(B_CHOOSING)). We simulate that here.
   */
  skipBattleTransition(): this {
    if (this.phase.type === 'BATTLE_TRANSITION') {
      act(() => {
        useGameStore.getState().setPhase(battle(B_CHOOSING));
      });
    }
    return this;
  }

  // ── Log replay ───────────────────────────────────────────────────────────

  /**
   * Install a seeded mulberry32 PRNG as Math.random. Used by loadLogAsScenario
   * so logs recorded in-game replay deterministically in tests.
   */
  seedPrng(seed: number): this {
    let state = seed | 0;
    Math.random = () => {
      state = (state + 0x6d2b79f5) | 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return this;
  }

  /**
   * Replay a recorded event log through the simulator. Restores the snapshot,
   * seeds the PRNG, and dispatches each event with a tick in between.
   *
   * Only supports `move`, `action`, and `battle` event types — `item` and
   * `pcSwap` require hooks not wired into the headless useGameLoop.
   */
  loadLogAsScenario(log: RecLog, opts: { tickBetween?: number } = {}): this {
    const tickMs = opts.tickBetween ?? 200;
    act(() => {
      useGameStore.setState(structuredClone(log.snapshot) as never);
    });
    this.seedPrng(log.seed);
    this.tick(100);
    for (const e of log.events) {
      switch (e.k) {
        case 'move': this.move(e.dir); break;
        case 'action': this.interact(); break;
        case 'battle': this.battleAction(e.action); break;
        // item/pcSwap intentionally skipped (not in useGameLoop surface)
      }
      this.tick(tickMs);
    }
    return this;
  }

  // ── Random control ───────────────────────────────────────────────────────

  /** Queue specific random values. Values are consumed in order. */
  setRandomSequence(values: number[]): this {
    this.randomValues = values;
    this.randomIndex = 0;
    return this;
  }

  /** Set a single next random value (convenience wrapper) */
  setNextRandom(value: number): this {
    this.randomValues = [value];
    this.randomIndex = 0;
    return this;
  }

  // ── State queries ────────────────────────────────────────────────────────

  get state() { return useGameStore.getState(); }
  get phase(): GamePhase { return this.state.phase; }
  get map(): MapID { return this.state.currentMap; }
  get pos(): Position { return this.state.playerPos; }
  get direction(): Direction { return this.state.direction; }
  get team(): Pokemon[] { return this.state.playerTeam; }
  get dialogue(): string | null { return this.state.dialogue; }
  get confirm() { return this.state.confirm; }
  get storyStep(): string { return this.state.storyStep; }
  get inventory(): InventoryCounts { return this.state.inventory; }
  get badges(): string[] { return this.state.badges; }
  get hasPokedex(): boolean { return this.state.hasPokedex; }
  get hasParcel(): boolean { return this.state.hasParcel; }
  get money(): number { return this.state.money; }
  get enemyPokemon() { return this.state.enemyPokemon; }
  get battleLog() { return this.state.battleLog; }
  get battleState() { return this.hookResult.result.current.battleStateRef.current; }

  /** Get all logged events of a given type */
  eventsOfType(type: SimEvent['type']): SimEvent[] {
    return this.log.filter(e => e.type === type);
  }

  /** Check if any dialogue contained a substring */
  dialogueContains(substring: string): boolean {
    return this.log
      .filter(e => e.type === 'dialogue')
      .some(e => (e.value as string).includes(substring));
  }

  /**
   * Throws if any world integrity issue is present (warps, NPCs, items, encounters).
   * Safe to call after warps or state transitions to catch drift mid-scenario.
   */
  assertWorldIntact(): this {
    const issues = validateWorld();
    if (issues.length > 0) {
      throw new Error(`World integrity failed:\n${issues.map(i => `  [${i.category}] ${i.message}`).join('\n')}`);
    }
    return this;
  }

  /** Get all phase transitions as an array of phase type strings */
  phaseHistory(): string[] {
    return this.log
      .filter(e => e.type === 'phase')
      .map(e => {
        const phase = e.value as GamePhase;
        if (phase.type === 'BATTLE') return `BATTLE:${phase.sub.type}`;
        return phase.type;
      });
  }
}

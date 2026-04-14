/**
 * scenarios.test.ts — 10 integration scenarios exercising the game loop headlessly.
 *
 * Each scenario creates a GameSimulator, sets up state, executes commands,
 * and asserts expected outcomes. Runs deterministically via fake timers
 * and seeded Math.random.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { GameSimulator } from './GameSimulator';
import { useGameStore } from '../../store/gameStore';
import { STARTERS, makePokemon, MOVES } from '../../constants';

// ─── Mock sound manager (no audio in tests) ────────────────────────────────

vi.mock('../../lib/sounds', () => ({
  soundManager: { play: vi.fn(), playMove: vi.fn(), playMusic: vi.fn(), stop: vi.fn() },
}));

// ─── Helper: a wounded starter for healing tests ────────────────────────────

function woundedStarter() {
  const s = { ...STARTERS[0] };
  return {
    ...s,
    hp: 1,
    moves: s.moves.map(m => ({ ...m, pp: 0 })),
    status: 'poison' as const,
  };
}

function strongStarter() {
  return makePokemon('charmander', 'CHARMANDER', 50, 'fire', [MOVES.EMBER, MOVES.SCRATCH], 4);
}

// ─── Shared teardown ────────────────────────────────────────────────────────

let sim: GameSimulator;

afterEach(() => {
  sim?.destroy();
});

// ─── Scenario 1: Oak stops player from leaving Pallet Town ─────────────────

describe('Scenario 1: Oak stops player at Route 1', () => {
  it('walks player to Oak lab after dismissing Oak\'s dialogue', () => {
    sim = new GameSimulator().init({
      currentMap: 'PALLET_TOWN',
      playerPos: { x: 10, y: 6 },
      direction: 'up',
      playerTeam: [],
    });

    // Move north toward Route 1 (y=5 triggers Oak's stop event)
    sim.move('up');

    // Oak's dialogue should be shown immediately
    expect(sim.dialogueContains('OAK')).toBe(true);
    expect(sim.map).toBe('PALLET_TOWN'); // still in Pallet until dialogue dismissed

    // Simulate dismissing the dialogue — fires the dialogueCallback
    const cb = useGameStore.getState().dialogueCallback;
    if (cb) { cb(); }

    // Advance timers through the full walk path (~20 steps * 200ms = 4000ms)
    sim.tick(5000);

    // Should now be in Oak's Lab
    expect(sim.map).toBe('OAKS_LAB');
    expect(sim.storyStep).toBe('OAK_STOPPED');
  });

  it('does not retrigger when player already has a team', () => {
    sim = new GameSimulator().init({
      currentMap: 'PALLET_TOWN',
      playerPos: { x: 10, y: 6 },
      direction: 'up',
      playerTeam: [STARTERS[0]],
      storyStep: 'EXPLORING',
    });

    sim.move('up');

    // Player should NOT be sent to Oak's Lab
    expect(sim.map).toBe('PALLET_TOWN');
  });
});

// ─── Scenario 1b: Oak's Lab is locked before meeting Oak ────────────────────

describe('Scenario 1b: Oak\'s Lab locked at START', () => {
  it('blocks entry to Oak\'s Lab and shows locked message', () => {
    sim = new GameSimulator().init({
      currentMap: 'PALLET_TOWN',
      // Stand one tile above the lab door at (10, 14)
      playerPos: { x: 10, y: 15 },
      direction: 'up',
      playerTeam: [],
      storyStep: 'START',
    });

    // Try to walk onto the lab door tile (10, 14) — should be blocked by lab_locked object
    sim.move('up');
    sim.tick(500);

    // Player should NOT have moved (still at y=15)
    expect(sim.pos).toEqual({ x: 10, y: 15 });
    expect(sim.map).toBe('PALLET_TOWN');

    // Interact with the blocking sign
    sim.interact();

    expect(sim.dialogue).toBeTruthy();
    expect(sim.dialogueContains('cerrado')).toBe(true);
  });
});

// ─── Scenario 2: Pick starter Pokémon in Oak's Lab ─────────────────────────

describe('Scenario 2: Pick starter in Oak\'s Lab', () => {
  it('adds the chosen starter to the team', () => {
    sim = new GameSimulator().init({
      currentMap: 'OAKS_LAB',
      // Stand one tile south of the first starter at (9, 8)
      playerPos: { x: 9, y: 9 },
      direction: 'up',
      playerTeam: [],
      storyStep: 'OAK_STOPPED',
    });

    // Interact with the starter item (facing up toward y=8)
    sim.interact();

    expect(sim.team).toHaveLength(1);
    expect(sim.team[0].id).toBe(STARTERS[0].id);
    expect(sim.storyStep).toBe('PICKED_STARTER');
    expect(sim.dialogueContains(STARTERS[0].name)).toBe(true);
  });
});

// ─── Scenario 3: Rival battle triggers after picking starter ────────────────

describe('Scenario 3: Rival battle after starter pick', () => {
  it('transitions to battle after picking a starter', () => {
    sim = new GameSimulator().init({
      currentMap: 'OAKS_LAB',
      playerPos: { x: 9, y: 9 },
      direction: 'up',
      playerTeam: [],
      storyStep: 'OAK_STOPPED',
    });

    sim.interact();

    // Dismiss the "Has elegido a..." dialogue
    sim.dismissDialogue();

    // Advance past the 1500ms delay (scaled by game speed)
    sim.tick(2000);

    // Should have transitioned to BATTLE_TRANSITION
    const phases = sim.phaseHistory();
    expect(phases).toContain('BATTLE_TRANSITION');
    expect(sim.dialogueContains('AZUL')).toBe(true);
  });
});

// ─── Scenario 4: Win rival battle → return to EXPLORING ─────────────────────

describe('Scenario 4: Win rival battle', () => {
  it('returns to EXPLORING with storyStep RIVAL_BATTLE after winning', () => {
    // Start with a strong Pokémon so we win quickly
    sim = new GameSimulator().init({
      currentMap: 'OAKS_LAB',
      playerPos: { x: 9, y: 9 },
      direction: 'up',
      playerTeam: [],
      storyStep: 'OAK_STOPPED',
    });

    // Pick starter
    sim.interact();
    sim.dismissDialogue();
    sim.tick(2000);

    // Skip the animation-based BATTLE_TRANSITION → BATTLE(CHOOSING)
    sim.skipBattleTransition();

    // Now manually override team to be very strong so we win the battle easily
    useGameStore.getState().setPlayerTeam([strongStarter()]);

    // The battle state ref also needs updating
    if (sim.battleState) {
      sim.battleState.playerTeam = [strongStarter()];
    }

    // Wait for battle phase to settle
    sim.tick(5000);

    // Keep attacking until we win (max 20 turns to be safe)
    for (let i = 0; i < 20; i++) {
      if (sim.phase.type !== 'BATTLE') break;
      if (sim.battleState?.outcome !== 'ongoing') break;

      const firstAliveMove = sim.battleState?.playerTeam?.[0]?.moves?.[0];
      if (firstAliveMove && sim.battleState?.phase === 'CHOOSING') {
        sim.battleAction({ type: 'ATTACK', move: firstAliveMove });
      }
      sim.tick(5000);
    }

    // Wait for post-battle resolution
    sim.tick(10000);

    expect(sim.phase.type).toBe('EXPLORING');
    expect(sim.storyStep).toBe('RIVAL_BATTLE');
    expect(sim.dialogueContains('AZUL')).toBe(true);
  });
});

// ─── Scenario 5: Mom healing with no Pokémon ────────────────────────────────

describe('Scenario 5: Mom with no Pokémon', () => {
  it('shows dialogue but does NOT trigger healing phase', () => {
    sim = new GameSimulator().init({
      currentMap: 'PLAYERS_HOUSE_1F',
      // Mom is at (10, 8); stand one tile south
      playerPos: { x: 10, y: 9 },
      direction: 'up',
      playerTeam: [],
    });

    sim.interact();

    expect(sim.dialogue).toBeTruthy();
    expect(sim.dialogueContains('MAMÁ')).toBe(true);

    // Advance time and check no HEALING phase was triggered
    sim.tick(5000);
    const phases = sim.phaseHistory();
    expect(phases).not.toContain('HEALING');
  });
});

// ─── Scenario 6: Mom healing with Pokémon ───────────────────────────────────

describe('Scenario 6: Mom heals team', () => {
  it('heals wounded team through HEALING phase', () => {
    const wounded = woundedStarter();
    sim = new GameSimulator().init({
      currentMap: 'PLAYERS_HOUSE_1F',
      playerPos: { x: 10, y: 9 },
      direction: 'up',
      playerTeam: [wounded],
    });

    sim.interact();

    // Advance through all healing timers (1500 + 800 + 1600 = 3900ms, scaled)
    sim.tick(5000);

    const phases = sim.phaseHistory();
    expect(phases).toContain('HEALING');
    expect(phases).toContain('EXPLORING');

    // Team should be healed
    expect(sim.team[0].hp).toBe(sim.team[0].maxHp);
    expect(sim.team[0].status).toBe('none');
    expect(sim.team[0].moves[0].pp).toBe(sim.team[0].moves[0].maxPp);
  });
});

// ─── Scenario 7: Wild encounter on Route 1 ─────────────────────────────────

describe('Scenario 7: Wild encounter on Route 1', () => {
  it('triggers battle when stepping on grass with low random', () => {
    const starter = { ...STARTERS[1] }; // Charmander
    sim = new GameSimulator().init({
      currentMap: 'ROUTE_1',
      // Position on path next to grass. Grass tiles are at x=5..8 and x=12..15
      playerPos: { x: 9, y: 10 },
      direction: 'left',
      playerTeam: [starter],
      storyStep: 'EXPLORING',
    });

    // Seed random: Per §4 of formulas.md, R = floor(random*256), encounter fires if R < EncounterRate.
    // Route 1 EncounterRate = 25. With random=0.05, R = floor(0.05*256) = 12 < 25 → encounter.
    sim.setRandomSequence([0.05, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);

    // Move left onto a grass tile (x=8 should be grass based on the map)
    sim.move('left');
    sim.tick(1000);

    const phases = sim.phaseHistory();
    expect(phases).toContain('BATTLE_TRANSITION');
    expect(sim.enemyPokemon).toBeTruthy();
  });
});

// ─── Scenario 8: Pokémart parcel pickup ─────────────────────────────────────

describe('Scenario 8: Pokémart parcel pickup', () => {
  it('gives OAK_PARCEL on first visit', () => {
    sim = new GameSimulator().init({
      currentMap: 'POKEMART',
      // Shop NPC at (7, 7); stand below
      playerPos: { x: 7, y: 8 },
      direction: 'up',
      playerTeam: [STARTERS[0]],
      hasParcel: false,
      hasPokedex: false,
      storyStep: 'RIVAL_BATTLE',
    });

    sim.interact();

    expect(sim.hasParcel).toBe(true);
    expect(sim.inventory['OAK_PARCEL']).toBeGreaterThanOrEqual(1);
    expect(sim.dialogueContains('paquete')).toBe(true);
  });
});

// ─── Scenario 9: Deliver parcel → get Pokédex ──────────────────────────────

describe('Scenario 9: Deliver parcel to Oak → Pokédex', () => {
  it('removes parcel and grants Pokédex', () => {
    sim = new GameSimulator().init({
      currentMap: 'OAKS_LAB',
      // Oak NPC at (10, 7); stand below
      playerPos: { x: 10, y: 8 },
      direction: 'up',
      playerTeam: [STARTERS[0]],
      hasParcel: true,
      hasPokedex: false,
      inventory: { OAK_PARCEL: 1, POTION: 1, POKEBALL: 1 },
      storyStep: 'RIVAL_BATTLE',
    });

    sim.interact();

    expect(sim.hasParcel).toBe(false);
    expect(sim.hasPokedex).toBe(true);
    expect(sim.inventory['OAK_PARCEL']).toBeUndefined();
    expect(sim.dialogueContains('POKÉDEX')).toBe(true);
  });
});

// ─── Scenario 10: Cannot use Pokéball in trainer battle ─────────────────────

describe('Scenario 10: Pokéball blocked in trainer battle', () => {
  it('rejects Pokéball, keeps inventory, stays in CHOOSING', () => {
    sim = new GameSimulator().init({
      currentMap: 'OAKS_LAB',
      playerPos: { x: 9, y: 9 },
      direction: 'up',
      playerTeam: [],
      storyStep: 'OAK_STOPPED',
      inventory: { POTION: 1, POKEBALL: 5 },
    });

    // Pick starter → rival battle triggers
    sim.interact();
    sim.dismissDialogue();
    sim.tick(2000);
    sim.skipBattleTransition();

    expect(sim.phase.type).toBe('BATTLE');
    expect(sim.battleState?.isTrainerBattle).toBe(true);

    // Try to throw a Pokéball
    sim.battleAction({ type: 'CATCH' });
    sim.tick(1000);

    // Should show rejection message in battle log
    expect(sim.battleLog).toContain('No puedes usar eso');

    // Pokéball count should NOT have decreased
    expect(sim.inventory['POKEBALL']).toBe(5);

    // Should still be in CHOOSING (not ENEMY_ATTACK — no turn lost)
    expect(sim.battleState?.phase).toBe('CHOOSING');
  });
});

// ─── Scenario 11: Pokécenter healing ────────────────────────────────────────

describe('Scenario 11: Pokécenter healing', () => {
  it('heals the team through HEALING → EXPLORING', () => {
    const wounded = woundedStarter();
    sim = new GameSimulator().init({
      currentMap: 'POKECENTER',
      // Nurse Joy at (10, 7); stand below
      playerPos: { x: 10, y: 8 },
      direction: 'up',
      playerTeam: [wounded],
      storyStep: 'EXPLORING',
    });

    sim.interact();

    // Advance through healing timers
    sim.tick(5000);

    const phases = sim.phaseHistory();
    expect(phases).toContain('HEALING');
    expect(phases).toContain('EXPLORING');

    // Team should be fully healed
    expect(sim.team[0].hp).toBe(sim.team[0].maxHp);
    expect(sim.team[0].status).toBe('none');
    expect(sim.team[0].moves[0].pp).toBe(sim.team[0].moves[0].maxPp);

    // lastHealLocation should be set to POKECENTER
    expect(sim.state.lastHealLocation.map).toBe('POKECENTER');
  });
});

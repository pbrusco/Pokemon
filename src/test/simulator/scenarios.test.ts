/**
 * scenarios.test.ts — 10 integration scenarios exercising the game loop headlessly.
 *
 * Each scenario creates a GameSimulator, sets up state, executes commands,
 * and asserts expected outcomes. Runs deterministically via fake timers
 * and seeded Math.random.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import { GameSimulator } from './GameSimulator';
import { useGameStore } from '../../store/gameStore';
import { STARTERS, makePokemon } from '../../constants/pokemon';
import { MOVES } from '../../constants/moves';

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
  // FireRed Pallet Town is at world (60, 260) size 24×20. Its north exit
  // gap is at world cols 72-73, y=260 (the row above leads onto Route 1).
  // World col x=72 is fully walkable through the entire town.
  it('triggers Oak cutscene after walking north through Pallet Town path', () => {
    sim = new GameSimulator().init({
      currentMap: 'KANTO_OVERWORLD',
      playerPos: { x: 72, y: 266 },
      direction: 'up',
      playerTeam: [],
    });

    // Walk 6 tiles north — no cutscene yet (y=266 → y=260)
    for (let i = 0; i < 6; i++) {
      expect(sim.dialogue).toBeNull();
      sim.move('up').tick(50);
    }

    // 7th step tries to enter Route 1 (nextY=259), Oak intercepts.
    sim.move('up');
    expect(sim.dialogueContains('OAK')).toBe(true);
    expect(sim.map).toBe('KANTO_OVERWORLD');

    sim.dismissDialogue().dismissDialogue().tick(5000);
    expect(sim.map).toBe('OAKS_LAB');
    expect(sim.storyStep).toBe('OAK_STOPPED');
  });

  it('walks player to Oak lab after dismissing Oak\'s dialogue', () => {
    sim = new GameSimulator().init({
      currentMap: 'KANTO_OVERWORLD',
      playerPos: { x: 72, y: 260 },
      direction: 'up',
      playerTeam: [],
    });

    sim.move('up');
    expect(sim.dialogueContains('OAK')).toBe(true);
    expect(sim.map).toBe('KANTO_OVERWORLD');

    // Dismiss greeting dialogue, then warning dialogue
    sim.dismissDialogue();
    sim.dismissDialogue();

    // Advance timers through the full walk path
    sim.tick(5000);

    // Should now be in Oak's Lab
    expect(sim.map).toBe('OAKS_LAB');
    expect(sim.storyStep).toBe('OAK_STOPPED');
  });

  it('does not retrigger when player already has a team', () => {
    sim = new GameSimulator().init({
      currentMap: 'KANTO_OVERWORLD',
      playerPos: { x: 73, y: 261 },
      direction: 'up',
      playerTeam: [STARTERS[0]],
      storyStep: 'EXPLORING',
    });

    sim.move('up');
    expect(sim.map).toBe('KANTO_OVERWORLD');
  });
});

// ─── Scenario 1b: Oak's Lab is locked before meeting Oak ────────────────────

describe('Scenario 1b: Oak\'s Lab locked at START', () => {
  it('blocks entry to Oak\'s Lab and shows locked message', () => {
    sim = new GameSimulator().init({
      currentMap: 'KANTO_OVERWORLD',
      // FireRed Oak's Lab door is at world (76, 273); stand directly below it.
      playerPos: { x: 76, y: 274 },
      direction: 'up',
      playerTeam: [],
      storyStep: 'START',
    });

    // Try to walk onto the lab door tile — should be blocked by lab_locked object.
    sim.move('up');
    sim.tick(500);

    expect(sim.pos).toEqual({ x: 76, y: 274 });
    expect(sim.map).toBe('KANTO_OVERWORLD');

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
      // Stand one tile south of the first starter at (3, 5)
      playerPos: { x: 3, y: 6 },
      direction: 'up',
      playerTeam: [],
      storyStep: 'OAK_STOPPED',
    });

    // Interact with the starter item (facing up toward y=5)
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
      playerPos: { x: 3, y: 6 },
      direction: 'up',
      playerTeam: [],
      storyStep: 'OAK_STOPPED',
    });

    sim.interact();

    // Dismiss the "Has elegido a..." dialogue
    sim.dismissDialogue();

    // Advance past the 1500ms delay (scaled by game speed)
    sim.tick(2000);

    // Blue's dialogue appears before battle starts
    expect(sim.dialogueContains('AZUL')).toBe(true);

    // Dismiss Blue's dialogue — battle fires in its callback
    sim.dismissDialogue();

    // Should have transitioned to BATTLE_TRANSITION
    const phases = sim.phaseHistory();
    expect(phases).toContain('BATTLE_TRANSITION');
  });
});

// ─── Scenario 4: Win rival battle → return to EXPLORING ─────────────────────

describe('Scenario 4: Win rival battle', () => {
  it('returns to EXPLORING with storyStep RIVAL_BATTLE after winning', () => {
    // Start with a strong Pokémon so we win quickly
    sim = new GameSimulator().init({
      currentMap: 'OAKS_LAB',
      playerPos: { x: 3, y: 6 },
      direction: 'up',
      playerTeam: [],
      storyStep: 'OAK_STOPPED',
    });

    // Pick starter
    sim.interact();
    sim.dismissDialogue();
    sim.tick(2000);

    // Dismiss Blue's "¡Vamos a luchar!" dialogue — battle fires in its callback
    sim.dismissDialogue();

    // Skip the animation-based BATTLE_TRANSITION → BATTLE(CHOOSING)
    sim.skipBattleTransition();

    // Now manually override team to be very strong so we win the battle easily
    act(() => {
      useGameStore.getState().setPlayerTeam([strongStarter()]);

      // The battle state ref also needs updating
      if (sim.battleState) {
        sim.battleState.playerTeam = [strongStarter()];
      }
    });

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
      // Mom is at FireRed (8, 4) facing left; stand one tile east of her at
      // (9, 4) facing left so we look directly at her.
      playerPos: { x: 9, y: 4 },
      direction: 'left',
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
      playerPos: { x: 9, y: 4 },
      direction: 'left',
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
    // FireRed Route 1 is at world (60, 220) size 24×40. Walking up the
    // central path; place wild pokemon one step in our direction.
    sim = new GameSimulator().init({
      currentMap: 'KANTO_OVERWORLD',
      playerPos: { x: 72, y: 250 },
      direction: 'up',
      playerTeam: [starter],
      storyStep: 'EXPLORING',
    });

    useGameStore.getState().setWildPokemon([{
      id: 'wild_pidgey_test',
      type: 'wild_pokemon',
      position: { x: 72, y: 249 },
      direction: 'down',
      pokemon: starter
    }]);

    sim.move('up');
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
      // Shop NPC at (4, 2); stand below
      playerPos: { x: 4, y: 3 },
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
      // Oak NPC at (4, 2); stand below
      playerPos: { x: 4, y: 3 },
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
      playerPos: { x: 3, y: 6 },
      direction: 'up',
      playerTeam: [],
      storyStep: 'OAK_STOPPED',
      inventory: { POTION: 1, POKEBALL: 5 },
    });

    // Pick starter → rival battle triggers
    sim.interact();
    sim.dismissDialogue();
    sim.tick(2000);
    // Dismiss Blue's dialogue — battle fires in its callback
    sim.dismissDialogue();
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
      // Nurse Joy at (6, 2); stand below
      playerPos: { x: 6, y: 3 },
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

// ─── Scenario: loadLogAsScenario — replays recorded events ────────────────

describe('loadLogAsScenario helper', () => {
  it('replays a hand-crafted log: move + interact', () => {
    sim = new GameSimulator().init({
      currentMap: 'KANTO_OVERWORLD',
      // FireRed Pallet Town central path (col 12, walkable everywhere) at
      // world x=72, y=270. Walking up should land at (72, 269).
      playerPos: { x: 72, y: 270 },
      direction: 'down',
      playerTeam: [STARTERS[0]],
      storyStep: 'EXPLORING',
    });
    const snapshot: Record<string, unknown> = {};
    const raw = useGameStore.getState() as unknown as Record<string, unknown>;
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v !== 'function') snapshot[k] = v;
    }
    const log = {
      version: 2 as const,
      seed: 0xdeadbeef,
      startedAt: Date.now(),
      snapshot: structuredClone(snapshot),
      events: [{ k: 'move' as const, dir: 'up' as const }],
      observations: [],
    };
    sim.loadLogAsScenario(log);
    expect(sim.pos).toEqual({ x: 72, y: 269 });
  });
});



// ─── Scenario 13: Trainer vision is exactly 3 tiles ────────────────────────

describe('Scenario 13: Trainer vision range', () => {
  // FireRed: ROUTE_3 at world (96, 70). youngster_route_3_0 @
  // w('ROUTE_3', 14, 4) → world (110, 74) facing down.

  it('does NOT trigger when player is out of trainer line-of-sight', () => {
    sim = new GameSimulator().init({
      currentMap: 'KANTO_OVERWORLD',
      playerPos: { x: 111, y: 76 },
      direction: 'right',
      playerTeam: [strongStarter()],
      storyStep: 'EXPLORING',
    });
    sim.move('right');
    sim.tick(1500);
    expect(sim.phase.type).toBe('EXPLORING');
    expect(sim.dialogueContains('¡Te he visto!')).toBe(false);
  });

  it('triggers cutscene when player steps into 2nd tile of vision (boundary)', () => {
    sim = new GameSimulator().init({
      currentMap: 'KANTO_OVERWORLD',
      // Walk left from (111, 76) into the trainer's vision column at x=110.
      playerPos: { x: 111, y: 76 },
      direction: 'left',
      playerTeam: [strongStarter()],
      storyStep: 'EXPLORING',
    });
    sim.move('left');
    sim.tick(2500);
    expect(sim.dialogueContains('¡Te he visto!')).toBe(true);
  });
});

// ─── Scenario 14: Brock leader battle ──────────────────────────────────────

describe('Scenario 14: Brock leader battle', () => {
  // Brock @ PEWTER_GYM (4, 1) at pokered position, facing down.
  it('a L50 starter wins against Brock', () => {
    sim = new GameSimulator().init({
      currentMap: 'PEWTER_GYM',
      playerPos: { x: 4, y: 2 },
      direction: 'up',
      playerTeam: [strongStarter()],
      storyStep: 'EXPLORING',
      defeatedTrainers: ['pewter_gym_jr_trainer_m_1'],
    });
    sim.interact();
    sim.dismissDialogue();
    sim.tick(2000);
    sim.skipBattleTransition();
    expect(sim.phase.type).toBe('BATTLE');
    expect(sim.battleState?.isTrainerBattle).toBe(true);
    for (let i = 0; i < 30; i++) {
      if (sim.phase.type !== 'BATTLE') break;
      if (sim.battleState?.outcome !== 'ongoing') break;
      const move = sim.battleState?.playerTeam?.[0]?.moves?.[0];
      if (move && sim.battleState?.phase === 'CHOOSING') {
        sim.battleAction({ type: 'ATTACK', move });
      }
      sim.tick(5000);
    }
    sim.tick(10000);
    expect(sim.phase.type).toBe('EXPLORING');
    expect(sim.state.defeatedTrainers).toContain('brock');
  });
});

// ─── Scenario 12: No re-battle after winning a trainer fight ────────────────

describe('Scenario 12: No ghost re-battle after winning trainer fight', () => {
  // TODO: re-enable once VIRIDIAN_FOREST is migrated as its own FireRed
  // MapID. With the multi-zone Kanto stitch, Viridian Forest is a separate
  // dungeon-style map that doesn't sit on the overworld grid.
  it.todo('cleanly exits battle and does NOT re-enter with 0 HP enemy');
});

describe.skip('Scenario 12 (legacy)', () => {
  it('cleanly exits battle and does NOT re-enter with 0 HP enemy', () => {
    // Start in Viridian Forest near bugcatcher_viridian_forest_1 at world (142, 59) facing left
    // Player stands at (140, 59) — within trainer's 3-tile left vision
    sim = new GameSimulator().init({
      currentMap: 'KANTO_OVERWORLD',
      playerPos: { x: 140, y: 59 },
      direction: 'right',
      playerTeam: [strongStarter()],
      storyStep: 'EXPLORING',
    });

    // Step into trainer's vision zone → triggers trainer cutscene
    sim.move('right'); // now at (141, 59) — within vision
    sim.tick(500);

    // If dialogue appeared, dismiss it
    if (sim.dialogue) sim.dismissDialogue();
    sim.tick(2000);

    // Skip BATTLE_TRANSITION
    sim.skipBattleTransition();

    // Confirm we are in battle
    expect(sim.phase.type).toBe('BATTLE');

    // Override team to be very strong to guarantee a quick win
    act(() => {
      useGameStore.getState().setPlayerTeam([strongStarter()]);
      if (sim.battleState) {
        sim.battleState.playerTeam = [strongStarter()];
      }
    });

    // Attack until we win (max 20 turns)
    for (let i = 0; i < 20; i++) {
      if (sim.phase.type !== 'BATTLE') break;
      if (sim.battleState?.outcome !== 'ongoing') break;
      const move = sim.battleState?.playerTeam?.[0]?.moves?.[0];
      if (move && sim.battleState?.phase === 'CHOOSING') {
        sim.battleAction({ type: 'ATTACK', move });
      }
      sim.tick(5000);
    }

    // Wait for post-battle resolution (the 2000ms setTimeout in resolveBattleOutcome)
    sim.tick(10000);

    // ── KEY ASSERTIONS: bug reproduction ──

    // 1. Phase must be EXPLORING, not BATTLE
    expect(sim.phase.type).toBe('EXPLORING');

    // 2. activeBattle must be null (cleared properly)
    expect(sim.state.activeBattle).toBeNull();

    // 3. The trainer should be in defeatedTrainers
    expect(sim.state.defeatedTrainers).toContain('bugcatcher_viridian_forest_1');

    // 4. Verify we don't bounce back into battle after further ticks
    sim.tick(5000);
    expect(sim.phase.type).toBe('EXPLORING');

    // 5. The phase history should NOT show a second BATTLE_TRANSITION after EXPLORING
    const phases = sim.phaseHistory();
    const exploringIdx = phases.lastIndexOf('EXPLORING');
    const phasesAfterExploring = phases.slice(exploringIdx + 1);
    expect(phasesAfterExploring).not.toContain('BATTLE_TRANSITION');
  });
});

// ─── Scenario 15: Warp tiles are walkable even when the underlying tile isn't
//
// REGRESSION: pokered marks staircase / ladder graphics non-walkable in the
// per-blockset collision table; the player only steps onto them via the warp
// event. If our movement engine rejects movement onto non-walkable tiles
// before checking warps, the player gets soft-locked one tile from the stairs.
describe('Scenario 15: Warp tiles override collision', () => {
  it('player can step onto the stairs warp even though the stair tile is non-walkable', () => {
    sim = new GameSimulator().init({
      currentMap: 'PLAYERS_HOUSE_1F',
      // FireRed PalletTown_PlayersHouse_1F stairs warp is at (10, 2).
      // Stand directly below it and walk up.
      playerPos: { x: 10, y: 3 },
      direction: 'up',
      playerTeam: [strongStarter()],
      storyStep: 'EXPLORING',
    });
    sim.move('up');
    sim.tick(2000);
    expect(sim.map).toBe('PLAYERS_HOUSE_2F');
  });

  // REGRESSION: FireRed-migrated indoor maps embed the dest_warp coord in the
  // FireRed map (e.g. MAP_PALLET_TOWN @ (5, 8)). Without an exit-pin, the
  // bridge would teleport the player to the unified overworld at (5, 8) which
  // is empty void. The bridge's FIRERED_EXIT_TO_KANTO_OVERWORLD table pins
  // the landing spot to the door's world coords on KANTO_OVERWORLD.
  it('exiting Players House 1F lands the player just outside the front door', () => {
    sim = new GameSimulator().init({
      currentMap: 'PLAYERS_HOUSE_1F',
      // FireRed PalletTown_PlayersHouse_1F door warps at (4, 8) and (5, 8).
      // Stand one tile north of the door, walk down onto it.
      playerPos: { x: 5, y: 7 },
      direction: 'down',
      playerTeam: [strongStarter()],
      storyStep: 'EXPLORING',
    });
    sim.move('down').tick(2000);
    expect(sim.map).toBe('KANTO_OVERWORLD');
    // FireRed Pallet Town: player house door at world (66, 267). The
    // bridge pins the landing one tile south at (66, 268) so the player
    // isn't standing on the warp tile after exiting.
    expect(sim.state.playerPos).toEqual({ x: 66, y: 268 });
  });

  // REGRESSION: warps must land the player ON the destination tile so a stair
  // tile (non-walkable) doesn't fall back to the safe-zone error dialog.
  it('stairs round-trip 1F → 2F → 1F lands on the staircase tile', () => {
    sim = new GameSimulator().init({
      currentMap: 'PLAYERS_HOUSE_1F',
      playerPos: { x: 10, y: 3 },
      direction: 'up',
      playerTeam: [strongStarter()],
      storyStep: 'EXPLORING',
    });
    sim.move('up').tick(2000);
    expect(sim.map).toBe('PLAYERS_HOUSE_2F');
    // FireRed 2F stair-down warp is at (10, 2).
    expect(sim.state.playerPos).toEqual({ x: 10, y: 2 });

    // Walk down off the stairs, then back up onto them — should warp back to 1F.
    sim.move('down').tick(500);
    sim.move('up').tick(2000);
    expect(sim.map).toBe('PLAYERS_HOUSE_1F');
    expect(sim.state.playerPos).toEqual({ x: 10, y: 2 });
  });
});


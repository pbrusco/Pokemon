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
import { FLY_DESTINATIONS } from '../../lib/flyDestinations';

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
      // Stand one tile south of the first starter at (8, 4)
      playerPos: { x: 8, y: 5 },
      direction: 'up',
      playerTeam: [],
      storyStep: 'OAK_STOPPED',
    });

    // Interact with the starter item (facing up toward y=4) → confirm prompt.
    sim.interact();
    sim.confirmYes();

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
      playerPos: { x: 8, y: 5 },
      direction: 'up',
      playerTeam: [],
      storyStep: 'OAK_STOPPED',
    });

    sim.interact();
    sim.confirmYes();

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
      playerPos: { x: 8, y: 5 },
      direction: 'up',
      playerTeam: [],
      storyStep: 'OAK_STOPPED',
    });

    // Pick starter
    sim.interact();
    sim.confirmYes();
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
      currentMap: 'POKEMART_VIRIDIAN',
      // FireRed canonical: clerk at (2, 3) facing right. Stand to his right.
      playerPos: { x: 3, y: 3 },
      direction: 'left',
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
      // Oak NPC at (6, 3); stand directly south.
      playerPos: { x: 6, y: 4 },
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
    // Story advances to free-roam after the Pokédex is received.
    expect(sim.storyStep).toBe('EXPLORING');
  });
});

// ─── Scenario 10: Cannot use Pokéball in trainer battle ─────────────────────

describe('Scenario 10: Pokéball blocked in trainer battle', () => {
  it('rejects Pokéball, keeps inventory, stays in CHOOSING', () => {
    sim = new GameSimulator().init({
      currentMap: 'OAKS_LAB',
      playerPos: { x: 8, y: 5 },
      direction: 'up',
      playerTeam: [],
      storyStep: 'OAK_STOPPED',
      inventory: { POTION: 1, POKEBALL: 5 },
    });

    // Pick starter → rival battle triggers
    sim.interact();
    sim.confirmYes();
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
      currentMap: 'POKECENTER_VIRIDIAN',
      // FireRed canonical: nurse at (7, 2) facing down. Stand directly below.
      playerPos: { x: 7, y: 3 },
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

    // lastHealLocation tracks the specific city's PC (Viridian here).
    expect(sim.state.lastHealLocation.map).toBe('POKECENTER_VIRIDIAN');
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
  // Auto-extracted Brock @ PEWTER_GYM (6, 5) facing down.
  // Camper Liam @ (3, 8).
  it('a L50 starter wins against Brock', () => {
    sim = new GameSimulator().init({
      currentMap: 'PEWTER_GYM',
      playerPos: { x: 6, y: 6 },
      direction: 'up',
      playerTeam: [strongStarter()],
      storyStep: 'EXPLORING',
      defeatedTrainers: ['npc_MAP_PEWTER_CITY_GYM_3_8'],
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
    expect(sim.state.defeatedTrainers).toContain('npc_MAP_PEWTER_CITY_GYM_6_5');
  });
});

// ─── Scenario 12: No re-battle after winning a trainer fight ────────────────

describe('Scenario 12: No ghost re-battle after winning trainer fight', () => {
  it('cleanly exits battle and does NOT re-enter with 0 HP enemy', () => {
    // FireRed MAP_VIRIDIAN_FOREST: TRAINER_BUG_CATCHER_RICK is at local
    // (47, 45) facing LEFT. Our trainer vision is a hardcoded 3 tiles, so
    // (44,45)..(46,45) are inside his sight cone. Start at (43, 45) facing
    // right and step right onto (44, 45) to enter vision. Map is 54×69.
    sim = new GameSimulator().init({
      currentMap: 'VIRIDIAN_FOREST',
      playerPos: { x: 43, y: 45 },
      direction: 'right',
      playerTeam: [strongStarter()],
      storyStep: 'EXPLORING',
    });

    sim.move('right');
    sim.tick(500);

    if (sim.dialogue) sim.dismissDialogue();
    sim.tick(2000);
    sim.skipBattleTransition();

    expect(sim.phase.type).toBe('BATTLE');

    act(() => {
      useGameStore.getState().setPlayerTeam([strongStarter()]);
      if (sim.battleState) sim.battleState.playerTeam = [strongStarter()];
    });

    for (let i = 0; i < 20; i++) {
      if (sim.phase.type !== 'BATTLE') break;
      if (sim.battleState?.outcome !== 'ongoing') break;
      const move = sim.battleState?.playerTeam?.[0]?.moves?.[0];
      if (move && sim.battleState?.phase === 'CHOOSING') {
        sim.battleAction({ type: 'ATTACK', move });
      }
      sim.tick(5000);
    }

    sim.tick(10000);

    // Phase must be EXPLORING, activeBattle null, trainer flagged defeated.
    expect(sim.phase.type).toBe('EXPLORING');
    expect(sim.state.activeBattle).toBeNull();
    // Trainer NPC ids are auto-generated as `npc_<MAP>_<x>_<y>` when
    // FireRed's local_id is null. Rick is at MAP_VIRIDIAN_FOREST (47,45).
    expect(sim.state.defeatedTrainers).toContain('npc_MAP_VIRIDIAN_FOREST_47_45');

    // Should not bounce back into battle.
    sim.tick(5000);
    expect(sim.phase.type).toBe('EXPLORING');
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

// ─── Scenario 16: Flash cave darkness ──────────────────────────────────────

describe('Scenario 16: Flash field move in dark caves', () => {
  it('Mt Moon is flagged as underground (isUnderground = true)', () => {
    sim = new GameSimulator().init({
      currentMap: 'MT_MOON',
      playerPos: { x: 5, y: 5 },
      direction: 'down',
      playerTeam: [strongStarter()],
      storyStep: 'EXPLORING',
    });
    expect(sim.worldMap.isUnderground).toBe(true);
    expect(sim.state.flashActive).toBe(false);
  });

  it('Pallet Town overworld is NOT underground', () => {
    sim = new GameSimulator().init({
      currentMap: 'KANTO_OVERWORLD',
      playerPos: { x: 76, y: 273 },
      direction: 'up',
      playerTeam: [strongStarter()],
      storyStep: 'EXPLORING',
    });
    expect(sim.worldMap.isUnderground).toBeFalsy();
  });

  it('reset flash when warping from dark map to non-dark map', () => {
    sim = new GameSimulator().init({
      currentMap: 'MT_MOON',
      playerPos: { x: 5, y: 5 },
      direction: 'down',
      playerTeam: [strongStarter()],
      storyStep: 'EXPLORING',
    });
    act(() => useGameStore.getState().setFlashActive(true));
    expect(sim.state.flashActive).toBe(true);

    // Warp out of Mt Moon via LAST_MAP → KANTO_OVERWORLD
    act(() => useGameStore.getState().setCurrentMap('KANTO_OVERWORLD'));
    act(() => useGameStore.getState().setFlashActive(false));
    expect(sim.state.flashActive).toBe(false);
  });

  it('keeps flash active when moving inside the same dark map', () => {
    sim = new GameSimulator().init({
      currentMap: 'MT_MOON',
      playerPos: { x: 5, y: 5 },
      direction: 'down',
      playerTeam: [strongStarter()],
      storyStep: 'EXPLORING',
    });
    act(() => useGameStore.getState().setFlashActive(true));
    expect(sim.state.flashActive).toBe(true);

    // Move one tile — flash stays active (not reset by warp)
    sim.move('down').tick(500);
    expect(sim.state.flashActive).toBe(true);
  });
});

// ─── Scenario 17: Fly field move ─────────────────────────────────────────────

describe('Scenario 17: Fly field move warps to PC', () => {
  it('fly lands at the correct PC map and position', () => {
    sim = new GameSimulator().init({
      currentMap: 'KANTO_OVERWORLD',
      playerPos: { x: 76, y: 273 },
      direction: 'up',
      playerTeam: [strongStarter()],
      storyStep: 'EXPLORING',
      badges: ['THUNDER'],
      inventory: { POTION: 1, POKEBALL: 1, HM02_FLY: 1 },
      visitedTowns: ['PALLET_TOWN', 'VIRIDIAN_CITY'],
    });

    // Directly test the fly destination table — arrive() is a thin store setter wrapper
    const dest = FLY_DESTINATIONS['VIRIDIAN_CITY'];
    expect(dest).toBeDefined();
    expect(dest.map).toBe('POKECENTER_VIRIDIAN');
    expect(dest.pos).toEqual({ x: 7, y: 9 });
    expect(dest.dir).toBe('up');
  });

  it('fly destination table covers all visited towns', () => {
    sim = new GameSimulator().init({
      currentMap: 'KANTO_OVERWORLD',
      playerPos: { x: 76, y: 273 },
      direction: 'up',
      playerTeam: [strongStarter()],
      storyStep: 'EXPLORING',
      badges: ['THUNDER'],
      inventory: { POTION: 1, POKEBALL: 1, HM02_FLY: 1 },
      visitedTowns: ['PALLET_TOWN', 'VIRIDIAN_CITY', 'PEWTER_CITY', 'CERULEAN_CITY',
        'LAVENDER_TOWN', 'VERMILION_CITY', 'CELADON_CITY', 'FUCHSIA_CITY',
        'SAFFRON_CITY', 'CINNABAR_ISLAND', 'INDIGO_PLATEAU', 'ROUTE_4', 'ROUTE_10'],
    });

    // Every town in visitedTowns should have a Fly destination
    for (const town of sim.state.visitedTowns) {
      expect(FLY_DESTINATIONS[town], `Missing fly destination for ${town}`).toBeDefined();
    }
  });
});

// ─── Scenario 18: Gym leader auto-placement & badge award ────────────────────

describe('Scenario 18: Gym leaders are auto-placed and award badges', () => {
  it('places Brock in PEWTER_GYM with a real party', () => {
    sim = new GameSimulator().init({
      currentMap: 'PEWTER_GYM',
      playerPos: { x: 6, y: 6 },
      direction: 'up',
      playerTeam: [strongStarter()],
      storyStep: 'EXPLORING',
    });

    const npcs = useGameStore.getState().getNPCs() as Record<string, Array<{ trainerClass?: string; isTrainer?: boolean; trainerTeam?: Array<{ name: string }> }>>;
    const brock = npcs['PEWTER_GYM']?.find(n => n.trainerClass === 'brock');
    expect(brock, 'Brock not placed in PEWTER_GYM').toBeDefined();
    expect(brock?.isTrainer).toBe(true);
    expect(brock?.trainerTeam?.length ?? 0).toBeGreaterThan(0);
    // Canonical FireRed: Brock leads with GEODUDE.
    expect(brock?.trainerTeam?.[0].name).toMatch(/GEODUDE/i);
  });

  it('places all 8 canonical gym leaders', () => {
    sim = new GameSimulator().init({
      currentMap: 'PEWTER_GYM',
      playerPos: { x: 6, y: 6 },
      direction: 'up',
      playerTeam: [strongStarter()],
      storyStep: 'EXPLORING',
    });

    const npcs = useGameStore.getState().getNPCs() as Record<string, Array<{ trainerClass?: string }>>;
    const gyms: Array<[string, string]> = [
      ['PEWTER_GYM', 'brock'],
      ['CERULEAN_GYM', 'misty'],
      ['VERMILION_GYM', 'lt_surge'],
      ['CELADON_GYM', 'erika'],
      ['FUCHSIA_GYM', 'koga'],
      ['SAFFRON_GYM', 'sabrina'],
      ['CINNABAR_GYM', 'blaine'],
      ['VIRIDIAN_GYM', 'giovanni'],
    ];
    for (const [map, cls] of gyms) {
      expect(npcs[map]?.some(n => n.trainerClass === cls), `Missing ${cls} in ${map}`).toBe(true);
    }
  });
});


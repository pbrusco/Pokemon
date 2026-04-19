import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInteractionEngine } from '../useInteractionEngine';
import { useGameStore } from '../../store/gameStore';
import type { NPC, Entity, Tile, Pokemon, Position, InventoryCounts } from '../../types';
import type { MapID } from '../../types';
import { STARTERS } from '../../constants';
import { EXPLORING, SHOP, battle, B_CHOOSING } from '../../types/gamePhase';
import { worldConfig } from '../../data/worldConfig';

// ─── Map / world fixtures ─────────────────────────────────────────────────────

const WALKABLE_TILE: Tile = { type: 'path', walkable: true };
const TREE_TILE: Tile = { type: 'tree', walkable: false };
const CUT_TREE_TILE: Tile = { type: 'cut_tree', walkable: false };
const BOULDER_TILE: Tile = { type: 'boulder', walkable: false };

function makeGrid(overrides: Partial<Record<string, Tile>> = {}): Tile[][] {
  // 20×20 grid of path tiles, with optional overrides keyed as "y,x"
  const grid = Array.from({ length: 20 }, (_, y) =>
    Array.from({ length: 20 }, (_, x) => ({ ...(overrides[`${y},${x}`] ?? WALKABLE_TILE) })),
  );
  return grid;
}

const EMPTY_MAPS: Record<MapID, { tiles: Tile[][] }> = {
  PALLET_TOWN: { tiles: makeGrid() },
  PLAYERS_HOUSE_1F: { tiles: makeGrid() },
  PLAYERS_HOUSE_2F: { tiles: makeGrid() },
  RIVALS_HOUSE: { tiles: makeGrid() },
  OAKS_LAB: { tiles: makeGrid() },
  ROUTE_1: { tiles: makeGrid() },
  VIRIDIAN_CITY: { tiles: makeGrid() },
  POKECENTER: { tiles: makeGrid() },
  POKEMART: { tiles: makeGrid() },
  VIRIDIAN_FOREST: { tiles: makeGrid() },
  PEWTER_CITY: { tiles: makeGrid() },
  PEWTER_GYM: { tiles: makeGrid() },
  ROUTE_3: { tiles: makeGrid() },
  MT_MOON: { tiles: makeGrid() },
  ROUTE_2: { tiles: makeGrid() },
};

function makeNPC(overrides: Partial<NPC> = {}): NPC {
  return {
    id: 'npc1',
    type: 'npc',
    position: { x: 5, y: 4 }, // one tile north of player (5,5)
    direction: 'down',
    name: 'NPC',
    dialogue: ['Hola!'],
    ...overrides,
  };
}

function makeItem(overrides: Partial<Entity> = {}): Entity {
  return {
    id: 'item1',
    type: 'item',
    position: { x: 5, y: 4 },
    direction: 'down',
    sprite: '🧪',
    ...overrides,
  };
}

const ALL_MAP_IDS = ['PALLET_TOWN','PLAYERS_HOUSE_1F','PLAYERS_HOUSE_2F','RIVALS_HOUSE','OAKS_LAB','ROUTE_1','VIRIDIAN_CITY','POKECENTER','POKEMART','VIRIDIAN_FOREST','PEWTER_CITY','PEWTER_GYM','ROUTE_3','MT_MOON','ROUTE_2'];

const EMPTY_NPCS: Record<MapID, NPC[]> = Object.fromEntries(
  ALL_MAP_IDS.map(k => [k, []])
) as Record<MapID, NPC[]>;

const EMPTY_ITEMS: Record<MapID, Entity[]> = Object.fromEntries(
  ALL_MAP_IDS.map(k => [k, []])
) as Record<MapID, Entity[]>;

// ─── Hook factory ─────────────────────────────────────────────────────────────
// The hook now reads all state from the Zustand store, so setup() configures
// the store directly and overrides getNPCs/getItems/worldMaps for isolation.

interface Overrides {
  currentMap?: MapID;
  playerPos?: Position;
  direction?: 'up' | 'down' | 'left' | 'right';
  dialogue?: string | null;
  inBattle?: boolean;
  hasParcel?: boolean;
  hasPokedex?: boolean;
  badges?: string[];
  inventory?: InventoryCounts;
  playerTeam?: Pokemon[];
  pickedItemIds?: string[];
  npcs?: Record<MapID, NPC[]>;
  items?: Record<MapID, Entity[]>;
  maps?: Record<MapID, { tiles: Tile[][] }>;
}

function setup(overrides: Overrides = {}) {
  const initBattle = vi.fn();

  useGameStore.setState({
    // Runtime defaults
    isMoving: false,
    badgeBoostGlitchStacks: 0,
    showMoves: false,
    isLocked: false,
    showBattleTransition: false,
    teleports: worldConfig.teleports,
    lastHealLocation: { map: 'PALLET_TOWN' as MapID, pos: { x: 7, y: 11 } },
    pcStorage: [],
    pokedex: {},
    money: 3000,
    defeatedTrainers: [],
    storyStep: 'START',

    // Overrideable state
    currentMap: (overrides.currentMap ?? 'PALLET_TOWN') as MapID,
    playerPos: overrides.playerPos ?? { x: 5, y: 5 },
    direction: overrides.direction ?? 'up',
    dialogue: overrides.dialogue ?? null,
    phase: overrides.inBattle ? battle(B_CHOOSING) : EXPLORING,
    hasParcel: overrides.hasParcel ?? false,
    hasPokedex: overrides.hasPokedex ?? false,
    badges: overrides.badges ?? [],
    inventory: overrides.inventory ?? {},
    playerTeam: overrides.playerTeam ?? [],
    pickedItemIds: overrides.pickedItemIds ?? [],

    // Override getNPCs/getItems/worldMaps for test isolation
    getNPCs: () => (overrides.npcs ?? EMPTY_NPCS),
    getItems: () => (overrides.items ?? EMPTY_ITEMS),
    worldMaps: (overrides.maps ?? EMPTY_MAPS) as typeof worldConfig.maps,
  });

  const { result } = renderHook(() => useInteractionEngine({ initBattle }));

  return {
    handleAction: result.current.handleAction,
    initBattle,
    getState: () => useGameStore.getState(),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Dismiss dialogue', () => {
  it('clears dialogue when dialogue is active', () => {
    const { handleAction, getState } = setup({ dialogue: 'Hello!' });
    act(() => handleAction());
    expect(getState().dialogue).toBeNull();
  });

  it('does not interact with world when dialogue is active', () => {
    const healNpc = makeNPC({ onInteract: 'heal', name: 'NURSE JOY' });
    const { handleAction, getState } = setup({
      dialogue: 'Some text',
      npcs: { ...EMPTY_NPCS, PALLET_TOWN: [healNpc] },
    });
    act(() => handleAction());
    // Dialogue was cleared (dismiss), but no phase change happened
    expect(getState().phase.type).toBe('EXPLORING');
  });
});

describe('No-op in battle', () => {
  it('returns early without interacting when inBattle=true', () => {
    const { handleAction, getState } = setup({ inBattle: true });
    act(() => handleAction());
    expect(getState().dialogue).toBeNull();
    expect(getState().phase.type).toBe('BATTLE');
  });
});

describe('Healing NPC', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('sets last heal location and triggers HEALING phase', () => {
    const healNpc = makeNPC({
      id: 'nurse_joy',
      name: 'NURSE JOY',
      onInteract: 'heal',
      position: { x: 5, y: 4 },
    });
    const { handleAction, getState } = setup({
      currentMap: 'POKECENTER',
      npcs: { ...EMPTY_NPCS, POKECENTER: [healNpc] },
    });

    act(() => handleAction());

    // Immediately: sets dialogue with nurse's greeting
    expect(getState().dialogue).toBeTruthy();
    expect(getState().dialogue).toContain('JOY');

    // After 1500ms: triggers HEALING
    act(() => vi.advanceTimersByTime(1500));
    expect(getState().phase.type).toBe('HEALING');

    // Sets heal location for POKECENTER
    expect(getState().lastHealLocation).toEqual(
      expect.objectContaining({ map: 'POKECENTER' }),
    );
  });

  it('heals the team (all HP/PP/status restored) after 800ms inside HEALING', () => {
    const healNpc = makeNPC({ name: 'NURSE JOY', onInteract: 'heal', position: { x: 5, y: 4 } });
    const woundedPkmn: Pokemon = {
      id: 'charmander', name: 'CHARMANDER', level: 10, hp: 5, maxHp: 28,
      type: 'fire', baseStats: { hp: 39, attack: 52, defense: 43, special: 50, speed: 65 },
      moves: [{ name: 'PLACAJE', type: 'normal', power: 40, accuracy: 100, pp: 3, maxPp: 35 }],
      sprite: '', status: 'paralyzed',
    };
    const { handleAction, getState } = setup({
      currentMap: 'POKECENTER',
      playerTeam: [woundedPkmn],
      npcs: { ...EMPTY_NPCS, POKECENTER: [healNpc] },
    });

    act(() => handleAction());
    act(() => vi.advanceTimersByTime(1500 + 800)); // trigger HEALING + heal tick

    const healed = getState().playerTeam[0];
    expect(healed.hp).toBe(woundedPkmn.maxHp);
    expect(healed.status).toBe('none');
    expect(healed.moves[0].pp).toBe(woundedPkmn.moves[0].maxPp);
  });

  it('returns to EXPLORING after 1600ms inside HEALING', () => {
    const healNpc = makeNPC({ name: 'NURSE JOY', onInteract: 'heal', position: { x: 5, y: 4 } });
    const { handleAction, getState } = setup({
      currentMap: 'POKECENTER',
      npcs: { ...EMPTY_NPCS, POKECENTER: [healNpc] },
    });

    act(() => handleAction());
    act(() => vi.advanceTimersByTime(1500 + 1600));

    expect(getState().phase).toEqual(EXPLORING);
  });
});

describe('Shop NPC — first visit (parcel pickup)', () => {
  it('gives parcel on first visit to POKEMART when hasParcel=false and hasPokedex=false', () => {
    const shopNpc = makeNPC({ name: 'DEPENDIENTE', onInteract: 'shop', position: { x: 5, y: 4 } });
    const { handleAction, getState } = setup({
      currentMap: 'POKEMART',
      npcs: { ...EMPTY_NPCS, POKEMART: [shopNpc] },
      hasParcel: false,
      hasPokedex: false,
    });

    act(() => handleAction());

    expect(getState().hasParcel).toBe(true);
    expect(getState().inventory['OAK_PARCEL']).toBeGreaterThanOrEqual(1);
    expect(getState().dialogue).toBeTruthy();
    expect(getState().dialogue).toContain('paquete');
  });
});

describe('Shop NPC — returning visit', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('opens SHOP phase when hasParcel=true', () => {
    const shopNpc = makeNPC({ name: 'DEPENDIENTE', onInteract: 'shop', position: { x: 5, y: 4 } });
    const { handleAction, getState } = setup({
      currentMap: 'POKEMART',
      npcs: { ...EMPTY_NPCS, POKEMART: [shopNpc] },
      hasParcel: true,
      hasPokedex: false,
    });

    act(() => handleAction());
    act(() => vi.advanceTimersByTime(1000));

    expect(getState().phase).toEqual(SHOP);
  });
});

describe('Oak parcel turn-in', () => {
  it('removes parcel and grants Pokedex', () => {
    const oakNpc = makeNPC({ name: 'PROF. OAK', onInteract: 'oak_parcel_turnin', position: { x: 5, y: 4 } });
    const { handleAction, getState } = setup({
      currentMap: 'OAKS_LAB',
      npcs: { ...EMPTY_NPCS, OAKS_LAB: [oakNpc] },
      hasParcel: true,
      inventory: { OAK_PARCEL: 1 },
    });

    act(() => handleAction());

    expect(getState().hasParcel).toBe(false);
    expect(getState().hasPokedex).toBe(true);
    expect(getState().inventory['OAK_PARCEL']).toBeUndefined();
    expect(getState().dialogue).toBeTruthy();
    expect(getState().dialogue).toContain('POKÉDEX');
  });

  it('does NOT grant Pokedex when hasParcel=false', () => {
    const oakNpc = makeNPC({ name: 'PROF. OAK', onInteract: 'oak_parcel_turnin', position: { x: 5, y: 4 } });
    const { handleAction, getState } = setup({
      currentMap: 'OAKS_LAB',
      npcs: { ...EMPTY_NPCS, OAKS_LAB: [oakNpc] },
      hasParcel: false,
    });

    act(() => handleAction());

    expect(getState().hasPokedex).toBe(false);
  });
});

describe('Generic NPC dialogue', () => {
  it('sets dialogue from NPC.dialogue[0]', () => {
    const npc = makeNPC({ dialogue: ['¡Hola mundo!'] });
    const { handleAction, getState } = setup({
      npcs: { ...EMPTY_NPCS, PALLET_TOWN: [npc] },
    });

    act(() => handleAction());

    expect(getState().dialogue).toBe('¡Hola mundo!');
  });
});

describe('Item pickup — potion', () => {
  it('adds POTION to inventory and sets picked ID', () => {
    const potionItem: Entity = {
      ...makeItem({ id: 'item_potion_1', sprite: '🧪' }),
      position: { x: 5, y: 4 },
    };
    const { handleAction, getState } = setup({
      items: { ...EMPTY_ITEMS, PALLET_TOWN: [potionItem] },
    });

    act(() => handleAction());

    expect(getState().inventory['POTION']).toBeGreaterThanOrEqual(1);
    expect(getState().pickedItemIds).toContain('item_potion_1');
    expect(getState().dialogue).toBeTruthy();
    expect(getState().dialogue).toContain('POCIÓN');
  });
});

describe('Item pickup — pokeball', () => {
  it('adds POKEBALL to inventory and sets picked ID', () => {
    const ballItem: Entity = {
      ...makeItem({ id: 'item_pokeball_1', sprite: '🔴' }),
      position: { x: 5, y: 4 },
    };
    const { handleAction, getState } = setup({
      items: { ...EMPTY_ITEMS, PALLET_TOWN: [ballItem] },
    });

    act(() => handleAction());

    expect(getState().inventory['POKEBALL']).toBeGreaterThanOrEqual(1);
    expect(getState().pickedItemIds).toContain('item_pokeball_1');
    expect(getState().dialogue).toContain('POKÉ BALL');
  });
});

describe('Starter selection', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('sets player team and story step when picking a starter', () => {
    const starterItem: Entity = {
      id: 'starter_1',
      type: 'item',
      position: { x: 5, y: 4 },
      direction: 'down',
      sprite: STARTERS[0].sprite,
    };
    const { handleAction, getState } = setup({
      currentMap: 'OAKS_LAB',
      playerTeam: [], // empty — required for starter selection
      items: { ...EMPTY_ITEMS, OAKS_LAB: [starterItem] },
    });

    act(() => handleAction());

    expect(getState().playerTeam).toHaveLength(1);
    expect(getState().playerTeam[0]).toMatchObject(STARTERS[0]);
    expect(getState().storyStep).toBe('PICKED_STARTER');
    expect(getState().dialogue).toBeTruthy();
  });

  it('triggers rival battle after 1500ms', () => {
    const starterItem: Entity = {
      id: 'starter_1',
      type: 'item',
      position: { x: 5, y: 4 },
      direction: 'down',
      sprite: STARTERS[0].sprite,
    };
    const { handleAction, initBattle } = setup({
      currentMap: 'OAKS_LAB',
      playerTeam: [],
      items: { ...EMPTY_ITEMS, OAKS_LAB: [starterItem] },
    });

    act(() => handleAction());
    act(() => vi.advanceTimersByTime(1500));

    expect(initBattle).toHaveBeenCalledWith(
      expect.objectContaining({ name: expect.stringContaining('RIVAL') }),
      true,
    );
  });

  it('does not pick a starter when player already has a team', () => {
    const starterItem: Entity = {
      id: 'starter_1',
      type: 'item',
      position: { x: 5, y: 4 },
      direction: 'down',
      sprite: STARTERS[0].sprite,
    };
    const existingPkmn: Pokemon = {
      id: 'charmander', name: 'CHARMANDER', level: 5, hp: 18, maxHp: 18,
      type: 'fire', baseStats: { hp: 39, attack: 52, defense: 43, special: 50, speed: 65 },
      moves: [], sprite: '',
    };
    const { handleAction, getState } = setup({
      currentMap: 'OAKS_LAB',
      playerTeam: [existingPkmn], // already has a team
      items: { ...EMPTY_ITEMS, OAKS_LAB: [starterItem] },
    });

    act(() => handleAction());

    expect(getState().storyStep).not.toBe('PICKED_STARTER');
  });
});

describe('Sign / object interactions', () => {
  it('sets dialogue when facing a sign object', () => {
    const sign: Entity = {
      id: 'sign_home',
      type: 'object',
      position: { x: 5, y: 4 },
      direction: 'down',
      sprite: '🪧',
    };
    const { handleAction, getState } = setup({
      items: { ...EMPTY_ITEMS, PALLET_TOWN: [sign] },
    });

    act(() => handleAction());

    expect(getState().dialogue).toBeTruthy();
    expect(getState().dialogue).toContain('CASA');
  });
});

describe('HM — CUT tree obstacle', () => {
  it('shows error if player lacks CASCADE badge', () => {
    const maps = {
      ...EMPTY_MAPS,
      PALLET_TOWN: { tiles: makeGrid({ '4,5': CUT_TREE_TILE }) },
    };
    const { handleAction, getState } = setup({
      playerPos: { x: 5, y: 5 },
      direction: 'up',
      maps,
      badges: [], // no CASCADE badge
    });

    act(() => handleAction());

    expect(getState().dialogue).toBeTruthy();
    expect(getState().dialogue).toContain('CASCADE');
  });

  it('shows error if player has badge but lead Pokemon lacks CUT move', () => {
    const maps = {
      ...EMPTY_MAPS,
      PALLET_TOWN: { tiles: makeGrid({ '4,5': CUT_TREE_TILE }) },
    };
    const pkmnWithoutCut: Pokemon = {
      id: 'charmander', name: 'CHARMANDER', level: 10, hp: 28, maxHp: 28,
      type: 'fire', baseStats: { hp: 39, attack: 52, defense: 43, special: 50, speed: 65 },
      moves: [{ name: 'PLACAJE', type: 'normal', power: 40, accuracy: 100, pp: 35, maxPp: 35 }],
      sprite: '',
    };
    const { handleAction, getState } = setup({
      maps,
      badges: ['CASCADE'],
      playerTeam: [pkmnWithoutCut],
    });

    act(() => handleAction());

    expect(getState().dialogue).toBeTruthy();
    expect(getState().dialogue).toContain('CORTAR');
  });

  it('clears the tree tile when badge and move are present', () => {
    const maps = {
      ...EMPTY_MAPS,
      PALLET_TOWN: { tiles: makeGrid({ '4,5': CUT_TREE_TILE }) },
    };
    const pkmnWithCut: Pokemon = {
      id: 'charmander', name: 'CHARMANDER', level: 10, hp: 28, maxHp: 28,
      type: 'fire', baseStats: { hp: 39, attack: 52, defense: 43, special: 50, speed: 65 },
      moves: [{ name: 'CORTAR', type: 'normal', power: 50, accuracy: 95, pp: 30, maxPp: 30 }],
      sprite: '',
    };
    const { handleAction, getState } = setup({
      maps,
      badges: ['CASCADE'],
      playerTeam: [pkmnWithCut],
    });

    act(() => handleAction());

    // Tile should be mutated to path (the hook modifies the tile in place)
    expect(maps.PALLET_TOWN.tiles[4][5].type).toBe('path');
    expect(maps.PALLET_TOWN.tiles[4][5].walkable).toBe(true);
    expect(getState().dialogue).toBeTruthy();
    expect(getState().dialogue).toContain('CORTAR');
  });
});

describe('HM — STRENGTH boulder obstacle', () => {
  it('shows error if player lacks RAINBOW badge', () => {
    const maps = {
      ...EMPTY_MAPS,
      PALLET_TOWN: { tiles: makeGrid({ '4,5': BOULDER_TILE }) },
    };
    const { handleAction, getState } = setup({
      maps,
      badges: [],
    });

    act(() => handleAction());

    expect(getState().dialogue).toBeTruthy();
    expect(getState().dialogue).toContain('RAINBOW');
  });

  it('clears the boulder tile when badge and FUERZA move are present', () => {
    const maps = {
      ...EMPTY_MAPS,
      PALLET_TOWN: { tiles: makeGrid({ '4,5': BOULDER_TILE }) },
    };
    const pkmnWithStrength: Pokemon = {
      id: 'charmander', name: 'CHARMANDER', level: 10, hp: 28, maxHp: 28,
      type: 'fire', baseStats: { hp: 39, attack: 52, defense: 43, special: 50, speed: 65 },
      moves: [{ name: 'FUERZA', type: 'normal', power: 80, accuracy: 100, pp: 15, maxPp: 15 }],
      sprite: '',
    };
    const { handleAction, getState } = setup({
      maps,
      badges: ['RAINBOW'],
      playerTeam: [pkmnWithStrength],
    });

    act(() => handleAction());

    expect(maps.PALLET_TOWN.tiles[4][5].type).toBe('path');
    expect(maps.PALLET_TOWN.tiles[4][5].walkable).toBe(true);
    expect(getState().dialogue).toContain('FUERZA');
  });
});

describe('No NPC or item in target tile', () => {
  it('does nothing when facing an empty walkable tile', () => {
    const { handleAction, getState } = setup();

    act(() => handleAction());

    expect(getState().dialogue).toBeNull();
    expect(getState().phase.type).toBe('EXPLORING');
  });

  it('shows dialogue for regular tree tile', () => {
    const maps = {
      ...EMPTY_MAPS,
      PALLET_TOWN: { tiles: makeGrid({ '4,5': TREE_TILE }) },
    };
    const { handleAction, getState } = setup({ maps });

    act(() => handleAction());

    expect(getState().dialogue).toBeTruthy();
    expect(getState().dialogue).toContain('árbol');
  });
});

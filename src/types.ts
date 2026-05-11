import type { worldMaps } from './data/maps';

export type Direction = 'up' | 'down' | 'left' | 'right';
export type MapID = keyof typeof worldMaps;

export interface Position {
  x: number;
  y: number;
}

export interface MapData {
  tiles: Tile[][];
  warps: Array<{ x: number; y: number; targetMap: MapID; targetPos: Position; targetDir?: Direction; destWarpId?: string }>;
  /** All maps now flow through the FireRed pipeline. */
  firered?: true;
  /**
   * FireRed layout payload (single zone or multi-zone descriptor).
   * Typed as `unknown` to avoid a circular import via
   * src/lib/firered/bridge.ts; consumers cast to the right shape.
   */
  fireredLayout?: unknown;
  /** True if this map is an underground / cave / dark area (Flash-eligible). */
  isUnderground?: boolean;
}

type PokedexEntry = { seen: boolean; caught: boolean };
export type PokedexState = Record<string, PokedexEntry>;

interface StatChange {
  target: 'self' | 'enemy';
  stat: 'attack' | 'defense' | 'special' | 'speed' | 'accuracy' | 'evasion';
  stages: number;
}

export interface Move {
  name: string;
  type: string;
  power: number;
  accuracy: number;
  pp: number;
  maxPp: number;
  sfxType?: 'pulse' | 'noise' | 'glissando';
  statusEffect?: 'paralyzed' | 'sleep' | 'poison' | 'burn' | 'frozen';
  statusChance?: number;
  statChange?: StatChange;
  highCrit?: boolean;
  recoil?: number;
  drain?: number;
  alwaysHit?: boolean;
  confuseChance?: number;
  multiHit?: { minHits: number; maxHits: number };
  rampage?: { turns: number };
  recharge?: boolean;
  twoTurn?: { chargeMessage: string; invulnerable: boolean };
  priority?: number;
  fixedDmg?: number;
  dmgEqualsLevel?: boolean;
  faintsUser?: boolean;
  healSelf?: number;
  healStatus?: boolean;
  ohko?: boolean;
  halfHp?: boolean;
  trap?: { turns: number };
}

export interface BaseStats {
  hp: number;
  attack: number;
  defense: number;
  special: number;
  speed: number;
}

export interface StatBoosts {
  attack: number;
  defense: number;
  special: number;
  speed: number;
  accuracy?: number;
  evasion?: number;
}

export interface Pokemon {
  uid?: string;
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  type: string;
  types?: string[];
  baseStats: BaseStats;
  moves: Move[];
  sprite: string;
  exp?: number;
  expToNextLevel?: number;
  status?: 'none' | 'paralyzed' | 'sleep' | 'poison' | 'burn' | 'frozen';
  toxicTurns?: number;
  statBoosts?: StatBoosts;
  evolutionLevel?: number;
  evolvesTo?: string;
  movesToLearn?: { level: number, move: Move }[];
  catchRate?: number;
  growthRate?: 'fast' | 'medium_fast' | 'medium_slow' | 'slow';
  baseExp?: number;
  confused?: { turns: number };
  recharging?: boolean;
  rampage?: { move: Move; remainingTurns: number };
  charging?: boolean;
  leechSeed?: boolean;
  bideState?: { accumulatedDamage: number; remainingTurns: number };
  lastPhysicalDamage?: number;
  trapped?: { damage: number; remainingTurns: number };
  rageActive?: boolean;
  disabled?: { moveName: string; turns: number };
}

export interface PokemonSummary {
  id: string;
  name: string;
  sprite: string;
  types?: string[];
  height?: number;
  weight?: number;
  description?: string;
}

interface ItemEffect {
  healHp?: number;
  cureStatus?: 'paralyzed' | 'sleep' | 'poison' | 'burn' | 'frozen' | 'all';
  revive?: boolean;
  reviveHpPercent?: number;
  stoneEvolve?: boolean;
  rareCandy?: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'potion' | 'pokeball' | 'key_item' | 'status_heal' | 'revive' | 'tm' | 'stone';
  effect?: ItemEffect;
}

export type InventoryCounts = Record<string, number>;

export interface NPC extends Entity {
  name: string;
  dialogue: string[];
  onInteract?: 'heal' | 'shop' | 'oak_parcel_turnin' | 'give_town_map' | 'give_poke_flute' | 'give_ss_ticket' | 'wake_snorlax' | 'give_master_ball' | 'give_bike' | 'cerulean_cave_guard';
  questId?: string;
  requiredBadge?: string;
  isRival?: boolean;
  isTrainer?: boolean;
  trainerTeam?: Pokemon[];
  trainerClass?: string;
}

export interface WildPokemonEntity extends Entity {
  type: 'wild_pokemon';
  pokemon: Pokemon;
}

export interface Entity {
  id: string;
  type: 'player' | 'npc' | 'object' | 'teleport' | 'item' | 'wild_pokemon';
  position: Position;
  direction: Direction;
  sprite?: string;
  itemId?: string; // Reference to ITEMS_DATABASE
  targetMap?: MapID;
  targetPos?: Position;
  dialogue?: string[];
}

export interface Tile {
  type: 'grass' | 'water' | 'path' | 'wall' | 'door' | 'floor' | 'carpet' | 'table' | 'tree' | 'sign' | 'cut_tree' | 'boulder' | 'bookshelf' | 'machine' | 'fence' | 'flower' | 'ledge_down' | 'ledge_left' | 'ledge_right' | 'cave' | 'sand' | 'warp_pad' | 'counter';
  walkable: boolean;
  /**
   * Movement directions the player CANNOT use to enter this tile. Used for
   * FireRed's MB_IMPASSABLE_<DIR> metatiles (e.g. fence corners that you can
   * step around but not through). When unset, walkability is purely governed
   * by `walkable`. Multiple directions block multiple entries (the diagonal
   * MB_IMPASSABLE_NE etc. map to two-direction blocks).
   */
  blockFrom?: Direction[];
}

export const TILE_SIZE = 64;

export interface BattleLogEntry {
  id: number;
  speaker: string;
  text: string;
}

// ---------------------------------------------------------------------------
// Game Phase FSM
// ---------------------------------------------------------------------------

export type BattlePhase =
  | { type: 'CHOOSING' }
  | { type: 'PLAYER_ATTACK' }
  | { type: 'ENEMY_ATTACK' }
  | { type: 'PLAYER_FAINTED' }
  | { type: 'FORCED_SWITCH' }
  | { type: 'ENEMY_FAINTED' }
  | { type: 'CATCHING' }
  | { type: 'LEVEL_UP' }
  | { type: 'EVOLVING' }
  | { type: 'BATTLE_INVENTORY' }
  | { type: 'BATTLE_TEAM' }
  | { type: 'BATTLE_ITEM_TEAM_SELECT'; itemId: string }
  | { type: 'TRAINER_NEXT_POKEMON' }

export type GamePhase =
  | { type: 'EXPLORING' }
  | { type: 'MENU'; returnTo?: GamePhase }
  | { type: 'INVENTORY'; returnTo?: GamePhase }
  | { type: 'ITEM_TEAM_SELECT'; itemId: string; returnTo?: GamePhase }
  | { type: 'HM_FORGET'; itemId: string; teamIndex: number; existingMoveNames: string[] }
  | { type: 'FLY_TOWN_SELECT' }
  | { type: 'FLY_ANIMATING'; town: string; pokemonName: string; pokemonSprite: string }
  | { type: 'POKEMON_SUMMARY'; teamIndex: number }
  | { type: 'TEAM'; returnTo?: GamePhase }
  | { type: 'SHOP'; shopId?: string }
  | { type: 'POKEDEX'; returnTo?: GamePhase }
  | { type: 'PC'; returnTo?: GamePhase }
  | { type: 'BATTLE_TRANSITION' }
  | { type: 'BATTLE'; sub: BattlePhase }
  | { type: 'BLACKOUT' }
  | { type: 'HEALING' }
  | { type: 'CONFIG'; returnTo?: GamePhase }

export const EXPLORING: GamePhase = { type: 'EXPLORING' };
export const BATTLE_TRANSITION: GamePhase = { type: 'BATTLE_TRANSITION' };
export const BLACKOUT: GamePhase = { type: 'BLACKOUT' };
export const HEALING: GamePhase = { type: 'HEALING' };

export function battle(sub: BattlePhase): GamePhase {
  return { type: 'BATTLE', sub };
}

export const B_CHOOSING      = { type: 'CHOOSING' } as const;
export const B_PLAYER_ATTACK = { type: 'PLAYER_ATTACK' } as const;
export const B_ENEMY_ATTACK  = { type: 'ENEMY_ATTACK' } as const;
export const B_PLAYER_FAINTED = { type: 'PLAYER_FAINTED' } as const;
export const B_FORCED_SWITCH = { type: 'FORCED_SWITCH' } as const;
export const B_ENEMY_FAINTED = { type: 'ENEMY_FAINTED' } as const;
export const B_CATCHING      = { type: 'CATCHING' } as const;
export const B_LEVEL_UP      = { type: 'LEVEL_UP' } as const;
export const B_EVOLVING      = { type: 'EVOLVING' } as const;
export const B_BATTLE_INVENTORY = { type: 'BATTLE_INVENTORY' } as const;
export const B_BATTLE_TEAM   = { type: 'BATTLE_TEAM' } as const;
export const B_TRAINER_NEXT_POKEMON = { type: 'TRAINER_NEXT_POKEMON' } as const;

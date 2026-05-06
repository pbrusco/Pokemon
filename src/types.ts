import type { worldMaps } from './data/maps';

export type Direction = 'up' | 'down' | 'left' | 'right';
export type MapID = keyof typeof worldMaps;

export interface Position {
  x: number;
  y: number;
}

export interface MapData {
  tiles: Tile[][];
  warps: Array<{ x: number; y: number; targetMap: MapID; targetPos: Position; targetDir?: Direction }>;
  /** All maps now flow through the FireRed pipeline. */
  firered?: true;
  /**
   * FireRed layout payload (single zone or multi-zone descriptor).
   * Typed as `unknown` to avoid a circular import via
   * src/lib/firered/bridge.ts; consumers cast to the right shape.
   */
  fireredLayout?: unknown;
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
  reviveHpPercent?: number; // e.g. 50 for revive, 100 for max revive
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'potion' | 'pokeball' | 'key_item' | 'status_heal' | 'revive';
  effect?: ItemEffect;
}

export type InventoryCounts = Record<string, number>;

export interface NPC extends Entity {
  name: string;
  dialogue: string[];
  onInteract?: 'heal' | 'shop' | 'oak_parcel_turnin' | 'give_town_map' | 'give_poke_flute' | 'give_ss_ticket' | 'wake_snorlax';
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
  type: 'grass' | 'water' | 'path' | 'wall' | 'door' | 'floor' | 'carpet' | 'table' | 'tree' | 'sign' | 'cut_tree' | 'boulder' | 'bookshelf' | 'machine' | 'fence' | 'flower' | 'ledge_down' | 'ledge_left' | 'ledge_right' | 'cave' | 'sand';
  walkable: boolean;
}

export const TILE_SIZE = 64;

export interface BattleLogEntry {
  id: number;
  speaker: string;
  text: string;
}

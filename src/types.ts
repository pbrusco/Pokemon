import type { worldMaps } from './data/maps';

export type Direction = 'up' | 'down' | 'left' | 'right';
export type MapID = keyof typeof worldMaps;

export interface Position {
  x: number;
  y: number;
}

export type PokedexEntry = { seen: boolean; caught: boolean };
export type PokedexState = Record<string, PokedexEntry>;

export interface StatChange {
  target: 'self' | 'enemy';
  stat: 'attack' | 'defense' | 'special' | 'speed';
  stages: number; // negative = lower, positive = raise
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
}

export interface PokemonSummary {
  id: string;
  name: string;
  sprite: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'potion' | 'pokeball' | 'key_item';
}

export type InventoryCounts = Record<string, number>;

export interface NPC extends Entity {
  name: string;
  dialogue: string[];
  onInteract?: 'heal' | 'shop' | 'oak_parcel_turnin' | 'give_town_map';
  questId?: string;
  isRival?: boolean;
  isTrainer?: boolean;
  trainerTeam?: Pokemon[];
}

export interface Entity {
  id: string;
  type: 'player' | 'npc' | 'object' | 'teleport' | 'item';
  position: Position;
  direction: Direction;
  sprite?: string;
  targetMap?: MapID;
  targetPos?: Position;
  dialogue?: string[];
}

export interface Tile {
  type: 'grass' | 'water' | 'path' | 'wall' | 'door' | 'floor' | 'carpet' | 'table' | 'tree' | 'sign' | 'cut_tree' | 'boulder' | 'bookshelf' | 'machine' | 'fence' | 'flower';
  walkable: boolean;
}

export const TILE_SIZE = 64;

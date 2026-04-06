export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Position {
  x: number;
  y: number;
}

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
  statusEffect?: 'paralyzed' | 'sleep' | 'poison' | 'burn' | 'frozen';
  statusChance?: number;
  statChange?: StatChange;
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
}

export interface Pokemon {
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

export interface NPC extends Entity {
  name: string;
  dialogue: string[];
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
  targetMap?: string;
  targetPos?: Position;
}

export interface Tile {
  type: 'grass' | 'water' | 'path' | 'wall' | 'door' | 'floor' | 'carpet' | 'table' | 'tree' | 'sign';
  walkable: boolean;
}

export const TILE_SIZE = 64;
export const GRID_SIZE = 20;

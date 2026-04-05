export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Position {
  x: number;
  y: number;
}

export interface Move {
  name: string;
  type: string;
  power: number;
  accuracy: number;
}

export interface Pokemon {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  type: string;
  moves: Move[];
  sprite: string;
  exp?: number;
  expToNextLevel?: number;
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

const createEmptyMap = (type: Tile['type'] = 'grass', walkable = true): Tile[][] => 
  Array(GRID_SIZE).fill(null).map(() => 
    Array(GRID_SIZE).fill(null).map(() => ({ type, walkable }))
  );

// --- PALLET TOWN ---
export const MAP_PALLET_TOWN = createEmptyMap();
for (let i = 0; i < GRID_SIZE; i++) {
  for (let j = 0; j < GRID_SIZE; j++) {
    if (i < 5 || i > 15 || j < 3 || j > 17) {
      MAP_PALLET_TOWN[i][j] = { type: 'tree', walkable: false };
    } else {
      MAP_PALLET_TOWN[i][j] = { type: 'path', walkable: true };
    }
  }
}

const addHouse = (map: Tile[][], startX: number, startY: number, width: number, height: number) => {
  for (let i = startY; i < startY + height; i++) {
    for (let j = startX; j < startX + width; j++) {
      map[i][j] = { type: 'wall', walkable: false };
    }
  }
  map[startY + height - 1][startX + Math.floor(width/2)] = { type: 'door', walkable: true };
};

addHouse(MAP_PALLET_TOWN, 6, 7, 3, 3); // Player's house
addHouse(MAP_PALLET_TOWN, 11, 7, 3, 3); // Rival's house
addHouse(MAP_PALLET_TOWN, 8, 12, 4, 3); // Oak's Lab

// --- OAK'S LAB ---
export const MAP_OAKS_LAB = createEmptyMap('floor', true);
for (let i = 0; i < GRID_SIZE; i++) {
  for (let j = 0; j < GRID_SIZE; j++) {
    if (i < 5 || i > 15 || j < 5 || j > 15) {
      MAP_OAKS_LAB[i][j] = { type: 'wall', walkable: false };
    }
  }
}
// Lab Tables
for (let j = 8; j <= 12; j++) MAP_OAKS_LAB[8][j] = { type: 'table', walkable: false };
MAP_OAKS_LAB[15][10] = { type: 'carpet', walkable: true }; // Exit

// --- ROUTE 1 ---
export const MAP_ROUTE_1 = createEmptyMap('grass', true);
for (let i = 0; i < GRID_SIZE; i++) {
  for (let j = 0; j < GRID_SIZE; j++) {
    if (j < 5 || j > 14) {
      MAP_ROUTE_1[i][j] = { type: 'tree', walkable: false };
    }
  }
  MAP_ROUTE_1[i][9] = { type: 'path', walkable: true };
  MAP_ROUTE_1[i][10] = { type: 'path', walkable: true };
}

// --- VIRIDIAN CITY ---
export const MAP_VIRIDIAN_CITY = createEmptyMap('path', true);
addHouse(MAP_VIRIDIAN_CITY, 5, 5, 4, 4); // PokeCenter
addHouse(MAP_VIRIDIAN_CITY, 12, 5, 4, 4); // PokeMart

// --- POKECENTER ---
export const MAP_POKECENTER = createEmptyMap('floor', true);
for (let i = 0; i < GRID_SIZE; i++) {
  for (let j = 0; j < GRID_SIZE; j++) {
    if (i < 5 || i > 15 || j < 5 || j > 15) {
      MAP_POKECENTER[i][j] = { type: 'wall', walkable: false };
    }
  }
}
MAP_POKECENTER[15][10] = { type: 'carpet', walkable: true }; // Exit

// --- POKEMART ---
export const MAP_POKEMART = createEmptyMap('floor', true);
for (let i = 0; i < GRID_SIZE; i++) {
  for (let j = 0; j < GRID_SIZE; j++) {
    if (i < 5 || i > 15 || j < 5 || j > 15) {
      MAP_POKEMART[i][j] = { type: 'wall', walkable: false };
    }
  }
}
MAP_POKEMART[15][10] = { type: 'carpet', walkable: true }; // Exit

/**
 * Block-based tile parser (backward-compatible with old char-grid JSONs)
 *
 * Reads canonical block-ID map JSONs AND legacy char-grid JSONs.
 * Resolves per-tile type/walkability using pre-extracted blockset assets.
 */

import { type Tile, type Position, type MapID, type Direction } from '../../types';
import { buildRenderLayers } from '../tileset/autotiler';
import { blocksetBlocks, blocksetSemantics } from '../../lib/blocksetData';

// ══════════════════════════════════════════════════════════════════════
// Type definitions
// ══════════════════════════════════════════════════════════════════════

interface BlockMapJson {
  blockset: string;
  borderBlock: number;
  width: number;
  height: number;
  blocks: number[][];
  warps?: Array<{
    x: number;
    y: number;
    targetMap: string;
    targetPos?: { x: number; y: number };
    targetDir?: string;
  }>;
  objects?: Array<{ x: number; y: number; text: string }>;
}

interface CharMapJson {
  rows: string[];
  warps?: Array<{
    x: number; y: number; targetMap: string;
    targetPos: { x: number; y: number }; targetDir?: string;
  }>;
}

interface ParsedMap {
  tiles: Tile[][];
  warps: Array<{ x: number; y: number; targetMap: MapID; targetPos: Position; targetDir?: Direction }>;
  /** Legacy autotiler output (populated for char-grid maps) */
  layers?: { ground: number[][]; objects: number[][]; overhead: number[][] };
  /** Present for block-based maps */
  blockset?: string;
  blocks?: number[][];
  widthBlocks?: number;
  heightBlocks?: number;
  borderBlock?: number;
}

// ══════════════════════════════════════════════════════════════════════
// Legacy char-grid support
// ══════════════════════════════════════════════════════════════════════

const TILE_LEGEND: Record<string, Tile> = {
  T: { type: 'tree', walkable: false },
  G: { type: 'grass', walkable: true },
  P: { type: 'path', walkable: true },
  W: { type: 'wall', walkable: false },
  D: { type: 'door', walkable: true },
  F: { type: 'floor', walkable: true },
  C: { type: 'carpet', walkable: true },
  X: { type: 'table', walkable: false },
  S: { type: 'sign', walkable: true },
  H: { type: 'cut_tree', walkable: false },
  B: { type: 'boulder', walkable: false },
  '~': { type: 'water', walkable: false },
  K: { type: 'bookshelf', walkable: false },
  M: { type: 'machine', walkable: false },
  '+': { type: 'fence', walkable: false },
  '*': { type: 'flower', walkable: true },
  L: { type: 'ledge_down', walkable: false },
  '<': { type: 'ledge_left', walkable: false },
  '>': { type: 'ledge_right', walkable: false },
};

const FALLBACK_TILE: Tile = { type: 'path', walkable: true };

// ══════════════════════════════════════════════════════════════════════
// Block-based helpers
// ══════════════════════════════════════════════════════════════════════

// Priority order for determining a quadrant's semantic type from its 4 native tiles.
// Tree comes from semantics for outdoor blocksets only; indoors the same tile
// IDs encode furniture/walls so we trust the per-blockset semantics.json.
const TYPE_PRIORITY: Tile['type'][] = [
  'door', 'water', 'grass', 'ledge_down', 'ledge_left', 'ledge_right', 'sign',
  'fence', 'flower', 'cut_tree', 'boulder', 'tree',
];

function getBlockId(
  blocks: number[][],
  hBlocks: number,
  wBlocks: number,
  borderBlock: number,
  tx: number,
  ty: number,
): number {
  const bx = tx >> 1;
  const by = ty >> 1;
  if (by >= 0 && by < hBlocks && bx >= 0 && bx < wBlocks) {
    return blocks[by][bx];
  }
  return borderBlock;
}

/** Tile types that should be reported as walkable when the underlying native tiles are. */
const WALKABLE_TYPES = new Set(['door', 'sign', 'flower', 'grass', 'path']);

/**
 * A "building block" is one whose bottom half visually represents a wall/door
 * (house, lab, mart, gym, etc.). Pokered marks the upper half tiles as walkable
 * so the player can pass behind the building under an overhead layer; we don't
 * have an overhead layer yet, so we treat the whole block as wall visually +
 * blocked for movement, except for door quadrants which keep their semantic.
 */
function isBuildingBlock(blockTiles: number[], semantics: Record<string, { type: string; walkable: boolean }>): boolean {
  const bottomHalf = blockTiles.slice(8);
  return bottomHalf.some(id => semantics[id]?.type === 'wall' || semantics[id]?.type === 'door');
}

/** Scan all 4 native tiles in a 2×2 quadrant and return the most specific semantic type. */
function quadrantTile(blockTiles: number[], tx: number, ty: number, semantics: Record<string, { type: string; walkable: boolean }>): Tile {
  const qx = tx & 1;
  const qy = ty & 1;
  // Indices of the 4 native tiles in this quadrant (row-major 4×4 grid)
  const tileIds = [
    blockTiles[(qy * 2) * 4 + (qx * 2)],
    blockTiles[(qy * 2) * 4 + (qx * 2 + 1)],
    blockTiles[(qy * 2 + 1) * 4 + (qx * 2)],
    blockTiles[(qy * 2 + 1) * 4 + (qx * 2 + 1)],
  ];

  // Walkability for the whole quadrant: any non-walkable native tile blocks the player.
  const quadWalkable = tileIds.every(id => semantics[id]?.walkable);

  // Doors take precedence — even in upper quadrants (rare but possible).
  if (tileIds.some(id => semantics[id]?.type === 'door')) {
    return { type: 'door', walkable: true };
  }

  // Water tiles take precedence over the building-block heuristic so pond/lake
  // edge blocks (which contain wall-type "shore" tiles) still render as water.
  if (tileIds.some(id => semantics[id]?.type === 'water')) {
    return { type: 'water', walkable: false };
  }

  // For "building blocks" (any block with wall/door in its bottom half), force
  // the upper quadrants to render as wall so the building visually covers all
  // four cells, not just the lower two.
  if (isBuildingBlock(blockTiles, semantics)) {
    return { type: 'wall', walkable: false };
  }

  // Check remaining priority types (grass, ledge, sign, fence, tree, etc.).
  for (const priority of TYPE_PRIORITY) {
    if (priority !== 'door' && priority !== 'water') {
      if (tileIds.some(id => semantics[id]?.type === priority)) {
        const walkable = WALKABLE_TYPES.has(priority) ? quadWalkable : false;
        return { type: priority, walkable };
      }
    }
  }

  // If all walkable → floor (interior) or path (outdoor); any non-walkable → wall.
  if (quadWalkable) {
    const hasFloor = tileIds.some(id => semantics[id]?.type === 'floor');
    return { type: hasFloor ? 'floor' : 'path', walkable: true };
  }
  return { type: 'wall', walkable: false };
}

/** Resolve semantic tile info at a given tile coordinate. */
function tileFromBlock(data: BlockMapJson, tx: number, ty: number): Tile {
  const blockId = getBlockId(data.blocks, data.height, data.width, data.borderBlock, tx, ty);

  const bsBlocks = blocksetBlocks[data.blockset];
  const semantics = blocksetSemantics[data.blockset];

  if (bsBlocks && semantics && blockId < bsBlocks.length) {
    return quadrantTile(bsBlocks[blockId], tx, ty, semantics);
  }

  // Fallback: use border block semantics if available
  if (bsBlocks && semantics && data.borderBlock < bsBlocks.length) {
    return quadrantTile(bsBlocks[data.borderBlock], tx, ty, semantics);
  }

  return { type: 'path', walkable: true };
}

// ══════════════════════════════════════════════════════════════════════
// Public parse functions
// ══════════════════════════════════════════════════════════════════════

/** Detect format and parse either block-ID or char-grid map JSON. */
export function parseMap(data: BlockMapJson | CharMapJson): ParsedMap {
  if ('blocks' in data && Array.isArray(data.blocks)) {
    return parseBlockMap(data as BlockMapJson);
  }
  return parseTileMap(data as CharMapJson);
}

function parseBlockMap(data: BlockMapJson): ParsedMap {
  const heightTiles = data.height * 2;
  const widthTiles = data.width * 2;

  const tiles: Tile[][] = [];
  for (let ty = 0; ty < heightTiles; ty++) {
    const row: Tile[] = [];
    for (let tx = 0; tx < widthTiles; tx++) {
      row.push(tileFromBlock(data, tx, ty));
    }
    tiles.push(row);
  }

  const warps = (data.warps || []).map(w => ({
    x: w.x,
    y: w.y,
    targetMap: w.targetMap as MapID,
    targetPos: w.targetPos as Position,
    targetDir: w.targetDir as Direction,
  }));

  const indoor = !OUTDOOR_BLOCKSETS.has(data.blockset);
  const layers = buildRenderLayers(tiles, { indoor });

  return {
    tiles,
    warps,
    layers,
    blockset: data.blockset,
    blocks: data.blocks,
    widthBlocks: data.width,
    heightBlocks: data.height,
    borderBlock: data.borderBlock,
  };
}

const OUTDOOR_BLOCKSETS = new Set(['OVERWORLD', 'FOREST', 'PLATEAU']);

function parseTileMap(data: CharMapJson): ParsedMap {
  const tiles = data.rows.map(row =>
    row.split('').map(char => TILE_LEGEND[char] ?? FALLBACK_TILE)
  );

  const layers = buildRenderLayers(tiles);

  return {
    tiles,
    warps: (data.warps || []) as ParsedMap['warps'],
    layers,
  };
}

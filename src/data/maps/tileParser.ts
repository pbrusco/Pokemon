/**
 * Compact tile map format.
 *
 * Each map is stored as { "rows": string[] } where every string is exactly 20
 * characters long, one character per tile.  This is ~40× smaller than the old
 * { type, walkable } object-per-tile format and is easy to edit by hand.
 *
 * Legend:
 *   T  tree    (not walkable)
 *   G  grass   (walkable — flat, no encounters)
 *   P  path    (walkable)
 *   W  wall    (not walkable)
 *   D  door    (walkable)
 *   F  floor   (walkable, indoors)
 *   C  carpet  (walkable, indoors)
 *   X  table   (not walkable)
 *   S  sign    (walkable, interactable)
 *   ~  water   (not walkable)
 */

import { Tile } from '../../types';

const TILE_LEGEND: Record<string, Tile> = {
  T: { type: 'tree',   walkable: false },
  G: { type: 'grass',  walkable: true  },
  P: { type: 'path',   walkable: true  },
  W: { type: 'wall',   walkable: false },
  D: { type: 'door',   walkable: true  },
  F: { type: 'floor',  walkable: true  },
  C: { type: 'carpet', walkable: true  },
  X: { type: 'table',  walkable: false },
  S: { type: 'sign',   walkable: true  },
  '~': { type: 'water', walkable: false },
};

/** Fallback tile for unknown characters — keeps the game running if a map typo slips through */
const FALLBACK_TILE: Tile = { type: 'path', walkable: true };

export function parseTileMap(data: { rows: string[] }): Tile[][] {
  return data.rows.map(row =>
    row.split('').map(char => TILE_LEGEND[char] ?? FALLBACK_TILE)
  );
}

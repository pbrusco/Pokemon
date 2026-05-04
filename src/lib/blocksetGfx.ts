/**
 * Canonical pokered tileset graphics — runtime URLs + dimensions.
 *
 * Each `*.tiles.png` is the 2-bit grayscale 8×8 tile sprite sheet for one
 * blockset (16 columns wide, height varies). Block IDs in `*.blocks.json`
 * reference these tiles by index.
 *
 * Why this exists: rendering blocks as native tile graphics avoids the lossy
 * "block → semantic type → autotiler synthesizes a sprite" pipeline that
 * collapses tables, TVs, bookshelves, plants, and stairs all into "wall".
 */

import OVERWORLD_URL from '../artifacts/tilesets/OVERWORLD.tiles.png';
import CAVERN_URL from '../artifacts/tilesets/CAVERN.tiles.png';
import CEMETERY_URL from '../artifacts/tilesets/CEMETERY.tiles.png';
import CLUB_URL from '../artifacts/tilesets/CLUB.tiles.png';
import FACILITY_URL from '../artifacts/tilesets/FACILITY.tiles.png';
import FOREST_URL from '../artifacts/tilesets/FOREST.tiles.png';
import GATE_URL from '../artifacts/tilesets/GATE.tiles.png';
import GYM_URL from '../artifacts/tilesets/GYM.tiles.png';
import HOUSE_URL from '../artifacts/tilesets/HOUSE.tiles.png';
import INTERIOR_URL from '../artifacts/tilesets/INTERIOR.tiles.png';
import LAB_URL from '../artifacts/tilesets/LAB.tiles.png';
import LOBBY_URL from '../artifacts/tilesets/LOBBY.tiles.png';
import MANSION_URL from '../artifacts/tilesets/MANSION.tiles.png';
import PLATEAU_URL from '../artifacts/tilesets/PLATEAU.tiles.png';
import POKECENTER_URL from '../artifacts/tilesets/POKECENTER.tiles.png';
import REDS_HOUSE_URL from '../artifacts/tilesets/REDS_HOUSE.tiles.png';
import SHIP_URL from '../artifacts/tilesets/SHIP.tiles.png';
import SHIP_PORT_URL from '../artifacts/tilesets/SHIP_PORT.tiles.png';
import UNDERGROUND_URL from '../artifacts/tilesets/UNDERGROUND.tiles.png';

export const blocksetTilesUrl: Record<string, string> = {
  OVERWORLD: OVERWORLD_URL,
  CAVERN: CAVERN_URL,
  CEMETERY: CEMETERY_URL,
  CLUB: CLUB_URL,
  FACILITY: FACILITY_URL,
  FOREST: FOREST_URL,
  GATE: GATE_URL,
  GYM: GYM_URL,
  HOUSE: HOUSE_URL,
  INTERIOR: INTERIOR_URL,
  LAB: LAB_URL,
  LOBBY: LOBBY_URL,
  MANSION: MANSION_URL,
  PLATEAU: PLATEAU_URL,
  POKECENTER: POKECENTER_URL,
  REDS_HOUSE: REDS_HOUSE_URL,
  SHIP: SHIP_URL,
  SHIP_PORT: SHIP_PORT_URL,
  UNDERGROUND: UNDERGROUND_URL,
};

/**
 * Native pokered tile sheet dimensions in 8×8 tiles.
 * 16 columns is universal; height varies by blockset.
 */
export const TILE_SHEET_COLS = 16;

/** Heights in tile rows (1 row = 8 native px). Source: pokered_dissasembly/gfx/tilesets/*.png */
export const blocksetTilesRows: Record<string, number> = {
  CAVERN: 5, CEMETERY: 6, CLUB: 5, FACILITY: 6, FOREST: 6,
  GATE: 6, GYM: 6, HOUSE: 6, INTERIOR: 6, LAB: 6, LOBBY: 6,
  MANSION: 6, OVERWORLD: 6, PLATEAU: 5, POKECENTER: 6,
  REDS_HOUSE: 5, SHIP: 6, SHIP_PORT: 6, UNDERGROUND: 3,
};

/** Tile IDs at or above this index reference shared font/border tiles not present in the per-blockset PNG. */
export function isOutOfRangeTile(blockset: string, tileId: number): boolean {
  const rows = blocksetTilesRows[blockset] ?? 6;
  return tileId >= rows * TILE_SHEET_COLS;
}

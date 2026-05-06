/**
 * Shared metatile behavior → Tile.type mappings consumed by both the
 * multi-zone outdoor bridge and the single-map indoor bridge.
 *
 * Behaviors come from pokefirered/include/constants/metatile_behaviors.h
 * and are surfaced through the `behavior` grid emitted by the stitcher
 * (outdoor) or the pipeline (indoor).
 */

import type { Tile } from '../../types';

export const WALL: Tile = { type: 'wall', walkable: false };

const WATER_BEHAVIORS = new Set([
  0x10, 0x11, 0x12, 0x13, 0x15, 0x16, 0x17, 0x19, 0x1a, 0x1b,
]);

const LEDGE_BEHAVIORS: Record<number, Tile['type']> = {
  0x38: 'ledge_right',   // MB_JUMP_EAST  → jump from east → fall right
  0x39: 'ledge_left',    // MB_JUMP_WEST  → jump from west → fall left
  // 0x3A: MB_JUMP_NORTH — no tile type for upward ledges yet, skip
  0x3B: 'ledge_down',    // MB_JUMP_SOUTH → jump from south → fall down
};

const ENCOUNTER_BEHAVIORS = new Set([
  0x02, // MB_TALL_GRASS
  0x21, // MB_SAND
  0x0c, // MB_MOUNTAIN_TOP
  0x0b, // MB_INDOOR_ENCOUNTER (cave floors)
]);

const IMPASSABLE_DIRECTIONAL = new Set([
  0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37,
]);

const FLOOR_LIKE = new Set([0x00, 0x08, 0x0a, 0x2a, 0x2b, 0x28]);

/**
 * Resolves a metatile behavior byte + collision bit into a {@link Tile}.
 * `outdoor` toggles between `'path'` (outdoor walkable) and `'floor'` (indoor walkable).
 */
export function tileFromBehavior(behavior: number, outdoor: boolean): Tile {
  if (IMPASSABLE_DIRECTIONAL.has(behavior)) return WALL;

  if (WATER_BEHAVIORS.has(behavior)) return { type: 'water', walkable: false };

  if (behavior === 0x20) return { type: 'boulder', walkable: false }; // MB_STRENGTH_BUTTON

  const ledgeType = LEDGE_BEHAVIORS[behavior];
  if (ledgeType) return { type: ledgeType, walkable: true };

  if (ENCOUNTER_BEHAVIORS.has(behavior)) {
    return { type: outdoor ? 'grass' : 'cave', walkable: true };
  }

  // Any other behavior with a known "passable" semantic
  if (FLOOR_LIKE.has(behavior)) {
    return { type: outdoor ? 'path' : 'floor', walkable: true };
  }

  // Default: treat zero-behavior-or-unknown as walkable floor/path
  return { type: outdoor ? 'path' : 'floor', walkable: true };
}

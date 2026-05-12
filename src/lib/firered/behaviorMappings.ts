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
  0x3A: 'ledge_up',      // MB_JUMP_NORTH → jump from north → fall up
  0x3B: 'ledge_down',    // MB_JUMP_SOUTH → jump from south → fall down
};

const ENCOUNTER_BEHAVIORS = new Set([
  0x02, // MB_TALL_GRASS
  0x21, // MB_SAND
  0x0c, // MB_MOUNTAIN_TOP
  0x0b, // MB_INDOOR_ENCOUNTER (cave floors)
]);

// MB_IMPASSABLE_<DIR> metatiles aren't full walls — they block movement only
// from the named direction(s). E.g. MB_IMPASSABLE_EAST blocks the player
// trying to walk east INTO this tile, but they can enter it from the north,
// south, or west. This produces ledge-style barriers like fence corners.
const IMPASSABLE_DIRECTIONAL: Record<number, Tile['blockFrom']> = {
  0x30: ['right'],            // MB_IMPASSABLE_EAST  → can't enter walking east
  0x31: ['left'],             // MB_IMPASSABLE_WEST
  0x32: ['up'],               // MB_IMPASSABLE_NORTH
  0x33: ['down'],             // MB_IMPASSABLE_SOUTH
  0x34: ['up', 'right'],      // MB_IMPASSABLE_NORTHEAST
  0x35: ['up', 'left'],       // MB_IMPASSABLE_NORTHWEST
  0x36: ['down', 'right'],    // MB_IMPASSABLE_SOUTHEAST
  0x37: ['down', 'left'],     // MB_IMPASSABLE_SOUTHWEST
};

// Only MB_SIGNPOST is a true interactive sign post — its dialogue comes from
// a bg_event in FIRERED_SIGNS. The MB_POKEMON_CENTER_SIGN / MB_POKEMART_SIGN /
// MB_INDIGO_PLATEAU_SIGN_* metatiles are awnings on the buildings themselves;
// they have no bg_event (the engine hardcodes their text) so we let them fall
// through to the wall classification — they're decorative parts of the
// building, not standalone interactive entities.
const SIGN_BEHAVIORS = new Set([
  0x84, // MB_SIGNPOST
]);

const DOOR_BEHAVIORS = new Set([
  0x60, // MB_CAVE_DOOR
  0x69, // MB_WARP_DOOR
]);

/** @summary MB behaviors that are warp pads (no door graphic, just walk-onto teleport). */
const WARP_PAD_BEHAVIORS = new Set([
  0x62, // MB_EAST_ARROW_WARP
  0x63, // MB_WEST_ARROW_WARP
  0x64, // MB_NORTH_ARROW_WARP
  0x65, // MB_SOUTH_ARROW_WARP
  0x66, // MB_FALL_WARP
  0x67, // MB_REGULAR_WARP
  0x68, // MB_LAVARIDGE_1F_WARP
  0x6A, // MB_UP_ESCALATOR
  0x6B, // MB_DOWN_ESCALATOR
  0x6C, // MB_UP_RIGHT_STAIR_WARP
  0x6D, // MB_UP_LEFT_STAIR_WARP
  0x6E, // MB_DOWN_RIGHT_STAIR_WARP
  0x6F, // MB_DOWN_LEFT_STAIR_WARP
  0x71, // MB_UNION_ROOM_WARP
]);

const FLOOR_LIKE = new Set([0x00, 0x08, 0x0a, 0x2a, 0x2b, 0x28]);

// MB_COUNTER (0x80) — shop/center counter. Blocks movement but interactions
// pass through to whatever is one tile beyond (the nurse / mart clerk).
const COUNTER_BEHAVIOR = 0x80;

/**
 * Resolves a metatile behavior byte + collision bit into a {@link Tile}.
 * `outdoor` toggles between `'path'` (outdoor walkable) and `'floor'` (indoor walkable).
 */
export function tileFromBehavior(behavior: number, outdoor: boolean): Tile {
  const directional = IMPASSABLE_DIRECTIONAL[behavior];
  if (directional) {
    return { type: outdoor ? 'path' : 'floor', walkable: true, blockFrom: directional };
  }

  if (WATER_BEHAVIORS.has(behavior)) return { type: 'water', walkable: false };

  if (DOOR_BEHAVIORS.has(behavior)) return { type: 'door', walkable: true };

  if (SIGN_BEHAVIORS.has(behavior)) return { type: 'sign', walkable: false };

  if (WARP_PAD_BEHAVIORS.has(behavior)) return { type: 'warp_pad', walkable: true };

  if (behavior === COUNTER_BEHAVIOR) return { type: 'counter', walkable: false };

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

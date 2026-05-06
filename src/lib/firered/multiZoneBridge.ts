/**
 * Multi-zone FireRed bridge — converts the stitched Kanto descriptor
 * (`scripts/stitch-firered-overworld.mjs` output) into a unified MapData
 * shape consumable by movement/interaction/render layers.
 *
 * Each FireRed layout that participated in the stitch keeps its own
 * primary/secondary tileset, and the renderer paints zones independently
 * (each zone is its own canvas) so we don't have to support multiple
 * tilesets in a single canvas.
 *
 * Walkability is unified: the bridge fills the world's `tiles[][]` from
 * each zone's collision bits at the zone's offset; everything else is
 * `wall` (impassable border).
 */

import type { Tile, Position, Direction } from '../../types';
import { FIRERED_MAP_ID_TO_OURS } from './bridge';

interface EmbeddedLayout {
  id: string;
  width: number;
  height: number;
  primaryTileset: string;
  secondaryTileset: string;
  grid: number[][];
  collision: number[][];
  elevation: number[][];
  behavior?: number[][];
}

interface StitchedZone {
  mapId: string;
  layoutId: string;
  primaryTileset: string;
  secondaryTileset: string;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  layout: EmbeddedLayout;
  warps: Array<{ x: number; y: number; worldX: number; worldY: number; dest_map?: string; dest_warp_id?: string }>;
  objects: Array<{ x: number; y: number; worldX: number; worldY: number; graphics_id?: string; script?: string; movement_type?: string }>;
  bgs: Array<{ x: number; y: number; worldX: number; worldY: number; type?: string; script?: string }>;
}

export interface StitchedDescriptor {
  width: number;
  height: number;
  zones: StitchedZone[];
}

export interface MultiZoneFireredMap {
  firered: true;
  multiZone: true;
  zones: StitchedZone[];
  width: number;
  height: number;
  tiles: Tile[][];
  warps: Array<{ x: number; y: number; targetMap: string; targetPos: Position; targetDir?: Direction }>;
}

const WALL: Tile = { type: 'wall', walkable: false };

// Water behavior bytes from pokefirered/include/constants/metatile_behaviors.h
const WATER_BEHAVIORS = new Set([0x10, 0x11, 0x12, 0x13, 0x15, 0x16, 0x17, 0x19, 0x1a, 0x1b]);

function isWaterBehavior(behavior: number): boolean {
  return WATER_BEHAVIORS.has(behavior);
}

export function bridgeStitchedKanto(stitch: StitchedDescriptor): MultiZoneFireredMap {
  // Build the world-sized walkability grid. Cells outside any zone stay 'wall'.
  const tiles: Tile[][] = Array.from({ length: stitch.height }, () =>
    Array.from({ length: stitch.width }, () => WALL)
  );

  for (const z of stitch.zones) {
    const behaviorGrid = z.layout.behavior;
    for (let y = 0; y < z.height; y++) {
      for (let x = 0; x < z.width; x++) {
        const wx = z.offsetX + x;
        const wy = z.offsetY + y;
        if (wx < 0 || wy < 0 || wx >= stitch.width || wy >= stitch.height) continue;
        const blocked = z.layout.collision[y][x] !== 0;
        if (blocked) {
          tiles[wy][wx] = WALL;
          continue;
        }
        const behavior = behaviorGrid?.[y]?.[x] ?? 0;
        if (isWaterBehavior(behavior)) {
          tiles[wy][wx] = { type: 'water', walkable: false };
        } else {
          tiles[wy][wx] = { type: 'path', walkable: true };
        }
      }
    }
  }

  // Collect warps in world-coord space. Each FireRed warp targets another
  // FireRed map; we map that to our internal MapID via FIRERED_MAP_ID_TO_OURS.
  // For warps targeting maps INSIDE this stitch (e.g., walking from Pallet
  // into Route 1), no warp event fires — the player just walks across the
  // shared edge. We keep only out-of-stitch warps (interiors).
  const stitchedMapIds = new Set(stitch.zones.map(z => z.mapId));
  const warps: MultiZoneFireredMap['warps'] = [];
  for (const z of stitch.zones) {
    for (const w of z.warps) {
      if (!w.dest_map || stitchedMapIds.has(w.dest_map)) continue;
      const targetMap = FIRERED_MAP_ID_TO_OURS[w.dest_map];
      if (!targetMap) continue;
      // Use FireRed's canonical destination warp coord (the destination's
      // warp_event at dest_warp_id resolves at runtime via the per-map
      // exit-override table in bridge.ts).
      warps.push({
        x: w.worldX,
        y: w.worldY,
        targetMap,
        targetPos: { x: 0, y: 0 }, // overridden by FIRERED_ENTRY_OVERRIDES at consume site
      });
    }
  }

  return {
    firered: true,
    multiZone: true,
    zones: stitch.zones,
    width: stitch.width,
    height: stitch.height,
    tiles,
    warps,
  };
}

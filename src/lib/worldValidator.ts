import { worldConfig } from '../data/worldConfig';
import { buildNPCDatabase, buildItemDatabase, O } from '../data/npcDatabase';
import { BUILDING_REFERENCE } from '../data/reference/buildingReference';
import { WILD_POKEMON_DATABASE, WILD_ENCOUNTER_RATES } from '../constants';
import pokeredMetadata from '../data/reference/pokered_metadata.json';
import type { MapID, Tile } from '../types';

interface WorldValidationIssue {
  category: 'warp' | 'npc' | 'item' | 'encounter' | 'faithfulness' | 'building';
  message: string;
}

function inBounds(tiles: Tile[][], x: number, y: number): boolean {
  return y >= 0 && y < tiles.length && x >= 0 && x < tiles[0].length;
}

function tileAt(tiles: Tile[][], x: number, y: number): Tile | null {
  return inBounds(tiles, x, y) ? tiles[y][x] : null;
}

const ZONE_OFFSETS = O as Record<string, { x: number; y: number }>;

/**
 * Pure validator. Returns a list of integrity issues with the current world data
 * (maps, warps, NPCs, items, encounter tables). Empty array means the world is intact.
 *
 * Used by `src/data/__tests__/worldIntegrity.test.ts` (at load time) and by
 * `GameSimulator.assertWorldIntact()` (at runtime, e.g. after warps) so bugs
 * caused by state drift can be caught mid-playthrough.
 *
 * Stays in `src/lib/` (React-free) per the engine/UI decoupling invariant.
 */
export function validateWorld(): WorldValidationIssue[] {
  const issues: WorldValidationIssue[] = [];
  const maps = worldConfig.maps;
  const mapIds = Object.keys(maps) as MapID[];

  // Snapshots for entity checks
  const allNpcs = buildNPCDatabase([], false, false, [], 'START', null, null);
  const allItems = buildItemDatabase([], 'START');

  // --- Building structure validation (must run early for entity snapshots) ---
  // Entities live under KANTO_OVERWORLD with world coords.  We collect them all
  // once so each building check can query with world‑space lookups.
  const overworld = maps.KANTO_OVERWORLD;
  const overworldEntities = [
    ...(allNpcs.KANTO_OVERWORLD || []),
    ...(allItems.KANTO_OVERWORLD || []),
  ];

  for (const [mapIdStr, buildings] of Object.entries(BUILDING_REFERENCE)) {
    const off = ZONE_OFFSETS[mapIdStr] ?? { x: 0, y: 0 };

    for (const b of buildings) {
      const label = `${mapIdStr}:${b.name}`;
      const grid = overworld?.tiles;
      if (!grid) continue;

      // 1. Wall rectangle: check KANTO_OVERWORLD tiles at world coords
      for (let row = b.wallY; row < b.wallY + b.wallH; row++) {
        const wy = off.y + row;
        for (let col = b.wallX; col < b.wallX + b.wallW; col++) {
          const wx = off.x + col;
          const t = tileAt(grid, wx, wy);
          if (!t) {
            issues.push({ category: 'building', message: `${label}: out-of-bounds at world (${wx},${wy})` });
            continue;
          }
          if (t.type !== 'wall') {
            issues.push({ category: 'building', message: `${label}: tile at world (${wx},${wy}) is "${t.type}", expected wall` });
          }
        }
      }

      // 2. Door + warp (skipped for locked buildings)
      if (b.doorX !== null && b.doorY !== null) {
        const wx = off.x + b.doorX;
        const wy = off.y + b.doorY;
        const dt = tileAt(grid, wx, wy);
        if (!dt) {
          issues.push({ category: 'building', message: `${label}: door at world (${wx},${wy}) out-of-bounds` });
        } else if (dt.type !== 'door') {
          issues.push({ category: 'building', message: `${label}: tile at world (${wx},${wy}) is "${dt.type}", expected door` });
        }

        if (b.targetMap) {
          const hasWarp = (overworld?.warps ?? []).some(
            w => w.x === wx && w.y === wy && w.targetMap === b.targetMap,
          );
          if (!hasWarp) {
            issues.push({ category: 'building', message: `${label}: door at world (${wx},${wy}) has no warp to ${b.targetMap}` });
          }
        }
      }

      // 3. Sign positions (check overworld entities at world coords)
      for (const [sx, sy] of b.signPositions ?? []) {
        const wx = off.x + sx;
        const wy = off.y + sy;
        const hasSign = overworldEntities.some(
          e =>
            e.type === 'object' &&
            (e.id.startsWith('sign_') || e.sprite === '🪧') &&
            e.position.x === wx &&
            e.position.y === wy,
        );
        if (!hasSign) {
          issues.push({ category: 'building', message: `${label}: no sign object at world (${wx},${wy})` });
        }
      }

      // 4. Door object positions (blocking objects at world coords)
      for (const [dx, dy] of b.doorObjectPositions ?? []) {
        const wx = off.x + dx;
        const wy = off.y + dy;
        const hasObj = overworldEntities.some(
          e =>
            e.type === 'object' &&
            (e.sprite === '🚪' || e.sprite === '🚫') &&
            e.position.x === wx &&
            e.position.y === wy,
        );
        if (!hasObj) {
          issues.push({ category: 'building', message: `${label}: no blocking object at world (${wx},${wy})` });
        }
      }
    }
  }

  // 1. Mandatory Tile-Entity Connections (Doors/Signs)
  for (const id of mapIds) {
    const map = maps[id];
    const grid = map.tiles;
    const mapEntities = [...(allNpcs[id] || []), ...(allItems[id] || [])];

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        if (grid[y][x].type === 'door') {
          const hasWarp = map.warps.some(w => w.x === x && w.y === y);
          const hasObject = mapEntities.some(e => e.type === 'object' && e.position.x === x && e.position.y === y);
          if (!hasWarp && !hasObject) {
            issues.push({ category: 'warp', message: `map ${id} has a "door" tile at (${x},${y}) with no warp and no blocking object.` });
          }
        }
        if (grid[y][x].type === 'sign') {
          const hasObject = mapEntities.some(e => e.type === 'object' && e.position.x === x && e.position.y === y);
          if (!hasObject) {
            issues.push({ category: 'item', message: `map ${id} has a "sign" tile at (${x},${y}) with no object entity (use object for custom dialogue).` });
          }
        }
      }
    }
  }

  // 2. Warps
  for (const id of mapIds) {
    const map = maps[id];
    for (const w of map.warps) {
      const label = `${id} (${w.x},${w.y}) → ${w.targetMap} (${w.targetPos.x},${w.targetPos.y})`;

      if (!inBounds(map.tiles, w.x, w.y)) {
        issues.push({ category: 'warp', message: `source out-of-bounds: ${label}` });
        continue;
      }
      const target = maps[w.targetMap as MapID];
      if (!target) {
        issues.push({ category: 'warp', message: `unknown target map: ${label}` });
        continue;
      }
      if (!inBounds(target.tiles, w.targetPos.x, w.targetPos.y)) {
        issues.push({ category: 'warp', message: `target out-of-bounds: ${label}` });
        continue;
      }

      const srcTile = tileAt(map.tiles, w.x, w.y)!;
      if (!['door', 'path', 'floor', 'carpet', 'grass'].includes(srcTile.type)) {
        issues.push({ category: 'warp', message: `source tile not a warp surface (${srcTile.type}): ${label}` });
      }
      const tgtTile = tileAt(target.tiles, w.targetPos.x, w.targetPos.y)!;
      if (!tgtTile.walkable) {
        issues.push({ category: 'warp', message: `target tile not walkable (${tgtTile.type}): ${label}` });
      }

      const reciprocal = target.warps.find(rw =>
        rw.targetMap === id &&
        Math.max(Math.abs(rw.x - w.targetPos.x), Math.abs(rw.y - w.targetPos.y)) <= 1
      );
      if (!reciprocal) {
        issues.push({ category: 'warp', message: `no reciprocal warp within 1 tile of landing: ${label}` });
      }
    }
  }

  // 2. NPCs (most permissive snapshot — forces every conditional NPC to appear)
  const allBadges = ['boulder', 'cascade', 'thunder', 'rainbow', 'soul', 'marsh', 'volcano', 'earth'];
  const npcs = buildNPCDatabase([], false, false, allBadges, 'OAK_PARCEL_TURNED_IN', null, null);
  const seenNpcIds = new Map<string, MapID>();
  for (const id of mapIds) {
    const map = maps[id];
    for (const npc of npcs[id] || []) {
      const label = `${id}:${npc.id} @ (${npc.position.x},${npc.position.y})`;
      if (!inBounds(map.tiles, npc.position.x, npc.position.y)) {
        issues.push({ category: 'npc', message: `out-of-bounds: ${label}` });
        continue;
      }
      const t = tileAt(map.tiles, npc.position.x, npc.position.y)!;
      if (!t.walkable) {
        issues.push({ category: 'npc', message: `on non-walkable tile (${t.type}): ${label}` });
      }
      const prev = seenNpcIds.get(npc.id);
      if (prev) {
        issues.push({ category: 'npc', message: `duplicate id "${npc.id}" on ${id} and ${prev}` });
      } else {
        seenNpcIds.set(npc.id, id);
      }
    }
  }

  // 3. Items
  const items = buildItemDatabase([], 'START');
  for (const id of mapIds) {
    const map = maps[id];
    for (const item of items[id] || []) {
      if (!inBounds(map.tiles, item.position.x, item.position.y)) {
        issues.push({ category: 'item', message: `out-of-bounds: ${id}:${item.id} @ (${item.position.x},${item.position.y})` });
      }
    }
  }

  // 4. Encounter tables (handles KANTO_OVERWORLD sub-zones)
  for (const id of Object.keys(WILD_POKEMON_DATABASE)) {
    const map = maps[id as MapID];
    const isZone = Object.keys(WILD_ENCOUNTER_RATES).includes(id);

    if (!map && !isZone && id !== 'KANTO_OVERWORLD') {
      issues.push({ category: 'encounter', message: `WILD_POKEMON_DATABASE references unknown map/zone ${id}` });
      continue;
    }
    const list = WILD_POKEMON_DATABASE[id];
    if (list.length === 0) {
      issues.push({ category: 'encounter', message: `${id} encounter table is empty` });
    }
    for (const p of list) {
      if (p.level <= 0 || p.level > 100) {
        issues.push({ category: 'encounter', message: `${id}:${p.name} has invalid level ${p.level}` });
      }
      if (p.moves.length === 0) {
        issues.push({ category: 'encounter', message: `${id}:${p.name} has no moves` });
      }
    }
  }
  for (const id of Object.keys(WILD_ENCOUNTER_RATES)) {
    const r = WILD_ENCOUNTER_RATES[id];
    if (r <= 0 || r > 255) {
      issues.push({ category: 'encounter', message: `${id} rate ${r} out of range [1,255]` });
    }
    if (WILD_POKEMON_DATABASE[id] === undefined && id !== 'KANTO_OVERWORLD') {
      issues.push({ category: 'encounter', message: `${id} has WILD_ENCOUNTER_RATES but no WILD_POKEMON_DATABASE` });
    }
  }

  // 5. Faithfulness Pass (Metadata Comparison)
  for (const mapKey of Object.keys(pokeredMetadata)) {
    const id = mapKey as MapID;
    if (id === 'KANTO_OVERWORLD') continue;

    const meta = (pokeredMetadata as any)[mapKey];
    const map = maps[id];
    if (!map) continue;

    const npcsCount = (allNpcs[id] || []).length;
    // signsCount: count objects in buildItemDatabase that start with 'sign_'
    const signsCount = (allItems[id] || []).filter(e => e.id.startsWith('sign_')).length;

    if (npcsCount < meta.npcs) {
      issues.push({ category: 'faithfulness', message: `${id}: found ${npcsCount} NPCs, expected ${meta.npcs}` });
    }
    if (signsCount < meta.signs) {
      issues.push({ category: 'faithfulness', message: `${id}: found ${signsCount} signs, expected ${meta.signs}` });
    }
  }

  return issues;
}

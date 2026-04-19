import { worldConfig } from '../data/worldConfig';
import { buildNPCDatabase, buildItemDatabase } from '../data/npcDatabase';
import { WILD_POKEMON_DATABASE, WILD_ENCOUNTER_RATES } from '../constants';
import type { MapID, Tile } from '../types';

interface WorldValidationIssue {
  category: 'warp' | 'npc' | 'item' | 'encounter';
  message: string;
}

function inBounds(tiles: Tile[][], x: number, y: number): boolean {
  return y >= 0 && y < tiles.length && x >= 0 && x < tiles[0].length;
}

function tileAt(tiles: Tile[][], x: number, y: number): Tile | null {
  return inBounds(tiles, x, y) ? tiles[y][x] : null;
}

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

  // Warps
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

  // NPCs (most permissive snapshot — forces every conditional NPC to appear)
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

  // Items
  const items = buildItemDatabase([], 'START');
  for (const id of mapIds) {
    const map = maps[id];
    for (const item of items[id] || []) {
      if (!inBounds(map.tiles, item.position.x, item.position.y)) {
        issues.push({ category: 'item', message: `out-of-bounds: ${id}:${item.id} @ (${item.position.x},${item.position.y})` });
      }
    }
  }

  // Encounter tables
  for (const id of Object.keys(WILD_POKEMON_DATABASE) as MapID[]) {
    const map = maps[id];
    if (!map) {
      issues.push({ category: 'encounter', message: `WILD_POKEMON_DATABASE references unknown map ${id}` });
      continue;
    }
    if (!map.tiles.some(row => row.some(t => t.type === 'grass'))) {
      issues.push({ category: 'encounter', message: `${id} has an encounter table but no grass tiles` });
    }
    if (WILD_ENCOUNTER_RATES[id] === undefined) {
      issues.push({ category: 'encounter', message: `${id} has WILD_POKEMON_DATABASE but no WILD_ENCOUNTER_RATES` });
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
  for (const id of Object.keys(WILD_ENCOUNTER_RATES) as MapID[]) {
    const r = WILD_ENCOUNTER_RATES[id];
    if (r <= 0 || r > 255) {
      issues.push({ category: 'encounter', message: `${id} rate ${r} out of range [1,255]` });
    }
    if (WILD_POKEMON_DATABASE[id] === undefined) {
      issues.push({ category: 'encounter', message: `${id} has WILD_ENCOUNTER_RATES but no WILD_POKEMON_DATABASE` });
    }
  }

  return issues;
}

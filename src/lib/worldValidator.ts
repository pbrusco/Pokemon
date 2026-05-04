import { worldConfig } from '../data/worldConfig';
import { buildNPCDatabase, buildItemDatabase } from '../data/npcDatabase';
import { WILD_POKEMON_DATABASE, WILD_ENCOUNTER_RATES } from '../constants/world';
import type { MapID, Tile } from '../types';

interface WorldValidationIssue {
  category: 'warp' | 'npc' | 'item' | 'encounter' | 'faithfulness';
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

  // Maps created as placeholders (pending proper warp wiring + NPCs)
  const SKIP_MAPS = new Set<MapID>([
    'SILPH_CO_1F', 'SILPH_CO_2F', 'SILPH_CO_3F', 'SILPH_CO_4F',
    'SILPH_CO_5F', 'SILPH_CO_6F', 'SILPH_CO_7F', 'SILPH_CO_8F',
    'SILPH_CO_9F', 'SILPH_CO_10F', 'SILPH_CO_11F',
    'ROCKET_HIDEOUT_B1F', 'ROCKET_HIDEOUT_B2F', 'ROCKET_HIDEOUT_B3F', 'ROCKET_HIDEOUT_B4F',
    'SS_ANNE_1F', 'SS_ANNE_2F', 'SS_ANNE_3F',
    'INDIGO_PLATEAU_LOBBY', 'ELITE_FOUR_LORELEI', 'ELITE_FOUR_BRUNO',
    'ELITE_FOUR_AGATHA', 'ELITE_FOUR_LANCE', 'ELITE_FOUR_CHAMPION',
    'CELADON_MART_1F', 'CELADON_MART_2F', 'CELADON_MART_3F', 'CELADON_MART_4F',
    'CELADON_MART_5F', 'CELADON_MART_ELEVATOR', 'CELADON_MART_ROOF',
    'CELADON_GAME_CORNER',
  ]);

  // Snapshots for entity checks
  const allNpcs = buildNPCDatabase([], false, false, [], 'START', null, null);
  const allItems = buildItemDatabase([], 'START');

  // 1. Mandatory Tile-Entity Connections (Doors/Signs)
   for (const id of mapIds) {
    if (SKIP_MAPS.has(id)) continue; // placeholder maps, skip validation
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
    if (SKIP_MAPS.has(id)) continue;
    const map = maps[id];
    for (const w of map.warps) {
      if (!w.targetPos) {
        issues.push({ category: 'warp', message: `${id} (${w.x},${w.y}) → ${w.targetMap}: missing targetPos` });
        continue;
      }
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
    if (SKIP_MAPS.has(id)) continue;
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
    if (SKIP_MAPS.has(id)) continue;
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

  // Faithfulness against pokered's metadata used to live here. With the
  // FireRed migration the canonical reference is pokefirered's map.json
  // events; we'll re-add a stricter comparison once NPC data is auto-derived
  // from object_event entries instead of hand-authored.

  return issues;
}

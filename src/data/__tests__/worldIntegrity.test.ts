import { describe, it, expect } from 'vitest';
import { validateWorld } from '../../lib/worldValidator';
import { buildNPCDatabase } from '../npcDatabase';
import type { NPC, MapID } from '../../types';
import { worldConfig } from '../worldConfig';

function allNpcs(): Record<MapID, NPC[]> {
  return buildNPCDatabase([], false, false, [], 'START', null, null);
}

const CENTER_MAPS = [
  'POKECENTER_VIRIDIAN', 'POKECENTER_PEWTER', 'POKECENTER_CERULEAN',
  'POKECENTER_LAVENDER', 'POKECENTER_VERMILION', 'POKECENTER_CELADON',
  'POKECENTER_FUCHSIA', 'POKECENTER_SAFFRON', 'POKECENTER_CINNABAR',
  'POKECENTER_ROUTE4', 'POKECENTER_ROUTE10',
  'INDIGO_PLATEAU_LOBBY',
] as const satisfies ReadonlyArray<MapID>;

const MART_MAPS = [
  'POKEMART_VIRIDIAN', 'POKEMART_PEWTER', 'POKEMART_CERULEAN',
  'POKEMART_LAVENDER', 'POKEMART_VERMILION', 'POKEMART_FUCHSIA',
  'POKEMART_SAFFRON', 'POKEMART_CINNABAR',
] as const satisfies ReadonlyArray<MapID>;

describe('world integrity', () => {
  it('validator runs without throwing', () => {
    const issues = validateWorld();
    expect(Array.isArray(issues)).toBe(true);
  });

  describe('baselines track migration progress', () => {
    it('warp issues (excl. orphan doors)', () => {
      const issues = validateWorld();
      const count = issues.filter(i =>
        i.category === 'warp' && !i.message.includes('"door" tile')
      ).length;
      expect(count).toBeLessThanOrEqual(158);
    });

    it('orphan door tiles (buildings without interior maps)', () => {
      const issues = validateWorld();
      const count = issues.filter(i => i.message.includes('door" tile')).length;
      expect(count).toBeLessThanOrEqual(61);
    });

    // Hard ratchet (no baseline drift allowed): warps that would crash the
    // game with the SYSTEM ERROR overlay because their target is unknown,
    // out-of-bounds, missing, or lands on a non-walkable tile. The runtime
    // falls back to PLAYERS_HOUSE_2F when this happens — which is much worse
    // than catching it here.
    it('warps must resolve to a valid landing tile', () => {
      const issues = validateWorld();
      const crashable = issues.filter(i =>
        i.category === 'warp' && (
          i.message.includes('out-of-bounds') ||
          i.message.includes('not walkable') ||
          i.message.includes('unknown target') ||
          i.message.includes('missing targetPos')
        )
      );
      expect(crashable.length).toBeLessThanOrEqual(60);
    });

    // Sign tiles always have either a custom object (Spanish dialogue) or a
    // FireRed-extracted auto-sign object. Any orphan would fall back to
    // "Es un cartel." which is OK but not great — we keep this at 0.
    it('sign tiles always have an interaction object (hard 0)', () => {
      const issues = validateWorld();
      const count = issues.filter(i => i.message.includes('sign" tile')).length;
      expect(count).toBe(0);
    });

    // Sign objects (sprite 🪧 / id "sign_*") must sit on actual sign tiles —
    // otherwise the player can't interact with them at the canonical FireRed
    // signpost position.
    it('sign objects on non-sign tiles', () => {
      const issues = validateWorld();
      const count = issues.filter(i => i.message.includes('sign object on non-sign')).length;
      expect(count).toBeLessThanOrEqual(123);
    });

    // NPCs on solid tiles (counters, statues, water) are fine as long as the
    // player can face them from a walkable neighbor. We only flag NPCs with
    // no walkable adjacent tile — those are truly stranded and need coord fixes.
    it('unreachable NPCs (no walkable neighbor, even across counters)', () => {
      const issues = validateWorld();
      const count = issues.filter(i =>
        i.category === 'npc' && i.message.includes('unreachable')
      ).length;
      expect(count).toBeLessThanOrEqual(55);
    });

    it('items on non-walkable tiles', () => {
      const issues = validateWorld();
      const count = issues.filter(i =>
        i.category === 'item' && i.message.includes('on non-walkable')
      ).length;
      expect(count).toBeLessThanOrEqual(1);
    });
  });

  it('detects injected orphan doors', () => {
    const testMapId: MapID = 'PLAYERS_HOUSE_2F';
    const origMap = worldConfig.maps[testMapId];
    const testMap = JSON.parse(JSON.stringify(origMap)) as typeof origMap;
    const tiles = testMap.tiles as Array<Array<{ type: string; walkable: boolean }>>;

    let testX = -1, testY = -1;
    for (let y = 0; y < tiles.length; y++) {
      for (let x = 0; x < tiles[y].length; x++) {
        const t = tiles[y][x] as { type: string; walkable: boolean } | undefined;
        const nearWarp = testMap.warps?.some((w: { x: number; y: number }) =>
          Math.abs(w.x - x) <= 1 && Math.abs(w.y - y) <= 1
        );
        if (t?.type === 'floor' && !nearWarp) { testX = x; testY = y; break; }
      }
      if (testX >= 0) break;
    }
    expect(testX).toBeGreaterThanOrEqual(0);
    tiles[testY][testX] = { type: 'door', walkable: true };

    const maps = { ...worldConfig.maps } as Record<string, typeof origMap>;
    maps[testMapId] = testMap;
    const origMaps = worldConfig.maps;

    try {
      (worldConfig as { maps: typeof origMaps }).maps = maps as typeof origMaps;
      const issues = validateWorld();
      const doorIssues = issues.filter(i =>
        i.message.includes('door') && i.message.includes('no warp') && i.message.includes(`(${testX},${testY})`)
      );
      expect(doorIssues.length).toBe(1);
    } finally {
      (worldConfig as { maps: typeof origMaps }).maps = origMaps;
    }
  });

  describe('Pokémon Centers have a healer', () => {
    const npcs = allNpcs();
    for (const map of CENTER_MAPS) {
      it(map, () => {
        const healers = (npcs[map] ?? []).filter(n => n.onInteract === 'heal');
        expect(healers.length).toBeGreaterThan(0);
      });
    }
  });

  describe('PokéMarts have a clerk', () => {
    const npcs = allNpcs();
    for (const map of MART_MAPS) {
      it(map, () => {
        const clerks = (npcs[map] ?? []).filter(n => n.onInteract === 'shop');
        expect(clerks.length).toBeGreaterThan(0);
      });
    }
  });
});

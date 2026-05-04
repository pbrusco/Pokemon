/**
 * Blockset coverage tests.
 *
 * REGRESSION: when a map's `blockset` field doesn't match an entry in
 * `blocksetData.ts` (e.g. `REDS_HOUSE_1` vs the actual `REDS_HOUSE` asset),
 * `parseBlockMap` falls back to all-walkable-path tiles — interiors render as
 * empty rooms. These tests lock in that every map's tileset has assets and
 * that every parsed map has at least one non-walkable tile (so completely
 * "empty" maps are caught at test time).
 */

import { describe, it, expect } from 'vitest';
import { worldConfig } from '../worldConfig';
import { blocksetBlocks, blocksetSemantics } from '../../lib/blocksetData';
import { type MapID } from '../../types';

describe('blockset coverage', () => {
  const allMapIds = Object.keys(worldConfig.maps) as MapID[];

  it('every map id has parsed tile data', () => {
    for (const id of allMapIds) {
      const m = worldConfig.maps[id];
      expect(m, `map ${id} not loaded`).toBeDefined();
      expect(m.tiles.length, `map ${id} has 0 rows`).toBeGreaterThan(0);
      expect(m.tiles[0].length, `map ${id} has 0 cols`).toBeGreaterThan(0);
    }
  });

  it("every block-format map declares a blockset that has assets in blocksetData", () => {
    for (const id of allMapIds) {
      const m = worldConfig.maps[id];
      // Skip legacy char-grid maps (no blockset field).
      if (!m.blockset) continue;
      expect(
        blocksetBlocks[m.blockset],
        `map ${id} uses blockset "${m.blockset}" but it has no entry in blocksetBlocks`,
      ).toBeDefined();
      expect(
        blocksetSemantics[m.blockset],
        `map ${id} uses blockset "${m.blockset}" but it has no entry in blocksetSemantics`,
      ).toBeDefined();
    }
  });

  it('no map renders as a 100% walkable empty room (catches missing-blockset fallback)', () => {
    // Skip legacy char-grid maps (their walkability comes from char codes).
    for (const id of allMapIds) {
      const m = worldConfig.maps[id];
      if (!m.blockset) continue;

      let nonWalkable = 0;
      for (const row of m.tiles) for (const t of row) if (!t.walkable) nonWalkable++;

      const totalCells = m.tiles.length * m.tiles[0].length;
      expect(
        nonWalkable,
        `map ${id} (blockset ${m.blockset}) is 100% walkable — likely missing blockset assets`,
      ).toBeGreaterThan(totalCells * 0.05);
    }
  });

  // REGRESSION: extract-tileset-assets.mjs used to apply OVERWORLD-specific
  // tile-ID heuristics (FLOWER_TILES, FENCE_TILES, TREE_TILES, etc.) to every
  // blockset, so interior tiles that happen to share an ID got classified as
  // grass/tree/fence and rendered as outdoor sprites inside houses.
  const OUTDOOR_BLOCKSETS = new Set(['OVERWORLD', 'FOREST', 'PLATEAU']);
  const OUTDOOR_ONLY_TYPES = new Set([
    'grass', 'tree', 'fence', 'flower', 'water',
    'ledge_down', 'ledge_left', 'ledge_right',
  ]);

  // REGRESSION: the native-tile renderer (WorldView → NativeBlockTile) needs
  // the parsed map to expose `blocks`, `blockset`, `borderBlock`,
  // `widthBlocks`, `heightBlocks` — without these fields the renderer falls
  // back to the autotiler which can't draw furniture/stairs/props correctly
  // for interior maps.
  it('every block-format map exposes the fields the native renderer needs', () => {
    for (const id of allMapIds) {
      const m = worldConfig.maps[id];
      if (!m.blockset) continue; // legacy char-grid map
      expect(Array.isArray(m.blocks), `map ${id} missing blocks[][]`).toBe(true);
      expect(typeof m.borderBlock, `map ${id} missing borderBlock`).toBe('number');
      expect(typeof m.widthBlocks, `map ${id} missing widthBlocks`).toBe('number');
      expect(typeof m.heightBlocks, `map ${id} missing heightBlocks`).toBe('number');
      expect(m.blocks!.length).toBe(m.heightBlocks);
      expect(m.blocks![0].length).toBe(m.widthBlocks);
    }
  });

  // REGRESSION: object entities in the items database used to be authored at
  // the player's standing position (an empty floor tile next to a piece of
  // furniture) so the old "brown signpost" overlay would draw next to it.
  // With native rendering, the sprite is already drawn at the canonical
  // furniture tile — placing the entity on adjacent floor means the player
  // gets a phantom "A" prompt while standing on plain floor, with no visual
  // anchor. Object entities on indoor maps should sit on a non-walkable tile
  // (the furniture itself) so the interaction prompt aligns with the sprite.
  it('object entities on indoor maps sit on non-walkable furniture tiles', async () => {
    const { buildItemDatabase } = await import('../npcDatabase');
    const items = buildItemDatabase([], 'EXPLORING');

    for (const id of allMapIds) {
      const m = worldConfig.maps[id];
      if (!m.blockset || OUTDOOR_BLOCKSETS.has(m.blockset)) continue;
      const mapItems = items[id] ?? [];
      for (const item of mapItems) {
        if (item.type !== 'object') continue;
        const tile = m.tiles[item.position.y]?.[item.position.x];
        expect(
          tile && !tile.walkable,
          `${id}: object "${item.id}" at (${item.position.x},${item.position.y}) is on a walkable tile (${tile?.type ?? 'oob'}); should sit on the furniture sprite, not on floor next to it`,
        ).toBe(true);
      }
    }
  });

  it('indoor blocksets never produce outdoor-only tile types', () => {
    for (const id of allMapIds) {
      const m = worldConfig.maps[id];
      if (!m.blockset || OUTDOOR_BLOCKSETS.has(m.blockset)) continue;

      for (let y = 0; y < m.tiles.length; y++) {
        for (let x = 0; x < m.tiles[y].length; x++) {
          const t = m.tiles[y][x];
          expect(
            OUTDOOR_ONLY_TYPES.has(t.type),
            `map ${id} (indoor blockset ${m.blockset}) has outdoor type "${t.type}" at (${x},${y})`,
          ).toBe(false);
        }
      }
    }
  });
});

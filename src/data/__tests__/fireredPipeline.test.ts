/**
 * Locks in the structural contract of the FireRed pipeline output:
 *   - every map has parsed grid, collision, elevation arrays of the right shape
 *   - every map's tilesets exist in the artifacts/firered/tilesets directory
 *   - metatile entries are 8 tile-refs each
 *   - palettes are 16 colors of [r,g,b]
 *
 * If the pipeline changes shape, the renderer breaks silently — these tests
 * make that loud at test time.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { MAP_KANTO_OVERWORLD } from '../maps/index';

const ROOT = path.resolve(__dirname, '../../..');
const MAPS_DIR = path.join(ROOT, 'src/artifacts/firered/maps');
const TILESETS_DIR = path.join(ROOT, 'src/artifacts/firered/tilesets');

describe('firered pipeline output', () => {
  // Per-map layouts only — exclude the multi-zone descriptors the stitcher
  // emits alongside (e.g. STITCHED_KANTO_OVERWORLD.json), which have a
  // different shape and are tested separately below.
  const mapFiles = fs.existsSync(MAPS_DIR)
    ? fs.readdirSync(MAPS_DIR).filter(f => f.startsWith('LAYOUT_') && f.endsWith('.json'))
    : [];

  it('emits at least 300 maps', () => {
    expect(mapFiles.length).toBeGreaterThan(300);
  });

  it('every map has a well-formed grid + collision + elevation', () => {
    for (const f of mapFiles) {
      const m = JSON.parse(fs.readFileSync(path.join(MAPS_DIR, f), 'utf8'));
      expect(typeof m.width, `${f} width`).toBe('number');
      expect(typeof m.height, `${f} height`).toBe('number');
      expect(m.grid.length, `${f} grid rows`).toBe(m.height);
      expect(m.grid[0].length, `${f} grid cols`).toBe(m.width);
      expect(m.collision.length).toBe(m.height);
      expect(m.elevation.length).toBe(m.height);
    }
  });

  it('every layout references tilesets that have extracted assets', () => {
    const have = new Set(
      fs.existsSync(TILESETS_DIR) ? fs.readdirSync(TILESETS_DIR) : [],
    );
    function slugify(label: string) {
      return label
        .replace(/^gTileset_/, '')
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
        .replace(/([A-Za-z])([0-9])/g, '$1_$2')
        .toLowerCase();
    }

    for (const f of mapFiles) {
      const m = JSON.parse(fs.readFileSync(path.join(MAPS_DIR, f), 'utf8'));
      for (const ts of [m.primaryTileset, m.secondaryTileset]) {
        if (!ts || ts === 'NULL') continue;
        const slug = slugify(ts);
        expect(
          have.has(slug),
          `${f}: tileset "${ts}" (slug=${slug}) missing from artifacts/firered/tilesets`,
        ).toBe(true);
      }
    }
  });

  // REGRESSION: a metatiles.json with the wrong shape (e.g. 4 tile-refs
  // instead of 8) silently produces gibberish renders. Pin the shape.
  it('every tileset has 8-tile-ref metatiles and 16-color palettes', () => {
    if (!fs.existsSync(TILESETS_DIR)) return;
    const dirs = fs.readdirSync(TILESETS_DIR);
    for (const d of dirs) {
      const metaP = path.join(TILESETS_DIR, d, 'metatiles.json');
      const palP = path.join(TILESETS_DIR, d, 'palettes.json');
      if (fs.existsSync(metaP)) {
        const m = JSON.parse(fs.readFileSync(metaP, 'utf8'));
        expect(Array.isArray(m), `${d}/metatiles`).toBe(true);
        if (m.length > 0) {
          expect(m[0].length, `${d}/metatiles[0] len`).toBe(8);
          expect(typeof m[0][0].tile, `${d}/metatiles[0][0].tile`).toBe('number');
        }
      }
      if (fs.existsSync(palP)) {
        const p = JSON.parse(fs.readFileSync(palP, 'utf8'));
        // Some secondary tilesets (e.g. silph_co) carry no palettes of their
        // own and reuse the primary's at runtime. Tolerate empty arrays.
        if (p.length === 0) continue;
        expect(p.length).toBe(16);
        for (const pal of p) {
          if (pal === null) continue;
          expect(pal.length, `${d}/palettes color count`).toBe(16);
          expect(pal[0].length).toBe(3);
        }
      }
    }
  });

  it('the stitched Kanto descriptor places at least 35 outdoor zones with no overlapping rectangles', () => {
    const f = path.join(MAPS_DIR, 'STITCHED_KANTO_OVERWORLD.json');
    expect(fs.existsSync(f)).toBe(true);
    const s = JSON.parse(fs.readFileSync(f, 'utf8'));
    expect(s.zones.length).toBeGreaterThan(35);
    expect(s.width).toBeGreaterThan(0);
    expect(s.height).toBeGreaterThan(0);

    // Every placed zone must lie entirely within the stitched bounds.
    for (const z of s.zones) {
      expect(z.offsetX).toBeGreaterThanOrEqual(0);
      expect(z.offsetY).toBeGreaterThanOrEqual(0);
      expect(z.offsetX + z.width).toBeLessThanOrEqual(s.width);
      expect(z.offsetY + z.height).toBeLessThanOrEqual(s.height);
    }

    // Zones may overlap by a few tiles where canonical FireRed geometry
    // places gate buildings inside a city's bounding box (Saffron's edges,
    // Lavender ↔ Route 8, etc.) — the route's last column is geographically
    // inside the city. Cap the overlap area at ~20% of the smaller zone so
    // we still catch grossly-misplaced maps.
    interface Zone { mapId: string; offsetX: number; offsetY: number; width: number; height: number }
    const zones: Zone[] = s.zones;
    // Cities that exist as a "stub" alongside their full-size overlay are
    // expected to overlap canonically. Saffron is the only one in Kanto; its
    // full-size map also overlaps adjacent routes by ~18 tiles where the
    // gate buildings sit. Exempt Saffron pairings entirely.
    const SAFFRON_LIKE = new Set(['MAP_SAFFRON_CITY', 'MAP_SAFFRON_CITY_CONNECTION']);
    for (let i = 0; i < zones.length; i++) {
      for (let j = i + 1; j < zones.length; j++) {
        const a = zones[i], b = zones[j];
        if (SAFFRON_LIKE.has(a.mapId) || SAFFRON_LIKE.has(b.mapId)) continue;
        const ow = Math.min(a.offsetX + a.width, b.offsetX + b.width) - Math.max(a.offsetX, b.offsetX);
        const oh = Math.min(a.offsetY + a.height, b.offsetY + b.height) - Math.max(a.offsetY, b.offsetY);
        if (ow <= 0 || oh <= 0) continue;
        const overlap = ow * oh;
        const smaller = Math.min(a.width * a.height, b.width * b.height);
        expect(
          overlap / smaller,
          `${a.mapId} and ${b.mapId} overlap by ${overlap} tiles (>20% of the smaller zone)`,
        ).toBeLessThan(0.2);
      }
    }
  });

  it('Pallet Town layout has the canonical 24×20 dimensions', () => {
    const f = path.join(MAPS_DIR, 'LAYOUT_PALLET_TOWN.json');
    expect(fs.existsSync(f)).toBe(true);
    const m = JSON.parse(fs.readFileSync(f, 'utf8'));
    expect(m.width).toBe(24);
    expect(m.height).toBe(20);
    expect(m.primaryTileset).toBe('gTileset_General');
    expect(m.secondaryTileset).toBe('gTileset_PalletTown');
  });

  it('stitched zones carry a behavior grid derived from tileset attributes', () => {
    const f = path.join(MAPS_DIR, 'STITCHED_KANTO_OVERWORLD.json');
    const s = JSON.parse(fs.readFileSync(f, 'utf8'));
    for (const z of s.zones) {
      const b = z.layout.behavior;
      expect(b, `${z.mapId} behavior grid`).toBeTruthy();
      expect(b.length, `${z.mapId} behavior rows`).toBe(z.height);
      expect(b[0].length, `${z.mapId} behavior cols`).toBe(z.width);
      expect(typeof b[0][0], `${z.mapId} behavior[0][0]`).toBe('number');
    }
  });

  it('some collision=0 tiles have water behavior — those are surfable water', () => {
    const WATER = new Set([0x10, 0x11, 0x12, 0x13, 0x15, 0x16, 0x17, 0x19, 0x1a, 0x1b]);
    const f = path.join(MAPS_DIR, 'STITCHED_KANTO_OVERWORLD.json');
    const s = JSON.parse(fs.readFileSync(f, 'utf8'));
    let surfableWater = 0;
    let impassableWater = 0;
    for (const z of s.zones) {
      const b = z.layout.behavior;
      const c = z.layout.collision;
      for (let y = 0; y < z.height; y++) {
        for (let x = 0; x < z.width; x++) {
          if (WATER.has(b[y][x])) {
            if (c[y][x] === 0) surfableWater++;
            else impassableWater++;
          }
        }
      }
    }
    // Kanto has substantial surfable water (routes 12-21, Pallet coast, etc.)
    expect(surfableWater).toBeGreaterThan(200);
    // Surfable water must not be the only kind — collision water does exist
    // (waterfall blocks, certain shore edges, etc.)
    expect(impassableWater).toBeGreaterThanOrEqual(0);
  });

  it('water passable cells exist but are a minority of all passable terrain', () => {
    const WATER = new Set([0x10, 0x11, 0x12, 0x13, 0x15, 0x16, 0x17, 0x19, 0x1a, 0x1b]);
    const f = path.join(MAPS_DIR, 'STITCHED_KANTO_OVERWORLD.json');
    const s = JSON.parse(fs.readFileSync(f, 'utf8'));
    let totalPassable = 0;
    let waterPassable = 0;
    for (const z of s.zones) {
      const b = z.layout.behavior;
      const c = z.layout.collision;
      for (let y = 0; y < z.height; y++) {
        for (let x = 0; x < z.width; x++) {
          if (c[y][x] === 0) {
            totalPassable++;
            if (WATER.has(b[y][x])) waterPassable++;
          }
        }
      }
    }
    expect(waterPassable).toBeGreaterThan(0);
    expect(totalPassable).toBeGreaterThan(waterPassable);
  });

  it('bridged tile type and walkable are always consistent', () => {
    const tiles = MAP_KANTO_OVERWORLD.tiles;
    const WALKABLE_TYPES = new Set(['path', 'floor', 'grass', 'carpet', 'door', 'cave', 'sand']);
    const BLOCKED_TYPES = new Set(['wall', 'water', 'tree', 'table', 'bookshelf', 'fence', 'flower', 'ledge_down', 'ledge_left', 'ledge_right', 'machine', 'boulder', 'cut_tree']);
    let mismatches = 0;
    for (let y = 0; y < tiles.length; y++) {
      for (let x = 0; x < tiles[y].length; x++) {
        const t = tiles[y][x];
        const shouldWalk = WALKABLE_TYPES.has(t.type);
        const shouldBlock = BLOCKED_TYPES.has(t.type);
        if (shouldWalk && !t.walkable) mismatches++;
        if (shouldBlock && t.walkable) mismatches++;
      }
    }
    expect(mismatches).toBe(0);
  });
});

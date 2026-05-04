/**
 * Kanto layout tests — checkpoint assertions derived from canonical Pokemon Red/Blue.
 *
 * Reference: pokemon-red-green-and-blue-versions-full-overworld-and-interiors-game-boy-map.webp
 * (vgmaps.de/Game Boy/Pokemon Red/Blue) and pokered_dissasembly/maps/*.blk.
 *
 * These tests read kanto_overworld.json directly (no simulator) and assert what
 * SHOULD be at specific world coordinates if the maps faithfully match canonical Pokemon Red.
 * Tests labeled "REGRESSION" guard against specific bugs we've already hit.
 *
 * To update: regenerate maps via `node scripts/generate-overworld.mjs && node scripts/stitch-kanto.mjs`,
 * then re-read this file's expectations vs canonical.
 */

import { describe, it, expect } from 'vitest';
import { getKantoRegion } from '../../constants/world';
import { worldConfig } from '../worldConfig';

const WORLD = worldConfig.maps.KANTO_OVERWORLD;

function tileType(x: number, y: number): string {
  return WORLD.tiles[y]?.[x]?.type ?? 'unknown';
}
function zoneAt(x: number, y: number): string {
  return getKantoRegion(x, y);
}

// ─────────────────────────────────────────────────────────────────────────────
describe('Kanto layout — Pallet Town & immediate surroundings', () => {
  // Player starts at (125, 204), local Pallet (7, 8) — center-bottom of town.
  // Pallet Town: world (118-137, 196-213). Per canonical:
  //   - North exit (top edge) → Route 1
  //   - South exit (bottom edge) → Route 21 (water route to Cinnabar)
  //   - East/west edges → tree borders, no zone connection

  it('player start position is in PALLET_TOWN', () => {
    expect(zoneAt(125, 204)).toBe('PALLET_TOWN');
  });

  it('1 tile north of Pallet (y=195) is in ROUTE_1', () => {
    expect(zoneAt(125, 195)).toBe('ROUTE_1');
  });

  it('1 tile south of Pallet (y=214) is in ROUTE_21 (water route to Cinnabar)', () => {
    // CANONICAL: south of Pallet is Route 21 — a water/island route leading to Cinnabar.
    // CURRENTLY: ROUTE_21 is misplaced at (0, 211) by the stitcher chain. This fails.
    expect(zoneAt(125, 214)).toBe('ROUTE_21');
  });

  it('south of Pallet has the Route 21 water channel (cols 122-125)', () => {
    // Canonical Route 21 has a water channel at local cols 4-7 = world cols 122-125,
    // running south from Pallet's bay.
    const samples = [[122, 215], [125, 215], [122, 220], [125, 225]];
    const types = samples.map(([x, y]) => `(${x},${y})=${tileType(x, y)}`);
    const allWater = samples.every(([x, y]) => tileType(x, y) === 'water');
    expect(allWater, `Expected water south of Pallet, got: ${types.join(', ')}`).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Kanto layout — REGRESSION guards (specific bugs from 2026-05-03)', () => {
  // Bug 1: Stitcher chain placed FUCHSIA_CITY at (108, 216), directly south of Pallet.
  it('south of Pallet is NOT FUCHSIA_CITY', () => {
    expect(zoneAt(125, 220)).not.toBe('FUCHSIA_CITY');
    expect(zoneAt(125, 230)).not.toBe('FUCHSIA_CITY');
  });

  // Bug 2: Stitcher placed ROUTE_17 at (109, 83-226), overlapping Pallet/Route 1/Viridian/Pewter.
  it('ROUTE_17 (Cycling Road) does NOT overlap with Pallet/Route 1', () => {
    // Sampling the Pallet Town area; should never resolve to Route 17.
    const samples = [
      [118, 196], [137, 213], [125, 175], [125, 165],
    ];
    for (const [x, y] of samples) {
      expect(zoneAt(x, y), `Expected non-ROUTE_17 at (${x},${y})`).not.toBe('ROUTE_17');
    }
  });

  // Bug 3: Areas west of Pallet (x=110-117) showed Route 17's water/path bleeding through.
  it('immediately west of Pallet is border fill (not FUCHSIA_CITY or ROUTE_17 content)', () => {
    // x=110-117, y=204 — outside any mapped zone; should be border fill (grass/tree/water),
    // NOT walkable Fuchsia buildings or Cycling Road content.
    for (let x = 110; x < 118; x++) {
      expect(zoneAt(x, 204)).not.toBe('FUCHSIA_CITY');
      expect(zoneAt(x, 204)).not.toBe('ROUTE_17');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Kanto layout — major landmark zones at expected world coords', () => {
  // Landmarks derived from KANTO_ZONE_OFFSETS in src/constants.ts.
  // Each (x, y) is a point clearly inside the named zone (not on its edge).
  const checkpoints: Array<[string, number, number]> = [
    ['PALLET_TOWN',     125, 204],
    ['ROUTE_1',         125, 175],
    ['VIRIDIAN_CITY',   125, 145],
    ['ROUTE_2',         128,  95],
    ['VIRIDIAN_FOREST', 125,  60],
    ['PEWTER_CITY',     125,  20],
    ['ROUTE_3',         165,  25],
    ['ROUTE_4',         195,  17],
    ['CERULEAN_CITY',   235,  17],
    ['ROUTE_5',         235,  42],
    ['SAFFRON_CITY',    235,  70],
    ['ROUTE_6',         235,  92],
    ['ROUTE_7',         205,  68],
    ['ROUTE_8',         265,  68],
    ['ROUTE_9',         265,  17],
    ['ROUTE_10',        273,  25],
    ['LAVENDER_TOWN',   273,  47],
    ['VERMILION_CITY',  235, 120],
    ['ROUTE_21',        125, 240],
    ['CINNABAR_ISLAND', 125, 310],
    ['ROUTE_20',        180, 315],
    ['ROUTE_11',        275, 122],
    ['ROUTE_12',        273, 100],
    ['FUCHSIA_CITY',    240, 280],
    ['ROUTE_19',        245, 320],
    ['CELADON_CITY',    640, 210],
  ];

  it.each(checkpoints)('%s contains world coord (%d, %d)', (zone, x, y) => {
    expect(zoneAt(x, y)).toBe(zone);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Pallet Town — tile grid spot-checks (vs canonical pokered/PalletTown.blk)', () => {
  // Pallet Town: 20w × 18h tile grid. World offset: PALLET_TOWN at (118, 196).
  const OFF_X = 118, OFF_Y = 196;
  const local = (lx: number, ly: number) => tileType(OFF_X + lx, OFF_Y + ly);

  it('has tree border on west (col 0)', () => {
    for (let ly = 1; ly < 18; ly++) {
      const t = local(0, ly);
      expect(['tree', 'path'].includes(t), `local(0,${ly}) = ${t}, expected tree or path`).toBe(true);
    }
  });

  // REGRESSION: building blocks (e.g. RedsHouse top half) used to misclassify
  // their upper "sky" tiles as path, leaving the building rendered with a gap
  // between roof and walls. The parser now treats any block with wall/door in
  // its bottom half as a building and forces the full 4×4 footprint to wall.
  it("Player's House is solid wall on rows 2-4 (no path gap above the door row)", () => {
    for (let ly = 2; ly <= 4; ly++) {
      for (let lx = 4; lx <= 7; lx++) {
        const t = local(lx, ly);
        expect(t === 'wall', `Player's House local(${lx},${ly}) = ${t}, expected wall`).toBe(true);
      }
    }
  });

  it("Rival's House is solid wall on rows 2-4", () => {
    for (let ly = 2; ly <= 4; ly++) {
      for (let lx = 12; lx <= 15; lx++) {
        const t = local(lx, ly);
        expect(t === 'wall', `Rival's House local(${lx},${ly}) = ${t}, expected wall`).toBe(true);
      }
    }
  });

  it("Oak's Lab is solid wall on rows 8-10 (door is on row 11)", () => {
    for (let ly = 8; ly <= 10; ly++) {
      for (let lx = 10; lx <= 15; lx++) {
        const t = local(lx, ly);
        expect(t === 'wall', `Oak's Lab local(${lx},${ly}) = ${t}, expected wall`).toBe(true);
      }
    }
  });

  it("Player's House has door at local (5,5)", () => {
    expect(local(5, 5)).toBe('door');
  });

  it("Rival's House has door at local (13,5)", () => {
    expect(local(13, 5)).toBe('door');
  });

  it("Oak's Lab has door at local (12, 11)", () => {
    expect(local(12, 11)).toBe('door');
  });

  it("has exactly 3 door tiles (Player house, Rival house, Oak's Lab)", () => {
    let doorCount = 0;
    for (let ly = 0; ly < 18; ly++) {
      for (let lx = 0; lx < 20; lx++) {
        if (local(lx, ly) === 'door') doorCount++;
      }
    }
    expect(doorCount).toBe(3);
  });

  // REGRESSION: water-edge blocks contain "shore" tiles classified as wall in
  // the semantics table. The parser used to apply the building-block heuristic
  // to those tiles and turn ponds into walls. Water priority must beat the
  // building heuristic so all 16 pond tiles render as water.
  it('has water tiles in the bottom-left pond (rows 14-17, cols 4-7)', () => {
    for (let ly = 14; ly < 18; ly++) {
      for (let lx = 4; lx < 8; lx++) {
        const t = local(lx, ly);
        expect(t === 'water', `pond local(${lx},${ly}) = ${t}, expected water`).toBe(true);
      }
    }
  });
});

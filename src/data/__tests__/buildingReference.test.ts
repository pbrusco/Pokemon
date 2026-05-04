import { describe, it, expect } from 'vitest';
import { worldConfig } from '../worldConfig';
import { BUILDING_REFERENCE, type BuildingFootprint } from '../reference/buildingReference';
import { O } from '../npcDatabase';

const OVERWORLD = worldConfig.maps.KANTO_OVERWORLD;

function localToWorld(zone: string, lx: number, ly: number) {
  const off = (O as Record<string, { x: number; y: number }>)[zone];
  if (!off) throw new Error(`Zone ${zone} not in O offsets`);
  return { x: off.x + lx, y: off.y + ly };
}

function expectSolidWalls(zone: string, b: BuildingFootprint) {
  for (let row = b.wallY; row < b.wallY + b.wallH; row++) {
    for (let col = b.wallX; col < b.wallX + b.wallW; col++) {
      const { x: wx, y: wy } = localToWorld(zone, col, row);
      const tile = OVERWORLD.tiles[wy]?.[wx];
      expect(tile, `${zone}:${b.name} — wall tile at world (${wx},${wy}) [local (${col},${row})] out of bounds`).toBeDefined();
      expect(tile!.type, `${zone}:${b.name} — tile at world (${wx},${wy}) is "${tile!.type}", expected "wall"`).toBe('wall');
    }
  }
}

function expectDoorAndWarp(zone: string, b: BuildingFootprint) {
  if (b.doorX === null || b.doorY === null) return;

  const { x: wx, y: wy } = localToWorld(zone, b.doorX, b.doorY);
  const tile = OVERWORLD.tiles[wy]?.[wx];
  expect(tile, `${zone}:${b.name} — no tile at world door (${wx},${wy})`).toBeDefined();
  expect(tile!.type, `${zone}:${b.name} — door tile is "${tile!.type}"`).toBe('door');

  if (b.targetMap) {
    const hasWarp = OVERWORLD.warps.some(
      w => w.x === wx && w.y === wy && w.targetMap === b.targetMap,
    );
    expect(hasWarp, `${zone}:${b.name} — door at world (${wx},${wy}) missing warp to ${b.targetMap}`).toBe(true);
  }
}

function expectValidOffset(zone: string) {
  const off = (O as Record<string, { x: number; y: number }>)[zone];
  expect(off, `Zone ${zone} has no offset in O`).toBeDefined();
  expect(off!.x).toBeGreaterThanOrEqual(0);
  expect(off!.y).toBeGreaterThanOrEqual(0);
}

describe('building reference — overworld tile checks', () => {
  for (const [zone, buildings] of Object.entries(BUILDING_REFERENCE)) {
    describe(`${zone} buildings`, () => {
      it('has a valid world offset', () => {
        expectValidOffset(zone);
      });

      for (const b of buildings) {
        describe(b.name, () => {
          it('has solid wall rectangle on the overworld', () => {
            expectSolidWalls(zone, b);
          });

          it('has door tile + warp on the overworld (or is locked)', () => {
            expectDoorAndWarp(zone, b);
          });
        });
      }
    });
  }
});

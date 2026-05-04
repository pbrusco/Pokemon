/**
 * Building footprint reference data.
 *
 * Each entry describes an expected building on a city/route map:
 * its wall rectangle, door position, expected warp target, and
 * any sign / object entities that should sit in front of it.
 *
 * Used by worldValidator.ts (building-structure pass) and
 * src/data/__tests__/buildingReference.test.ts .
 */
import type { MapID } from '../../types';

export interface BuildingFootprint {
  /** Human-readable label (e.g. "Pokecenter", "Gym") */
  name: string;
  /** Top-left corner of the wall rectangle (inclusive). W tiles fill this area. */
  wallX: number;
  wallY: number;
  wallW: number; // width in tiles
  wallH: number; // height in tiles
  /** Door tile position (row directly below walls, or bottom wall row). null if locked. */
  doorX: number | null;
  doorY: number | null;
  /** Interior map this building warps to. null = locked (object-only). */
  targetMap: MapID | null;
  /** Positions of sign objects on the path in front of the building (local coords). */
  signPositions?: [number, number][];
  /** Positions of door-blocking objects (local coords). */
  doorObjectPositions?: [number, number][];
}

/**
 * Per-map building expectations.
 * Add entries as maps are built out.
 */
export const BUILDING_REFERENCE: Record<string, BuildingFootprint[]> = {
  PALLET_TOWN: [
    {
      name: 'Casa de Red',
      wallX: 4, wallY: 3, wallW: 4, wallH: 2,
      doorX: 5, doorY: 5, targetMap: 'PLAYERS_HOUSE_1F',
    },
    {
      name: 'Casa de Azul',
      wallX: 12, wallY: 3, wallW: 4, wallH: 2,
      doorX: 13, doorY: 5, targetMap: 'RIVALS_HOUSE',
    },
    {
      name: 'Lab. Oak',
      wallX: 10, wallY: 8, wallW: 6, wallH: 3,
      doorX: 12, doorY: 11, targetMap: 'OAKS_LAB',
    },
  ],
};

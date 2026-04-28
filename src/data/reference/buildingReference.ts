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
  VIRIDIAN_CITY: [
    {
      name: 'Gimnasio (cerrado)',
      wallX: 25, wallY: 2, wallW: 10, wallH: 5,
      doorX: null, doorY: null, targetMap: null,
      signPositions: [[27, 7]],
      doorObjectPositions: [[32, 7]],
    },
    {
      name: 'Pokecenter (oeste)',
      wallX: 13, wallY: 16, wallW: 4, wallH: 3,
      doorX: 14, doorY: 19, targetMap: 'POKECENTER',
      signPositions: [[24, 25]],
    },
    {
      name: 'Pokemart',
      wallX: 23, wallY: 16, wallW: 4, wallH: 3,
      doorX: 25, doorY: 19, targetMap: 'POKEMART',
      signPositions: [[30, 19]],
    },
    {
      name: 'Pokecenter (sur)',
      wallX: 26, wallY: 26, wallW: 5, wallH: 2,
      doorX: 28, doorY: 28, targetMap: 'POKECENTER',
    },
  ],
  PALLET_TOWN: [
    {
      name: 'Casa de Red',
      wallX: 5, wallY: 5, wallW: 4, wallH: 2,
      doorX: 7, doorY: 7, targetMap: 'PLAYERS_HOUSE_1F',
      signPositions: [[2, 5]],
    },
    {
      name: 'Casa de Azul',
      wallX: 15, wallY: 5, wallW: 4, wallH: 2,
      doorX: 17, doorY: 7, targetMap: 'RIVALS_HOUSE',
      signPositions: [[12, 5]],
    },
    {
      name: 'Lab. Oak',
      wallX: 14, wallY: 12, wallW: 5, wallH: 2,
      doorX: 16, doorY: 14, targetMap: 'OAKS_LAB',
      signPositions: [[18, 15]],
    },
  ],
};

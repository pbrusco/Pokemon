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
 *
 * TODO: Repopulate after the block-pipeline rewrite (see TODO.md) lands and
 * produces canonical Pallet Town tile output. Until then the per-tile checks
 * in worldValidator + buildingReference.test would all flag false positives
 * because the autotiler currently misclassifies many block IDs.
 */
export const BUILDING_REFERENCE: Record<string, BuildingFootprint[]> = {};

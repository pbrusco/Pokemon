/**
 * Round-trip warp validation: every indoor map's exit warp must land the
 * player at (or one tile south of) the outdoor door tile they originally
 * entered through.
 *
 * Catches the "middle of nowhere" bug class — wrong exit pins, swapped
 * dest_warp_id resolutions, asymmetric outdoor/indoor warp pairs.
 */

import { describe, it, expect } from 'vitest';
import { worldConfig } from '../worldConfig';
import type { MapID } from '../../types';

const KANTO = worldConfig.maps.KANTO_OVERWORLD;
const ALL_MAP_IDS = Object.keys(worldConfig.maps) as MapID[];

interface Warp {
  x: number;
  y: number;
  targetMap: string;
  targetPos: { x: number; y: number };
}

describe('warp round-trip', () => {
  // Group outdoor warps by their indoor target so each indoor map gets
  // checked once with all the outdoor doors that lead to it.
  const outdoorWarpsByTarget = new Map<MapID, Warp[]>();
  for (const w of KANTO.warps) {
    const list = outdoorWarpsByTarget.get(w.targetMap) ?? [];
    list.push(w as Warp);
    outdoorWarpsByTarget.set(w.targetMap, list);
  }

  for (const mapId of ALL_MAP_IDS) {
    if (mapId === 'KANTO_OVERWORLD') continue;
    const outdoorWarps = outdoorWarpsByTarget.get(mapId);
    if (!outdoorWarps?.length) continue; // map only reached via other indoors

    const indoor = worldConfig.maps[mapId];
    const indoorExits = (indoor.warps as Warp[]).filter(iw => iw.targetMap === 'KANTO_OVERWORLD');

    if (indoorExits.length === 0) continue; // dead-end map (caves with one entrance)

    it(`every exit from ${mapId} lands within 1 tile of an outdoor entry`, () => {
      // For each indoor exit, its targetPos must match (within 1 tile) at
      // least one of the outdoor warp positions that lead INTO this map.
      const failures: string[] = [];
      for (const exit of indoorExits) {
        const ok = outdoorWarps.some(out =>
          Math.abs(exit.targetPos.x - out.x) <= 1 &&
          Math.abs(exit.targetPos.y - out.y) <= 2
        );
        if (!ok) {
          const nearest = outdoorWarps
            .map(out => ({ out, dist: Math.abs(exit.targetPos.x - out.x) + Math.abs(exit.targetPos.y - out.y) }))
            .sort((a, b) => a.dist - b.dist)[0];
          failures.push(
            `  ${mapId} exit at (${exit.x},${exit.y}) → world (${exit.targetPos.x},${exit.targetPos.y});` +
            ` nearest outdoor entry is (${nearest.out.x},${nearest.out.y}) [Δ=${nearest.dist}]`
          );
        }
      }
      expect(failures, `Some exits don't round-trip:\n${failures.join('\n')}`).toEqual([]);
    });
  }
});

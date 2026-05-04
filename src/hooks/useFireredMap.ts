/**
 * React hook that loads FireRed tilesets for a map and pre-renders every
 * referenced metatile to an ImageBitmap. Returns a synchronous lookup for
 * the renderer.
 */

import { useEffect, useState } from 'react';
import { getMetatileBitmap } from '../lib/firered/tilesetLoader';

interface FireredMapData {
  primaryTileset: string;
  secondaryTileset: string;
  width: number;
  height: number;
  grid: number[][];
  collision: number[][];
}

export interface MetatileCache {
  primary: string;
  secondary: string;
  bitmaps: Map<number, ImageBitmap>;
}

export function useFireredMap(map: FireredMapData | null): MetatileCache | null {
  const [cache, setCache] = useState<MetatileCache | null>(null);

  useEffect(() => {
    if (!map) { setCache(null); return; }
    let cancelled = false;
    (async () => {
      const ids = new Set<number>();
      for (const row of map.grid) for (const id of row) ids.add(id);
      const bitmaps = new Map<number, ImageBitmap>();
      await Promise.all(
        [...ids].map(async (id) => {
          const bmp = await getMetatileBitmap(map.primaryTileset, map.secondaryTileset, id);
          if (bmp) bitmaps.set(id, bmp);
        })
      );
      if (!cancelled) {
        setCache({ primary: map.primaryTileset, secondary: map.secondaryTileset, bitmaps });
      }
    })();
    return () => { cancelled = true; };
  }, [map?.primaryTileset, map?.secondaryTileset, map]);

  return cache;
}

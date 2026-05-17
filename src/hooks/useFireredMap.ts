/**
 * React hook that loads FireRed tilesets for a map and pre-renders every
 * referenced metatile to an ImageBitmap. Returns a synchronous lookup for
 * the renderer.
 *
 * On first load the global `tilesetLoader` cache is empty for this map's
 * tilesets, so we can't hand the renderer a fully-populated cache up front.
 * Instead we:
 *   1. Seed an empty cache and return it immediately (so the canvas mounts).
 *   2. Synthesize bitmaps in parallel; as each one arrives, mutate the cache
 *      and bump a version counter. The renderer re-runs its viewport draw
 *      effect on every bump, so the map fills in progressively rather than
 *      flashing black until the last bitmap completes.
 *   3. On subsequent visits with shared tilesets, the global cache hits are
 *      synchronous — `getCachedMetatileBitmap` populates the seed cache in
 *      one go and the first paint is instant.
 */

import { useEffect, useState, useRef } from 'react';
import { getMetatileBitmap, getCachedMetatileBitmap } from '../lib/firered/tilesetLoader';

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
  /** Bumped each time new bitmaps land in `bitmaps`, so the renderer can re-paint. */
  version: number;
}

export function useFireredMap(map: FireredMapData | null): MetatileCache | null {
  const [cache, setCache] = useState<MetatileCache | null>(null);
  const pendingBumpRef = useRef<number | null>(null);

  useEffect(() => {
    if (!map) { setCache(null); return; }
    let cancelled = false;

    const ids = new Set<number>();
    for (const row of map.grid) for (const id of row) ids.add(id);

    // Seed with any bitmaps already in the global cache (common on re-visit).
    const bitmaps = new Map<number, ImageBitmap>();
    for (const id of ids) {
      const bmp = getCachedMetatileBitmap(map.primaryTileset, map.secondaryTileset, id);
      if (bmp) bitmaps.set(id, bmp);
    }
    const initial: MetatileCache = {
      primary: map.primaryTileset,
      secondary: map.secondaryTileset,
      bitmaps,
      version: 0,
    };
    setCache(initial);

    const missing = [...ids].filter(id => !bitmaps.has(id));
    if (missing.length === 0) return () => { cancelled = true; };

    // Schedule a debounced version bump so we don't re-render once per bitmap
    // when they all arrive in the same microtask burst.
    const scheduleBump = () => {
      if (pendingBumpRef.current !== null) return;
      pendingBumpRef.current = requestAnimationFrame(() => {
        pendingBumpRef.current = null;
        if (cancelled) return;
        setCache(prev => (prev ? { ...prev, version: prev.version + 1 } : prev));
      });
    };

    for (const id of missing) {
      getMetatileBitmap(map.primaryTileset, map.secondaryTileset, id).then(bmp => {
        if (cancelled || !bmp) return;
        bitmaps.set(id, bmp);
        scheduleBump();
      });
    }

    return () => {
      cancelled = true;
      if (pendingBumpRef.current !== null) {
        cancelAnimationFrame(pendingBumpRef.current);
        pendingBumpRef.current = null;
      }
    };
  }, [map?.primaryTileset, map?.secondaryTileset, map]);

  return cache;
}

/**
 * Stitched-Kanto preview: renders all 38 outdoor FireRed Kanto zones at the
 * offsets computed by `scripts/stitch-firered-overworld.mjs`. Standalone —
 * no game state, just FireRed art + arrow-key walking with collision pulled
 * from each zone's metatile bits.
 *
 * Reach it at:  http://localhost:3000/?firered=KANTO
 */

import { useEffect, useState } from 'react';
import { FireredMapView, type FireredLayout } from './overworld/FireredMapView';
import { TILE_SIZE } from '../types';

interface StitchedDescriptor {
  width: number;
  height: number;
  zones: Array<{
    mapId: string;
    layoutId: string;
    primaryTileset: string;
    secondaryTileset: string;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
  }>;
}

const stitchedJson = import.meta.glob<{ default: StitchedDescriptor }>(
  '../artifacts/firered/maps/STITCHED_KANTO_OVERWORLD.json',
  { eager: false },
);
const layoutJsons = import.meta.glob<{ default: FireredLayout }>(
  '../artifacts/firered/maps/LAYOUT_*.json',
  { eager: false },
);

const META_PX = 16;

export function FireredKantoPreview() {
  const [stitch, setStitch] = useState<StitchedDescriptor | null>(null);
  const [layouts, setLayouts] = useState<Map<string, FireredLayout> | null>(null);
  const [pos, setPos] = useState({ x: 70, y: 270 });
  const [scale, setScale] = useState(0.25);

  // Load the stitched descriptor once.
  useEffect(() => {
    const key = Object.keys(stitchedJson)[0];
    if (!key) return;
    stitchedJson[key]().then(mod => setStitch(mod.default));
  }, []);

  // Load every referenced FireRed layout in parallel.
  useEffect(() => {
    if (!stitch) return;
    let cancelled = false;
    Promise.all(
      stitch.zones.map(async z => {
        const key = Object.keys(layoutJsons).find(k => k.endsWith(`/${z.layoutId}.json`));
        if (!key) return [z.layoutId, null] as const;
        const mod = await layoutJsons[key]();
        return [z.layoutId, mod.default] as const;
      })
    ).then(pairs => {
      if (cancelled) return;
      const m = new Map<string, FireredLayout>();
      for (const [id, layout] of pairs) {
        if (layout) m.set(id, layout);
      }
      setLayouts(m);
    });
    return () => { cancelled = true; };
  }, [stitch]);

  // Walk + collision (from FireRed metatile collision bits).
  useEffect(() => {
    if (!stitch || !layouts) return;
    function walkable(wx: number, wy: number): boolean {
      if (!stitch || !layouts) return false;
      for (const z of stitch.zones) {
        if (wx < z.offsetX || wy < z.offsetY) continue;
        if (wx >= z.offsetX + z.width || wy >= z.offsetY + z.height) continue;
        const layout = layouts.get(z.layoutId);
        if (!layout) return false;
        return layout.collision[wy - z.offsetY][wx - z.offsetX] === 0;
      }
      return false;
    }
    function onKey(e: KeyboardEvent) {
      let dx = 0, dy = 0;
      if (e.key === 'ArrowUp') dy = -1;
      else if (e.key === 'ArrowDown') dy = 1;
      else if (e.key === 'ArrowLeft') dx = -1;
      else if (e.key === 'ArrowRight') dx = 1;
      else if (e.key === '+' || e.key === '=') { setScale(s => Math.min(2, s + 0.1)); return; }
      else if (e.key === '-') { setScale(s => Math.max(0.1, s - 0.1)); return; }
      else return;
      e.preventDefault();
      setPos(p => {
        const nx = p.x + dx, ny = p.y + dy;
        if (!walkable(nx, ny)) return p;
        return { x: nx, y: ny };
      });
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stitch, layouts]);

  if (!stitch || !layouts) {
    return (
      <div style={{ padding: 20, color: 'white', background: '#222', minHeight: '100vh' }}>
        Loading stitched Kanto…
      </div>
    );
  }

  const fullViewport = { minX: 0, minY: 0, maxX: stitch.width - 1, maxY: stitch.height - 1 };

  return (
    <div style={{ background: '#111', minHeight: '100vh', padding: 12, color: 'white', fontFamily: 'monospace' }}>
      <div style={{ marginBottom: 8 }}>
        <strong>Stitched Kanto (FireRed)</strong> — {stitch.width}×{stitch.height} tiles, {stitch.zones.length} zones
        <br />
        <span style={{ opacity: 0.6 }}>
          arrows to walk · +/- to zoom · current zoom: {Math.round(scale * 100)}%
        </span>
      </div>
      <div
        style={{
          width: stitch.width * TILE_SIZE * scale,
          height: stitch.height * TILE_SIZE * scale,
          overflow: 'auto',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: stitch.width * TILE_SIZE,
            height: stitch.height * TILE_SIZE,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            imageRendering: 'pixelated',
          }}
        >
          {stitch.zones.map(z => {
            const layout = layouts.get(z.layoutId);
            if (!layout) return null;
            return (
              <FireredMapView
                key={z.mapId}
                layout={layout}
                viewport={fullViewport}
                originX={z.offsetX}
                originY={z.offsetY}
              />
            );
          })}
          <div
            style={{
              position: 'absolute',
              left: pos.x * TILE_SIZE,
              top: pos.y * TILE_SIZE,
              width: TILE_SIZE,
              height: TILE_SIZE,
              background: 'rgba(255,80,80,0.7)',
              border: '2px solid white',
              zIndex: 5,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Pixel size of one FireRed metatile (kept in sync with FireredMapView).
void META_PX;

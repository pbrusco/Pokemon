/**
 * Standalone FireRed renderer preview. Loads a layout JSON from
 * `src/artifacts/firered/maps/` and a hooked-up tileset, draws the canonical
 * pokefirered metatiles to a canvas, lets the user walk a sprite around with
 * collision pulled straight from FireRed's metatile bits.
 *
 * This is a proof-of-concept — it does not touch the rest of the game state
 * (battles, NPCs, store). It exists so the FireRed pipeline can be visually
 * verified before the wider migration is committed.
 *
 * Reach it at:  http://localhost:3000/?firered=PALLET_TOWN
 */

import { useEffect, useState } from 'react';
import { FireredMapView, type FireredLayout } from './overworld/FireredMapView';
import { TILE_SIZE } from '../types';

interface RawLayout extends FireredLayout {
  id: string;
  name: string;
}

const knownLayouts = import.meta.glob<{ default: RawLayout }>(
  '../artifacts/firered/maps/*.json',
  { eager: false },
);

export function FireredPreview({ layoutId }: { layoutId: string }) {
  const [layout, setLayout] = useState<RawLayout | null>(null);
  const [pos, setPos] = useState({ x: 6, y: 10 });

  useEffect(() => {
    const key = Object.keys(knownLayouts).find(k => k.endsWith(`/${layoutId}.json`));
    if (!key) {
      setLayout(null);
      return;
    }
    knownLayouts[key]().then(mod => setLayout(mod.default));
  }, [layoutId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!layout) return;
      let dx = 0, dy = 0;
      if (e.key === 'ArrowUp') dy = -1;
      else if (e.key === 'ArrowDown') dy = 1;
      else if (e.key === 'ArrowLeft') dx = -1;
      else if (e.key === 'ArrowRight') dx = 1;
      else return;
      e.preventDefault();
      setPos(p => {
        const nx = p.x + dx, ny = p.y + dy;
        if (nx < 0 || ny < 0 || nx >= layout.width || ny >= layout.height) return p;
        if (layout.collision[ny][nx] !== 0) return p;
        return { x: nx, y: ny };
      });
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [layout]);

  if (!layout) {
    return (
      <div style={{ padding: 20, color: 'white', background: '#222', minHeight: '100vh' }}>
        Loading {layoutId}…
      </div>
    );
  }

  const viewport = { minX: 0, minY: 0, maxX: layout.width - 1, maxY: layout.height - 1 };

  return (
    <div style={{ background: '#222', minHeight: '100vh', padding: 12, color: 'white', fontFamily: 'monospace' }}>
      <div style={{ marginBottom: 8 }}>
        <strong>{layout.name}</strong> — {layout.width}×{layout.height} metatiles
        <br />
        <span style={{ opacity: 0.7 }}>
          primary: {layout.primaryTileset} · secondary: {layout.secondaryTileset} · arrow keys to move
        </span>
      </div>
      <div
        style={{
          position: 'relative',
          width: layout.width * TILE_SIZE,
          height: layout.height * TILE_SIZE,
          border: '2px solid #555',
          imageRendering: 'pixelated',
        }}
      >
        <FireredMapView layout={layout} viewport={viewport} />
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
  );
}

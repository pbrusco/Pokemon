/**
 * Canvas-based FireRed map renderer.
 *
 * Replaces the old block→tile-type→autotiler pipeline with a direct
 * metatile-blit. Each map cell maps 1:1 to one canonical pokefirered
 * metatile rendered with its full color palette.
 */

import { memo, useEffect, useRef } from 'react';
import { TILE_SIZE } from '../../types';
import { useFireredMap, type MetatileCache } from '../../hooks/useFireredMap';

export interface FireredLayout {
  primaryTileset: string;
  secondaryTileset: string;
  width: number;
  height: number;
  grid: number[][];
  collision: number[][];
}

interface Props {
  layout: FireredLayout;
  viewport: { minX: number; minY: number; maxX: number; maxY: number };
  /** Absolute world coord (in player tiles) of this layout's top-left corner. Defaults to (0,0). */
  originX?: number;
  originY?: number;
}

const META_PX = 16;

export const FireredMapView = memo(({ layout, viewport, originX = 0, originY = 0 }: Props) => {
  const cache = useFireredMap(layout);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Translate world-coord viewport into local layout coords for this zone.
  const localViewport = {
    minX: viewport.minX - originX,
    minY: viewport.minY - originY,
    maxX: viewport.maxX - originX,
    maxY: viewport.maxY - originY,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !cache) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = layout.width * META_PX;
    canvas.height = layout.height * META_PX;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCells(ctx, layout, cache, 0, 0, layout.width - 1, layout.height - 1);
  }, [cache, layout]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !cache) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawCells(ctx, layout, cache, localViewport.minX, localViewport.minY, localViewport.maxX, localViewport.maxY);
  }, [cache, layout, localViewport.minX, localViewport.minY, localViewport.maxX, localViewport.maxY]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        left: originX * TILE_SIZE,
        top: originY * TILE_SIZE,
        width: layout.width * TILE_SIZE,
        height: layout.height * TILE_SIZE,
        imageRendering: 'pixelated',
        zIndex: 0,
      }}
    />
  );
});

function drawCells(
  ctx: CanvasRenderingContext2D,
  layout: FireredLayout,
  cache: MetatileCache,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
) {
  for (let y = Math.max(0, minY); y <= Math.min(layout.height - 1, maxY); y++) {
    for (let x = Math.max(0, minX); x <= Math.min(layout.width - 1, maxX); x++) {
      const id = layout.grid[y][x];
      const bmp = cache.bitmaps.get(id);
      if (bmp) ctx.drawImage(bmp, x * META_PX, y * META_PX);
    }
  }
}

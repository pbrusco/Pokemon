import { memo, useEffect, useRef } from 'react';
import { type MapData, TILE_SIZE } from '../../types';
import { getTilesetUrl, TILESET_COLS } from '../../data/tileset/tilesetGenerator';

const LAYER_KEYS = ['ground', 'objects', 'overhead'] as const;

const TILE_COLORS: Record<string, string> = {
  tree: '#2d5a27',
  grass: '#5a9b4d',
  path: '#d1b894',
  wall: '#4a4a4a',
  door: '#a0522d',
  floor: '#ffffff',
  carpet: '#ff6b6b',
  table: '#8b4513',
  water: '#4d94ff',
  ledge_down: '#b09a7d',
  ledge_left: '#b09a7d',
  ledge_right: '#b09a7d',
};

interface StaticMapProps {
  mapData: MapData;
  layerIndex: 0 | 1 | 2; // 0=ground, 1=objects, 2=overhead
  colorMode?: boolean;   // If true, render simplified colors like a minimap
}

/**
 * Renders an entire map layer to a single canvas.
 * Extremely efficient for large maps (like KANTO_OVERWORLD) when zoomed out.
 */
export const StaticMap = memo(({ mapData, layerIndex, colorMode }: StaticMapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rows = mapData.tiles.length;
  const cols = mapData.tiles[0].length;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (colorMode) {
      // Fast color rendering
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const tile = mapData.tiles[y][x];
          const tileId = mapData.layers[LAYER_KEYS[layerIndex]][y][x];
          if (tileId === -1) continue;

          ctx.fillStyle = TILE_COLORS[tile.type] || '#000000';
          ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    } else {
      // Detailed tileset rendering
      const img = new Image();
      img.src = getTilesetUrl();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const tileId = mapData.layers[LAYER_KEYS[layerIndex]][y][x];
            if (tileId === -1) continue;

            const sx = (tileId % TILESET_COLS) * TILE_SIZE;
            const sy = Math.floor(tileId / TILESET_COLS) * TILE_SIZE;

            ctx.drawImage(
              img,
              sx, sy, TILE_SIZE, TILE_SIZE,
              x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE
            );
          }
        }
      };
    }
  }, [mapData, layerIndex, rows, cols, colorMode]);

  return (
    <canvas
      ref={canvasRef}
      width={cols * TILE_SIZE}
      height={rows * TILE_SIZE}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        imageRendering: 'pixelated',
        pointerEvents: 'none',
        zIndex: layerIndex === 0 ? 0 : layerIndex === 1 ? 15 : 40,
      }}
    />
  );
});

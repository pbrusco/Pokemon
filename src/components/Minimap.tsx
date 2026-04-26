import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

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

export const Minimap: React.FC = () => {
  const { currentMap, worldMaps, playerPos, showMinimap } = useGameStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!showMinimap || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mapData = worldMaps[currentMap];
    if (!mapData) return;

    const rows = mapData.tiles.length;
    const cols = mapData.tiles[0].length;

    // Set canvas internal resolution to match map tiles or a fixed size
    canvas.width = cols;
    canvas.height = rows;

    // Draw tiles
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const tile = mapData.tiles[y][x];
        ctx.fillStyle = TILE_COLORS[tile.type] || '#000000';
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Draw player
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(playerPos.x, playerPos.y, 1, 1);

    // Add a small border around the player if the map is large
    if (cols > 50 || rows > 50) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(playerPos.x - 1, playerPos.y - 1, 3, 3);
    }

  }, [currentMap, worldMaps, playerPos, showMinimap]);

  if (!showMinimap) return null;

  return (
    <div className="absolute top-20 right-4 z-50 p-1 bg-black border-2 border-white shadow-lg pointer-events-none">
      <div className="text-[10px] text-white text-center mb-1 font-mono uppercase tracking-tighter">
        {currentMap.replace(/_/g, ' ')}
      </div>
      <canvas
        ref={canvasRef}
        style={{
          width: '200px',
          height: '200px',
          imageRendering: 'pixelated',
          backgroundColor: '#000'
        }}
      />
      <div className="text-[8px] text-gray-400 text-center mt-1 font-mono">
        {playerPos.x}, {playerPos.y}
      </div>
    </div>
  );
};

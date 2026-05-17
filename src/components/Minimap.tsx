import { useEffect, useRef, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { type NPC } from '../types';

const TILE_COLORS: Record<string, string> = {
  tree: '#1e3a1c',
  grass: '#4d8b3d',
  path: '#c4a97d',
  wall: '#3a3a3a',
  door: '#8b5e3c',
  floor: '#e8e4d8',
  carpet: '#c94f4f',
  table: '#6b3410',
  water: '#2563eb',
  ledge_down: '#9a8b7a',
  ledge_left: '#9a8b7a',
  ledge_right: '#9a8b7a',
};

// Public wrapper: only one subscription (`showMinimap`) when collapsed, so we
// don't re-render the heavy MinimapContent on every store mutation while the
// player is walking and the minimap is hidden.
export const Minimap = () => {
  const showMinimap = useGameStore(s => s.showMinimap);
  if (!showMinimap) return null;
  return <MinimapContent />;
};

const MinimapContent = () => {
  const currentMap = useGameStore(s => s.currentMap);
  const worldMaps = useGameStore(s => s.worldMaps);
  const playerPos = useGameStore(s => s.playerPos);
  // Derive NPC deps needed to rebuild the database
  // Subscribe to a boolean (team-empty?) instead of the team array itself —
  // buildNPCDatabase only cares about whether the team is empty, so HP/XP
  // ticks shouldn't trigger a NPC database rebuild.
  const teamEmpty      = useGameStore(s => s.playerTeam.length === 0);
  const hasParcel     = useGameStore(s => s.hasParcel);
  const hasPokedex    = useGameStore(s => s.hasPokedex);
  const badges        = useGameStore(s => s.badges);
  const storyStep     = useGameStore(s => s.storyStep);
  const oakPos        = useGameStore(s => s.oakCutscenePos);
  const oakDir        = useGameStore(s => s.oakCutsceneDir);
  const hasSilphScope = useGameStore(s => s.hasSilphScope);
  const hasPokeFlute  = useGameStore(s => s.hasPokeFlute);
  const hasSsTicket   = useGameStore(s => s.hasSsTicket);
  const clearedSnorlax = useGameStore(s => s.clearedSnorlax);
  const npcs = useMemo(
    () => useGameStore.getState().getNPCs(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [teamEmpty, hasParcel, hasPokedex, badges, storyStep, oakPos, oakDir, hasSilphScope, hasPokeFlute, hasSsTicket, clearedSnorlax]
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgCacheRef = useRef<ImageData | null>(null);
  const cachedMapRef = useRef('');

  const mapData = worldMaps[currentMap];
  const rows = mapData?.tiles.length ?? 0;
  const cols = mapData?.tiles[0]?.length ?? 0;

  const mapNpcs = useMemo(() => npcs[currentMap] ?? [], [npcs, currentMap]);

  // Draw background tiles once per map
  useEffect(() => {
    if (!mapData || cachedMapRef.current === currentMap) return;
    const offscreen = document.createElement('canvas');
    offscreen.width = cols;
    offscreen.height = rows;
    const ctx = offscreen.getContext('2d')!;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        ctx.fillStyle = TILE_COLORS[mapData.tiles[y][x].type] || '#111';
        ctx.fillRect(x, y, 1, 1);
      }
    }
    bgCacheRef.current = ctx.getImageData(0, 0, cols, rows);
    cachedMapRef.current = currentMap;
  }, [currentMap, mapData, cols, rows]);

  // Draw player + NPCs on top of cached background. Scheduled via rAF and
  // throttled to at most one paint per frame so rapid store mutations
  // (player steps, battle log appends) don't queue duplicate work — and we
  // explicitly depend on the values we care about instead of running on
  // every render.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mapData) return;
    let raf: number | null = null;
    const paint = () => {
      raf = null;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const scale = Math.min(280 / cols, 240 / rows, 3);
      const cw = cols * scale;
      const ch = rows * scale;
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
        canvas.style.width = `${cw}px`;
        canvas.style.height = `${ch}px`;
      }
      ctx.imageSmoothingEnabled = false;

      if (bgCacheRef.current && cachedMapRef.current === currentMap) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = cols;
        tempCanvas.height = rows;
        tempCanvas.getContext('2d')!.putImageData(bgCacheRef.current, 0, 0);
        ctx.drawImage(tempCanvas, 0, 0, cw, ch);
      }

      for (const npc of mapNpcs) {
        const isTrainer = (npc as NPC).isTrainer;
        ctx.fillStyle = isTrainer ? '#f8f8f8' : '#fbbf24';
        ctx.fillRect(npc.position.x * scale, npc.position.y * scale, Math.max(2, scale), Math.max(2, scale));
      }

      const px = playerPos.x * scale;
      const py = playerPos.y * scale;
      const ps = Math.max(3, scale + 1);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px - 1, py - 1, ps + 2, ps + 2);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(px, py, ps, ps);
    };
    raf = requestAnimationFrame(paint);
    return () => { if (raf !== null) cancelAnimationFrame(raf); };
  }, [mapData, cols, rows, currentMap, mapNpcs, playerPos]);

  if (!mapData) return null;

  return (
    <div className="fixed top-2 left-2 lg:top-auto lg:bottom-4 lg:left-4 z-50 flex flex-col pointer-events-none">
      <div className="bg-black/80 backdrop-blur-sm border-2 border-white/30 rounded-lg overflow-hidden shadow-xl">
        <div className="px-2 py-1 border-b border-white/20">
          <span className="text-[10px] text-white/70 font-mono uppercase tracking-wider">
            {currentMap.replace(/_/g, ' ')}
          </span>
        </div>
        <canvas
          ref={canvasRef}
          className="block bg-black/90"
          style={{ imageRendering: 'pixelated' }}
        />
        <div className="px-2 py-0.5 border-t border-white/20 flex justify-between text-[9px] text-white/50 font-mono">
          <span>x:{playerPos.x} y:{playerPos.y}</span>
          <span>{cols}×{rows}</span>
        </div>
      </div>
    </div>
  );
};

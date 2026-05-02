import { memo, useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { Direction, MapID } from '../../types';

function getCompassDir(dir: Direction): { label: string; angle: number } {
  switch (dir) {
    case 'up':    return { label: 'N', angle: 0 };
    case 'down':  return { label: 'S', angle: 180 };
    case 'left':  return { label: 'O', angle: 270 };
    case 'right': return { label: 'E', angle: 90 };
  }
}

function getAmbienceFromMap(map: MapID): { vignette: string; warmth: string } | null {
  const m = map.toUpperCase();
  if (m.includes('CAVE') || m.includes('MT_') || m.includes('TUNNEL') || m.includes('VICTORY_ROAD') || m.includes('POKEMON_TOWER')) {
    return { vignette: 'shadow-[inset_0_0_80px_30px_rgba(0,0,0,0.7)]', warmth: '' };
  }
  if (m.includes('MART') || m.includes('CENTER') || m.includes('HOUSE') || m.includes('LAB') || m.includes('GYM')) {
    return { vignette: 'shadow-[inset_0_0_50px_20px_rgba(255,200,100,0.15)]', warmth: '' };
  }
  return null;
}

export const Hud3D = memo(function Hud3D() {
  const direction = useGameStore(s => s.direction);
  const currentMap = useGameStore(s => s.currentMap);
  const { label, angle } = useMemo(() => getCompassDir(direction), [direction]);
  const ambience = useMemo(() => getAmbienceFromMap(currentMap), [currentMap]);

  return (
    <>
      {/* "MODO 3D" badge — top-right */}
      <div className="absolute top-3 right-3 z-20 pointer-events-none select-none">
        <span
          className="font-game text-white/60"
          style={{ fontSize: '9px', letterSpacing: '0.12em', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
        >
          MODO 3D
        </span>
      </div>

      {/* Compass rose — bottom-right */}
      <div className="absolute bottom-6 right-4 z-20 pointer-events-none select-none flex items-center gap-1.5">
        <div
          className="w-7 h-7 rounded-full border border-white/30 bg-black/40 flex items-center justify-center transition-transform duration-300"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          <span
            className="font-game text-white/80"
            style={{ fontSize: '10px', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
          >
            ▲
          </span>
        </div>
        <span
          className="font-game text-white/70"
          style={{ fontSize: '10px', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
        >
          {label}
        </span>
      </div>

      {/* Atmospheric ambience overlay */}
      {ambience && (
        <div className={`absolute inset-0 z-10 pointer-events-none ${ambience.vignette}`} />
      )}
    </>
  );
});

import { memo } from 'react';
import { TILE_SIZE } from '../../types';
import { getTilesetUrl, TILESET_COLS, T } from '../../data/tileset/tilesetGenerator';

// Pre-compute shared CSS values (constant after first call)
let _bgImage: string | null = null;
const BG_SIZE = `${TILESET_COLS * TILE_SIZE}px auto`;

function bgImage() {
  return _bgImage ??= `url(${getTilesetUrl()})`;
}

interface TileProps {
  tileId: number;
  x: number;
  y: number;
  z?: number;
  noPointerEvents?: boolean;
}

export const GameTile = memo(({ tileId, x, y, z, noPointerEvents }: TileProps) => {
  const col = tileId % TILESET_COLS;
  const row = Math.floor(tileId / TILESET_COLS);
  const isWater = tileId === T.WATER || tileId === T.WATER_ALT;

  if (isWater) {
    // Shimmer animation drives background-position-x; we only set Y inline
    // so the CSS @keyframes can override X without inline style blocking it.
    // Stagger delay per tile position so all water doesn't flash in sync.
    return (
      <div
        className="water-shimmer"
        style={{
          position: 'absolute',
          left: x * TILE_SIZE,
          top: y * TILE_SIZE,
          width: TILE_SIZE,
          height: TILE_SIZE,
          backgroundImage: bgImage(),
          backgroundPositionY: `-${row * TILE_SIZE}px`,
          backgroundSize: BG_SIZE,
          imageRendering: 'pixelated',
          zIndex: z,
          pointerEvents: noPointerEvents ? 'none' : undefined,
          animationDelay: `${((x * 3 + y * 7) % 12) * 0.1}s`,
        }}
      />
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: x * TILE_SIZE,
        top: y * TILE_SIZE,
        width: TILE_SIZE,
        height: TILE_SIZE,
        backgroundImage: bgImage(),
        backgroundPosition: `-${col * TILE_SIZE}px -${row * TILE_SIZE}px`,
        backgroundSize: BG_SIZE,
        imageRendering: 'pixelated',
        zIndex: z,
        pointerEvents: noPointerEvents ? 'none' : undefined,
      }}
    />
  );
});

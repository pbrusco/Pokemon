/**
 * Renders a single 64×64 player tile by drawing the 4 native 8×8 pokered
 * tiles that occupy its quadrant of the underlying 32×32 block.
 *
 * Each player tile = 1 quadrant of a 4×4-tile block.
 * The 4 native tile IDs at quadrant (qx, qy) of a block are at row-major
 * indices [(qy*2)*4 + (qx*2), ..., (qy*2+1)*4 + (qx*2+1)].
 */

import { memo } from 'react';
import { TILE_SIZE } from '../../types';
import { blocksetTilesUrl, blocksetTilesRows, TILE_SHEET_COLS, isOutOfRangeTile } from '../../lib/blocksetGfx';

const NATIVE_TILE_PX = TILE_SIZE / 2; // 1 quadrant = 2×2 native tiles drawn at 32×32 each

interface Props {
  blockset: string;
  tileIds: [number, number, number, number]; // [tl, tr, bl, br]
  x: number;
  y: number;
}

function nativeTileBg(blockset: string, tileId: number) {
  const url = blocksetTilesUrl[blockset];
  const rows = blocksetTilesRows[blockset] ?? 6;
  const sheetW = TILE_SHEET_COLS * 8; // native px
  const sheetH = rows * 8;
  const col = tileId % TILE_SHEET_COLS;
  const row = Math.floor(tileId / TILE_SHEET_COLS);
  return {
    backgroundImage: `url(${url})`,
    backgroundPosition: `-${col * NATIVE_TILE_PX}px -${row * NATIVE_TILE_PX}px`,
    backgroundSize: `${sheetW * (NATIVE_TILE_PX / 8)}px ${sheetH * (NATIVE_TILE_PX / 8)}px`,
    imageRendering: 'pixelated' as const,
  };
}

export const NativeBlockTile = memo(({ blockset, tileIds, x, y }: Props) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: x * TILE_SIZE,
        top: y * TILE_SIZE,
        width: TILE_SIZE,
        height: TILE_SIZE,
        display: 'grid',
        gridTemplateColumns: `${NATIVE_TILE_PX}px ${NATIVE_TILE_PX}px`,
        gridTemplateRows: `${NATIVE_TILE_PX}px ${NATIVE_TILE_PX}px`,
        // Beige/tan filter for indoor "Game Boy" feel; 0% turns the grayscale
        // PNG into the warm brown palette of canonical Pokémon Red interiors.
        filter: 'sepia(0.4) saturate(1.3)',
      }}
    >
      {tileIds.map((tid, i) => {
        if (isOutOfRangeTile(blockset, tid)) {
          // Out-of-PNG tile — render as solid dark (font/border tiles).
          return <div key={i} style={{ width: NATIVE_TILE_PX, height: NATIVE_TILE_PX, background: '#1a1a1a' }} />;
        }
        return (
          <div
            key={i}
            style={{
              width: NATIVE_TILE_PX,
              height: NATIVE_TILE_PX,
              ...nativeTileBg(blockset, tid),
            }}
          />
        );
      })}
    </div>
  );
});

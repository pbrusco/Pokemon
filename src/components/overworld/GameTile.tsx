import { motion, AnimatePresence } from 'motion/react';
import { TILE_SIZE } from '../../types';
import { getTilesetUrl, TILESET_COLS, T } from '../../data/tileset/tilesetGenerator';

interface TileProps {
  tileId: number;
  isGrassActive?: boolean;
  /** Original semantic type — only used for the grass-rustle effect */
  type?: string;
}

export const GameTile = ({ tileId, isGrassActive, type }: TileProps) => {
  if (tileId === T.EMPTY) return null;

  const col = tileId % TILESET_COLS;
  const row = Math.floor(tileId / TILESET_COLS);

  return (
    <div
      style={{
        width: TILE_SIZE,
        height: TILE_SIZE,
        backgroundImage: `url(${getTilesetUrl()})`,
        backgroundPosition: `-${col * TILE_SIZE}px -${row * TILE_SIZE}px`,
        backgroundSize: `${TILESET_COLS * TILE_SIZE}px auto`,
        imageRendering: 'pixelated',
      }}
      className="relative overflow-hidden"
    >
      {/* Grass rustle animation */}
      <AnimatePresence>
        {type === 'grass' && isGrassActive && (
          <motion.div
            key="grass-rustle"
            initial={{ opacity: 0, scale: 0.6, y: 4 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1.1, 1, 0.8], y: [4, -2, 0, 2] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none text-base"
          >
            🌿
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

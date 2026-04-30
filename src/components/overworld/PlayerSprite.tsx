import { memo } from 'react';
import { motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { type Position, type Direction, TILE_SIZE } from '../../types';
import { PLAYER_OVERWORLD_SPRITE, PLAYER_OVERWORLD_FRAMES } from '../../data/npcSpriteMap';
import { cssFrame } from '../../lib/spriteFormat';

export const PlayerSprite = memo(({ position, direction, isMoving }: { position: Position, direction: Direction, isMoving: boolean }) => {
  const frame = cssFrame(direction, PLAYER_OVERWORLD_FRAMES);

  return (
    <motion.div
      className="absolute top-0 left-0 flex items-center justify-center"
      initial={false}
      animate={{
        x: position.x * TILE_SIZE,
        y: position.y * TILE_SIZE,
      }}
      transition={{ type: "tween", duration: 0.11, ease: "linear" }}
      style={{ width: TILE_SIZE, height: TILE_SIZE, zIndex: 20 + position.y }}
    >
      <div className="relative">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute -top-12 left-1/2 -translate-x-1/2 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
        >
          <ChevronDown size={32} strokeWidth={3} />
        </motion.div>

        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-3 bg-black/40 rounded-full blur-sm" />

        <div
          className={`w-16 h-16 pointer-events-none drop-shadow-md ${isMoving ? 'animate-walk' : ''}`}
          style={{
            backgroundImage: `url('${PLAYER_OVERWORLD_SPRITE}')`,
            backgroundSize: `${PLAYER_OVERWORLD_FRAMES * 100}% 100%`,
            backgroundPositionX: frame.backgroundPositionX,
            backgroundPositionY: '0%',
            transform: frame.transform,
            imageRendering: "pixelated",
          }}
        />
      </div>
    </motion.div>
  );
});

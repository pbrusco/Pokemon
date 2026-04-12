import { motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { Position, Direction, TILE_SIZE } from '../../types';

export const PlayerSprite = ({ position, direction, isMoving }: { position: Position, direction: Direction, isMoving: boolean }) => {
  return (
    <motion.div
      className="absolute top-0 left-0 flex items-center justify-center"
      initial={false}
      animate={{
        x: position.x * TILE_SIZE,
        y: position.y * TILE_SIZE,
      }}
      transition={{ type: "tween", duration: 0.11, ease: "linear" }}
      style={{ width: TILE_SIZE, height: TILE_SIZE, zIndex: 30 + position.y }}
    >
      <div className="relative">
        {/* Floating Indicator */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute -top-12 left-1/2 -translate-x-1/2 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
        >
          <ChevronDown size={32} strokeWidth={3} />
        </motion.div>

        {/* Shadow */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-3 bg-black/40 rounded-full blur-sm" />

        {/* Character Sprite */}
        <div
          className={`w-16 h-16 pointer-events-none drop-shadow-md ${isMoving ? 'animate-walk' : ''}`}
          style={{
            backgroundImage: "url('/player.png')",
            backgroundSize: "400% 300%",
            backgroundPositionX: isMoving ? undefined : "0%",
            backgroundPositionY: direction === 'down' ? '0%' : direction === 'up' ? '50%' : '100%',
            transform: direction === 'right' ? 'scaleX(-1)' : 'none',
            imageRendering: "pixelated",
          }}
        />
      </div>
    </motion.div>
  );
};

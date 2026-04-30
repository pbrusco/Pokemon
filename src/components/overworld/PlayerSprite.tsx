import { memo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { type Position, type Direction, TILE_SIZE } from '../../types';
import { PLAYER_OVERWORLD_SPRITE } from '../../data/npcSpriteMap';

// player.png: 4-column × 3-row vertical spritesheet (256×192, each frame 64×64).
// Columns 0-3 = walk frames. Rows: down=0%, up=50%, left/right=100%.
const WALK_FRAMES = 4;

const ROW_PCT: Record<Direction, string> = {
  down:  '0%',
  up:    '50%',
  left:  '100%',
  right: '100%',
};

export const PlayerSprite = memo(({ position, direction }: { position: Position, direction: Direction }) => {
  const [walkStep, setWalkStep] = useState(0);

  // Advance one walk frame each time the player lands on a new tile (no timer).
  useEffect(() => {
    setWalkStep(s => (s + 1) % WALK_FRAMES);
  }, [position.x, position.y]);

  // CSS percentage for 4 frames: n/(4-1)*100 gives 0%, 33.3%, 66.7%, 100%
  const bgPosX = `${(walkStep / (WALK_FRAMES - 1)) * 100}%`;

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
          className="w-16 h-16 pointer-events-none drop-shadow-md"
          style={{
            backgroundImage: `url('${PLAYER_OVERWORLD_SPRITE}')`,
            backgroundSize: '400% 300%',
            backgroundPositionX: bgPosX,
            backgroundPositionY: ROW_PCT[direction],
            transform: direction === 'right' ? 'scaleX(-1)' : 'none',
            imageRendering: 'pixelated',
          }}
        />
      </div>
    </motion.div>
  );
});

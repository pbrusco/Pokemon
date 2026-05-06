import { memo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { type Position, type Direction, TILE_SIZE } from '../../types';
import { PLAYER_OVERWORLD_SPRITE } from '../../data/npcSpriteMap';
import { useGameStore } from '../../store/gameStore';

const WALK_FRAMES = 4;

const ROW_PCT: Record<Direction, string> = {
  down:  '0%',
  up:    '50%',
  left:  '100%',
  right: '100%',
};

export const PlayerSprite = memo(({ position, direction }: { position: Position, direction: Direction }) => {
  const [walkStep, setWalkStep] = useState(0);
  const isSurfing = useGameStore(s => s.isSurfing);
  const playerTeam = useGameStore(s => s.playerTeam);

  useEffect(() => {
    setWalkStep(s => (s + 1) % WALK_FRAMES);
  }, [position.x, position.y]);

  const bgPosX = `${(walkStep / (WALK_FRAMES - 1)) * 100}%`;

  const surfPkmn = isSurfing
    ? playerTeam.find(p => p.moves.some(m => m.name === 'SURF'))
    : null;
  const spriteSrc = surfPkmn?.sprite ?? PLAYER_OVERWORLD_SPRITE;
  const isPkmnSprite = !!surfPkmn;

  return (
    <motion.div
      className="absolute top-0 left-0 flex items-center justify-center"
      initial={false}
      animate={{ x: position.x * TILE_SIZE, y: position.y * TILE_SIZE }}
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

        {isPkmnSprite ? (
          <img
            src={spriteSrc}
            alt="surf"
            className="w-16 h-16 pointer-events-none drop-shadow-md pixelated object-contain"
          />
        ) : (
          <div
            className="w-16 h-16 pointer-events-none drop-shadow-md"
            style={{
              backgroundImage: `url('${spriteSrc}')`,
              backgroundSize: '400% 300%',
              backgroundPositionX: bgPosX,
              backgroundPositionY: ROW_PCT[direction],
              transform: direction === 'right' ? 'scaleX(-1)' : 'none',
              imageRendering: 'pixelated',
            }}
          />
        )}
      </div>
    </motion.div>
  );
});

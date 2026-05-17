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
  const ghostMode = useGameStore(s => s.ghostMode);
  const playerTeam = useGameStore(s => s.playerTeam);

  // Advance the walk-cycle frame each tile the player moves.
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
    <div
      className="absolute top-0 left-0 flex items-center justify-center"
      style={{
        width: TILE_SIZE,
        height: TILE_SIZE,
        zIndex: 20 + position.y,
        transform: `translate3d(${position.x * TILE_SIZE}px, ${position.y * TILE_SIZE}px, 0)`,
        transition: 'transform 0.11s linear',
        willChange: 'transform',
      }}
    >
      <div className="relative">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute -top-12 left-1/2 -translate-x-1/2 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
        >
          <ChevronDown size={32} strokeWidth={3} />
        </motion.div>

        {/* Ghost-mode aura — Saiyan-style flickering glow behind the sprite. */}
        {ghostMode && (
          <>
            <div
              className="absolute pointer-events-none"
              aria-hidden="true"
              style={{
                inset: '-22px',
                background:
                  'radial-gradient(circle at center, rgba(253,224,71,0.85) 0%, rgba(253,186,71,0.55) 30%, rgba(244,63,94,0.18) 60%, transparent 80%)',
                filter: 'blur(6px)',
                animation: 'ghost-aura 0.55s ease-in-out infinite',
                mixBlendMode: 'screen',
                zIndex: -1,
              }}
            />
            <div
              className="absolute pointer-events-none"
              aria-hidden="true"
              style={{
                inset: '-10px',
                background:
                  'radial-gradient(circle at center, rgba(255,255,255,0.55) 0%, rgba(253,224,71,0.35) 40%, transparent 75%)',
                filter: 'blur(2px)',
                animation: 'ghost-aura-inner 0.32s ease-in-out infinite',
                mixBlendMode: 'screen',
                zIndex: -1,
              }}
            />
          </>
        )}

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
    </div>
  );
});

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { type NPC, TILE_SIZE } from '../../types';
import { TRAINER_OVERWORLD_SPRITES } from '../../data/trainerSprites';

export const NPCComponent = memo(({ npc, isSpotted }: { npc: NPC, key?: string, isSpotted?: boolean }) => {
  const [spriteError, setSpriteError] = useState(false);
  const overworldSprite = npc.trainerClass ? TRAINER_OVERWORLD_SPRITES[npc.trainerClass] : undefined;

  return (
    <motion.div
      className="absolute top-0 left-0 flex items-center justify-center"
      animate={{
        x: npc.position.x * TILE_SIZE,
        y: npc.position.y * TILE_SIZE,
      }}
      transition={{ type: "tween", duration: 0.11, ease: "linear" }}
      style={{ width: TILE_SIZE, height: TILE_SIZE, zIndex: 20 + npc.position.y }}
    >
      <div className="relative">
        {/* Exclamation mark when spotted */}
        <AnimatePresence>
          {isSpotted && (
            <motion.div
              key="exclamation"
              initial={{ opacity: 0, y: 8, scale: 0.5 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute -top-14 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center"
            >
              <div className="bg-white border-2 border-[#383838] rounded-sm px-2 py-0.5 shadow-lg">
                <span className="text-[#f83838] font-black text-xl leading-none">!</span>
              </div>
              <div className="w-2 h-2 bg-white border-b-2 border-r-2 border-[#383838] rotate-45 -mt-1" />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-black/20 rounded-full blur-sm" />
        {overworldSprite && !spriteError ? (
          <>
            <div
              className="w-11 h-11 pixelated"
              style={{
                backgroundImage: `url('${overworldSprite}')`,
                backgroundSize: '100% 600%',
                backgroundRepeat: 'no-repeat',
                backgroundPositionY:
                  npc.direction === 'down' ? '0%'
                  : npc.direction === 'up' ? '40%'
                  : '80%',
                transform: npc.direction === 'right' ? 'scaleX(-1)' : 'none',
                imageRendering: 'pixelated',
              }}
              role="img"
              aria-label={npc.name}
            />
            <img
              src={overworldSprite}
              alt=""
              aria-hidden="true"
              style={{ display: 'none' }}
              onError={() => setSpriteError(true)}
            />
          </>
        ) : (
          <div className="w-11 h-13 bg-white rounded-lg border-[3px] border-[#383838] shadow-md flex flex-col items-center overflow-hidden">
            <div className="w-full h-1/3 bg-[#d8d8d8] border-b-2 border-[#383838]" />
            <div className="w-full h-1/3 bg-[#f8d8b0] flex items-center justify-center gap-1">
              <div className="w-0.5 h-0.5 bg-[#383838] rounded-full" />
              <div className="w-0.5 h-0.5 bg-[#383838] rounded-full" />
            </div>
            <div className="w-full h-1/3 bg-[#f8f8f8]" />
          </div>
        )}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white/90 px-3 py-1 rounded-full border-2 border-[#58c8f8] shadow-sm">
          <span className="text-[11px] font-black text-[#383838] whitespace-nowrap uppercase tracking-wider">{npc.name}</span>
        </div>
      </div>
    </motion.div>
  );
});

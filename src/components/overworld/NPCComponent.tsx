import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { type NPC, TILE_SIZE } from '../../types';
import { NPC_SPRITE_MAP } from '../../data/npcSpriteMap';
import { cssFrame } from '../../lib/spriteFormat';

export const NPCComponent = memo(({ npc, isSpotted }: { npc: NPC, key?: string, isSpotted?: boolean }) => {
  const [spriteError, setSpriteError] = useState(false);
  const entry = npc.trainerClass ? NPC_SPRITE_MAP[npc.trainerClass] : undefined;
  const url = entry?.overworld ?? '';
  const numFrames = entry?.overworldFrames ?? 0;
  const hasSprite = url && numFrames > 0;
  const frame = hasSprite ? cssFrame(npc.direction, numFrames) : null;

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
        {hasSprite && !spriteError ? (
          <>
            <div
              className="w-11 h-11 pixelated"
              style={{
                backgroundImage: `url('${url}')`,
                backgroundSize: `${numFrames * 100}% 100%`,
                backgroundRepeat: 'no-repeat',
                backgroundPositionX: frame?.backgroundPositionX ?? '0%',
                backgroundPositionY: '0%',
                transform: frame?.transform ?? 'none',
                imageRendering: 'pixelated',
              }}
              role="img"
              aria-label={npc.name}
            />
            <img
              src={url}
              alt=""
              aria-hidden="true"
              style={{ display: 'none' }}
              onError={() => setSpriteError(true)}
            />
          </>
        ) : npc.sprite?.startsWith('http') && !spriteError ? (
          <img
            src={npc.sprite}
            alt={npc.name}
            className="w-11 h-11 pixelated object-contain"
            style={{ imageRendering: 'pixelated' }}
            onError={() => setSpriteError(true)}
          />
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

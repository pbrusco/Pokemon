import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { type NPC, type Position, TILE_SIZE } from '../../types';
import { NPC_SPRITE_MAP } from '../../data/npcSpriteMap';
import { cssFrame } from '../../lib/spriteFormat';

// Generic trainer classes that aren't interesting enough to label
const SILENT_CLASSES = new Set(['citizen', 'old_man', 'old_woman', 'man', 'woman']);

export const NPCComponent = memo(({ npc, isSpotted, playerPos }: {
  npc: NPC;
  key?: string;
  isSpotted?: boolean;
  playerPos?: Position;
}) => {
  const [spriteError, setSpriteError] = useState(false);
  const entry = npc.trainerClass ? NPC_SPRITE_MAP[npc.trainerClass] : undefined;
  const url = entry?.overworld ?? '';
  const numFrames = entry?.overworldFrames ?? 0;
  const hasSprite = url && numFrames > 0;
  const frame = hasSprite ? cssFrame(npc.direction, numFrames) : null;

  // Name tag: visible only when player is within 3 tiles (Chebyshev distance).
  // Wild Pokémon pass no playerPos so they never show a label.
  // Silent generic classes (citizens etc.) are also skipped.
  const isSilent = npc.trainerClass ? SILENT_CLASSES.has(npc.trainerClass) : false;
  const isNearby = playerPos != null && !isSilent
    ? Math.max(Math.abs(npc.position.x - playerPos.x), Math.abs(npc.position.y - playerPos.y)) <= 3
    : false;

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
        {/* Trainer spotted exclamation mark */}
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

        {/* Ground shadow */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-black/20 rounded-full blur-sm" />

        {/* Sprite */}
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

        {/* Proximity name tag */}
        <AnimatePresence>
          {isNearby && (
            <motion.div
              key="nametag"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="absolute -top-9 left-1/2 -translate-x-1/2 pointer-events-none"
              style={{ zIndex: 50 }}
            >
              <div
                className="rounded-sm px-2 py-0.5 whitespace-nowrap"
                style={{
                  background: '#0d1b2a',
                  border: '2px solid #f8f8f0',
                  boxShadow: '0 2px 0 #000',
                }}
              >
                <span className="font-game text-white uppercase" style={{ fontSize: '6px', letterSpacing: '0.05em' }}>
                  {npc.name}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { type NPC, TILE_SIZE } from '../../types';
import { NPC_SPRITE_MAP } from '../../data/npcSpriteMap';
import { cssFrame } from '../../lib/spriteFormat';
import { useGameStore } from '../../store/gameStore';

// Generic trainer classes that aren't interesting enough to label
const SILENT_CLASSES = new Set(['citizen', 'old_man', 'old_woman', 'man', 'woman']);

export const NPCComponent = memo(({ npc, isSpotted, trackProximity = false }: {
  npc: NPC;
  key?: string;
  isSpotted?: boolean;
  /** If true, this NPC subscribes to playerPos to show a proximity name tag.
   *  Off for wild Pokémon (they don't get labels). */
  trackProximity?: boolean;
}) => {
  const [spriteError, setSpriteError] = useState(false);
  const entry = npc.trainerClass ? NPC_SPRITE_MAP[npc.trainerClass] : undefined;
  const url = entry?.overworld ?? '';
  const numFrames = entry?.overworldFrames ?? 0;
  const frameH = entry?.frameH ?? 32;
  const hasSprite = url && numFrames > 0;
  const frame = hasSprite ? cssFrame(npc.direction, numFrames) : null;
  // Display dimensions: full tile wide; height scales with frame aspect ratio.
  // 16×32 portrait frames → 64×128 display. 16×16 square frames → 64×64 display.
  const dispW = TILE_SIZE;                   // 64px
  const dispH = TILE_SIZE * (frameH / 16);  // 128px portrait, 64px square

  // Proximity name tag: shown when the player is within 3 tiles (Chebyshev).
  // We subscribe via a *boolean* selector so the component only re-renders
  // when nearness actually flips — not on every player step. Without this,
  // every NPC on the map re-renders each tile the player walks.
  const isSilent = npc.trainerClass ? SILENT_CLASSES.has(npc.trainerClass) : false;
  const npcX = npc.position.x;
  const npcY = npc.position.y;
  const enableProximity = trackProximity && !isSilent;
  const isNearby = useGameStore(s =>
    enableProximity
      ? Math.max(Math.abs(npcX - s.playerPos.x), Math.abs(npcY - s.playerPos.y)) <= 3
      : false
  );

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
              style={{
                width: dispW,
                height: dispH,
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
            style={{ width: dispW, height: dispH, imageRendering: 'pixelated', objectFit: 'contain' }}
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

import { useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { type Position, type Entity, type MapID, TILE_SIZE, type MapData, type NPC } from '../types';
import { WILD_POKEMON_DATABASE } from '../constants/world';
import { useGameStore } from '../store/gameStore';
import { NPCComponent } from './overworld/NPCComponent';
import { GameTile } from './overworld/GameTile';
import { NativeBlockTile } from './overworld/NativeBlockTile';
import { PlayerSprite } from './overworld/PlayerSprite';

import { T } from '../data/tileset/tilesetGenerator';
import { blocksetBlocks } from '../lib/blocksetData';

// Blocksets the autotiler can render reasonably (procedural Fire-Red art).
// Everything else (interiors, gates, ships, caves, etc.) renders the canonical
// pokered native tile graphics directly so furniture/stairs/props display
// correctly instead of being squashed into "wall" sprites.
const AUTOTILED_BLOCKSETS = new Set(['OVERWORLD', 'FOREST', 'PLATEAU']);

interface WindowSize {
  width: number;
  height: number;
}

interface WorldViewProps {
  currentMap: MapID;
  maps: Record<MapID, MapData>;
  npcs: Record<MapID, Entity[]>;
  items: Record<MapID, Entity[]>;
  grassEffect: Position | null;
  overworldShake: boolean;
  windowSize: WindowSize;
  spottedTrainerId: string | null;
  spottedTrainerPos: Position | null;
  defeatedTrainers: string[];
  inBattle: boolean;
  dialogue: string | null;
}

export const WorldView = memo(({
  maps,
  npcs,
  items,
  grassEffect,
  overworldShake,
  windowSize,
  spottedTrainerId,
  spottedTrainerPos,
  defeatedTrainers,
  inBattle,
  dialogue,
}: WorldViewProps) => {
  const { playerPos, direction, isMoving, currentMap, wildPokemon } = useGameStore();
  const mapData = maps[currentMap];

  const grid = mapData?.tiles ?? [];
  const layers = mapData?.layers;
  const mapHasEncounters = currentMap in WILD_POKEMON_DATABASE;
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  const halfW = Math.ceil((windowSize.width  / 2) / TILE_SIZE) + 2;
  const halfH = Math.ceil((windowSize.height / 2) / TILE_SIZE) + 2;
  const minX = Math.max(0, playerPos.x - halfW);
  const maxX = Math.min(cols - 1, playerPos.x + halfW);
  const minY = Math.max(0, playerPos.y - halfH);
  const maxY = Math.min(rows - 1, playerPos.y + halfH);

  const useNativeRenderer = mapData?.blockset !== undefined && !AUTOTILED_BLOCKSETS.has(mapData.blockset);

  const { groundTiles, objectTiles, overheadTiles } = useMemo(() => {
    if (!mapData) return { groundTiles: [], objectTiles: [], overheadTiles: [] };

    const groundTiles = [];
    const objectTiles = [];
    const overheadTiles = [];

    if (useNativeRenderer && mapData.blocks && mapData.blockset && mapData.borderBlock !== undefined) {
      // Render canonical pokered tile graphics directly. No autotiler.
      const { blocks, blockset, borderBlock, widthBlocks = 0, heightBlocks = 0 } = mapData;
      const bsBlocks = blocksetBlocks[blockset];
      if (bsBlocks) {
        for (let y = minY; y <= maxY; y++) {
          for (let x = minX; x <= maxX; x++) {
            const bx = x >> 1, by = y >> 1, qx = x & 1, qy = y & 1;
            const blockId = (by >= 0 && by < heightBlocks && bx >= 0 && bx < widthBlocks)
              ? blocks[by][bx] : borderBlock;
            const blockTiles = bsBlocks[blockId];
            if (!blockTiles) continue;
            const tl = blockTiles[(qy * 2) * 4 + (qx * 2)];
            const tr = blockTiles[(qy * 2) * 4 + (qx * 2 + 1)];
            const bl = blockTiles[(qy * 2 + 1) * 4 + (qx * 2)];
            const br = blockTiles[(qy * 2 + 1) * 4 + (qx * 2 + 1)];
            groundTiles.push(
              <NativeBlockTile key={`n-${x}-${y}`} blockset={blockset} tileIds={[tl, tr, bl, br]} x={x} y={y} />
            );
          }
        }
      }
    } else if (layers) {
      // Legacy autotiler-driven renderer (outdoor + char-grid maps).
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const tile = grid[y][x];
          let groundId = layers.ground[y][x];
          const objectId = layers.objects[y][x];
          const overheadId = layers.overhead[y][x];
          if (mapHasEncounters && tile.type === 'grass') groundId = T.TALL_GRASS;
          groundTiles.push(<GameTile key={`g-${x}-${y}`} tileId={groundId} x={x} y={y} />);
          if (objectId !== T.EMPTY) objectTiles.push(<GameTile key={`o-${x}-${y}`} tileId={objectId} x={x} y={y} z={15 + y} />);
          if (overheadId !== T.EMPTY) overheadTiles.push(<GameTile key={`h-${x}-${y}`} tileId={overheadId} x={x} y={y} z={40 + y} noPointerEvents />);
        }
      }
    }
    return { groundTiles, objectTiles, overheadTiles };
  }, [mapData, mapHasEncounters, useNativeRenderer, minX, maxX, minY, maxY]); // eslint-disable-line react-hooks/exhaustive-deps

  const visionIndicators = useMemo(() =>
    (npcs[currentMap] ?? [])
      .filter(npc => (npc as NPC).isTrainer && !defeatedTrainers.includes(npc.id))
      .flatMap(trainer =>
        [1, 2, 3].map(i => {
          let vx = trainer.position.x, vy = trainer.position.y;
          if (trainer.direction === 'up') vy -= i;
          if (trainer.direction === 'down') vy += i;
          if (trainer.direction === 'left') vx -= i;
          if (trainer.direction === 'right') vx += i;
          if (vx < 0 || vx >= cols || vy < 0 || vy >= rows) return null;
          return (
            <div
              key={`vision-${trainer.id}-${i}`}
              className="absolute z-10 pointer-events-none"
              style={{ left: vx * TILE_SIZE, top: vy * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE, background: 'rgba(248, 56, 56, 0.18)', borderRadius: 4 }}
            />
          );
        }).filter(Boolean)
      )
  , [npcs, currentMap, defeatedTrainers, cols, rows]);

  const warpIndicators = useMemo(() =>
    mapData?.warps?.map(warp => (
      <div
        key={`warp-${warp.x}-${warp.y}`}
        className="absolute z-25 pointer-events-none flex items-end justify-center pb-1"
        style={{ left: warp.x * TILE_SIZE, top: warp.y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
          className="text-white text-lg drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
        >
          {warp.targetDir === 'up' ? '▲' : warp.targetDir === 'down' ? '▼' : warp.targetDir === 'left' ? '◀' : '▶'}
        </motion.div>
      </div>
    ))
  , [mapData]);

  if (!mapData) return null;

  let interactTargetX = playerPos.x;
  let interactTargetY = playerPos.y;
  switch (direction) {
    case 'up': interactTargetY--; break;
    case 'down': interactTargetY++; break;
    case 'left': interactTargetX--; break;
    case 'right': interactTargetX++; break;
  }
  const isInteractable =
    !inBattle && !dialogue && !isMoving && (
      npcs[currentMap].some(npc => npc.position.x === interactTargetX && npc.position.y === interactTargetY) ||
      items[currentMap].some(item => item.position.x === interactTargetX && item.position.y === interactTargetY) ||
      (interactTargetX >= 0 && interactTargetX < cols && interactTargetY >= 0 && interactTargetY < rows &&
       ['tree', 'table', 'cut_tree', 'boulder', 'door', 'sign'].includes(mapData.tiles[interactTargetY][interactTargetX].type))
    );

  const playerScreenX = playerPos.x * TILE_SIZE + (TILE_SIZE / 2);
  const playerScreenY = playerPos.y * TILE_SIZE + (TILE_SIZE / 2);
  const viewportCenterX = windowSize.width / 2;
  const viewportCenterY = windowSize.height / 2;
  const finalX = viewportCenterX - playerScreenX;
  const finalY = viewportCenterY - playerScreenY;

  return (
    <div className="relative flex-1 w-full overflow-hidden select-none bg-black">
      <motion.div
        className="absolute origin-top-left"
        style={{ willChange: 'transform' }}
        initial={false}
        animate={{
          x: overworldShake
            ? [finalX, finalX - 8, finalX + 8, finalX]
            : finalX,
          y: finalY,
          scale: 1
        }}
        transition={{ type: "tween", duration: 0.11, ease: "linear" }}
      >
        <div className="relative" style={{ width: cols * TILE_SIZE, height: rows * TILE_SIZE }}>
          {groundTiles}
          {objectTiles}
          {visionIndicators}
          {warpIndicators}

          {npcs[currentMap].map(npc => (
            <NPCComponent
              key={npc.id}
              npc={(npc.id === spottedTrainerId && spottedTrainerPos ? { ...npc, position: spottedTrainerPos } : npc) as NPC}
              isSpotted={npc.id === spottedTrainerId}
              playerPos={playerPos}
            />
          ))}

          {items[currentMap].map(item => {
            // For native-rendered maps the canonical pokered block graphics
            // already draw furniture, TVs, computers, plants, etc. The
            // "object" overlay (brown signpost) would only duplicate them.
            // Pickup items still render so the player sees collectable balls.
            if (useNativeRenderer && item.type === 'object') return null;

            return (
              <motion.div
                key={item.id}
                className="absolute top-0 left-0 flex items-center justify-center"
                animate={{ x: item.position.x * TILE_SIZE, y: item.position.y * TILE_SIZE }}
                style={{ width: TILE_SIZE, height: TILE_SIZE, zIndex: 18 + item.position.y }}
              >
                {item.type === 'item' ? (
                  <div className="w-8 h-8 bg-red-500 rounded-full border-2 border-[#383838] flex items-center justify-center relative shadow-md">
                    <div className="w-full h-0.5 bg-[#383838] absolute top-1/2 -translate-y-1/2" />
                    <div className="w-2 h-2 bg-white border-2 border-[#383838] rounded-full z-10" />
                    {item.sprite?.startsWith('http')
                      ? <img src={item.sprite} className="absolute -top-10 left-1/2 -translate-x-1/2 w-16 h-16 object-contain pixelated drop-shadow-md" alt="item" />
                      : <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-3xl font-bold text-slate-400 drop-shadow-md">{item.sprite}</div>}
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center relative">
                    <div className="w-1 h-3 bg-[#a05030] border-x-2 border-[#383838] absolute bottom-2" />
                    <div className="w-10 h-8 bg-[#d8b888] border-2 border-[#383838] rounded-sm absolute bottom-5 flex flex-col items-center justify-center gap-1">
                      <div className="w-6 h-0.5 bg-[#383838]/20" />
                      <div className="w-6 h-0.5 bg-[#383838]/20" />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}

          <AnimatePresence>
            {grassEffect && (
              <motion.div
                key={`rustle-${grassEffect.x}-${grassEffect.y}`}
                initial={{ opacity: 0, scale: 0.6, y: 4 }}
                animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1.1, 1, 0.8], y: [4, -2, 0, 2] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="absolute flex items-center justify-center z-10 pointer-events-none text-base"
                style={{ left: grassEffect.x * TILE_SIZE, top: grassEffect.y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}
              >
                🌿
              </motion.div>
            )}
          </AnimatePresence>

          {wildPokemon.map(wild => (
            <NPCComponent
              key={wild.id}
              npc={{
                ...wild,
                name: wild.pokemon.name,
                dialogue: [],
                trainerClass: String(wild.pokemon.id),
                sprite: wild.pokemon.sprite,
              } as NPC}
            />
          ))}
          <PlayerSprite position={playerPos} direction={direction} />

          {overheadTiles}

          <AnimatePresence>
            {isInteractable && (
              <motion.div
                key="interact-indicator"
                initial={{ opacity: 0, y: 10, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="absolute z-30 pointer-events-none flex flex-col items-center"
                style={{ left: interactTargetX * TILE_SIZE, top: interactTargetY * TILE_SIZE - 24, width: TILE_SIZE }}
              >
                <div className="bg-white/90 backdrop-blur-sm rounded-full w-6 h-6 shadow-lg border-2 border-blue-500 flex items-center justify-center animate-bounce">
                  <span className="text-[10px] font-black text-blue-600">A</span>
                </div>
                <div className="w-2 h-2 bg-blue-500 rotate-45 -mt-1 shadow-sm" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
});

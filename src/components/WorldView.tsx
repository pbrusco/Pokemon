import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Position, Direction, NPC, Entity, Pokemon, MapID, TILE_SIZE, GRID_SIZE } from '../types';
import { WILD_POKEMON_DATABASE } from '../constants';
import { NPCComponent } from './overworld/NPCComponent';
import { GameTile } from './overworld/GameTile';
import { PlayerSprite } from './overworld/PlayerSprite';

interface MapData {
  tiles: { type: string; walkable: boolean }[][];
  warps: Array<{ x: number; y: number; targetMap: MapID; targetPos: Position; targetDir?: Direction }>;
}

interface WindowSize {
  width: number;
  height: number;
}

interface WorldViewProps {
  playerPos: Position;
  direction: Direction;
  isMoving: boolean;
  currentMap: MapID;
  maps: Record<MapID, MapData>;
  npcs: Record<MapID, NPC[]>;
  items: Record<MapID, Entity[]>;
  grassEffect: Position | null;
  overworldShake: boolean;
  windowSize: WindowSize;
  spottedTrainerId: string | null;
  spottedTrainerPos: Position | null;
  defeatedTrainers: string[];
  inBattle: boolean;
  dialogue: string | null;
  playerTeam: Pokemon[];
}

export const WorldView = ({
  playerPos,
  direction,
  isMoving,
  currentMap,
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
  playerTeam,
}: WorldViewProps) => {
  const mapData = maps[currentMap];
  const grid = mapData.tiles;
  const mapHasEncounters = currentMap in WILD_POKEMON_DATABASE;

  const [isDemoActive, setIsDemoActive] = useState(() => (window as typeof window & { __demo?: any }).__demo?.running?.() ?? false);

  useEffect(() => {
    const handleDemoChange = (e: any) => setIsDemoActive(e.detail.running && !e.detail.paused);
    window.addEventListener('demoModeChanged', handleDemoChange);
    return () => window.removeEventListener('demoModeChanged', handleDemoChange);
  }, []);

  const cullRadius = 24;
  const cullStep = 4;
  const rawMinY = Math.max(0, playerPos.y - cullRadius);
  const rawMaxY = Math.min(GRID_SIZE - 1, playerPos.y + cullRadius);
  const rawMinX = Math.max(0, playerPos.x - cullRadius);
  const rawMaxX = Math.min(GRID_SIZE - 1, playerPos.x + cullRadius);
  const minY = Math.max(0, Math.floor(rawMinY / cullStep) * cullStep);
  const minX = Math.max(0, Math.floor(rawMinX / cullStep) * cullStep);
  const maxY = Math.min(GRID_SIZE - 1, Math.ceil((rawMaxY + 1) / cullStep) * cullStep - 1);
  const maxX = Math.min(GRID_SIZE - 1, Math.ceil((rawMaxX + 1) / cullStep) * cullStep - 1);

  const visibleTiles = [];
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const tile = grid[y][x];
      visibleTiles.push(
        <div
          key={`${x}-${y}`}
          className="absolute"
          style={{ left: x * TILE_SIZE, top: y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }}
        >
          <GameTile
            type={tile.type}
            isGrassActive={grassEffect?.x === x && grassEffect?.y === y}
            hasEncounters={mapHasEncounters}
          />
        </div>
      );
    }
  }

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
      (interactTargetX >= 0 && interactTargetX < GRID_SIZE && interactTargetY >= 0 && interactTargetY < GRID_SIZE &&
       ['tree', 'table', 'cut_tree', 'boulder'].includes(mapData.tiles[interactTargetY][interactTargetX].type))
    );

  const centerX = -playerPos.x * TILE_SIZE + (windowSize.width / 2) - (TILE_SIZE / 2);

  return (
    <div className="relative flex-1 w-full overflow-hidden">
      {/* HP HUD */}
      <AnimatePresence>
        {playerTeam.length > 0 && !inBattle && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed top-24 sm:top-24 left-4 sm:left-8 z-20 bg-white/90 backdrop-blur-md p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-slate-800 shadow-xl w-32 sm:w-48"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-[8px] sm:text-[10px] font-black text-slate-800 uppercase tracking-tighter">{playerTeam[0].name}</span>
              <span className="text-[8px] sm:text-[10px] font-mono font-bold text-slate-500">Lv {playerTeam[0].level}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[6px] sm:text-[8px] font-black text-yellow-600">HP</span>
              <div className="flex-1 h-1.5 sm:h-2 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                <motion.div
                  initial={false}
                  animate={{ width: `${(playerTeam[0].hp / playerTeam[0].maxHp) * 100}%` }}
                  className={`h-full ${playerTeam[0].hp > playerTeam[0].maxHp / 2 ? 'bg-emerald-500' : playerTeam[0].hp > playerTeam[0].maxHp / 5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                />
              </div>
            </div>
            <div className="text-right mt-0.5 sm:mt-1">
              <span className="text-[8px] sm:text-[10px] font-mono font-bold text-slate-600">{playerTeam[0].hp}/{playerTeam[0].maxHp}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map viewport */}
      <motion.div
        className="absolute bg-emerald-50 rounded-[2rem] shadow-2xl overflow-hidden border-8 border-slate-800"
        initial={false}
        animate={{
          x: overworldShake
            ? [centerX, centerX - 8, centerX + 8, centerX]
            : centerX,
          y: -playerPos.y * TILE_SIZE + (windowSize.height / 2) - (TILE_SIZE / 2)
        }}
        transition={{ type: "tween", duration: 0.1, ease: "linear" }}
      >
        {/* Map grid */}
        <div className="relative" style={{ width: GRID_SIZE * TILE_SIZE, height: GRID_SIZE * TILE_SIZE }}>
          {visibleTiles}
        </div>

        {/* Trainer vision indicators */}
        {npcs[currentMap]
          .filter(npc => npc.isTrainer && !defeatedTrainers.includes(npc.id))
          .flatMap(trainer =>
            [1, 2, 3].map(i => {
              let vx = trainer.position.x, vy = trainer.position.y;
              if (trainer.direction === 'up') vy -= i;
              if (trainer.direction === 'down') vy += i;
              if (trainer.direction === 'left') vx -= i;
              if (trainer.direction === 'right') vx += i;
              if (vx < 0 || vx >= GRID_SIZE || vy < 0 || vy >= GRID_SIZE) return null;
              return (
                <div
                  key={`vision-${trainer.id}-${i}`}
                  className="absolute z-10 pointer-events-none"
                  style={{ left: vx * TILE_SIZE, top: vy * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE, background: 'rgba(248, 56, 56, 0.18)', borderRadius: 4 }}
                />
              );
            }).filter(Boolean)
          )
        }

        {/* Warp indicators */}
        {mapData.warps?.map(warp => (
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
        ))}

        {/* NPCs */}
        {npcs[currentMap].map(npc => (
          <NPCComponent
            key={npc.id}
            npc={npc.id === spottedTrainerId && spottedTrainerPos ? { ...npc, position: spottedTrainerPos } : npc}
            isSpotted={npc.id === spottedTrainerId}
          />
        ))}

        {/* Items / Objects */}
        {items[currentMap].map(item => (
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
        ))}

        {/* Player */}
        <PlayerSprite position={playerPos} direction={direction} isMoving={isMoving} />

        {/* Tree canopy overlay */}
        {mapData.tiles.flatMap((row, y) =>
          row.map((tile, x) => {
            if (tile.type !== 'tree') return null;
            return (
              <div
                key={`tree-canopy-${x}-${y}`}
                className="absolute pointer-events-none"
                style={{ left: x * TILE_SIZE - 6, top: y * TILE_SIZE - 18, width: TILE_SIZE + 12, height: TILE_SIZE, zIndex: 40 + y }}
              >
                <div className="w-full h-full bg-[#88d8b0] border-2 border-[#383838] rounded-full flex flex-col items-center justify-center gap-1 shadow-sm">
                  <div className="w-8 h-1 bg-white/20 rounded-full" />
                  <div className="w-6 h-1 bg-white/20 rounded-full" />
                </div>
              </div>
            );
          })
        )}

        {/* Interaction indicator */}
        <AnimatePresence>
          {isInteractable && !isDemoActive && (
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
      </motion.div>
    </div>
  );
};

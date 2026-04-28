import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { type Position, type Entity, type Pokemon, type MapID, TILE_SIZE, type MapData, type NPC } from '../types';
import { WILD_POKEMON_DATABASE } from '../constants';
import { useGameStore } from '../store/gameStore';
import { NPCComponent } from './overworld/NPCComponent';
import { GameTile } from './overworld/GameTile';
import { PlayerSprite } from './overworld/PlayerSprite';
import { StaticMap } from './overworld/StaticMap';
import { T } from '../data/tileset/tilesetGenerator';

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
  playerTeam: Pokemon[];
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
  playerTeam,
}: WorldViewProps) => {
  const { playerPos, direction, isMoving, currentMap, zoomLevel, cameraOffset, isCameraLocked, setZoomLevel, setCameraOffset, setIsCameraLocked, wildPokemon } = useGameStore();
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const mapData = maps[currentMap];
  if (!mapData) return null;
  const grid = mapData.tiles;
  const { layers } = mapData;
  const mapHasEncounters = currentMap in WILD_POKEMON_DATABASE;

  // ── Rendering Strategy ──────────────────────────────────────
  const isLargeMap = grid.length * grid[0].length > 2000;
  const useStaticMap = isLargeMap && zoomLevel < 0.6;
  const useColorMode = isLargeMap && zoomLevel < 0.15;

  // ── Visible-tile culling ──────────────────────────────────────
  const cullRadius = Math.min(Math.ceil(24 / zoomLevel), 50); 
  const cullStep = 4;
  const rows = grid.length;
  const cols = grid[0].length;
  const rawMinY = Math.max(0, playerPos.y - cullRadius);
  const rawMaxY = Math.min(rows - 1, playerPos.y + cullRadius);
  const rawMinX = Math.max(0, playerPos.x - cullRadius);
  const rawMaxX = Math.min(cols - 1, playerPos.x + cullRadius);
  const minY = Math.max(0, Math.floor(rawMinY / cullStep) * cullStep);
  const minX = Math.max(0, Math.floor(rawMinX / cullStep) * cullStep);
  const maxY = Math.min(rows - 1, Math.ceil((rawMaxY + 1) / cullStep) * cullStep - 1);
  const maxX = Math.min(cols - 1, Math.ceil((rawMaxX + 1) / cullStep) * cullStep - 1);

  // ── Build layer tile arrays ───────────────────────────────────
  const visibleGroundTiles = [];
  const visibleObjectTiles = [];
  const visibleOverheadTiles = [];

  if (!useStaticMap) {
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const tile = grid[y][x];
        let groundId = layers.ground[y][x];
        const objectId = layers.objects[y][x];
        const overheadId = layers.overhead[y][x];

        // On encounter maps, swap normal grass for tall grass
        if (mapHasEncounters && tile.type === 'grass') {
          groundId = T.TALL_GRASS;
        }

        // Ground — single flat div per tile (no wrapper)
        visibleGroundTiles.push(
          <GameTile key={`g-${x}-${y}`} tileId={groundId} x={x} y={y} />
        );

        // Objects (trunks, tables, bookshelves, etc.)
        if (objectId !== T.EMPTY) {
          visibleObjectTiles.push(
            <GameTile key={`o-${x}-${y}`} tileId={objectId} x={x} y={y} z={15 + y} />
          );
        }

        // Overhead (tree canopies)
        if (overheadId !== T.EMPTY) {
          visibleOverheadTiles.push(
            <GameTile key={`h-${x}-${y}`} tileId={overheadId} x={x} y={y} z={40 + y} noPointerEvents />
          );
        }
      }
    }
  }

  // ── Interaction indicator target ──────────────────────────────
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

  const handleWheel = (e: React.WheelEvent) => {
    if (inBattle) return;
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoomLevel(prev => Math.min(Math.max(prev + delta, 0.05), 1.0));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) { // Left or middle click to drag
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setIsCameraLocked(false);
      setCameraOffset(prev => ({
        x: prev.x + e.movementX / zoomLevel,
        y: prev.y + e.movementY / zoomLevel
      }));
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Calculate camera position
  // If locked, offset is 0,0 and we follow player.
  // We use cameraOffset in world pixels, adjusted by zoom.
  const targetX = isCameraLocked ? 0 : cameraOffset.x;
  const targetY = isCameraLocked ? 0 : cameraOffset.y;

  const playerScreenX = playerPos.x * TILE_SIZE + (TILE_SIZE / 2);
  const playerScreenY = playerPos.y * TILE_SIZE + (TILE_SIZE / 2);

  const viewportCenterX = (windowSize.width / 2);
  const viewportCenterY = (windowSize.height / 2);

  // The final translation needed to center the view
  const baseTranslateX = viewportCenterX - playerScreenX * zoomLevel;
  const baseTranslateY = viewportCenterY - playerScreenY * zoomLevel;

  const finalX = baseTranslateX + targetX * zoomLevel;
  const finalY = baseTranslateY + targetY * zoomLevel;

  return (
    <div 
      className="relative flex-1 w-full overflow-hidden cursor-crosshair select-none bg-black"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Dynamic View Controls Overlay */}
      <div className="absolute bottom-24 right-8 z-30 flex flex-col gap-2 pointer-events-auto">
        <button 
          onClick={() => setIsCameraLocked(!isCameraLocked)}
          className={`p-3 rounded-full border-2 shadow-lg transition-all ${isCameraLocked ? 'bg-blue-600 border-blue-400 text-white' : 'bg-white border-slate-300 text-slate-600'}`}
          title="Seguir personaje (Espacio)"
        >
          {isCameraLocked ? '🔒' : '🔓'}
        </button>
        <button 
          onClick={() => { setZoomLevel(1.0); setCameraOffset({x:0, y:0}); setIsCameraLocked(true); }}
          className="bg-white p-3 rounded-full border-2 border-slate-300 shadow-lg text-slate-600 hover:bg-slate-50 transition-all"
          title="Restablecer vista"
        >
          🏠
        </button>
      </div>
      {/* Team HUD (Left Panel) with Drag & Drop */}
      <AnimatePresence>
        {playerTeam.length > 0 && !inBattle && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed top-24 sm:top-24 left-4 sm:left-8 z-20 bg-white/95 backdrop-blur-md p-2 sm:p-3 rounded-xl sm:rounded-2xl border-2 border-slate-800 shadow-xl w-40 sm:w-56 pointer-events-auto flex flex-col gap-2"
          >
            <h3 className="text-[10px] text-slate-400 font-black uppercase tracking-widest px-1">Equipo Pokémon</h3>
            {playerTeam.map((pkmn, idx) => (
              <div
                key={pkmn.uid || pkmn.id + idx}
                draggable
                onDragStart={(e) => {
                  setDraggedIdx(idx);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedIdx === null || draggedIdx === idx) return;
                  import('../store/gameStore').then(({ useGameStore }) => {
                    useGameStore.getState().reorderTeam(draggedIdx, idx);
                  });
                  setDraggedIdx(null);
                }}
                className={`bg-slate-50 p-2 border ${draggedIdx === idx ? 'border-dashed border-slate-500 opacity-50' : 'border-slate-300'} rounded shadow-sm hover:shadow-md hover:bg-white cursor-grab active:cursor-grabbing transition-colors`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] sm:text-xs font-black text-slate-800 uppercase tracking-tighter truncate max-w-[70%]">{pkmn.name}</span>
                  <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-500">Lv{pkmn.level}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[7px] sm:text-[8px] font-black text-yellow-600">HP</span>
                  <div className="flex-1 h-1.5 sm:h-2 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                    <motion.div
                      initial={false}
                      animate={{ width: `${(pkmn.hp / pkmn.maxHp) * 100}%` }}
                      className={`h-full ${pkmn.hp > pkmn.maxHp / 2 ? 'bg-emerald-500' : pkmn.hp > pkmn.maxHp / 5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    />
                  </div>
                </div>
                <div className="text-right mt-0.5 sm:mt-1">
                  <span className="text-[8px] sm:text-[10px] font-mono font-bold text-slate-600">{pkmn.hp}/{pkmn.maxHp}</span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map viewport */}
      <motion.div
        className="absolute origin-top-left"
        initial={false}
        animate={{
          x: overworldShake
            ? [finalX, finalX - 8, finalX + 8, finalX]
            : finalX,
          y: finalY,
          scale: zoomLevel
        }}
        transition={{ type: "tween", duration: 0.11, ease: "linear" }}
      >
        <div className="relative" style={{ width: cols * TILE_SIZE, height: rows * TILE_SIZE }}>
          {/* Ground layer */}
          {useStaticMap ? <StaticMap mapData={mapData} layerIndex={0} colorMode={useColorMode} /> : visibleGroundTiles}

          {/* Object layer (trunks, furniture — z-indexed by row) */}
          {useStaticMap ? <StaticMap mapData={mapData} layerIndex={1} colorMode={useColorMode} /> : visibleObjectTiles}

          {/* Trainer vision indicators */}
          {npcs[currentMap]
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
              npc={(npc.id === spottedTrainerId && spottedTrainerPos ? { ...npc, position: spottedTrainerPos } : npc) as NPC}
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

          {/* Grass rustle effect — single overlay instead of per-tile AnimatePresence */}
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

          {/* Player */}
          {wildPokemon.map(wild => (
            <NPCComponent 
              key={wild.id}
              npc={{
                ...wild,
                name: wild.pokemon.name,
                dialogue: [],
                trainerClass: wild.pokemon.id
              } as any}
            />
          ))}
          <PlayerSprite position={playerPos} direction={direction} isMoving={isMoving} />

          {/* Overhead layer (tree canopies — rendered above player) */}
          {useStaticMap ? <StaticMap mapData={mapData} layerIndex={2} colorMode={useColorMode} /> : visibleOverheadTiles}

          {/* Interaction indicator */}
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

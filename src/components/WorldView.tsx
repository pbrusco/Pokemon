import { useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { type Position, type Entity, type MapID, TILE_SIZE, type MapData, type NPC } from '../types';
import { useGameStore } from '../store/gameStore';
import { NPCComponent } from './overworld/NPCComponent';
import { FireredMapView } from './overworld/FireredMapView';
import { PlayerSprite } from './overworld/PlayerSprite';

interface WindowSize {
  width: number;
  height: number;
}

/** Tile margin around the camera viewport when culling NPCs / items. A few
 *  extra tiles avoid pop-in for tall sprites (16×32 → 64×128 on screen). */
const NPC_VIEWPORT_MARGIN = 4;

/** Short label for a `KeyboardEvent.key` value, suitable for a small badge. */
function formatKeyLabel(key: string): string {
  if (key === ' ') return '␣';
  if (key === 'Enter') return '↵';
  if (key === 'Escape') return 'Esc';
  if (key === 'Backspace') return '⌫';
  if (key === 'Tab') return '⇥';
  if (key === 'ArrowUp') return '↑';
  if (key === 'ArrowDown') return '↓';
  if (key === 'ArrowLeft') return '←';
  if (key === 'ArrowRight') return '→';
  if (key.length === 1) return key.toUpperCase();
  return key.slice(0, 3).toUpperCase();
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
  // Per-field selectors so unrelated store mutations (battle logs, dialogue
  // text, etc.) don't re-render the entire viewport while the player walks.
  const playerPos = useGameStore(s => s.playerPos);
  const direction = useGameStore(s => s.direction);
  const isMoving = useGameStore(s => s.isMoving);
  const currentMap = useGameStore(s => s.currentMap);
  const wildPokemon = useGameStore(s => s.wildPokemon);
  const isBiking = useGameStore(s => s.isBiking);
  const interactKeyLabel = useGameStore(s => formatKeyLabel(s.keyBindings.interact));
  const mapData = maps[currentMap];

  const grid = mapData?.tiles ?? [];
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  const halfW = Math.ceil((windowSize.width  / 2) / TILE_SIZE) + 2;
  const halfH = Math.ceil((windowSize.height / 2) / TILE_SIZE) + 2;
  const minX = Math.max(0, playerPos.x - halfW);
  const maxX = Math.min(cols - 1, playerPos.x + halfW);
  const minY = Math.max(0, playerPos.y - halfH);
  const maxY = Math.min(rows - 1, playerPos.y + halfH);

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

  const warpIndicators = useMemo(() => {
    const warps = mapData?.warps ?? [];
    // FireRed registers a separate warp_event for every tile a door spans
    // (so the player triggers the warp no matter which sub-tile they step
    // on). Cluster adjacent warps that share the same destination into a
    // single indicator so we don't show four arrows under a 2×2 door.
    const used = new Set<number>();
    const reps: typeof warps = [];
    for (let i = 0; i < warps.length; i++) {
      if (used.has(i)) continue;
      const cluster = [i];
      for (let j = 0; j < cluster.length; j++) {
        const a = warps[cluster[j]];
        for (let k = i + 1; k < warps.length; k++) {
          if (used.has(k) || cluster.includes(k)) continue;
          const b = warps[k];
          if (b.targetMap !== a.targetMap) continue;
          if (b.targetPos.x !== a.targetPos.x || b.targetPos.y !== a.targetPos.y) continue;
          if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) > 1) continue;
          cluster.push(k);
        }
      }
      // Pick the bottom-most tile in the cluster — that's where the player
      // typically approaches the door from.
      let best = cluster[0];
      for (const idx of cluster) {
        used.add(idx);
        const w = warps[idx];
        const cur = warps[best];
        if (w.y > cur.y || (w.y === cur.y && w.x > cur.x)) best = idx;
      }
      reps.push(warps[best]);
    }
    return reps.map(warp => (
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
    ));
  }, [mapData]);

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
      npcs[currentMap]?.some(npc => npc.position.x === interactTargetX && npc.position.y === interactTargetY) ||
      items[currentMap]?.some(item => item.position.x === interactTargetX && item.position.y === interactTargetY) ||
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
        transition={{ type: "tween", duration: isBiking ? 0.06 : 0.11, ease: "linear" }}
      >
        <div className="relative" style={{ width: cols * TILE_SIZE, height: rows * TILE_SIZE }}>
          {(() => {
            // Every map is FireRed-backed now. Multi-zone (KANTO_OVERWORLD)
            // renders each FireRed zone as its own canvas at its computed
            // offset; single-zone (indoor) maps render one layout.
            if (!mapData.fireredLayout) return null;
            const fl = mapData.fireredLayout as { multiZone?: true; zones?: Array<{ mapId: string; offsetX: number; offsetY: number; layout: Parameters<typeof FireredMapView>[0]['layout'] }> };
            if (fl.multiZone && fl.zones) {
              return fl.zones.map(z => (
                <FireredMapView
                  key={z.mapId}
                  layout={z.layout}
                  viewport={{ minX, minY, maxX, maxY }}
                  originX={z.offsetX}
                  originY={z.offsetY}
                />
              ));
            }
            return (
              <FireredMapView
                layout={mapData.fireredLayout as Parameters<typeof FireredMapView>[0]['layout']}
                viewport={{ minX, minY, maxX, maxY }}
              />
            );
          })()}
          {visionIndicators}
          {warpIndicators}

          {(npcs[currentMap] ?? []).map(npc => {
            // Cull NPCs outside the visible viewport (with a small margin so
            // tall sprites don't pop while scrolling in). For huge maps like
            // Kanto with 1000+ NPCs this is the difference between a few
            // dozen DOM nodes and a thousand.
            const x = npc.position.x;
            const y = npc.position.y;
            if (x < minX - NPC_VIEWPORT_MARGIN || x > maxX + NPC_VIEWPORT_MARGIN ||
                y < minY - NPC_VIEWPORT_MARGIN || y > maxY + NPC_VIEWPORT_MARGIN) {
              return null;
            }
            return (
              <NPCComponent
                key={npc.id}
                npc={(npc.id === spottedTrainerId && spottedTrainerPos ? { ...npc, position: spottedTrainerPos } : npc) as NPC}
                isSpotted={npc.id === spottedTrainerId}
                trackProximity
              />
            );
          })}

          {(items[currentMap] ?? []).map(item => {
            const x = item.position.x;
            const y = item.position.y;
            if (x < minX - NPC_VIEWPORT_MARGIN || x > maxX + NPC_VIEWPORT_MARGIN ||
                y < minY - NPC_VIEWPORT_MARGIN || y > maxY + NPC_VIEWPORT_MARGIN) {
              return null;
            }
            // For native-rendered maps the canonical pokered block graphics
            // already draw furniture, TVs, computers, plants, etc. The
            // "object" overlay (brown signpost) would only duplicate them.
            // Pickup items still render so the player sees collectable balls.
            // Object overlays (signs, computers, etc.) are already rendered
            // by the FireRed canvas — skip the JS overlay so we don't double-draw.
            // Exception: cut-tree objects sit on otherwise-walkable path tiles
            // and only exist as auto-extracted FireRed object_events, not as
            // metatiles, so we draw them ourselves.
            const isCutTree = item.id?.startsWith('cut_tree_');
            if (item.type === 'object' && !isCutTree) return null;
            if (isCutTree) {
              return (
                <div
                  key={item.id}
                  className="absolute top-0 left-0 flex items-end justify-center pointer-events-none"
                  style={{ left: item.position.x * TILE_SIZE, top: item.position.y * TILE_SIZE - TILE_SIZE / 2, width: TILE_SIZE, height: TILE_SIZE * 1.5, zIndex: 18 + item.position.y }}
                >
                  <div className="text-[40px] leading-none drop-shadow-[0_2px_2px_rgba(0,0,0,0.4)]">🌳</div>
                </div>
              );
            }

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

          {wildPokemon.map(wild => {
            const x = wild.position.x;
            const y = wild.position.y;
            if (x < minX - NPC_VIEWPORT_MARGIN || x > maxX + NPC_VIEWPORT_MARGIN ||
                y < minY - NPC_VIEWPORT_MARGIN || y > maxY + NPC_VIEWPORT_MARGIN) {
              return null;
            }
            return (
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
            );
          })}
          <PlayerSprite position={playerPos} direction={direction} />

          {/* No overhead layer — FireRed pipeline draws everything in-place. */}

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
                <div className="bg-white/90 backdrop-blur-sm rounded-full min-w-6 h-6 px-1.5 shadow-lg border-2 border-blue-500 flex items-center justify-center animate-bounce">
                  <span className="text-[10px] font-black text-blue-600 leading-none">{interactKeyLabel}</span>
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

/**
 * Oak escort cutscene — defined as declarative DSL steps.
 *
 * When the player tries to leave Pallet Town without a Pokémon,
 * Oak appears, speaks, then leads the player to his lab.
 */

import type { Direction, Position, MapID, MapData } from '../types';
import type { CutsceneStep } from './cutscenes/types';
import { runCutscene } from './cutscenes/runner';

// ── Path builder (pure function) ──────────────────────────────────────────────

interface PathNode { x: number; y: number; dir: Direction }

/** Lab door approach tile in KANTO_OVERWORLD coords. The path row y=274 is
 *  all walkable in canonical Pallet Town, so we navigate there before turning
 *  up onto the door at (76, 273). */
const LAB_APPROACH_X = 76;
const LAB_APPROACH_Y = 274;

/** BFS over walkable tiles to find a 4-connected path from start → goal. */
function bfsPath(map: MapData, start: Position, goal: Position): Position[] | null {
  const grid = map.tiles;
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  if (start.x === goal.x && start.y === goal.y) return [start];
  const isWalkable = (x: number, y: number) =>
    x >= 0 && x < w && y >= 0 && y < h && grid[y][x].walkable;
  const key = (x: number, y: number) => `${x},${y}`;
  const cameFrom = new Map<string, string | null>();
  cameFrom.set(key(start.x, start.y), null);
  const queue: Position[] = [start];
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur.x === goal.x && cur.y === goal.y) {
      const path: Position[] = [];
      let k: string | null = key(cur.x, cur.y);
      while (k) {
        const [sx, sy] = k.split(',').map(Number);
        path.push({ x: sx, y: sy });
        k = cameFrom.get(k) ?? null;
      }
      return path.reverse();
    }
    for (const [dx, dy] of dirs) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      const nk = key(nx, ny);
      if (cameFrom.has(nk)) continue;
      if (!isWalkable(nx, ny)) continue;
      cameFrom.set(nk, key(cur.x, cur.y));
      queue.push({ x: nx, y: ny });
    }
  }
  return null;
}

function dirBetween(from: Position, to: Position): Direction {
  if (to.x > from.x) return 'right';
  if (to.x < from.x) return 'left';
  if (to.y > from.y) return 'down';
  return 'up';
}

/** Build the Oak escort path from player position to the lab door approach.
 *  Uses BFS over the map's walkable tiles when a map is provided so the path
 *  routes around houses, fences, and trees instead of clipping through them.
 *  Falls back to a straight L-shape when no map is supplied (used by the
 *  legacy unit test). */
export function buildOakEscortPath(startPos: Position, map?: MapData): PathNode[] {
  const goal = { x: LAB_APPROACH_X, y: LAB_APPROACH_Y };

  if (map) {
    const tiles = bfsPath(map, startPos, goal);
    if (tiles && tiles.length > 0) {
      const nodes: PathNode[] = [{ x: tiles[0].x, y: tiles[0].y, dir: 'down' }];
      for (let i = 1; i < tiles.length; i++) {
        nodes.push({ x: tiles[i].x, y: tiles[i].y, dir: dirBetween(tiles[i - 1], tiles[i]) });
      }
      return nodes;
    }
  }

  // Fallback (no map / no path found): naive L-shape, may cut through walls.
  const path: PathNode[] = [];
  let { x, y } = startPos;
  path.push({ x, y, dir: 'down' });
  while (x > goal.x) { x--; path.push({ x, y, dir: 'left' }); }
  while (x < goal.x) { x++; path.push({ x, y, dir: 'right' }); }
  while (y < goal.y) { y++; path.push({ x, y, dir: 'down' }); }
  return path;
}

// ── Cutscene definition (DSL) ─────────────────────────────────────────────────

/** Build the Oak escort cutscene steps for a given player position. */
export function buildOakEscortSteps(playerPos: Position, map?: MapData): CutsceneStep[] {
  const path = buildOakEscortPath(playerPos, map);

  return [
    { type: 'lock' },
    { type: 'npc_appear', npcId: 'oak_escort', position: { x: playerPos.x, y: playerPos.y + 1 }, direction: 'up' as Direction },
    { type: 'dialogue', text: "PROF. OAK: ¡Hola! Soy el PROF. OAK. El mundo está lleno de criaturas misteriosas llamadas POKÉMON." },
    { type: 'dialogue', text: "PROF. OAK: ¡Espera! ¡Es peligroso salir a la hierba sin un POKÉMON! Ven al laboratorio." },
    { type: 'walk', path, npcLeadId: 'oak_escort' },
    { type: 'npc_remove' },
    { type: 'set_story', step: 'OAK_STOPPED' },
    // Land the player just inside the lab door, directly south of Oak
    // (canonical Oak at (6, 3) → player at (6, 11) facing up). Old (4, 10)
    // dropped the player off-axis and Oak felt disconnected from the entry.
    { type: 'warp', map: 'OAKS_LAB' as MapID, position: { x: 6, y: 11 }, direction: 'up' as Direction },
    { type: 'unlock' },
    { type: 'wait', ms: 500 },
    { type: 'dialogue', text: "PROF. OAK: ¡Hola! Por fin llegas. Pasa, pasa — ven hasta la mesa." },
    { type: 'dialogue', text: "PROF. OAK: Toma uno de estos POKÉMON, te ayudará en tu viaje." },
  ];
}

// ── Trigger (called from handleMove) ──────────────────────────────────────────

import { useGameStore } from '../store/gameStore';

/** Trigger the Oak escort cutscene. Called when the player tries to leave Pallet Town north without a Pokémon. */
export function triggerOakCutscene(playerPos: Position) {
  const s = useGameStore.getState();
  // Face the player toward Oak before the cutscene starts
  s.setDirection('down');

  // Pass the live KANTO_OVERWORLD map so the path BFS routes around buildings
  // and fences instead of clipping through them.
  const map = s.worldMaps[s.currentMap];
  const steps = buildOakEscortSteps(playerPos, map);
  runCutscene(steps);
}



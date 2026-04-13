// ─── Demo Mode: AI Auto-Play with Structured Logging ──────────────────────────
// Usage: window.__demo.start() / .stop() / .pause() / .resume()
//        window.__demo.speed(200) / .log() / .export()
// ───────────────────────────────────────────────────────────────────────────────

import { getTypeEffectiveness } from './damage';
import { setGameSpeed } from './gameSpeed';

type Dir = 'up' | 'down' | 'left' | 'right';

// Compact log: [tick, type, ...fields]
// Types: M=move, B=battle_start, A=battle_action, E=battle_end,
//        D=dialogue, C=map_change, L=level_up, K=blackout, S=switch
type LogEntry = [number, string, ...unknown[]];

// ─── State (on window to survive HMR) ────────────────────────────────────────

interface DS {
  intervalId: ReturnType<typeof setInterval> | null;
  tick: number;
  log: LogEntry[];
  dir: Dir;
  map: string;
  outcome: string;
  battleLogged: boolean;
  levels: number[];
  paused: boolean;
  tickMs: number;
  maxTicks: number;
  levelMap: Record<string, number>;
  lastDialogue: string;
  targetQueue: { x: number, y: number }[];
  exploredMap: string;
}

const W = window as any;
if (W.__ds?.intervalId) { clearInterval(W.__ds.intervalId); W.__ds.intervalId = null; }
if (!W.__ds) {
  W.__ds = {
    intervalId: null, tick: 0, log: [] as LogEntry[],
    dir: 'up' as Dir, map: '', outcome: 'ongoing',
    battleLogged: false, levels: [] as number[],
    paused: false, tickMs: 400, maxTicks: Infinity,
    levelMap: {} as Record<string, number>,
    lastDialogue: '',
    targetQueue: [],
    exploredMap: '',
  };
}
const ds: DS = W.__ds;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function game(): any { return W.__game; }
function store(): any { return W.__gameStore?.getState(); }

function L(type: string, ...fields: unknown[]) {
  ds.log.push([ds.tick, type, ...fields]);
}

function nextPos(pos: { x: number; y: number }, d: Dir) {
  const dx = d === 'left' ? -1 : d === 'right' ? 1 : 0;
  const dy = d === 'up' ? -1 : d === 'down' ? 1 : 0;
  return { x: pos.x + dx, y: pos.y + dy };
}

function findPath(start: { x: number, y: number }, target: { x: number, y: number }, s: any): Dir[] | null {
  const map = s.worldMaps?.[s.currentMap];
  if (!map) return null;
  const npcs = s.getNPCs?.()[s.currentMap] ?? [];

  const queue: { pos: { x: number, y: number }, path: Dir[], cost: number }[] = [{ pos: start, path: [], cost: 0 }];
  const visited = new Map<string, number>();
  visited.set(`${start.x},${start.y}`, 0);

  while (queue.length > 0) {
    queue.sort((a, b) => a.cost - b.cost);
    const { pos, path, cost } = queue.shift()!;
    const dirs: Dir[] = ['up', 'down', 'left', 'right'];
    for (const d of dirs) {
      const n = nextPos(pos, d);
      
      if (n.x === target.x && n.y === target.y) {
        return [...path, d];
      }

      const prevDir = path.length > 0 ? path[path.length - 1] : null;
      const turnPenalty = prevDir && prevDir !== d ? 1.5 : 0;
      const newCost = cost + 1 + turnPenalty;

      const key = `${n.x},${n.y}`;
      if (visited.has(key) && visited.get(key)! <= newCost) continue;

      if (n.x < 0 || n.x >= 20 || n.y < 0 || n.y >= 20) continue;
      if (!map[n.y]?.[n.x]?.walkable) continue;
      if (npcs.some((npc: any) => npc.position.x === n.x && n.y === npc.position.y)) continue;

      visited.set(key, newCost);
      queue.push({ pos: n, path: [...path, d], cost: newCost });
    }
  }
  return null;
}

// ─── Movement AI ──────────────────────────────────────────────────────────────

function getOppositeDir(dir: Dir): Dir {
  switch (dir) {
    case 'up': return 'down';
    case 'down': return 'up';
    case 'left': return 'right';
    case 'right': return 'left';
  }
}

function pickDir(s: any): Dir {
  const all: Dir[] = ['up', 'down', 'left', 'right'];
  const { playerPos: pos, currentMap, worldMaps } = s;
  const map = worldMaps?.[currentMap];
  if (!map) return all[Math.floor(Math.random() * 4)];

  // Get NPCs to avoid walking into them
  const npcs = s.getNPCs?.() ?? {};
  const mapNpcs = npcs[currentMap] ?? [];

  const valid = all.filter(d => {
    const n = nextPos(pos, d);
    if (n.x < 0 || n.x >= 20 || n.y < 0 || n.y >= 20) return false;
    if (!map[n.y]?.[n.x]?.walkable) return false;
    // Check NPC collision
    if (mapNpcs.some((npc: any) => npc.position.x === n.x && npc.position.y === n.y)) return false;
    // Check object collision
    const mapItems = s.items?.[currentMap] ?? [];
    if (mapItems.some((item: any) => item.position.x === n.x && item.position.y === n.y)) return false;
    return true;
  });

  if (valid.length === 0) return all[Math.floor(Math.random() * 4)];

  // Bias toward grass (70%)
  const grass = valid.filter(d => {
    const n = nextPos(pos, d);
    return map[n.y]?.[n.x]?.type === 'grass';
  });
  if (grass.length > 0 && Math.random() < 0.7) {
    return grass[Math.floor(Math.random() * grass.length)];
  }

  // Stronger bias to continue current direction (80%) for straight-line exploring
  if (valid.includes(ds.dir) && Math.random() < 0.8) return ds.dir;

  // Avoid immediate backtracking if possible
  const opposite = getOppositeDir(ds.dir);
  const forwardValid = valid.filter(d => d !== opposite);

  if (forwardValid.length > 0) {
    return forwardValid[Math.floor(Math.random() * forwardValid.length)];
  }

  // Dead end constraint, must go back
  return valid[Math.floor(Math.random() * valid.length)];
}

// ─── Battle AI ────────────────────────────────────────────────────────────────

function pickAction(bs: any): { type: string; move?: any; index?: number } {
  const pkmn = bs.playerTeam[0];
  const enemy = bs.enemyPokemon;
  const moves = pkmn.moves.filter((m: any) => m && m.pp > 0);

  // Catch low-HP wild
  if (!bs.isTrainerBattle && enemy.hp / enemy.maxHp < 0.3 && (bs.inventory?.['POKEBALL'] ?? 0) > 0) {
    return { type: 'CATCH' };
  }

  if (moves.length === 0) return { type: 'ATTACK', move: pkmn.moves[0] };

  const dmg = moves.filter((m: any) => m.power > 0);
  if (dmg.length === 0) return { type: 'ATTACK', move: moves[0] };

  const best = dmg
    .map((m: any) => ({ m, s: m.power * getTypeEffectiveness(m.type, enemy.types ?? []) }))
    .sort((a: any, b: any) => b.s - a.s);

  return { type: 'ATTACK', move: best[0].m };
}

// ─── Main Tick ────────────────────────────────────────────────────────────────

function tick() {
  if (ds.paused) return;
  ds.tick++;
  const g = game(), s = store();
  if (!g || !s) return;
  const phase = g.getPhase();
  if (!phase) return;

  // Map change detection
  if (s.currentMap !== ds.map) {
    L('C', ds.map, s.currentMap, `${s.playerPos.x},${s.playerPos.y}`);
    ds.map = s.currentMap;
  }

  // Level up detection (by pokemon id, not array index, to avoid false positives from switches)
  const lvMap: Record<string, number> = {};
  s.playerTeam?.forEach((p: any) => { lvMap[p.id] = p.level; });
  if (ds.levels.length > 0) {
    s.playerTeam?.forEach((p: any) => {
      const prev = ds.levelMap?.[p.id];
      if (prev !== undefined && p.level > prev)
        L('L', p.name, prev, p.level);
    });
  }
  ds.levelMap = lvMap;
  ds.levels = s.playerTeam?.map((p: any) => p.level) ?? [];

  // Dialogue — dismiss (skip logging duplicates)
  if (s.dialogue) {
    const txt = s.dialogue.substring(0, 60);
    if (txt !== ds.lastDialogue) { L('D', txt); ds.lastDialogue = txt; }
    g.dismissDialogue();
    return;
  } else {
    ds.lastDialogue = '';
  }

  switch (phase.type) {
    case 'EXPLORING': {
      ds.battleLogged = false;
      ds.outcome = 'ongoing';
      if (s.isMoving) return;

      if (ds.exploredMap !== s.currentMap) {
        ds.exploredMap = s.currentMap;
        const targets: { x: number, y: number }[] = [];
        
        // Scan NPCs
        const mapNpcs = s.getNPCs?.()[s.currentMap] ?? [];
        for (const npc of mapNpcs) {
          targets.push({ x: npc.position.x, y: npc.position.y });
        }
        
        // Scan Items
        const mapItems = s.items?.[s.currentMap] ?? [];
        for (const item of mapItems) {
          targets.push({ x: item.position.x, y: item.position.y });
        }
        
        // Scan Tiles
        const m = s.worldMaps?.[s.currentMap];
        if (m && m.tiles) {
          for (let y = 0; y < m.tiles.length; y++) {
            for (let x = 0; x < m.tiles[y].length; x++) {
              if (['tree', 'table', 'cut_tree', 'boulder'].includes(m.tiles[y][x]?.type)) {
                targets.push({ x, y });
              }
            }
          }
        }
        
        // Sort left-to-right, top-to-bottom
        targets.sort((a, b) => a.y - b.y || a.x - b.x);
        ds.targetQueue = targets;
      }

      // Check current target
      while (ds.targetQueue.length > 0) {
        const target = ds.targetQueue[0];
        const dx = target.x - s.playerPos.x;
        const dy = target.y - s.playerPos.y;

        // Are we adjacent?
        if (Math.abs(dx) + Math.abs(dy) === 1) {
          let neededDir: Dir = 'up';
          if (dx === 1) neededDir = 'right';
          else if (dx === -1) neededDir = 'left';
          else if (dy === 1) neededDir = 'down';

          if (s.direction !== neededDir) {
            ds.dir = neededDir;
            g.handleMove(neededDir); // Turning to face
          } else {
            g.handleAction();
            ds.targetQueue.shift(); // Done
          }
          return;
        } else if (dx === 0 && dy === 0) {
           // We are standing ON the item. Usually items require stepping on them.
           // Or maybe we can't be on an interactable. Let's just pop it.
           ds.targetQueue.shift();
           continue;
        }

        // Try to pathfind
        const path = findPath(s.playerPos, target, s);
        if (path !== null && path.length > 0) {
          ds.dir = path[0];
          g.handleMove(path[0]);
          return;
        } else {
          // Unreachable
          ds.targetQueue.shift();
        }
      }

      // Fallback
      const d = pickDir(s);
      ds.dir = d;
      g.handleMove(d);
      break;
    }

    case 'BATTLE': {
      const bs = g.battleStateRef?.current;
      if (!bs) break;

      if (!ds.battleLogged) {
        ds.battleLogged = true;
        const p = bs.playerTeam[0], e = bs.enemyPokemon;
        L('B', e.name, e.level, bs.isTrainerBattle ? 1 : 0, p.name, p.level);
      }

      // Use engine phase (always current) instead of React phase (may be stale)
      const enginePhase = bs.phase;
      if (bs.outcome !== 'ongoing') break; // battle already resolved, wait

      if (enginePhase === 'CHOOSING') {
        const act = pickAction(bs);
        const p = bs.playerTeam[0], e = bs.enemyPokemon;
        L('A', act.type, act.move?.name ?? '', `${p.hp}/${p.maxHp}`, `${e.hp}/${e.maxHp}`);
        g.dispatchBattle(act);
      } else if (enginePhase === 'FORCED_SWITCH') {
        const idx = bs.playerTeam.findIndex((p: any, i: number) => i > 0 && p.hp > 0);
        if (idx > 0) {
          L('S', idx, bs.playerTeam[idx].name);
          g.dispatchBattle({ type: 'SWITCH', index: idx });
        }
      }
      break;
    }

    case 'BATTLE_TRANSITION':
    case 'HEALING':
      break;

    case 'BLACKOUT':
      break;

    case 'MENU': case 'INVENTORY': case 'TEAM': case 'SHOP': case 'POKEDEX': case 'PC':
      g.setPhase(g.phases.EXPLORING);
      break;
  }

  // Battle outcome (once per battle — gated by battleLogged flag)
  const bsEnd = g.battleStateRef?.current;
  if (bsEnd && bsEnd.outcome !== 'ongoing' && ds.battleLogged && ds.outcome === 'ongoing') {
    ds.outcome = bsEnd.outcome;
    const hp = bsEnd.playerTeam.map((p: any) => `${p.hp}/${p.maxHp}`).join(',');
    L('E', bsEnd.outcome, hp, bsEnd.enemyPokemon.name, bsEnd.enemyPokemon.level);
  }
}

// ─── Restart interval with current tickMs ─────────────────────────────────────

function restartInterval() {
  if (ds.intervalId) clearInterval(ds.intervalId);
  ds.intervalId = setInterval(() => {
    if (ds.tick >= ds.maxTicks) { stopDemo(); return; }
    try { tick(); } catch (e) { console.error('[DEMO] tick error:', e); }
  }, ds.tickMs);
}

// ─── Public API ───────────────────────────────────────────────────────────────

function emitState() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('demoModeChanged', { detail: { running: isDemoRunning(), paused: isDemoPaused() } }));
  }
}

export function startDemo(opts?: { tickMs?: number; maxTicks?: number; gameSpeed?: number }) {
  if (ds.intervalId) { console.log('[DEMO] Already running'); return; }
  const speed = opts?.gameSpeed ?? 1;
  setGameSpeed(speed);
  ds.tickMs = opts?.tickMs ?? Math.max(30, 400 / speed);
  ds.maxTicks = opts?.maxTicks ?? Infinity;
  ds.tick = 0;
  ds.map = store()?.currentMap ?? '';
  ds.levels = store()?.playerTeam?.map((p: any) => p.level) ?? [];
  ds.outcome = 'ongoing';
  ds.battleLogged = false;
  ds.paused = false;
  console.log(`[DEMO] Started (${ds.tickMs}ms/tick, ${speed}x speed)`);
  restartInterval();
  emitState();
}

export function stopDemo() {
  if (ds.intervalId) { clearInterval(ds.intervalId); ds.intervalId = null; }
  ds.paused = false;
  setGameSpeed(1);
  console.log(`[DEMO] Stopped. ${ds.tick} ticks, ${ds.log.length} entries.`);
  emitState();
}

export function pauseDemo() {
  ds.paused = true;
  console.log('[DEMO] Paused');
  emitState();
}

export function resumeDemo() {
  ds.paused = false;
  console.log('[DEMO] Resumed');
  emitState();
}

export function setSpeed(speed: number) {
  setGameSpeed(speed);
  ds.tickMs = Math.max(30, 400 / speed);
  if (ds.intervalId) restartInterval();
  console.log(`[DEMO] Speed: ${speed}x (${ds.tickMs}ms/tick)`);
}

export function getDemoLog(): LogEntry[] { return ds.log; }

export function exportDemoLog(): string {
  // Header explains the compact format
  const header = {
    format: 'B=battle_start A=action E=end D=dialogue C=map_change L=levelup K=blackout S=switch',
    fields: {
      B: '[tick,"B",enemy,eLv,isTrainer,player,pLv]',
      A: '[tick,"A",type,move,pHp/max,eHp/max]',
      E: '[tick,"E",outcome,teamHp,enemy,eLv]',
      D: '[tick,"D",text]',
      C: '[tick,"C",from,to,pos]',
      L: '[tick,"L",pokemon,fromLv,toLv]',
      K: '[tick,"K",map]',
      S: '[tick,"S",index,pokemon]',
    },
    ticks: ds.tick,
    entries: ds.log.length,
  };
  return JSON.stringify({ header, log: ds.log });
}

function clearDemoLog() {
  ds.log = [];
  ds.tick = 0;
}

export function isDemoRunning(): boolean { return ds.intervalId !== null; }
export function isDemoPaused(): boolean { return ds.paused; }

// ─── Auto-attach to window ───────────────────────────────────────────────────

if (import.meta.env.DEV) {
  W.__demo = {
    start: startDemo, stop: stopDemo,
    pause: pauseDemo, resume: resumeDemo,
    speed: setSpeed,
    log: getDemoLog, export: exportDemoLog, clear: clearDemoLog,
    running: isDemoRunning, paused: isDemoPaused,
  };
}

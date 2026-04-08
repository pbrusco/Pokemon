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

// ─── Movement AI ──────────────────────────────────────────────────────────────

function pickDir(s: any): Dir {
  const all: Dir[] = ['up', 'down', 'left', 'right'];
  const { playerPos: pos, currentMap, worldMaps } = s;
  const map = worldMaps?.[currentMap];
  if (!map) return all[Math.floor(Math.random() * 4)];

  // Navigate toward middle starter when in Oak's Lab with no team
  if (currentMap === 'OAKS_LAB' && s.playerTeam?.length === 0) {
    const target = { x: 10, y: 9 }; // one tile south of middle starter (10,8)
    const dx = target.x - pos.x;
    const dy = target.y - pos.y;
    if (dx !== 0 || dy !== 0) {
      const preferred: Dir = Math.abs(dx) >= Math.abs(dy)
        ? (dx > 0 ? 'right' : 'left')
        : (dy > 0 ? 'down' : 'up');
      if (map[pos.y + (preferred === 'down' ? 1 : preferred === 'up' ? -1 : 0)]?.[pos.x + (preferred === 'right' ? 1 : preferred === 'left' ? -1 : 0)]?.walkable) {
        return preferred;
      }
    }
  }

  // Get NPCs to avoid walking into them
  const npcs = s.getNPCs?.() ?? {};
  const mapNpcs = npcs[currentMap] ?? [];

  const valid = all.filter(d => {
    const n = nextPos(pos, d);
    if (n.x < 0 || n.x >= 20 || n.y < 0 || n.y >= 20) return false;
    if (!map[n.y]?.[n.x]?.walkable) return false;
    // Check NPC collision
    if (mapNpcs.some((npc: any) => npc.position.x === n.x && npc.position.y === n.y)) return false;
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

  // Continue current direction (55%)
  if (valid.includes(ds.dir) && Math.random() < 0.55) return ds.dir;

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
      // Interact with starter when standing adjacent to it (facing up toward y=8)
      if (s.currentMap === 'OAKS_LAB' && s.playerTeam?.length === 0 && s.playerPos?.y === 9 && s.playerPos?.x === 10) {
        g.handleAction();
        return;
      }
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
}

export function stopDemo() {
  if (ds.intervalId) { clearInterval(ds.intervalId); ds.intervalId = null; }
  ds.paused = false;
  setGameSpeed(1);
  console.log(`[DEMO] Stopped. ${ds.tick} ticks, ${ds.log.length} entries.`);
}

export function pauseDemo() {
  ds.paused = true;
  console.log('[DEMO] Paused');
}

export function resumeDemo() {
  ds.paused = false;
  console.log('[DEMO] Resumed');
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

export function clearDemoLog() {
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

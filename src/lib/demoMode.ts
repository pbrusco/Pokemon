// ─── Demo Mode: AI Auto-Play with Structured Logging ──────────────────────────
// Drives the game by reading state from window.__gameStore / window.__game
// and dispatching actions on a tick loop. Zero React dependencies.
// Usage: window.__demo.start() / .stop() / .log() / .export()
// ───────────────────────────────────────────────────────────────────────────────

import { getTypeEffectiveness } from './damage';

type Direction = 'up' | 'down' | 'left' | 'right';

interface DemoLogEntry {
  tick: number;
  ts: number;
  type: 'move' | 'battle_start' | 'battle_action' | 'battle_end'
    | 'dialogue' | 'map_change' | 'level_up' | 'catch' | 'blackout' | 'phase_skip';
  data: Record<string, unknown>;
}

// ─── State (stored on window to survive HMR) ─────────────────────────────────

interface DemoState {
  intervalId: ReturnType<typeof setInterval> | null;
  tickCount: number;
  log: DemoLogEntry[];
  lastDir: Direction;
  lastMap: string;
  lastOutcome: string;
  inBattleLogged: boolean;
  prevTeamLevels: number[];
}

const W = window as any;
// Clean up any previous HMR interval
if (W.__demoState?.intervalId) {
  clearInterval(W.__demoState.intervalId);
  W.__demoState.intervalId = null;
}

if (!W.__demoState) {
  W.__demoState = {
    intervalId: null,
    tickCount: 0,
    log: [] as DemoLogEntry[],
    lastDir: 'up' as Direction,
    lastMap: '',
    lastOutcome: 'ongoing',
    inBattleLogged: false,
    prevTeamLevels: [] as number[],
  };
}
const ds: DemoState = W.__demoState;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGame(): any { return W.__game; }
function getStore(): any { return W.__gameStore?.getState(); }

function addLog(type: DemoLogEntry['type'], data: Record<string, unknown>) {
  const entry: DemoLogEntry = { tick: ds.tickCount, ts: Date.now(), type, data };
  ds.log.push(entry);
  console.log(`[DEMO] t=${ds.tickCount} ${type}`, data);
}

function applyDir(pos: { x: number; y: number }, dir: Direction) {
  switch (dir) {
    case 'up': return { x: pos.x, y: pos.y - 1 };
    case 'down': return { x: pos.x, y: pos.y + 1 };
    case 'left': return { x: pos.x - 1, y: pos.y };
    case 'right': return { x: pos.x + 1, y: pos.y };
  }
}

// ─── Movement AI ──────────────────────────────────────────────────────────────

function pickDirection(store: any): Direction {
  const dirs: Direction[] = ['up', 'down', 'left', 'right'];
  const { playerPos, currentMap, worldMaps } = store;
  const map = worldMaps?.[currentMap];
  if (!map) return dirs[Math.floor(Math.random() * 4)];

  const valid = dirs.filter(dir => {
    const next = applyDir(playerPos, dir);
    return (
      next.x >= 0 && next.x < 20 &&
      next.y >= 0 && next.y < 20 &&
      map[next.y]?.[next.x]?.walkable
    );
  });

  if (valid.length === 0) return dirs[Math.floor(Math.random() * 4)];

  // Bias toward grass (70%) to trigger encounters
  const grassDirs = valid.filter(dir => {
    const next = applyDir(playerPos, dir);
    return map[next.y]?.[next.x]?.type === 'grass';
  });
  if (grassDirs.length > 0 && Math.random() < 0.7) {
    return grassDirs[Math.floor(Math.random() * grassDirs.length)];
  }

  // Bias toward continuing current direction (60%) to avoid jitter
  if (valid.includes(ds.lastDir) && Math.random() < 0.6) {
    return ds.lastDir;
  }

  return valid[Math.floor(Math.random() * valid.length)];
}

// ─── Battle AI ────────────────────────────────────────────────────────────────

function pickBattleAction(bs: any): { type: string; move?: any; index?: number } {
  const pokemon = bs.playerTeam[0];
  const enemy = bs.enemyPokemon;
  const usableMoves = pokemon.moves.filter((m: any) => m && m.pp > 0);

  // Try to catch low-HP wild pokemon
  if (!bs.isTrainerBattle && enemy.hp / enemy.maxHp < 0.3) {
    if ((bs.inventory?.['POKEBALL'] ?? 0) > 0) {
      return { type: 'CATCH' };
    }
  }

  if (usableMoves.length === 0) {
    return { type: 'ATTACK', move: pokemon.moves[0] };
  }

  // Pick strongest effective damaging move
  const damaging = usableMoves.filter((m: any) => m.power > 0);
  if (damaging.length === 0) {
    return { type: 'ATTACK', move: usableMoves[0] };
  }

  const scored = damaging.map((m: any) => ({
    move: m,
    score: m.power * getTypeEffectiveness(m.type, enemy.types ?? []),
  }));
  scored.sort((a: any, b: any) => b.score - a.score);

  return { type: 'ATTACK', move: scored[0].move };
}

// ─── Main Tick ────────────────────────────────────────────────────────────────

function demoTick() {
  ds.tickCount++;
  const game = getGame();
  const store = getStore();
  if (!game || !store) return;

  const phase = game.getPhase();
  if (!phase) return;

  // Track map changes
  if (store.currentMap !== ds.lastMap) {
    addLog('map_change', { from: ds.lastMap, to: store.currentMap, pos: store.playerPos });
    ds.lastMap = store.currentMap;
  }

  // Track level ups
  const teamLevels = store.playerTeam?.map((p: any) => p.level) ?? [];
  if (ds.prevTeamLevels.length > 0) {
    teamLevels.forEach((lv: number, i: number) => {
      if (ds.prevTeamLevels[i] !== undefined && lv > ds.prevTeamLevels[i]) {
        addLog('level_up', { pokemon: store.playerTeam[i].name, from: ds.prevTeamLevels[i], to: lv });
      }
    });
  }
  ds.prevTeamLevels = teamLevels;

  // 1. Dialogue — dismiss immediately
  if (store.dialogue) {
    addLog('dialogue', { text: store.dialogue.substring(0, 100) });
    game.dismissDialogue();
    return;
  }

  // 2. Phase routing
  switch (phase.type) {
    case 'EXPLORING': {
      ds.inBattleLogged = false;
      if (store.isMoving) return;
      const dir = pickDirection(store);
      ds.lastDir = dir;
      game.handleMove(dir);
      if (ds.tickCount % 5 === 0) {
        addLog('move', { dir, map: store.currentMap, pos: store.playerPos });
      }
      break;
    }

    case 'BATTLE': {
      const sub = phase.sub?.type;
      const bs = game.battleStateRef?.current;
      if (!bs) break;

      if (!ds.inBattleLogged) {
        ds.inBattleLogged = true;
        addLog('battle_start', {
          enemy: bs.enemyPokemon.name,
          enemyLevel: bs.enemyPokemon.level,
          isTrainer: bs.isTrainerBattle,
          playerPkmn: bs.playerTeam[0].name,
          playerLevel: bs.playerTeam[0].level,
        });
      }

      if (sub === 'CHOOSING') {
        const action = pickBattleAction(bs);
        addLog('battle_action', {
          action: action.type,
          move: action.move?.name,
          playerPkmn: bs.playerTeam[0].name,
          playerHp: bs.playerTeam[0].hp + '/' + bs.playerTeam[0].maxHp,
          enemyPkmn: bs.enemyPokemon.name,
          enemyHp: bs.enemyPokemon.hp + '/' + bs.enemyPokemon.maxHp,
        });
        game.dispatchBattle(action);
      } else if (sub === 'FORCED_SWITCH') {
        const idx = bs.playerTeam.findIndex((p: any, i: number) => i > 0 && p.hp > 0);
        if (idx > 0) {
          addLog('battle_action', { action: 'SWITCH', index: idx, pokemon: bs.playerTeam[idx].name });
          game.dispatchBattle({ type: 'SWITCH', index: idx });
        }
      }
      break;
    }

    case 'BATTLE_TRANSITION':
      break;

    case 'BLACKOUT':
      if (ds.lastOutcome !== 'blackout_logged') {
        ds.lastOutcome = 'blackout_logged';
        addLog('blackout', { map: store.currentMap });
      }
      break;

    case 'HEALING':
      break;

    case 'MENU':
    case 'INVENTORY':
    case 'TEAM':
    case 'SHOP':
    case 'POKEDEX':
    case 'PC':
      addLog('phase_skip', { from: phase.type, to: 'EXPLORING' });
      game.setPhase(game.phases.EXPLORING);
      break;
  }

  // Check battle outcome (fire once per battle)
  const bs = game.battleStateRef?.current;
  if (bs && bs.outcome !== 'ongoing' && bs.outcome !== ds.lastOutcome) {
    ds.lastOutcome = bs.outcome;
    addLog('battle_end', {
      outcome: bs.outcome,
      teamHp: bs.playerTeam.map((p: any) => p.hp + '/' + p.maxHp),
      enemyPkmn: bs.enemyPokemon.name,
      enemyLevel: bs.enemyPokemon.level,
    });
  } else if (bs && bs.outcome === 'ongoing') {
    ds.lastOutcome = 'ongoing';
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function startDemo(options?: { tickMs?: number; maxTicks?: number }) {
  if (ds.intervalId) { console.log('[DEMO] Already running.'); return; }

  const tickMs = options?.tickMs ?? 400;
  const maxTicks = options?.maxTicks ?? Infinity;
  ds.tickCount = 0;
  ds.lastMap = getStore()?.currentMap ?? '';
  ds.prevTeamLevels = getStore()?.playerTeam?.map((p: any) => p.level) ?? [];
  ds.lastOutcome = 'ongoing';
  ds.inBattleLogged = false;

  console.log(`[DEMO] Starting (${tickMs}ms/tick, max ${maxTicks} ticks)`);

  ds.intervalId = setInterval(() => {
    if (ds.tickCount >= maxTicks) { stopDemo(); return; }
    try {
      demoTick();
    } catch (err) {
      console.error('[DEMO] Tick error:', err);
    }
  }, tickMs);
}

export function stopDemo() {
  if (ds.intervalId) {
    clearInterval(ds.intervalId);
    ds.intervalId = null;
  }
  console.log(`[DEMO] Stopped after ${ds.tickCount} ticks. ${ds.log.length} log entries.`);
}

export function getDemoLog(): DemoLogEntry[] {
  return ds.log;
}

export function exportDemoLog(): string {
  return JSON.stringify(ds.log, null, 2);
}

export function clearDemoLog() {
  ds.log = [];
  ds.tickCount = 0;
  console.log('[DEMO] Log cleared.');
}

export function isDemoRunning(): boolean {
  return ds.intervalId !== null;
}

// ─── Auto-attach to window ───────────────────────────────────────────────────

if (import.meta.env.DEV) {
  W.__demo = {
    start: startDemo,
    stop: stopDemo,
    log: getDemoLog,
    export: exportDemoLog,
    clear: clearDemoLog,
    running: isDemoRunning,
  };
}

import { useGameStore } from '../store/gameStore';
import type { BattleAction } from './battleEngine';
import type { Direction } from '../types';

export type RecEvent =
  | { k: 'move'; dir: Direction }
  | { k: 'action' }
  | { k: 'battle'; action: BattleAction }
  | { k: 'item'; itemId: string }
  | { k: 'pcSwap'; teamIdx: number; pcIdx: number };

/** Observations are emitted by the engine/world. They are written to the log
 *  for forensic reading but are NOT replayed (the seeded PRNG re-derives them
 *  from the user events). */
export type Observation =
  | { k: 'obs_encounter'; map: string; pokemon: string; level: number }
  | { k: 'obs_trainer_spotted'; trainerId: string }
  | { k: 'obs_battle_step'; action: BattleAction; prevPhase: string; newPhase: string; enemyName: string; enemyHp: number; enemyHpMax: number; playerName: string; playerHp: number; playerHpMax: number; logs: string[] }
  | { k: 'obs_battle_outcome'; outcome: string }
  | { k: 'obs_catch'; result: 'caught' | 'escaped' | 'failed_in_trainer' };

export interface ObservationEntry {
  t: number;        // ms since log started
  afterEvent: number; // index of the last user event before this obs was emitted
  obs: Observation;
}

export interface RecLog {
  version: 2;
  seed: number;
  startedAt: number;
  snapshot: Record<string, unknown>;
  events: RecEvent[];
  observations: ObservationEntry[];
}

/* ---------- PRNG (mulberry32) ---------- */
let originalRandom: (() => number) | null = null;
let prngState = 0;

function prng(): number {
  prngState = (prngState + 0x6d2b79f5) | 0;
  let t = prngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function installPRNG(seed: number) {
  prngState = seed | 0;
  if (originalRandom === null) originalRandom = Math.random;
  Math.random = prng;
}

function restorePRNG() {
  if (originalRandom) Math.random = originalRandom;
  originalRandom = null;
}

/* ---------- Snapshot ---------- */
function snapshotState(): Record<string, unknown> {
  const s = useGameStore.getState() as unknown as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(s)) {
    if (typeof v === 'function') continue;
    out[k] = v;
  }
  return structuredClone(out);
}

function restoreState(snap: Record<string, unknown>) {
  useGameStore.setState(structuredClone(snap) as any);
}

/* ---------- Recording ---------- */
let recording = false;
let current: RecLog | null = null;
let suppressDepth = 0;

/** Run `fn` without logging any events emitted during it (e.g., for
 *  handlers that internally call another recorded handler). */
export function withoutLogging<T>(fn: () => T): T {
  suppressDepth++;
  try { return fn(); } finally { suppressDepth--; }
}

export function startRecord(): RecLog {
  stopRecord();
  const seed = (originalRandom ? originalRandom() : Math.random()) * 0x7fffffff | 0;
  const snapshot = snapshotState();
  installPRNG(seed);
  current = { version: 2, seed, startedAt: Date.now(), snapshot, events: [], observations: [] };
  recording = true;
  return current;
}

export function stopRecord(): RecLog | null {
  recording = false;
  restorePRNG();
  return current;
}

export function logEvent(e: RecEvent): void {
  if (!recording || !current || suppressDepth > 0) return;
  current.events.push(e);
}

export function logObservation(obs: Observation): void {
  if (!recording || !current) return;
  current.observations.push({
    t: Date.now() - current.startedAt,
    afterEvent: current.events.length,
    obs,
  });
}

export function isRecording(): boolean {
  return recording;
}

export function getLog(): RecLog | null {
  return current;
}

export function exportLog(): string {
  if (!current) return '';
  return JSON.stringify(current);
}

export function downloadLog(): void {
  if (!current) return;
  const blob = new Blob([exportLog()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `session-${current.startedAt}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Write the current log to `./logs/session-<ts>.json` via the Vite dev
 *  middleware. Only works in `vite dev`. */
export async function saveLogToDisk(name?: string): Promise<string | null> {
  if (!current) return null;
  const qs = name ? `?name=${encodeURIComponent(name)}` : `?name=${current.startedAt}`;
  const res = await fetch(`/__log/save${qs}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: exportLog(),
  });
  const data = (await res.json()) as { ok: boolean; path?: string; error?: string };
  if (!data.ok) throw new Error(data.error ?? 'save failed');
  return data.path ?? null;
}

export async function listSavedLogs(): Promise<string[]> {
  const res = await fetch('/__log/list');
  return res.json();
}

export async function loadLogFromDisk(name: string): Promise<RecLog> {
  const res = await fetch(`/__log/load?name=${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error(`load failed: ${res.status}`);
  return res.json();
}

/* ---------- Replay ---------- */
let replayCancelled = false;

async function waitUntilReady(e: RecEvent, timeoutMs = 8000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (replayCancelled) return;
    const phase = useGameStore.getState().phase;
    const sub = phase.type === 'BATTLE' ? phase.sub.type : null;
    const ok =
      e.k === 'move' || e.k === 'action'
        ? phase.type === 'EXPLORING' && !useGameStore.getState().isMoving && !useGameStore.getState().dialogue
        : e.k === 'battle'
          ? phase.type === 'BATTLE' && (sub === 'CHOOSING' || sub === 'FORCED_SWITCH' || sub === 'BATTLE_INVENTORY' || sub === 'BATTLE_TEAM')
          : e.k === 'item'
            ? phase.type === 'EXPLORING' || phase.type === 'INVENTORY' || (phase.type === 'BATTLE' && sub === 'BATTLE_INVENTORY')
            : e.k === 'pcSwap'
              ? phase.type === 'PC'
              : true;
    if (ok) return;
    await new Promise(r => setTimeout(r, 50));
  }
}

function apply(e: RecEvent): void {
  const g = (window as any).__game;
  if (!g) return;
  switch (e.k) {
    case 'move': g.handleMove(e.dir); break;
    case 'action': g.handleAction(); break;
    case 'battle': g.dispatchBattle(e.action); break;
    case 'item': g.handleUseItem?.(e.itemId); break;
    case 'pcSwap': g.handlePCSwap?.(e.teamIdx, e.pcIdx); break;
  }
}

export async function replay(
  log: RecLog,
  opts: { upToStep?: number; onProgress?: (i: number, total: number) => void } = {}
): Promise<void> {
  stopRecord();
  replayCancelled = false;
  restoreState(log.snapshot);
  installPRNG(log.seed);

  // Let React flush the snapshot before we start dispatching.
  await new Promise(r => setTimeout(r, 100));

  const end = Math.min(opts.upToStep ?? log.events.length, log.events.length);
  for (let i = 0; i < end; i++) {
    if (replayCancelled) break;
    await waitUntilReady(log.events[i]);
    if (replayCancelled) break;
    apply(log.events[i]);
    opts.onProgress?.(i + 1, log.events.length);
  }
}

export function cancelReplay(): void {
  replayCancelled = true;
  restorePRNG();
}

/* ---------- Crash auto-save ----------
 * In DEV, if an unhandled error or rejection fires while a session is being
 * recorded, persist the log to disk as `crash-<ts>.json` so every bug can be
 * replayed as a test. Reads `src/test/simulator/GameSimulator.loadLogAsScenario`
 * to turn the saved log back into a failing scenario.
 */
function installCrashAutoSave() {
  const save = (tag: string) => {
    if (!current) return;
    const name = `crash-${tag}-${Date.now()}`;
    // fire-and-forget; don't block the error
    saveLogToDisk(name).catch(() => {});
  };
  window.addEventListener('error', () => save('error'));
  window.addEventListener('unhandledrejection', () => save('rejection'));
}

/* ---------- window bridge ---------- */
if (typeof window !== 'undefined' && (import.meta as any).env?.DEV) {
  installCrashAutoSave();
  (window as any).__log = {
    start: startRecord,
    stop: stopRecord,
    download: downloadLog,
    save: saveLogToDisk,
    list: listSavedLogs,
    load: loadLogFromDisk,
    export: exportLog,
    get: getLog,
    replay: (logOrJson: RecLog | string, opts?: { upToStep?: number }) => {
      const log = typeof logOrJson === 'string' ? (JSON.parse(logOrJson) as RecLog) : logOrJson;
      return replay(log, opts ?? {});
    },
    replayFromDisk: async (name: string, opts?: { upToStep?: number }) => {
      const log = await loadLogFromDisk(name);
      return replay(log, opts ?? {});
    },
    cancelReplay,
    status: () => ({ recording, eventCount: current?.events.length ?? 0, obsCount: current?.observations.length ?? 0, seed: current?.seed ?? null }),
  };
}

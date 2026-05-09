// Browser-only bridge for src/lib/eventLog.ts.
//
// Imports public functions from the pure recorder and wires them up to:
//   - DEV-only crash auto-save (window error / unhandledrejection listeners)
//   - `window.__log` console helpers
//   - downloadLog: anchor-tag click in DEV
//   - replay: drives recorded events back through window.__game
//
// Import this module once at the app entry (main.tsx) for the side effects.
// Tests and the simulator never touch this file.

import {
  type RecEvent,
  type RecLog,
  startRecord,
  stopRecord,
  saveLogToDisk,
  listSavedLogs,
  loadLogFromDisk,
  exportLog,
  getLog,
  isRecording,
  installPRNG,
  restorePRNG,
  restoreState,
} from './eventLog';
import { useGameStore } from '../store/gameStore';

export function downloadLog(): void {
  const log = getLog();
  if (!log) return;
  const blob = new Blob([exportLog()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `session-${log.startedAt}.json`;
  a.click();
  URL.revokeObjectURL(url);
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

async function replay(
  log: RecLog,
  opts: { upToStep?: number; onProgress?: (i: number, total: number) => void } = {},
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

function cancelReplay(): void {
  replayCancelled = true;
  restorePRNG();
}

/* ---------- Crash auto-save ---------- */
function installCrashAutoSave() {
  const save = (tag: string) => {
    if (!getLog()) return;
    const name = `crash-${tag}-${Date.now()}`;
    saveLogToDisk(name).catch(() => {});
  };
  window.addEventListener('error', () => save('error'));
  window.addEventListener('unhandledrejection', () => save('rejection'));
}

if (typeof window !== 'undefined' && import.meta.env?.DEV) {
  installCrashAutoSave();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    status: () => {
      const log = getLog();
      return {
        recording: isRecording(),
        eventCount: log?.events.length ?? 0,
        obsCount: log?.observations.length ?? 0,
        seed: log?.seed ?? null,
      };
    },
  };
}

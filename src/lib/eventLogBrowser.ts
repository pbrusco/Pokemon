// Browser-only bridge for src/lib/eventLog.ts.
//
// Imports public functions from the pure recorder and wires them up to:
//   - DEV-only crash auto-save (window error / unhandledrejection listeners)
//   - `window.__log` console helpers
//
// Import this module once at the app entry (App.tsx) for the side effects.
// Tests and the simulator never touch this file.

import {
  type RecLog,
  startRecord,
  stopRecord,
  downloadLog,
  saveLogToDisk,
  listSavedLogs,
  loadLogFromDisk,
  exportLog,
  getLog,
  isRecording,
  replay,
  cancelReplay,
} from './eventLog';

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

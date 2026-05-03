import { vi } from 'vitest';

vi.mock('zustand/middleware', async (importOriginal) => {
  const actual = await importOriginal<typeof import('zustand/middleware')>();
  return {
    ...actual,
    persist: (config: any) => config, // strip persist middleware out entirely
  };
});

// Mock HTMLAudioElement for headless tests
(globalThis as any).Audio = class MockAudio {
  src = '';
  loop = false;
  volume = 1;
  paused = true;
  currentTime = 0;
  _listeners: Record<string, Function[]> = {};

  play() {
    this.paused = false;
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
  addEventListener(event: string, cb: Function) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(cb);
  }
  removeEventListener(event: string, cb: Function) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter((f) => f !== cb);
  }
  dispatchEvent(event: string) {
    (this._listeners[event] || []).forEach((cb) => cb());
  }
};

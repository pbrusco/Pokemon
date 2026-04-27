import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInteractionEngine } from './hooks/useInteractionEngine';
import { useGameStore } from './store/gameStore';
import { buildOakEscortPath, buildOakEscortSteps } from './lib/oakCutscene';
import { runCutscene, stopCutscene, isCutsceneRunning } from './lib/cutscenes/runner';

describe('Oak Cutscene', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useGameStore.getState().resetGame();
  });

  afterEach(() => {
    stopCutscene();
    vi.useRealTimers();
  });

  // ── Unit: path builder ──────────────────────────────────────────────────

  describe('buildOakEscortPath', () => {
    it('builds a path from player position to the lab door at world coords', () => {
      // Player triggers cutscene at the Pallet Town north exit (world x=128-129, y=197).
      const path = buildOakEscortPath({ x: 128, y: 197 });

      expect(path[0]).toEqual({ x: 128, y: 197, dir: 'down' });

      // Path should end at the lab approach tile: world (134, 211).
      const last = path[path.length - 1];
      expect(last.x).toBe(134);
      expect(last.y).toBe(211);

      // Every step is exactly 1 tile from the previous
      for (let i = 1; i < path.length; i++) {
        const dx = Math.abs(path[i].x - path[i - 1].x);
        const dy = Math.abs(path[i].y - path[i - 1].y);
        expect(dx + dy).toBe(1);
      }
    });
  });

  // ── Unit: DSL step builder ──────────────────────────────────────────────

  describe('buildOakEscortSteps', () => {
    it('produces a valid cutscene step array', () => {
      const steps = buildOakEscortSteps({ x: 10, y: 6 });

      expect(steps[0].type).toBe('lock');
      expect(steps[1].type).toBe('npc_appear');
      expect(steps[2].type).toBe('dialogue'); // greeting
      expect(steps[3].type).toBe('dialogue'); // warning
      expect(steps[4].type).toBe('walk');
      expect(steps.find(s => s.type === 'warp')).toBeTruthy();
      expect(steps.find(s => s.type === 'unlock')).toBeTruthy();
      expect(steps[steps.length - 1].type).toBe('dialogue');
    });
  });

  // ── Unit: CutsceneRunner ────────────────────────────────────────────────

  describe('CutsceneRunner', () => {
    it('processes instant steps synchronously', () => {
      runCutscene([
        { type: 'lock' },
        { type: 'set_story', step: 'OAK_STOPPED' },
        { type: 'unlock' },
      ]);

      expect(useGameStore.getState().storyStep).toBe('OAK_STOPPED');
      expect(useGameStore.getState().isMoving).toBe(false);
      expect(isCutsceneRunning()).toBe(false);
    });

    it('pauses on dialogue steps until dismissed', () => {
      runCutscene([
        { type: 'dialogue', text: 'Hello!' },
        { type: 'set_story', step: 'OAK_STOPPED' },
      ]);

      // Dialogue is shown, but set_story hasn't fired yet
      expect(useGameStore.getState().dialogue).toBe('Hello!');
      expect(useGameStore.getState().storyStep).toBe('START');
      expect(isCutsceneRunning()).toBe(true);

      //  Dismiss dialogue via the callback
      const cb = useGameStore.getState().dialogueCallback;
      expect(cb).toBeTypeOf('function');
      cb!();

      // Now the next step should have fired
      expect(useGameStore.getState().storyStep).toBe('OAK_STOPPED');
      expect(isCutsceneRunning()).toBe(false);
    });

    it('drives walk steps via setInterval', async () => {
      const path = [
        { x: 10, y: 6, dir: 'down' as const },
        { x: 10, y: 7, dir: 'down' as const },
        { x: 10, y: 8, dir: 'down' as const },
      ];

      runCutscene([
        { type: 'walk', path },
        { type: 'set_story', step: 'OAK_STOPPED' },
      ]);

      // Before any tick: still running
      expect(isCutsceneRunning()).toBe(true);

      // After 1 tick: moved to path[1]
      await vi.advanceTimersByTimeAsync(200);
      expect(useGameStore.getState().playerPos).toEqual({ x: 10, y: 7 });

      // After 2 ticks: moved to path[2]
      await vi.advanceTimersByTimeAsync(200);
      expect(useGameStore.getState().playerPos).toEqual({ x: 10, y: 8 });

      // After 3rd tick: walk finishes (walkStep=3 >= length=3), next step fires
      await vi.advanceTimersByTimeAsync(200);
      expect(useGameStore.getState().storyStep).toBe('OAK_STOPPED');
    });

    it('handles wait steps', async () => {
      runCutscene([
        { type: 'wait', ms: 1000 },
        { type: 'set_story', step: 'OAK_STOPPED' },
      ]);

      expect(useGameStore.getState().storyStep).toBe('START');

      await vi.advanceTimersByTimeAsync(1000);
      expect(useGameStore.getState().storyStep).toBe('OAK_STOPPED');
    });
  });


  // ── Regression: handleAction must fire dialogueCallback ─────────────────

  describe('Regression', () => {
    it('handleAction fires dialogueCallback, not just clears text', () => {
      const callbackFired = vi.fn();
      useGameStore.getState().setDialogue('Test', callbackFired);

      const { result } = renderHook(() =>
        useInteractionEngine({ initBattle: vi.fn() })
      );
      act(() => result.current.handleAction());

      expect(useGameStore.getState().dialogue).toBeNull();
      expect(callbackFired).toHaveBeenCalledOnce();
    });
  });
});

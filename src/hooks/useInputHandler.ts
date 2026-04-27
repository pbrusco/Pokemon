import { useEffect, useRef } from 'react';
import { Direction } from '../types';
import { battle, B_CHOOSING, B_BATTLE_INVENTORY, B_BATTLE_TEAM, EXPLORING, EDITOR } from '../types/gamePhase';
import { BattleAction } from '../lib/battleEngine';
import { useGameStore } from '../store/gameStore';

// How long (ms) to wait after turning before walking begins if key is held.
// Shorter = snappier; 120ms is enough to show the turn frame without feeling sluggish.
const TURN_WALK_DELAY_MS = 120;

const turnLeft = (d: Direction): Direction =>
  d === 'up' ? 'left' : d === 'left' ? 'down' : d === 'down' ? 'right' : 'up';
const turnRight = (d: Direction): Direction =>
  d === 'up' ? 'right' : d === 'right' ? 'down' : d === 'down' ? 'left' : 'up';
const opposite = (d: Direction): Direction =>
  d === 'up' ? 'down' : d === 'down' ? 'up' : d === 'left' ? 'right' : 'left';

interface UseInputHandlerParams {
  handleMove: (dir: Direction) => void;
  handleAction: () => void;
  dispatchBattle: (action: BattleAction) => void;
  isTrainerBattle: boolean;
  spottedTrainerId: string | null;
}

export function useInputHandler({
  handleMove,
  handleAction,
  dispatchBattle,
  isTrainerBattle,
  spottedTrainerId,
}: UseInputHandlerParams): void {
  const pressedKeys = useRef<Set<Direction>>(new Set());
  const lastTurnedDir = useRef<Direction | null>(null);
  const turnWalkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 3D-mode (dungeon-crawler) hold state: forward / back resolve against the
  // player's *current* facing each step, not against the world cardinal.
  const forwardHeld = useRef(false);
  const backwardHeld = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const store = useGameStore.getState();
      const inBattle = store.phase.type === 'BATTLE';

      if (inBattle) {
        const battleSubPhase = store.phase.type === 'BATTLE' ? store.phase.sub.type : null;
        if (e.key === 'Escape') {
          if (battleSubPhase === 'BATTLE_INVENTORY' || battleSubPhase === 'BATTLE_TEAM') {
            store.setPhase(battle(B_CHOOSING));
            return;
          }
          if (battleSubPhase === 'CHOOSING' && store.showMoves) {
            store.setShowMoves(false);
            return;
          }
        }
        if (battleSubPhase === 'CHOOSING') {
          const inMovesMenu = store.showMoves;
          if (!inMovesMenu) {
            if (e.key === 'w' || e.key === 'W') { dispatchBattle({ type: 'CHEAT_KO' }); return; }
            if (e.key === '1') { store.setShowMoves(true); return; }
            if (e.key === '2') { store.setPhase(battle(B_BATTLE_TEAM)); return; }
            if (e.key === '3') { store.setPhase(battle(B_BATTLE_INVENTORY)); return; }
            if (e.key === '4' && !isTrainerBattle) { dispatchBattle({ type: 'FLEE' }); return; }
          } else {
            const idx = parseInt(e.key) - 1;
            if (idx >= 0 && idx <= 3) {
              const mv = store.playerTeam[0]?.moves[idx];
              if (mv && mv.pp > 0) dispatchBattle({ type: 'ATTACK', move: mv });
            }
          }
        }
        return;
      }

      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      if (store.phase.type === 'EXPLORING') {
        if (e.key === '1') { store.setViewMode('3d'); return; }
        if (e.key === '2') { store.setViewMode('2d'); return; }
      }

      if (e.key === 'E' && e.shiftKey) {
        store.setPhase(prev => prev.type === 'EDITOR' ? EXPLORING : EDITOR);
        return;
      }

      if (e.key === 'g' || e.key === 'G') {
        store.toggleGhostMode();
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        store.toggleMinimap();
        return;
      }

      if (e.key === '+' || e.key === '=') {
        store.setZoomLevel(prev => Math.min(prev + 0.05, 1.0));
        return;
      }
      if (e.key === '-') {
        store.setZoomLevel(prev => Math.max(prev - 0.05, 0.05));
        return;
      }
      if (e.key === 'Home' || (e.key === 'c' || e.key === 'C')) {
        store.resetCamera();
        return;
      }
      if (e.key === ' ') {
        if (!store.isCameraLocked) {
          store.setIsCameraLocked(true);
          store.setCameraOffset({ x: 0, y: 0 });
          return;
        }
      }

      if (store.dialogue) {
        if (!e.repeat) {
          const cb = store.dialogueCallback;
          store.setDialogue(null);
          if (cb) cb();
        }
        return;
      }

      // First-person 3D mode: arrow keys are camera-relative (forward/back/turn).
      if (store.viewMode === '3d' && store.phase.type === 'EXPLORING') {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          if (spottedTrainerId) return;
          const facing = store.direction;
          if (e.key === 'ArrowLeft')  { if (!e.repeat) store.setDirection(turnLeft(facing));  return; }
          if (e.key === 'ArrowRight') { if (!e.repeat) store.setDirection(turnRight(facing)); return; }
          if (e.key === 'ArrowUp')   { forwardHeld.current = true;  if (!store.isMoving) handleMove(facing);            return; }
          if (e.key === 'ArrowDown') { backwardHeld.current = true; if (!store.isMoving) handleMove(opposite(facing));  return; }
        }
      }

      let dir: Direction | null = null;
      switch (e.key) {
        case 'ArrowUp': dir = 'up'; break;
        case 'ArrowDown': dir = 'down'; break;
        case 'ArrowLeft': dir = 'left'; break;
        case 'ArrowRight': dir = 'right'; break;
        case 'z': case 'Enter': handleAction(); break;
        case ' ': if (store.isCameraLocked) handleAction(); break;
        case 'Escape': if (store.phase.type === 'MENU') store.setPhase(store.phase.returnTo ?? EXPLORING); break;
      }

      if (dir) {
        if (spottedTrainerId) return; // Block movement if a trainer has spotted us

        const currentDir = store.direction;

        // Turn-in-place: first fresh press of a *new* direction just turns the sprite.
        // e.repeat means the key is held down (OS key-repeat), so we skip turn-only then.
        if (!e.repeat && dir !== currentDir && lastTurnedDir.current !== dir) {
          store.setDirection(dir);
          lastTurnedDir.current = dir;
          pressedKeys.current.add(dir);
          // After a short delay, if the key is still held start walking.
          // We bypass the OS key-repeat delay (300-500ms) by doing this ourselves.
          if (turnWalkTimer.current) clearTimeout(turnWalkTimer.current);
          turnWalkTimer.current = setTimeout(() => {
            if (pressedKeys.current.has(dir)) handleMove(dir);
          }, TURN_WALK_DELAY_MS);
          return; // Don't actually step yet
        }

        // Same direction pressed again (after already turning), or OS key-repeat → move
        const wasEmpty = pressedKeys.current.size === 0;
        pressedKeys.current.add(dir);
        if (wasEmpty || e.repeat) handleMove(dir);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') forwardHeld.current = false;
      if (e.key === 'ArrowDown') backwardHeld.current = false;

      let dir: Direction | null = null;
      switch (e.key) {
        case 'ArrowUp': dir = 'up'; break;
        case 'ArrowDown': dir = 'down'; break;
        case 'ArrowLeft': dir = 'left'; break;
        case 'ArrowRight': dir = 'right'; break;
      }
      if (dir) {
        pressedKeys.current.delete(dir);
        if (lastTurnedDir.current === dir) {
          lastTurnedDir.current = null;
          // Cancel pending walk if key was released before the delay elapsed
          if (turnWalkTimer.current) {
            clearTimeout(turnWalkTimer.current);
            turnWalkTimer.current = null;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleMove, handleAction, isTrainerBattle, spottedTrainerId]);

  const isMoving = useGameStore(s => s.isMoving);
  // Self-trigger: the moment a move finishes, immediately start the next one if a key is held.
  useEffect(() => {
    if (isMoving || spottedTrainerId) return;
    const store = useGameStore.getState();
    if (store.viewMode === '3d') {
      // In 3D mode, hold-keys re-resolve against the player's current facing each step,
      // so turning mid-walk redirects the next step correctly.
      if (forwardHeld.current) handleMove(store.direction);
      else if (backwardHeld.current) handleMove(opposite(store.direction));
      return;
    }
    if (pressedKeys.current.size > 0) {
      const dir = Array.from(pressedKeys.current)[0] as Direction;
      handleMove(dir);
    }
  }, [isMoving, handleMove, spottedTrainerId]);
}

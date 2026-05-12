import { type RefObject, useEffect, useRef } from 'react';
import { type Direction } from '../types';
import { battle, B_CHOOSING, B_BATTLE_INVENTORY, B_BATTLE_TEAM, EXPLORING } from '../types';
import { type BattleAction } from '../lib/battleEngine';
import { SfxController } from '../lib/sfx';
import { useGameStore } from '../store/gameStore';

// How long (ms) to wait after turning before walking begins if key is held.
const TURN_WALK_DELAY_MS = 120;

interface UseInputHandlerParams {
  handleMove: (dir: Direction) => void;
  handleAction: () => void;
  dispatchBattle: (action: BattleAction) => void;
  isTrainerBattle: boolean;
  spottedTrainerId: string | null;
  mobileDirRef?: RefObject<Direction | null>;
}

export function useInputHandler({
  handleMove,
  handleAction,
  dispatchBattle,
  isTrainerBattle,
  spottedTrainerId,
  mobileDirRef,
}: UseInputHandlerParams): void {
  const pressedKeys = useRef<Set<Direction>>(new Set());
  const lastTurnedDir = useRef<Direction | null>(null);
  const turnWalkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const store = useGameStore.getState();
      const kb = store.keyBindings;

      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      const inBattle = store.phase.type === 'BATTLE';

      if (inBattle) {
        const battleSubPhase = store.phase.type === 'BATTLE' ? store.phase.sub.type : null;
        if (e.key === 'Escape' || e.key === 'Backspace') {
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
          if (!store.showMoves) {
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

      if (store.phase.type === 'EXPLORING') {
        if (e.key === 'Tab' || e.key === 'Backspace') { e.preventDefault(); if (store.hasPokedex) store.setPhase({ type: 'POKEDEX', returnTo: EXPLORING }); return; }
      }

      if (e.key.toLowerCase() === kb.menu.toLowerCase()) {
        const current = store.phase;
        const isMenu = current.type === 'MENU';
        SfxController.play(isMenu ? 'menu_close' : 'menu_open');
        store.setPhase(isMenu ? (current.returnTo ?? EXPLORING) : { type: 'MENU', returnTo: current });
        return;
      }

      if (e.key.toLowerCase() === kb.gmode.toLowerCase()) {
        store.toggleGhostMode();
        return;
      }

      if (e.key.toLowerCase() === kb.minimap.toLowerCase()) {
        store.toggleMinimap();
        return;
      }

      if (store.dialogue || store.confirm) {
        if (!e.repeat && store.dialogue) {
          const cb = store.dialogueCallback;
          SfxController.play('dialog_advance');
          store.setDialogue(null);
          if (cb) cb();
        }
        return;
      }

      let dir: Direction | null = null;
      if (e.key.toLowerCase() === kb.up.toLowerCase()) dir = 'up';
      else if (e.key.toLowerCase() === kb.down.toLowerCase()) dir = 'down';
      else if (e.key.toLowerCase() === kb.left.toLowerCase()) dir = 'left';
      else if (e.key.toLowerCase() === kb.right.toLowerCase()) dir = 'right';
      else if (e.key.toLowerCase() === kb.interact.toLowerCase() || e.key === ' ') handleAction();
      else if (e.key.toLowerCase() === kb.back.toLowerCase()) {
        if (store.phase.type === 'MENU') store.setPhase(store.phase.returnTo ?? EXPLORING);
      }
      else if (e.key.toLowerCase() === kb.bike.toLowerCase()) {
        if (store.phase.type === 'EXPLORING' && store.hasBike) {
          store.setIsBiking(!store.isBiking);
        }
      }

      if (dir) {
        if (spottedTrainerId) return;

        const currentDir = store.direction;

        if (!e.repeat && dir !== currentDir && lastTurnedDir.current !== dir) {
          store.setDirection(dir);
          lastTurnedDir.current = dir;
          pressedKeys.current.add(dir);
          if (turnWalkTimer.current) clearTimeout(turnWalkTimer.current);
          turnWalkTimer.current = setTimeout(() => {
            if (pressedKeys.current.has(dir)) handleMove(dir);
          }, TURN_WALK_DELAY_MS);
          return;
        }

        const wasEmpty = pressedKeys.current.size === 0;
        pressedKeys.current.add(dir);
        if (wasEmpty || e.repeat) handleMove(dir);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const kb = useGameStore.getState().keyBindings;
      let dir: Direction | null = null;
      if (e.key.toLowerCase() === kb.up.toLowerCase()) dir = 'up';
      else if (e.key.toLowerCase() === kb.down.toLowerCase()) dir = 'down';
      else if (e.key.toLowerCase() === kb.left.toLowerCase()) dir = 'left';
      else if (e.key.toLowerCase() === kb.right.toLowerCase()) dir = 'right';
      if (dir) {
        pressedKeys.current.delete(dir);
        if (lastTurnedDir.current === dir) {
          lastTurnedDir.current = null;
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
  }, [handleMove, handleAction, isTrainerBattle, spottedTrainerId, dispatchBattle]);

  const isMoving = useGameStore(s => s.isMoving);
  useEffect(() => {
    if (isMoving || spottedTrainerId) return;
    if (pressedKeys.current.size > 0) {
      const dir = Array.from(pressedKeys.current)[0] as Direction;
      handleMove(dir);
      return;
    }
    if (mobileDirRef?.current) handleMove(mobileDirRef.current);
  }, [isMoving, handleMove, spottedTrainerId, mobileDirRef]);
}

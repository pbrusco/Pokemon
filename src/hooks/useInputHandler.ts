import { useEffect, useRef } from 'react';
import { Direction } from '../types';
import { battle, B_CHOOSING, B_BATTLE_INVENTORY, B_BATTLE_TEAM, EXPLORING, MENU, EDITOR } from '../types/gamePhase';
import { BattleAction } from '../lib/battleEngine';
import { useGameStore } from '../store/gameStore';

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const store = useGameStore.getState();
      const inBattle = store.phase.type === 'BATTLE';
      
      if (inBattle) {
        const battleSubPhase = store.phase.type === 'BATTLE' ? store.phase.sub.type : null;
        if (e.key === 'Escape') {
          if (battleSubPhase === 'BATTLE_INVENTORY' || battleSubPhase === 'BATTLE_TEAM') {
             store.setPhase(battle(B_CHOOSING));
          }
        }
        if (battleSubPhase === 'CHOOSING') {
          const inMovesMenu = store.showMoves;
          if (e.key === 'Escape' && inMovesMenu) {
            store.setShowMoves(false);
            return;
          }
          if (e.key === 'Escape' && !inMovesMenu) {
            store.setPhase({ type: 'MENU', returnTo: store.phase });
            return;
          }
          if (!inMovesMenu) {
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

      if (e.key === 'E' && e.shiftKey) {
        store.setPhase(prev => prev.type === 'EDITOR' ? EXPLORING : EDITOR);
        return;
      }

      if (store.dialogue) {
        if (!e.repeat) {
          const cb = store.dialogueCallback;
          store.setDialogue(null);
          if (cb) cb();
        }
        return;
      }

      let dir: Direction | null = null;
      switch (e.key) {
        case 'ArrowUp': dir = 'up'; break;
        case 'ArrowDown': dir = 'down'; break;
        case 'ArrowLeft': dir = 'left'; break;
        case 'ArrowRight': dir = 'right'; break;
        case 'z': case 'Enter': case ' ': handleAction(); break;
        case 'x': case 'Shift': case 'Escape': store.setPhase(prev => prev.type === 'MENU' ? (prev.returnTo ?? EXPLORING) : MENU); break;
      }
      if (dir) {
        if (spottedTrainerId) return; // Block movement if a trainer has spotted us
        const wasEmpty = pressedKeys.current.size === 0;
        pressedKeys.current.add(dir);
        if (wasEmpty) handleMove(dir);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': pressedKeys.current.delete('up'); break;
        case 'ArrowDown': pressedKeys.current.delete('down'); break;
        case 'ArrowLeft': pressedKeys.current.delete('left'); break;
        case 'ArrowRight': pressedKeys.current.delete('right'); break;
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
    if (!isMoving && pressedKeys.current.size > 0 && !spottedTrainerId) {
      const dir = Array.from(pressedKeys.current)[0] as Direction;
      handleMove(dir);
    }
  }, [isMoving, handleMove, spottedTrainerId]);
}

import { useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { Direction, Pokemon } from '../types';
import { GamePhase, battle, B_CHOOSING, B_BATTLE_INVENTORY, B_BATTLE_TEAM, EXPLORING, MENU, EDITOR } from '../types/gamePhase';
import { BattleAction } from '../lib/battleEngine';

interface UseInputHandlerParams {
  handleMove: (dir: Direction) => void;
  handleAction: () => void;
  dispatchBattle: (action: BattleAction) => void;
  isMoving: boolean;
  inBattle: boolean;
  dialogue: string | null;
  phase: GamePhase;
  playerTeam: Pokemon[];
  isTrainerBattle: boolean;
  showMoves: boolean;
  setShowMoves: Dispatch<SetStateAction<boolean>>;
  setPhase: Dispatch<SetStateAction<GamePhase>>;
  setDialogue: (d: string | null) => void;
}

export function useInputHandler({
  handleMove,
  handleAction,
  dispatchBattle,
  isMoving,
  inBattle,
  dialogue,
  phase,
  playerTeam,
  isTrainerBattle,
  showMoves,
  setShowMoves,
  setPhase,
  setDialogue,
}: UseInputHandlerParams): void {
  const pressedKeys = useRef<Set<Direction>>(new Set());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (inBattle) {
        const battleSubPhase = phase.type === 'BATTLE' ? phase.sub.type : null;
        const team = playerTeam;
        if (e.key === 'Escape') {
          if (battleSubPhase === 'BATTLE_INVENTORY' || battleSubPhase === 'BATTLE_TEAM') {
            setPhase(battle(B_CHOOSING));
          }
        }
        if (battleSubPhase === 'CHOOSING') {
          const inMovesMenu = showMoves;
          if (e.key === 'Escape' && inMovesMenu) {
            setShowMoves(false);
            return;
          }
          if (!inMovesMenu) {
            if (e.key === '1') { setShowMoves(true); return; }
            if (e.key === 'b' || e.key === 'B') { setPhase(battle(B_BATTLE_INVENTORY)); return; }
            if (e.key === 'p' || e.key === 'P') { setPhase(battle(B_BATTLE_TEAM)); return; }
            if ((e.key === 'h' || e.key === 'H') && !isTrainerBattle) { dispatchBattle({ type: 'FLEE' }); return; }
          } else {
            const idx = parseInt(e.key) - 1;
            if (idx >= 0 && idx <= 3) {
              const mv = team[0]?.moves[idx];
              if (mv && mv.pp > 0) dispatchBattle({ type: 'ATTACK', move: mv });
            }
          }
        }
        return;
      }

      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      if (e.key === 'E' && e.shiftKey) {
        setPhase(prev => prev.type === 'EDITOR' ? EXPLORING : EDITOR);
        return;
      }

      if (dialogue) {
        setDialogue(null);
        return;
      }

      let dir: Direction | null = null;
      switch (e.key) {
        case 'ArrowUp': dir = 'up'; break;
        case 'ArrowDown': dir = 'down'; break;
        case 'ArrowLeft': dir = 'left'; break;
        case 'ArrowRight': dir = 'right'; break;
        case 'z': case 'Enter': case ' ': handleAction(); break;
        case 'x': case 'Shift': case 'Escape': setPhase(prev => prev.type === 'MENU' ? EXPLORING : MENU); break;
      }
      if (dir) {
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
  }, [handleMove, handleAction, dialogue, inBattle]);

  // Self-trigger: the moment a move finishes, immediately start the next one if a key is held.
  useEffect(() => {
    if (!isMoving && pressedKeys.current.size > 0) {
      const dir = Array.from(pressedKeys.current)[0] as Direction;
      handleMove(dir);
    }
  }, [isMoving, handleMove]);
}

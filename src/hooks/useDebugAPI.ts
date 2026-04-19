import { useEffect, MutableRefObject, Dispatch, SetStateAction } from 'react';
import { Pokemon } from '../types';
import { GamePhase, battle, B_CHOOSING, EXPLORING } from '../types/gamePhase';
import { BattleAction, BattleState, createBattleState } from '../lib/battleEngine';
import { MOVES, makePokemon } from '../constants';
import { useGameStore } from '../store/gameStore';

interface GameStateRef {
  playerTeam: Pokemon[];
  inventory: Record<string, number>;
  pcStorage: Pokemon[];
  badges: string[];
}

interface UseDebugAPIParams {
  dispatchBattle: (action: BattleAction) => void;
  battleStateRef: MutableRefObject<BattleState | null>;
  phase: GamePhase;
  setDialogue: (d: string | null) => void;
  setPhase: Dispatch<SetStateAction<GamePhase>>;
  handleMove: (dir: any) => void;
  handleAction: () => void;
  handleUseItem: (itemId: string) => void;
  handlePCSwap: (teamIdx: number, pcIdx: number) => void;
  isTrainerBattle: boolean;
  gameState: MutableRefObject<GameStateRef>;
  setPlayerTeam: (team: Pokemon[]) => void;
  setEnemyPokemon: (p: Pokemon | null) => void;
  setBattleLog: (log: string) => void;
  setIsTrainerBattle: Dispatch<SetStateAction<boolean>>;
}

export function useDebugAPI({
  dispatchBattle,
  battleStateRef,
  phase,
  setDialogue,
  setPhase,
  handleMove,
  handleAction,
  handleUseItem,
  handlePCSwap,
  isTrainerBattle,
  gameState,
  setPlayerTeam,
  setEnemyPokemon,
  setBattleLog,
  setIsTrainerBattle,
}: UseDebugAPIParams): void {
  useEffect(() => {
    if (import.meta.env.DEV) {
      (window as any).__game = {
        dispatchBattle,
        battleStateRef,
        getPhase: () => phase,
        dismissDialogue: () => {
          const cb = useGameStore.getState().dialogueCallback;
          setDialogue(null);
          if (cb) cb();
        },
        setPhase,
        handleMove,
        handleAction,
        handleUseItem,
        handlePCSwap,
        isTrainerBattle,
        phases: { EXPLORING, battle, B_CHOOSING },
        startTestBattle: () => {
          let team = gameState.current.playerTeam;
          if (team.length === 0) {
            const starter = makePokemon('charmander', 'CHARMANDER', 10, 'fire', [MOVES.SCRATCH, MOVES.EMBER, MOVES.GROWL], 4);
            setPlayerTeam([starter]);
            team = [starter];
            gameState.current = { ...gameState.current, playerTeam: team };
          }
          const enemy = makePokemon('rattata', 'RATTATA', 3, 'normal', [MOVES.TACKLE, MOVES.SCRATCH], 19);
          setEnemyPokemon(enemy);
          battleStateRef.current = createBattleState(team, enemy, {
            inventory: gameState.current.inventory,
            pcStorage: gameState.current.pcStorage,
            hasBoulderBadge: gameState.current.badges.includes('BOULDER'),
          });
          setIsTrainerBattle(false);
          setBattleLog(`¡Un ${enemy.name} salvaje apareció!`);
          setPhase(battle(B_CHOOSING));
        },
      };
    }
  });
}

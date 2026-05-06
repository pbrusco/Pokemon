import { useEffect, type MutableRefObject, type Dispatch, type SetStateAction } from 'react';
import { type Pokemon, type Direction } from '../types';
import { type GamePhase, battle, B_CHOOSING, EXPLORING } from '../types/gamePhase';
import { type BattleAction, type BattleState, createBattleState } from '../lib/battleEngine';
import { MOVES } from '../constants/moves';
import { makePokemon } from '../constants/pokemon';
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
  handleMove: (dir: Direction) => void;
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

function makeDemoTeam(): Pokemon[] {
  return [
    makePokemon('charizard', 'CHARIZARD', 50, 'fire',
      [MOVES.CUT, MOVES.SURF, MOVES.FLY, MOVES.FLAMETHROWER], 6,
      { types: ['fire', 'flying'] }),
    makePokemon('blastoise', 'BLASTOISE', 50, 'water',
      [MOVES.STRENGTH, MOVES.SURF, MOVES.WATER_GUN, MOVES.ICE_BEAM], 9,
      { types: ['water'] }),
    makePokemon('venusaur',  'VENUSAUR',  50, 'grass',
      [MOVES.CUT, MOVES.RAZOR_LEAF, MOVES.SLEEP_POWDER, MOVES.FLASH], 3,
      { types: ['grass', 'poison'] }),
    makePokemon('mewtwo',    'MEWTWO',    70, 'psychic',
      [MOVES.PSYCHIC, MOVES.THUNDERBOLT, MOVES.CONFUSION, MOVES.EARTHQUAKE], 150,
      { types: ['psychic'] }),
    makePokemon('dragonite', 'DRAGONITE', 55, 'dragon',
      [MOVES.FLY, MOVES.THUNDERBOLT, MOVES.ICE_BEAM, MOVES.FLAMETHROWER], 149,
      { types: ['dragon', 'flying'] }),
    makePokemon('snorlax',   'SNORLAX',   40, 'normal',
      [MOVES.BODY_SLAM, MOVES.EARTHQUAKE, MOVES.STRENGTH, MOVES.FLASH], 143),
  ];
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
}: UseDebugAPIParams) {
  const giveDemoTeam = () => {
    const store = useGameStore.getState();
    const allBadges = ['BOULDER', 'CASCADE', 'THUNDER', 'RAINBOW', 'SOUL', 'MARSH', 'VOLCANO', 'EARTH'];

    store.setPlayerTeam(makeDemoTeam());
    store.setBadges(allBadges);
    store.setHasPokedex(true);
    store.setHasPokeFlute(true);
    store.setHasSsTicket(true);
    store.setHasSilphScope(true);
    store.setStoryStep('EXPLORING');
    store.setMoney(99999);
    store.setInventory({ POTION: 50, POKEBALL: 50, FULL_HEAL: 20, REVIVE: 10, HM01_CUT: 1, HM02_FLY: 1, HM03_SURF: 1, HM04_STRENGTH: 1, HM05_FLASH: 1 });

    setDialogue('¡Equipo de test listo! Con todas las MOs y medallas.');
    setTimeout(() => useGameStore.getState().setDialogue(null), 2000);
  };

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
        giveDemoTeam,
      };
    }
  });

  return { giveDemoTeam };
}

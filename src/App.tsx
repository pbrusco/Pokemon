import { useEffect, useRef, useMemo, useCallback } from 'react';
import { BattleState, BattleAction } from './lib/battleEngine';
import { battle, B_CHOOSING, B_FORCED_SWITCH, EXPLORING } from './types/gamePhase';
import { RecorderButton } from './components/RecorderButton';
import { logEvent, withoutLogging } from './lib/eventLog';
import { Direction } from './types';
import { useInteractionEngine } from './hooks/useInteractionEngine';
import { useWindowSize } from './hooks/useWindowSize';
import { useBattleVFX } from './hooks/useBattleVFX';
import { useOverworldVFX } from './hooks/useOverworldVFX';
import { useGameStore } from './store/gameStore';
import { useInputHandler } from './hooks/useInputHandler';
import { useDebugAPI } from './hooks/useDebugAPI';
import { useBattleEngine } from './hooks/useBattleEngine';
import { useMovementEngine } from './hooks/useMovementEngine';
import { applyPotion } from './lib/healUtils';
import { GameHeader } from './components/GameHeader';
import { WorldView } from './components/WorldView';
import { MobileControls } from './components/MobileControls';
import { SideMenu } from './components/SideMenu';
import { MenuButton } from './components/MenuButton';
import { GameModals } from './components/GameModals';
import { ScreenEffects } from './components/ScreenEffects';
import { applyItemToPokemon } from './lib/itemUtils';

export default function App() {
  const store = useGameStore();

  const phase = store.phase;
  const inBattle = phase.type === 'BATTLE' || ('returnTo' in phase && phase.returnTo?.type === 'BATTLE');
  const battlePhase = phase.type === 'BATTLE' ? phase.sub : ('returnTo' in phase && phase.returnTo?.type === 'BATTLE' ? phase.returnTo.sub : null);
  // Memoize NPC/item databases — only recompute when the inputs to buildNPCDatabase / buildItemDatabase change
  const npcs = useMemo(
    () => store.getNPCs(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.playerTeam, store.hasParcel, store.hasPokedex, store.badges, store.storyStep, store.oakCutscenePos, store.oakCutsceneDir]
  );
  const items = useMemo(
    () => store.getItems(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.pickedItemIds, store.storyStep]
  );

  const windowSize = useWindowSize();
  const { overworldShake, setOverworldShake } = useOverworldVFX();
  const { playerAnim, setPlayerAnim, enemyAnim, setEnemyAnim, battleShake, setBattleShake } = useBattleVFX();

  const battleStateRef = useRef<BattleState | null>(null);

  const handlePCSwap = (teamIdx: number, pcIdx: number) => {
    logEvent({ k: 'pcSwap', teamIdx, pcIdx });
    const newTeam = [...store.playerTeam];
    const newPC = [...store.pcStorage];
    const temp = newTeam[teamIdx];
    newTeam[teamIdx] = newPC[pcIdx];
    newPC[pcIdx] = temp;
    store.updateTeam(newTeam);
    store.updatePcStorage(newPC);
  };

  const { dispatchBattle: rawDispatchBattle } = useBattleEngine({
    battleStateRef,
    setPlayerAnim,
    setEnemyAnim,
    setBattleShake,
  });
  const dispatchBattle = useCallback((action: BattleAction) => {
    if (action.type !== 'TICK') logEvent({ k: 'battle', action });
    rawDispatchBattle(action);
  }, [rawDispatchBattle]);

  // Restore battle state from persisted store on mount
  useEffect(() => {
    const s = useGameStore.getState();
    if (s.activeBattle && (s.phase.type === 'BATTLE' || s.phase.type === 'BATTLE_TRANSITION')) {
      battleStateRef.current = s.activeBattle;
      s.setEnemyPokemon(s.activeBattle.enemyPokemon);
      s.setIsTrainerBattle(s.activeBattle.isTrainerBattle);
      s.setBattleLog(s.activeBattle.log);
      s.setBattleLogs([{ text: s.activeBattle.log, speaker: 'Sistema', id: -1 }]);
      // If refreshed during transition, jump straight to battle
      if (s.phase.type === 'BATTLE_TRANSITION') {
        s.setPhase(s.activeBattle?.phase === 'FORCED_SWITCH' ? battle(B_FORCED_SWITCH) : battle(B_CHOOSING));
      }
    } else if (!s.activeBattle && (s.phase.type === 'BATTLE' || s.phase.type === 'BATTLE_TRANSITION')) {
      s.setPhase(EXPLORING);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { handleMove: rawHandleMove, initBattle } = useMovementEngine({
    battleStateRef,
    setOverworldShake,
  });
  const handleMove = useCallback((dir: Direction) => {
    logEvent({ k: 'move', dir });
    rawHandleMove(dir);
  }, [rawHandleMove]);

  const { handleAction: rawHandleAction } = useInteractionEngine({
    initBattle,
  });
  const handleAction = useCallback(() => {
    logEvent({ k: 'action' });
    rawHandleAction();
  }, [rawHandleAction]);

  const handleUseItem = (itemId: string) => {
    logEvent({ k: 'item', itemId });
    withoutLogging(() => {
      const hasItem = (store.inventory[itemId] ?? 0) > 0;
      if (!hasItem) return;
      if (!inBattle) {
        // If it's a Pokeball, we can't use it in overworld anyway
        if (itemId === 'POKEBALL') {
          store.setDialogue('¡No es el momento de usar eso!');
          store.setPhase(EXPLORING);
          return;
        }
        store.setPhase({ type: 'ITEM_TEAM_SELECT', itemId });
        return;
      }
      if (itemId === 'POKEBALL') {
        dispatchBattle({ type: 'CATCH' });
      } else {
        store.setPhase(battle({ type: 'BATTLE_ITEM_TEAM_SELECT', itemId }));
      }
    });
  };

  const handleApplyItemToPokemon = (index: number) => {
    withoutLogging(() => {
      let itemId: string | undefined;
      if (phase.type === 'ITEM_TEAM_SELECT') {
        itemId = phase.itemId;
      } else if (battlePhase?.type === 'BATTLE_ITEM_TEAM_SELECT') {
        itemId = battlePhase.itemId;
      }

      if (!itemId) return;

      if (!inBattle) {
        const pkmn = store.playerTeam[index];
        const result = applyItemToPokemon(pkmn, itemId);
        if (result.success) {
          const newTeam = [...store.playerTeam];
          newTeam[index] = result.pokemon;
          store.updateTeam(newTeam);
          store.removeInventoryItem(itemId);
          store.setDialogue(result.message);
        } else {
          // It shouldn't get here because TeamMenuUI prevents selecting if it fails, but just in case
          store.setDialogue(result.message);
        }
        store.setPhase(EXPLORING);
      } else {
        // In-battle handling (will be handled by battle engine via action)
        dispatchBattle({ type: 'USE_ITEM', itemId, targetIndex: index });
        // Phase is reset by battle engine
      }
    });
  };

  useDebugAPI({
    dispatchBattle,
    battleStateRef,
    phase,
    setDialogue: store.setDialogue,
    setPhase: store.setPhase,
    handleMove,
    handleAction,
    handleUseItem,
    handlePCSwap,
    isTrainerBattle: store.isTrainerBattle,
    gameState: { current: store } as any,
    setPlayerTeam: store.updateTeam,
    setEnemyPokemon: store.setEnemyPokemon,
    setBattleLog: store.setBattleLog,
    setIsTrainerBattle: store.setIsTrainerBattle,
  });

  useInputHandler({
    handleMove,
    handleAction,
    dispatchBattle,
    isTrainerBattle: store.isTrainerBattle,
    spottedTrainerId: store.spottedTrainerId,
  });

  return (
    <div className="h-screen bg-slate-900 flex flex-col items-center justify-center overflow-hidden font-sans selection:bg-red-500 selection:text-white">
      <div className="scanline" />

      <GameHeader />

      <WorldView
        currentMap={store.currentMap}
        playerPos={store.playerPos}
        direction={store.direction}
        isMoving={store.isMoving}
        maps={store.worldMaps}
        npcs={npcs}
        items={items}
        grassEffect={store.grassEffect}
        overworldShake={overworldShake}
        windowSize={windowSize}
        spottedTrainerId={store.spottedTrainerId}
        spottedTrainerPos={store.spottedTrainerPos}
        defeatedTrainers={store.defeatedTrainers}
        inBattle={inBattle}
        dialogue={store.dialogue}
        playerTeam={store.playerTeam}

      />

      <MobileControls onMove={handleMove} onAction={handleAction} setPhase={store.setPhase} />

      <MenuButton phase={phase} setPhase={store.setPhase} />

      <SideMenu
        phase={phase}
        playerTeam={store.playerTeam}
        storyStep={store.storyStep}
        inventory={store.inventory}
        hasPokedex={store.hasPokedex}
        setPhase={store.setPhase}
        setDialogue={store.setDialogue}
        resetGame={store.resetGame}
      />

      <GameModals
        battleShake={battleShake}
        enemyAnim={enemyAnim}
        playerAnim={playerAnim}
        handlePCSwap={handlePCSwap}
        handleUseItem={handleUseItem}
        handleApplyItemToPokemon={handleApplyItemToPokemon}
        dispatchBattle={dispatchBattle}
      />

      <ScreenEffects phaseType={phase.type} battlePhase={battlePhase} />

      {import.meta.env.DEV && <RecorderButton />}
    </div>
  );
}
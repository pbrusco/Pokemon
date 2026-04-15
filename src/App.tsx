import { useEffect, useRef, useMemo } from 'react';
import { soundManager } from './lib/sounds';
import { BattleState } from './lib/battleEngine';
import { battle, B_CHOOSING, B_FORCED_SWITCH, EXPLORING } from './types/gamePhase';
import { DemoModeButton } from './components/DemoModeButton';
import { GodModeButton } from './components/GodModeButton';
import './lib/demoMode'; 
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
import { GameModals } from './components/GameModals';
import { ScreenEffects } from './components/ScreenEffects';

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

  useEffect(() => {
    if (inBattle) {
      soundManager.play('BATTLE_START');
    }
  }, [inBattle]);

  useEffect(() => {
    if (inBattle) {
      soundManager.playMusic('BATTLE');
    } else if (store.currentMap === 'POKECENTER') {
      soundManager.playMusic('POKECENTER');
    } else {
      soundManager.playMusic('OVERWORLD');
    }
  }, [inBattle, store.currentMap]);

  const handlePCSwap = (teamIdx: number, pcIdx: number) => {
    const newTeam = [...store.playerTeam];
    const newPC = [...store.pcStorage];
    const temp = newTeam[teamIdx];
    newTeam[teamIdx] = newPC[pcIdx];
    newPC[pcIdx] = temp;
    store.updateTeam(newTeam);
    store.updatePcStorage(newPC);
    soundManager.play('SELECT');
  };

  const { dispatchBattle } = useBattleEngine({
    battleStateRef,
    setPlayerAnim,
    setEnemyAnim,
    setBattleShake,
  });

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

  const { handleMove, initBattle } = useMovementEngine({
    battleStateRef,
    setOverworldShake,
  });

  const { handleAction } = useInteractionEngine({
    initBattle,
  });

  const handleUseItem = (itemId: string) => {
    const hasItem = (store.inventory[itemId] ?? 0) > 0;
    if (!hasItem) return;
    if (!inBattle) {
      if (itemId === 'POTION') {
        const healedTeam = store.playerTeam.map(applyPotion);
        store.updateTeam(healedTeam);
        store.removeInventoryItem('POTION');
        store.setDialogue('¡Usaste una POCIÓN! Tus POKÉMON recuperaron salud.');
      }
      store.setPhase(EXPLORING);
      return;
    }
    if (itemId === 'POKEBALL') {
      dispatchBattle({ type: 'CATCH' });
    } else {
      dispatchBattle({ type: 'USE_ITEM', itemId });
    }
  };

  useDebugAPI({
    dispatchBattle,
    battleStateRef,
    phase,
    setDialogue: store.setDialogue,
    setPhase: store.setPhase,
    handleMove,
    handleAction,
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

      <GameHeader isMuted={store.isMuted} onToggleMute={() => store.setIsMuted(soundManager.toggleMute())} />

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
        dispatchBattle={dispatchBattle}
      />

      <ScreenEffects phaseType={phase.type} battlePhase={battlePhase} />

      {import.meta.env.DEV && (
        <div className="fixed bottom-4 left-4 z-[200]">
          <GodModeButton />
        </div>
      )}
      {import.meta.env.DEV && <DemoModeButton />}
    </div>
  );
}
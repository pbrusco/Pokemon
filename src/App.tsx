/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { GamePhase, EXPLORING } from './types/gamePhase';
import { worldMaps } from './data/maps';
import { soundManager } from './lib/sounds';
import { BattleState } from './lib/battleEngine';
import { DemoModeButton } from './components/DemoModeButton';
import { GodModeButton } from './components/GodModeButton';
import './lib/demoMode'; // side-effect: attaches window.__demo in dev
import { useInteractionEngine } from './hooks/useInteractionEngine';
import { useWindowSize } from './hooks/useWindowSize';
import { useBattleVFX } from './hooks/useBattleVFX';
import { useOverworldVFX } from './hooks/useOverworldVFX';
import { usePokedex } from './hooks/usePokedex';
import { useGameStore } from './store/gameStore';
import { buildNPCDatabase, buildItemDatabase } from './data/npcDatabase';
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

// --- Main App ---

export default function App() {
  const currentMap = useGameStore(s => s.currentMap);
  const setCurrentMap = useGameStore(s => s.setCurrentMap);
  const playerPos = useGameStore(s => s.playerPos);
  const setPlayerPos = useGameStore(s => s.setPlayerPos);
  const direction = useGameStore(s => s.direction);
  const setDirection = useGameStore(s => s.setDirection);
  const isMoving = useGameStore(s => s.isMoving);
  const setIsMoving = useGameStore(s => s.setIsMoving);
  const dialogue = useGameStore(s => s.dialogue);
  const setDialogue = useGameStore(s => s.setDialogue);
  const [phase, setPhase] = useState<GamePhase>(EXPLORING);
  const [showMoves, setShowMoves] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.muted);
  const [pickedItemIds, setPickedItemIds] = useState<string[]>([]);

  // Phase-derived helpers
  const inBattle = phase.type === 'BATTLE';
  const battlePhase = phase.type === 'BATTLE' ? phase.sub : null;
  const hasPokedex = useGameStore(s => s.hasPokedex);
  const setHasPokedex = useGameStore(s => s.setHasPokedex);
  const hasParcel = useGameStore(s => s.hasParcel);
  const setHasParcel = useGameStore(s => s.setHasParcel);
  const { pokedex, setPokedex, updatePokedex } = usePokedex();
  const pcStorage = useGameStore(s => s.pcStorage);
  const setPcStorage = useGameStore(s => s.setPcStorage);
  const badges = useGameStore(s => s.badges);
  const setBadges = useGameStore(s => s.setBadges);
  const defeatedTrainers = useGameStore(s => s.defeatedTrainers);
  const setDefeatedTrainers = useGameStore(s => s.setDefeatedTrainers);
  const { grassEffect, setGrassEffect, spottedTrainerId, setSpottedTrainerId, spottedTrainerPos, setSpottedTrainerPos, overworldShake, setOverworldShake } = useOverworldVFX();
  const windowSize = useWindowSize();

  const playerTeam = useGameStore(s => s.playerTeam);
  const setPlayerTeam = useGameStore(s => s.setPlayerTeam);
  const {
    playerAnim, setPlayerAnim,
    enemyAnim, setEnemyAnim,
    battleShake, setBattleShake,
    resetBattleVFX,
  } = useBattleVFX();
  const lastHealLocation = useGameStore(s => s.lastHealLocation);
  const setLastHealLocation = useGameStore(s => s.setLastHealLocation);
  const money = useGameStore(s => s.money);
  const setMoney = useGameStore(s => s.setMoney);
  const setBadgeBoostGlitchStacks = useGameStore(s => s.setBadgeBoostGlitchStacks);
  // Story State
  const storyStep = useGameStore(s => s.storyStep);
  const setStoryStep = useGameStore(s => s.setStoryStep);
  const inventory = useGameStore(s => s.inventory);
  const setInventory = useGameStore(s => s.setInventory);
  const addInventoryItem = useGameStore(s => s.addInventoryItem);
  const removeInventoryItem = useGameStore(s => s.removeInventoryItem);
  const hasItem = useCallback((itemId: string) => (inventory[itemId] ?? 0) > 0, [inventory]);



  const battleStateRef = useRef<BattleState | null>(null);
  useEffect(() => {
    if (inBattle) {
      soundManager.play('BATTLE_START');
    }
  }, [inBattle]);

  // Background music
  useEffect(() => {
    if (inBattle) {
      soundManager.playMusic('BATTLE');
    } else if (currentMap === 'POKECENTER') {
      soundManager.playMusic('POKECENTER');
    } else {
      soundManager.playMusic('OVERWORLD');
    }
  }, [inBattle, currentMap]);

  const maps = worldMaps;

  const npcs = buildNPCDatabase(playerTeam, hasParcel, hasPokedex, badges);
  const items = buildItemDatabase(pickedItemIds);

  const handlePCSwap = (teamIdx: number, pcIdx: number) => {
    const newTeam = [...playerTeam];
    const newPC = [...pcStorage];
    const temp = newTeam[teamIdx];
    newTeam[teamIdx] = newPC[pcIdx];
    newPC[pcIdx] = temp;
    setPlayerTeam(newTeam);
    setPcStorage(newPC);
    soundManager.play('SELECT');
  };

  const gameState = useRef({ playerPos, direction, isMoving, dialogue, inBattle, phaseType: phase.type, battleSubPhase: null as string | null, currentMap, playerTeam, maps, npcs, items, defeatedTrainers, inventory, storyStep, pcStorage, badges, lastHealLocation });
  useEffect(() => {
    gameState.current = { playerPos, direction, isMoving, dialogue, inBattle, phaseType: phase.type, battleSubPhase: phase.type === 'BATTLE' ? phase.sub.type : null, currentMap, playerTeam, maps, npcs, items, defeatedTrainers, inventory, storyStep, pcStorage, badges, lastHealLocation };
  }, [playerPos, direction, isMoving, dialogue, inBattle, phase, currentMap, playerTeam, maps, npcs, items, defeatedTrainers, inventory, storyStep, pcStorage, badges, lastHealLocation]);

  const { dispatchBattle, enemyPokemon, setEnemyPokemon, battleLog, setBattleLog, isTrainerBattle, setIsTrainerBattle, catchResult } = useBattleEngine({
    battleStateRef,
    gameState,
    setPhase,
    setShowMoves,
    setPlayerTeam,
    setPlayerAnim,
    setEnemyAnim,
    setDefeatedTrainers,
    setBadges,
    setMoney,
    setStoryStep,
    setDialogue,
    setInventory,
    setPcStorage,
    setCurrentMap,
    setPlayerPos,
    setPokedex,
    setBattleShake,
  });

  const { handleMove, initBattle } = useMovementEngine({
    gameState,
    battleStateRef,
    setCurrentMap,
    setPlayerPos,
    setDirection,
    setIsMoving,
    setDialogue,
    setStoryStep,
    setPlayerTeam,
    setPhase,
    setOverworldShake,
    setGrassEffect,
    setSpottedTrainerId,
    setSpottedTrainerPos,
    setEnemyPokemon,
    setIsTrainerBattle,
    setBattleLog,
    updatePokedex,
  });

  const { handleAction } = useInteractionEngine({
    dialogue,
    inBattle,
    playerPos,
    direction,
    currentMap,
    hasParcel,
    hasPokedex,
    badges,
    inventory,
    playerTeam,
    npcs,
    items,
    maps,
    setDialogue,
    setPhase,
    setPlayerTeam,
    setLastHealLocation,
    setHasParcel,
    setHasPokedex,
    setInventory,
    setPickedItemIds,
    setStoryStep,
    setEnemyPokemon,
    setIsTrainerBattle,
    initBattle,
  });

  const resetGame = useCallback(() => {
    setCurrentMap('PALLET_TOWN');
    setPlayerPos({ x: 10, y: 10 });
    setDirection('down');
    setIsMoving(false);
    setDialogue("¡Bienvenido a Pueblo Paleta! Usa las flechas para moverte.");
    setPhase(EXPLORING);
    setHasPokedex(false);
    setHasParcel(false);
    setPokedex({});
    setPcStorage([]);
    setBadges([]);
    setDefeatedTrainers([]);
    setPickedItemIds([]);
    setPlayerTeam([]);
    setEnemyPokemon(null);
    setBattleLog("");
    resetBattleVFX();
    setStoryStep('START');
    setInventory({ POTION: 1, POKEBALL: 1 });
    setMoney(3000);
    setBadgeBoostGlitchStacks(0);
    soundManager.play('SELECT');
  }, []);


  const handleUseItem = (itemId: string) => {
    if (!hasItem(itemId)) return;
    if (!inBattle) {
      if (itemId === 'POTION') {
        const healedTeam = playerTeam.map(applyPotion);
        setPlayerTeam(healedTeam);
        removeInventoryItem('POTION');
        setDialogue('¡Usaste una POCIÓN! Tus POKÉMON recuperaron salud.');
      }
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
    setDialogue,
    setPhase,
    handleMove,
    handleAction,
    isTrainerBattle,
    gameState,
    setPlayerTeam,
    setEnemyPokemon,
    setBattleLog,
    setIsTrainerBattle,
  });

  useInputHandler({
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
  });

  return (
    <div className="h-screen bg-slate-900 flex flex-col items-center justify-center overflow-hidden font-sans selection:bg-red-500 selection:text-white">
      <div className="scanline" />

      <GameHeader isMuted={isMuted} onToggleMute={() => setIsMuted(soundManager.toggleMute())} />

      <WorldView
        playerPos={playerPos}
        direction={direction}
        isMoving={isMoving}
        currentMap={currentMap}
        maps={maps}
        npcs={npcs}
        items={items}
        grassEffect={grassEffect}
        overworldShake={overworldShake}
        windowSize={windowSize}
        spottedTrainerId={spottedTrainerId}
        spottedTrainerPos={spottedTrainerPos}
        defeatedTrainers={defeatedTrainers}
        inBattle={inBattle}
        dialogue={dialogue}
        playerTeam={playerTeam}
      />

      <MobileControls onMove={handleMove} onAction={handleAction} setPhase={setPhase} />

      <SideMenu
        phase={phase}
        playerTeam={playerTeam}
        storyStep={storyStep}
        inventory={inventory}
        hasPokedex={hasPokedex}
        setPhase={setPhase}
        setDialogue={setDialogue}
        resetGame={resetGame}
      />

      <GameModals
        phase={phase}
        battlePhase={battlePhase}
        inBattle={inBattle}
        currentMap={currentMap}
        battleShake={battleShake}
        enemyPokemon={enemyPokemon}
        enemyAnim={enemyAnim}
        catchResult={catchResult}
        playerTeam={playerTeam}
        playerAnim={playerAnim}
        battleLog={battleLog}
        showMoves={showMoves}
        isTrainerBattle={isTrainerBattle}
        dialogue={dialogue}
        inventory={inventory}
        pcStorage={pcStorage}
        money={money}
        pokedex={pokedex}
        setShowMoves={setShowMoves}
        setPhase={setPhase}
        setDialogue={setDialogue}
        setPlayerTeam={setPlayerTeam}
        setMoney={setMoney}
        addInventoryItem={addInventoryItem}
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
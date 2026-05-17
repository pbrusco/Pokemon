import { useEffect, useRef, useMemo, useCallback, useState, lazy, Suspense } from 'react';
import { type BattleState } from './lib/battleEngine';
import { battle, B_CHOOSING, B_FORCED_SWITCH, EXPLORING } from './types';
import { type Direction } from './types';
import { useInteractionEngine } from './hooks/useInteractionEngine';
import { useWindowSize } from './hooks/useWindowSize';
import { useBattleVFX } from './hooks/useBattleVFX';
import { useOverworldVFX } from './hooks/useOverworldVFX';
import { useGameStore } from './store/gameStore';
import { useInputHandler } from './hooks/useInputHandler';
import { useDebugAPI } from './hooks/useDebugAPI';
import { useBattleEngine } from './hooks/useBattleEngine';
import { useMovementEngine } from './hooks/useMovementEngine';
import { useWildPokemonEngine } from './hooks/useWildPokemonEngine';
import { useAudioEngine } from './hooks/useAudioEngine';
import { SfxController } from './lib/sfx';
import { WorldView } from './components/WorldView';
import { Minimap } from './components/Minimap';
import { MobileControls } from './components/MobileControls';
import { ScreenEffects } from './components/ScreenEffects';

// Heavy menu/battle UIs that the player never sees until they open a menu
// or start a fight — lazy-load to keep the initial JS bundle small. Suspense
// fallback is `null` because each is rendered conditionally; while the chunk
// downloads the player just sees the overworld for a moment.
const SideMenu = lazy(() => import('./components/SideMenu').then(m => ({ default: m.SideMenu })));
const GameModals = lazy(() => import('./components/GameModals').then(m => ({ default: m.GameModals })));
const LoadGameModal = lazy(() => import('./components/LoadGameModal').then(m => ({ default: m.LoadGameModal })));
import { applyItemToPokemon } from './lib/itemUtils';
import { HM_MOVE_MAP, HM_REQUIREMENTS, TM_MOVE_MAP, STONE_EVOLUTIONS, ITEMS_DATABASE } from './constants/items';
import { MOVES } from './constants/moves';

export default function App() {

  // ── Granular store selectors ────────────────────────────────────
  // App MUST NOT subscribe to rapidly-changing values like playerPos,
  // direction, isMoving, or wildPokemon.
  // Each selector below only triggers re-render when its value changes.
  const phase = useGameStore(s => s.phase);
  const currentMap = useGameStore(s => s.currentMap);
  const worldMaps = useGameStore(s => s.worldMaps);
  const grassEffect = useGameStore(s => s.grassEffect);
  const spottedTrainerId = useGameStore(s => s.spottedTrainerId);
  const spottedTrainerPos = useGameStore(s => s.spottedTrainerPos);
  const defeatedTrainers = useGameStore(s => s.defeatedTrainers);
  const dialogue = useGameStore(s => s.dialogue);
  const playerTeam = useGameStore(s => s.playerTeam);
  const storyStep = useGameStore(s => s.storyStep);
  const inventory = useGameStore(s => s.inventory);
  const hasPokedex = useGameStore(s => s.hasPokedex);
  const isTrainerBattle = useGameStore(s => s.isTrainerBattle);
  const badges = useGameStore(s => s.badges);
  const hasParcel = useGameStore(s => s.hasParcel);
  const hasSilphScope = useGameStore(s => s.hasSilphScope);
  const hasPokeFlute = useGameStore(s => s.hasPokeFlute);
  const hasSsTicket = useGameStore(s => s.hasSsTicket);
  const clearedSnorlax = useGameStore(s => s.clearedSnorlax);
  const oakCutscenePos = useGameStore(s => s.oakCutscenePos);
  const oakCutsceneDir = useGameStore(s => s.oakCutsceneDir);
  const pickedItemIds = useGameStore(s => s.pickedItemIds);
  // Stable method refs (Zustand actions — identity never changes)
  const getNPCs = useGameStore(s => s.getNPCs);
  const getItems = useGameStore(s => s.getItems);
  const setPhase = useGameStore(s => s.setPhase);
  const setDialogue = useGameStore(s => s.setDialogue);
  const resetGame = useGameStore(s => s.resetGame);
  const updateTeam = useGameStore(s => s.updateTeam);
  const setEnemyPokemon = useGameStore(s => s.setEnemyPokemon);
  const setBattleLog = useGameStore(s => s.setBattleLog);

  const inBattle = phase.type === 'BATTLE' || ('returnTo' in phase && phase.returnTo?.type === 'BATTLE');
  const battlePhase = phase.type === 'BATTLE' ? phase.sub : ('returnTo' in phase && phase.returnTo?.type === 'BATTLE' ? phase.returnTo.sub : null);

  // getNPCs/getItems are stable store methods (use get() internally); extra deps signal when to recompute.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const npcs = useMemo(() => getNPCs(), [getNPCs, playerTeam, hasParcel, hasPokedex, badges, storyStep, oakCutscenePos, oakCutsceneDir, hasSilphScope, hasPokeFlute, hasSsTicket, clearedSnorlax]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const items = useMemo(() => getItems(), [getItems, pickedItemIds, storyStep]);

  const windowSize = useWindowSize();
  const { overworldShake, setOverworldShake } = useOverworldVFX();

  // Prewarm the tilesets the early game touches so the first map paint hits
  // a warm cache instead of flashing black while the PNGs decode. Runs once
  // at app boot under idle priority (or via setTimeout fallback in browsers
  // without requestIdleCallback).
  useEffect(() => {
    const prewarm = () => {
      import('./lib/firered/tilesetLoader').then(({ prewarmTileset }) => {
        for (const t of [
          'gTileset_General',
          'gTileset_PalletTown',
          'gTileset_Building',
          'gTileset_Lab',
          'gTileset_PokemonCenter',
          'gTileset_Mart',
          'gTileset_GenericBuilding1',
          'gTileset_GenericBuilding2',
        ]) prewarmTileset(t);
      });
    };
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    if (typeof ric === 'function') ric(prewarm);
    else setTimeout(prewarm, 300);
  }, []);

  // ── Warp flash on map transition ──────────────────────────────────
  const [warpFlash, setWarpFlash] = useState(false);
  const prevMapRef = useRef(currentMap);
  useEffect(() => {
    if (prevMapRef.current === currentMap) return;
    prevMapRef.current = currentMap;
    setWarpFlash(true);
    const t = setTimeout(() => setWarpFlash(false), 80);
    return () => clearTimeout(t);
  }, [currentMap]);
  const { playerAnim, setPlayerAnim, enemyAnim, setEnemyAnim, battleShake, setBattleShake } = useBattleVFX();

  const battleStateRef = useRef<BattleState | null>(null);

  const handlePCSwap = useCallback((teamIdx: number, pcIdx: number) => {
    const s = useGameStore.getState();
    const newTeam = [...s.playerTeam];
    const newPC = [...s.pcStorage];
    const temp = newTeam[teamIdx];
    newTeam[teamIdx] = newPC[pcIdx];
    newPC[pcIdx] = temp;
    s.updateTeam(newTeam);
    s.updatePcStorage(newPC);
  }, []);

  const { dispatchBattle: rawDispatchBattle } = useBattleEngine({
    battleStateRef,
    setPlayerAnim,
    setEnemyAnim,
    setBattleShake,
  });
  const dispatchBattle = rawDispatchBattle;

  // Restore battle state from persisted store on mount
  useEffect(() => {
    const s = useGameStore.getState();
    if (s.activeBattle && (s.phase.type === 'BATTLE' || s.phase.type === 'BATTLE_TRANSITION')) {
      battleStateRef.current = s.activeBattle;
      s.setEnemyPokemon(s.activeBattle.enemyPokemon);
      s.setIsTrainerBattle(s.activeBattle.isTrainerBattle);
      s.setBattleLog(s.activeBattle.log);
      s.setBattleLogs([{ text: s.activeBattle.log, speaker: 'Sistema', id: -1 }]);
      if (s.phase.type === 'BATTLE_TRANSITION') {
        s.setPhase(s.activeBattle?.phase === 'FORCED_SWITCH' ? battle(B_FORCED_SWITCH) : battle(B_CHOOSING));
      }
    } else if (!s.activeBattle && (s.phase.type === 'BATTLE' || s.phase.type === 'BATTLE_TRANSITION')) {
      s.setPhase(EXPLORING);
    }
  }, []);

  const { handleMove, initBattle } = useMovementEngine({
    setOverworldShake,
  });

  const { handleAction } = useInteractionEngine({
    initBattle,
  });

  const handleBack = useCallback(() => {
    const s = useGameStore.getState();
    if (s.dialogue) {
      const cb = s.dialogueCallback;
      SfxController.play('dialog_advance');
      s.setDialogue(null);
      if (cb) cb();
      return;
    }
    const ph = s.phase;
    if (ph.type === 'MENU') { SfxController.play('menu_close'); s.setPhase(ph.returnTo ?? EXPLORING); return; }
    if (ph.type === 'CONFIG') { SfxController.play('menu_close'); s.setPhase(ph.returnTo ?? EXPLORING); return; }
    if (ph.type === 'BATTLE' && s.showMoves) { s.setShowMoves(false); }
  }, []);

  const handleSelect = useCallback(() => {
    const s = useGameStore.getState();
    if (s.phase.type === 'BATTLE') {
      const sub = s.phase.sub.type;
      if (sub === 'BATTLE_INVENTORY' || sub === 'BATTLE_TEAM') {
        s.setPhase(battle(B_CHOOSING));
        return;
      }
      if (sub === 'CHOOSING' && s.showMoves) {
        s.setShowMoves(false);
        return;
      }
      return;
    }
    if (!s.hasPokedex) return;
    if (s.phase.type === 'EXPLORING') s.setPhase({ type: 'POKEDEX', returnTo: EXPLORING });
    else if (s.phase.type === 'POKEDEX') s.setPhase(s.phase.returnTo ?? EXPLORING);
  }, []);

  const handleUseItem = useCallback((itemId: string) => {
    const s = useGameStore.getState();
    const hasItem = (s.inventory[itemId] ?? 0) > 0;
    if (!hasItem) return;
    const ph = s.phase;
    const ib = ph.type === 'BATTLE' || ('returnTo' in ph && ph.returnTo?.type === 'BATTLE');
    const isBall = itemId === 'POKEBALL' || itemId === 'MASTER_BALL';
    if (!ib) {
      if (isBall) {
        s.setDialogue('¡No es el momento de usar eso!');
        s.setPhase(EXPLORING);
        return;
      }
      s.setPhase({ type: 'ITEM_TEAM_SELECT', itemId });
      return;
    }
    if (isBall) {
      dispatchBattleRef.current({ type: 'CATCH', ballType: itemId as 'POKEBALL' | 'MASTER_BALL' });
    } else {
      s.setPhase(battle({ type: 'BATTLE_ITEM_TEAM_SELECT', itemId }));
    }
  }, []);

  // dispatchBattle reference is stable (useCallback with stable dep), so it's
  // safe to reference inside the handler below even though it's not in deps.
  const dispatchBattleRef = useRef(dispatchBattle);
  dispatchBattleRef.current = dispatchBattle;

  const handleApplyItemToPokemon = useCallback((index: number) => {
    const s = useGameStore.getState();
    const ph = s.phase;
    const ib = ph.type === 'BATTLE' || ('returnTo' in ph && ph.returnTo?.type === 'BATTLE');
    let itemId: string | undefined;
    if (ph.type === 'ITEM_TEAM_SELECT') {
      itemId = ph.itemId;
    } else if (ib && ph.type === 'BATTLE') {
      if (ph.sub.type === 'BATTLE_ITEM_TEAM_SELECT') itemId = ph.sub.itemId;
    }

    if (!itemId) return;

    if (!ib) {
      const team = s.playerTeam;
      const hmMoveName = HM_MOVE_MAP[itemId] ?? TM_MOVE_MAP[itemId];
      if (hmMoveName) {
        const pkmn = team[index];
        if (pkmn.moves.some(m => m.name === hmMoveName)) {
          s.setDialogue(`¡${pkmn.name} ya sabe ${hmMoveName}!`);
          s.setPhase(EXPLORING);
        } else {
          const move = Object.values(MOVES).find(m => m.name === hmMoveName)!;
          if (pkmn.moves.length < 4) {
            const newTeam = [...team];
            newTeam[index] = { ...pkmn, moves: [...pkmn.moves, move] };
            s.updateTeam(newTeam);
            if (TM_MOVE_MAP[itemId]) s.removeInventoryItem(itemId);
            s.setDialogue(`¡${pkmn.name} aprendió ${hmMoveName}!`);
            s.setPhase(EXPLORING);
          } else {
            s.setConfirm({
              text: `¿${pkmn.name} quiere olvidar un movimiento para aprender ${hmMoveName}?`,
              onYes: () => {
                const fs2 = useGameStore.getState();
                const t = fs2.playerTeam;
                fs2.setPhase({ type: 'HM_FORGET', itemId: itemId!, teamIndex: index, existingMoveNames: t[index].moves.map(m => m.name) });
                fs2.setConfirm(null);
              },
              onNo: () => { useGameStore.getState().setConfirm(null); },
            });
            return;
          }
        }
        return;
      }

      const pkmn = team[index];
      const item = ITEMS_DATABASE[itemId];
      if (STONE_EVOLUTIONS[itemId]) {
        const compatible = STONE_EVOLUTIONS[itemId].includes(pkmn.id);
        if (!compatible) {
          s.setDialogue('¡No tiene ningún efecto!');
        } else {
          const evolvedMon = applyItemToPokemon(pkmn, itemId);
          const newTeam = [...team];
          newTeam[index] = evolvedMon.pokemon;
          s.updateTeam(newTeam);
          s.removeInventoryItem(itemId);
          s.setDialogue(`¡${pkmn.name} evolucionó con la ${item.name}!`);
        }
        s.setPhase(EXPLORING);
        return;
      }
      const result = applyItemToPokemon(pkmn, itemId);
      if (result.success) {
        const newTeam = [...team];
        newTeam[index] = result.pokemon;
        s.updateTeam(newTeam);
        s.removeInventoryItem(itemId);
        s.setDialogue(result.message);
      } else {
        s.setDialogue(result.message);
      }
      s.setPhase(EXPLORING);
    } else {
      dispatchBattleRef.current({ type: 'USE_ITEM', itemId, targetIndex: index });
    }
  }, []);

  const handleHMForget = useCallback((forgetIndex: number) => {
    const s = useGameStore.getState();
    const ph = s.phase;
    if (ph.type !== 'HM_FORGET') return;
    const hmMoveName = HM_MOVE_MAP[ph.itemId] ?? TM_MOVE_MAP[ph.itemId];
    if (!hmMoveName) return;
    const move = Object.values(MOVES).find(m => m.name === hmMoveName)!;
    const team = [...s.playerTeam];
    const pkmn = { ...team[ph.teamIndex] };
    const newMoves = [...pkmn.moves];
    newMoves[forgetIndex] = move;
    pkmn.moves = newMoves;
    team[ph.teamIndex] = pkmn;
    s.updateTeam(team);
    if (TM_MOVE_MAP[ph.itemId]) s.removeInventoryItem(ph.itemId);
    s.setDialogue(`¡${pkmn.name} aprendió ${hmMoveName} en lugar de ${ph.existingMoveNames[forgetIndex]}!`);
    s.setPhase(EXPLORING);
  }, []);

  const handleFlySelect = useCallback((town: string) => {
    const s = useGameStore.getState();
    const flyMon = s.playerTeam.find(p => p.moves.some(m => m.name === 'VUELO'));
    if (!flyMon) { s.setPhase(EXPLORING); return; }
    s.setPhase({ type: 'FLY_ANIMATING', town, pokemonName: flyMon.name, pokemonSprite: flyMon.sprite });
  }, []);

  const handleFieldMove = useCallback((moveName: string) => {
    const s = useGameStore.getState();
    if (moveName === HM_REQUIREMENTS.fly.move) {
      if (!s.badges.includes(HM_REQUIREMENTS.fly.badge)) {
        s.setDialogue(`Necesitas la medalla ${HM_REQUIREMENTS.fly.badge} para volar.`);
        return;
      }
      s.setPhase({ type: 'FLY_TOWN_SELECT' });
      return;
    }
    if (moveName === HM_REQUIREMENTS.surf.move) {
      if (!s.badges.includes(HM_REQUIREMENTS.surf.badge)) {
        s.setDialogue(`Necesitas la medalla ${HM_REQUIREMENTS.surf.badge} para surfear.`);
        return;
      }
      s.setIsSurfing(true);
      s.setPhase(EXPLORING);
      s.setDialogue('¡Usaste SURF! ¡Ahora puedes navegar por el agua!');
      return;
    }
    if (moveName === HM_REQUIREMENTS.flash.move) {
      if (!s.badges.includes(HM_REQUIREMENTS.flash.badge)) {
        s.setDialogue(`Necesitas la medalla ${HM_REQUIREMENTS.flash.badge} para usar DESTELLO.`);
        return;
      }
      s.setFlashActive(true);
      s.setPhase(EXPLORING);
      s.setDialogue('¡DESTELLO iluminó la cueva!');
      return;
    }
    s.setPhase(EXPLORING);
  }, []);

  const { giveDemoTeam } = useDebugAPI({
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
    gameState: { current: useGameStore.getState() } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    setPlayerTeam: updateTeam,
    setEnemyPokemon,
    setBattleLog,
    setIsTrainerBattle: (v: boolean | ((prev: boolean) => boolean)) => {
      const s = useGameStore.getState();
      const next = typeof v === 'function' ? v(s.isTrainerBattle) : v;
      s.setIsTrainerBattle(next);
    },
  });

  const mobileDirRef = useRef<Direction | null>(null);

  useInputHandler({
    handleMove,
    handleAction,
    dispatchBattle,
    isTrainerBattle,
    spottedTrainerId,
    mobileDirRef,
  });

  useWildPokemonEngine();

  useAudioEngine();

  return (
    <div className="h-screen bg-slate-900 flex flex-col items-center justify-center overflow-hidden font-sans selection:bg-red-500 selection:text-white">
      <div className="scanline" />


      <WorldView
        currentMap={currentMap}
        maps={worldMaps}
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
      />

      <Minimap />

      <MobileControls onMove={handleMove} onDirChange={(dir) => { mobileDirRef.current = dir; }} onAction={handleAction} onBack={handleBack} onSelect={handleSelect} setPhase={setPhase} />

      <Suspense fallback={null}>
        <SideMenu
          phase={phase}
          playerTeam={playerTeam}
          storyStep={storyStep}
          inventory={inventory}
          hasPokedex={hasPokedex}
          setPhase={setPhase}
          setDialogue={setDialogue}
          resetGame={resetGame}
          onUseItem={handleUseItem}
          giveDemoTeam={giveDemoTeam}
        />

        <GameModals
          battleShake={battleShake}
          enemyAnim={enemyAnim}
          playerAnim={playerAnim}
          handlePCSwap={handlePCSwap}
          handleUseItem={handleUseItem}
          handleApplyItemToPokemon={handleApplyItemToPokemon}
          handleHMForget={handleHMForget}
          handleFlySelect={handleFlySelect}
          onUseFieldMove={handleFieldMove}
          dispatchBattle={dispatchBattle}
        />
      </Suspense>

      <ScreenEffects phaseType={phase.type} battlePhase={battlePhase} />

      {/* Warp flash — brief white flash on map transition */}
      {warpFlash && (
        <div className="fixed inset-0 bg-white z-[400] pointer-events-none" />
      )}

      <Suspense fallback={null}>
        <LoadGameModal />
      </Suspense>

    </div>
  );
}